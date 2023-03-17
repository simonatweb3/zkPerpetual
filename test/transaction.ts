import * as utils from "./utils"
import { Entity, ChildEntity, TableInheritance, PrimaryGeneratedColumn, PrimaryColumn, Column, DataSource } from "typeorm"
import { ethers } from "hardhat"

let PREV_NONCE = 0
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Transaction {

	@PrimaryGeneratedColumn()
	id : number

	@Column()
	type : number		// utils.common.OpType

	@Column()
	pub_key : number

	@Column()
	wrappedToBlock : boolean

	nonce // u32
	expiration_timestamp // u32
	signature //

	constructor(type, pub_key) {
		this.type = type

		this.pub_key = pub_key
		this.nonce = PREV_NONCE
		PREV_NONCE += 1
		this.expiration_timestamp = Math.floor(Date.now() / 1000) + 3600 // s

		this.wrappedToBlock = false
	}

	pubdata() {
		console.log("No Pubdata In Pure Transaction...")
		return "0x"
	}
}

@ChildEntity()
export class Deposit extends Transaction {

	@Column()
	amount	: number

	constructor(pub_key, amount) {
		super(utils.common.OpType.Deposit, pub_key)
		this.amount = amount
	}

	pubdata() {
		let quantAmount = BigNumber.from("9223372036854775808")

		// TODO : account id
		let DepositPubData = utils.common.packPubData(
			[0, this.pub_key, BigNumber.from(this.amount).add(quantAmount)],
			[3, 20, 8]
		)
		return DepositPubData
	}

	// layer1 operation no hash()
}

@ChildEntity()
export class Withdraw extends Transaction {

	@Column()
	amount	: number

	@Column()
	fee : number

	valut_from

	constructor(pub_key, amount, fee) {
		super(utils.common.OpType.Withdraw, pub_key)

		this.amount = amount
		this.fee = fee
	}

	pubdata() {
		let quantAmount = BigNumber.from("9223372036854775808")
		quantAmount = quantAmount.sub(BigNumber.from(this.amount))
		let withdrawPubData = utils.common.packPubData(
			[0, this.pub_key, quantAmount],
			[3, 20, 8]
		)
		return withdrawPubData
	}

	hash() {

		let lens = [
			1, 3, 8, 8, 4, 4, 54		// total 82 ??
		]
		
		let datas = [
			this.type,
			this.valut_from,
			this.amount,
			this.fee,
			this.nonce,
			this.expiration_timestamp,
			0
		]

		return utils.common.packPubData(datas, lens)
	}
}


export class Trade extends Transaction {
	amount_synthetic
	amount_collateral
	asset_id
	is_buy
	fee

	hash() {

		let lens = [
			1, 4, 4, 8, 8, 8, 2, 3, 1, 43
		]
		
		let datas = [
			this.type,
			this.nonce,
			this.expiration_timestamp,
			this.amount_synthetic,
			this.amount_collateral,
			this.fee,
			this.asset_id,
			this.is_buy,
			0
		]

		return utils.common.packPubData(datas, lens)
	}

}

import { BigNumber } from "ethers"
import { AccountTree } from "./utils/account"
if (process.env.TRANSACTION_UNIT_TEST) {
	describe("Transaction Unit Test", function() {
		this.timeout(6000000);
		let owner
		before(async () => {
			const owners = await ethers.getSigners()
			owner = owners[0]
			console.log('signer : ', owner.address)
		});


		it("db", async function() {
			await DB.initialize().then(async () => {
				let d = new Deposit(2, 2)
				console.log("deposit pubdata " , d.pubdata())
				await DB.manager.save(d)

				let w = new Withdraw(1, 1, 1)
				console.log("withdraw pubdata " , w.pubdata())
				await DB.manager.save(w)

				const ts = await DB.manager.find(Transaction)
				console.log("Loaded t1s: ", ts)
			}).catch(error => console.log(error))
		});
	});
}