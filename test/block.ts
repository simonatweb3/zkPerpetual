import * as utils from "./utils"
import { Deposit, Transaction, Withdraw } from "./transaction"
import { ethers } from "hardhat" 
import { Entity, ChildEntity, TableInheritance, PrimaryGeneratedColumn, PrimaryColumn, Column, DataSource } from "typeorm"
import { deepCopy } from "./utils/common"
import { BigNumber } from "ethers"
import { logger } from "./utils/log"

let PREV_BLOCK_NUM = 0		// TODO : remove to use resistent style
@Entity()
export class Block {
	@PrimaryColumn()
	blockNumber : number

	@Column()
	timestamp : number

	// TODO : not column
	at : utils.account.AccountTree
	@Column()
	accountRoot : string
	@Column()
	validiumAccountRoot : string

	@Column()
	rollupColPubdata : string
	@Column()
	rollupPositionPubdata : string

	ot : utils.order.OrderTree
	@Column()
	orderRoot : string

	@Column()
	sendOnChain : boolean

	orderStateHash : string

	affectAccountId = []
	affectAccountBefore = new Map()

	transactions : Transaction[] = []
	witness = []

	constructor (at, ot) {
		this.at = at
		this.ot = ot
		this.timestamp = Math.floor(Date.now() / 1000) // s

		this.blockNumber = PREV_BLOCK_NUM + 1
		PREV_BLOCK_NUM += 1

		this.sendOnChain = false
	}

	// return onchain pubdata
	applyTx(t : Transaction) {
		this.transactions.push(t)

		let account_id = this.at.getAccount(t.pub_key)._accountId
		if (this.affectAccountBefore[account_id] == undefined) {
			this.affectAccountId.push(account_id)
			this.affectAccountBefore[account_id] = utils.common.deepCopy(this.at.getAccount(t.pub_key))
		}

		// acount root change accordingly
		this.witness.push(this.at.applyTx(t))
		this.accountRoot = this.at.getAccountRoot()
		this.validiumAccountRoot =  this.at.getValidiumAccountRoot()
		this.rollupColPubdata = this.updateRollupPubdata()[0]
		this.rollupPositionPubdata = this.updateRollupPubdata()[1]

		// order root change
		this.ot.applyTx(t)
		this.orderRoot = this.ot.root()
	}

	onChainPubdata() {
		// Note : sequencial transaction order

		let pubdata = ethers.utils.hexlify("0x")

		// deposit, [ TODO if cancelRecalimed, no pubdata before that]
		// withdraw,  all same account withdraw transaction will generate 1 total pubdata.
		this.transactions.forEach(t => {
			pubdata = ethers.utils.hexConcat([pubdata, t.pubdata()])
		});

		return pubdata

	}

	updateRollupPubdata() {
		// Note : sequencial account affect order

		// changed pubdata
		let collateralBalancePubData = ethers.utils.hexlify("0x")
		let positonPubData = ethers.utils.hexlify("0x")
	
		this.affectAccountId.forEach(accountId => {
			let a = this.at.getAccountById(accountId)
			if (a._is_rollup) {
				let oa : utils.account.Account = this.affectAccountBefore[accountId]
				if (oa._collateral_balance != a._collateral_balance) {
					let c_data = utils.common.packPubData(
							[accountId, a._collateral_balance],
							[3, 8]
						)
					collateralBalancePubData = ethers.utils.hexConcat(
						[ collateralBalancePubData, c_data]
					)
				}

				a._positions.forEach((p, idx, array) => {
					let op = oa._positions[idx]
					if (op.balance != p.balance || op.asset_id != p.asset_id) {
						let p_data = utils.common.packPubData(
							[p.asset_id, p.balance, p.cached_funding_index],
							[2, 8, 8]
						)
						positonPubData = ethers.utils.hexConcat(
							[ positonPubData, p_data]
						)
					}

				});
			}
		});

		return [collateralBalancePubData, positonPubData]
	}

	account_data_commitment() {
		let rollup_col_commitment
		let rollup_asset_commitment
		let rollup_data_commitment

		let all_col_commitment	// = insurance_fund_account_id, insurance_fund_collateral_balance)
		let all_asset_commitment
		let all_data_commitment

		// let account_data_commitment = sha256(rollup_data_commitment, all_data_commitment)
	}

	normalize() {
		let all_data_commitment = ethers.utils.formatBytes32String("1")
		let globalFundingIndex = []
		let fundingTimestamp
		let globalFundingIndexHash = ethers.utils.sha256("0x")
		let indexHashOrTimeStamp = globalFundingIndexHash

		if (this.blockNumber % 2 == 0) {
			globalFundingIndex	= [100, 200]	// HACK TODO REMOVE
			fundingTimestamp = 0x628db866
			indexHashOrTimeStamp = fundingTimestamp
			globalFundingIndexHash = utils.order.getGlobalFundingIndexHash(fundingTimestamp, globalFundingIndex)
		}

		let oraclePrice = [100, 200]
		let oraclePriceHash  = utils.order.getOraclePriceHash(oraclePrice)
		let globalStateHash = utils.order.getGloalStateHash(this.timestamp, globalFundingIndexHash, oraclePriceHash)
		logger.debug("........js globalStateHash ", globalStateHash)
		let orderStateHash = utils.order.getOrderStateHash(this.orderRoot, globalStateHash)
		return {
			blockNumber : this.blockNumber,
			//timestamp : this.timestamp,
			timestamp : 0x628db888,
			accountRoot: this.accountRoot,
			validiumAccountRoot: this.validiumAccountRoot,
			orderRoot : this.orderRoot,
			globalFunding : {
				index : globalFundingIndex,
				indexHashOrTimeStamp : indexHashOrTimeStamp,
			},
			oraclePriceHash : oraclePriceHash,
			orderStateHash : orderStateHash,
			all_data_commitment : all_data_commitment,
			blockChunkSize : 32,
			collateralBalancePubData : this.rollupColPubdata,
			positonPubData : this.rollupPositionPubdata,
			onchainPubData : this.onChainPubdata()
		}
	}
}


if (process.env.BLOCK_UNIT_TEST) {
describe("Block Tree Test", function() {
	let at : utils.account.AccountTree
	let ot : utils.order.OrderTree

	before(async () => {
		at = new utils.account.AccountTree("1111", "1111")
		ot = new utils.order.OrderTree()

		await DB.initialize()
	});

	it("Deep Copy", async function() {
		let va = at.createAccount("2222", false)
		logger.info("old balance : ", va._collateral_balance)
		let as = []
		as.push(utils.common.deepCopy(va))
		va.deposit(1000)
		logger.info("new balance : ", va._collateral_balance)
		logger.info("store balance : ", as[0]._collateral_balance)
	});

	it("Block", async function() {
		let b = new Block(at, ot)
		at.createAccount(1, true)
		b.applyTx(new Deposit(1, 100))
		b.applyTx(new Withdraw(1, 50, 1))
		await DB.manager.save(b)
		let lb = await DB.manager.find(Block)
		logger.info("load block : ", lb)
		lb.forEach(b => {
			logger.info("block normalize : ", b.normalize([]))
		});
	});
});
}