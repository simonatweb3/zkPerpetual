// acountId 
// 0 			: reserve
// 1 			: fee_acount_id
// [2, 2^23)	: validium account

import assert from "assert"
import { expect } from "chai"
import { arrayify, hexlify } from "ethers/lib/utils"
const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')
import { ethers } from "hardhat" 
import { exit } from "process"
import * as common from "./common"

// [2^23, 2^24)	: rollup account
const RESERVE_ACCOUNT_ID = 0
const FEE_ACCOUNT_ID = 1
const VALIDIUM_START_ACCOUNT_ID = 2
const VALIDIUM_END_ACCOUNT_ID = Math.pow(2, 23)
const ROLLUP_START_ACCOUNT_ID = Math.pow(2, 23)
const ROLLUP_END_ACCOUNT_ID = Math.pow(2, 24)
let CUR_VALIDIUM_ACCOUNT_ID = VALIDIUM_START_ACCOUNT_ID
let CUR_ROLLUP_ACCOUNT_ID = ROLLUP_START_ACCOUNT_ID

const POSITION_PER_ACCOUNT = 8

function alloc_validium_account() {
	assert(CUR_VALIDIUM_ACCOUNT_ID + 1 < VALIDIUM_END_ACCOUNT_ID)
	CUR_VALIDIUM_ACCOUNT_ID += 1
	return CUR_VALIDIUM_ACCOUNT_ID - 1
}

function alloc_rollup_account() {
	assert(CUR_ROLLUP_ACCOUNT_ID + 1 < ROLLUP_END_ACCOUNT_ID)
	CUR_ROLLUP_ACCOUNT_ID += 1
	return CUR_ROLLUP_ACCOUNT_ID - 1
}


import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, DataSource } from "typeorm"
import { BigNumber} from "ethers"
import { logger } from "./log"


@Entity()
export class Account {

	@PrimaryColumn()
	_accountId : number

    @Column()
	_pubkey_hash : number

    @Column()
	_collateral_balance : number

	_positions = []

	_is_rollup

	constructor(
		pubkey_hash, 		// 160 bits
		is_rollup,
		accountId = -1
	) {
		this._pubkey_hash = pubkey_hash
		this._is_rollup = is_rollup
		// update when deposit/withdraw
		// negative if < 2^63
		this._collateral_balance = 0; // Math.pow(2, 63)
		for (var i = 0; i < POSITION_PER_ACCOUNT; i++) {
			let position = {
				asset_id	: 0,	// 16 bits
				balance 	: 0, // Math.pow(2, 63),	// 64 bits
				cached_funding_index :  0, // 0 * Math.pow(2, 32), //64 bits
			}
			this._positions.push(position)
		}

		if (accountId == 0 || accountId == 1) {
			this._accountId = accountId
		} else if (is_rollup) {
			this._accountId = alloc_rollup_account()
		} else {
			this._accountId = alloc_validium_account()
		}
    }

	getPositionId(asset_id) {
		for (var i = 0; i < POSITION_PER_ACCOUNT; i++) {
			if (this._positions[i].asset_id == asset_id) {
				return i
			}
		}
		return -1
	}

	getPosition(asset_id) {
		let pid = this.getPositionId(asset_id)
		assert(pid != -1)
		return this._positions[pid]
	}

	getAvaliPositionId() {
		for (var i = 0; i < POSITION_PER_ACCOUNT; i++) {
			if (this._positions[i].asset_id == 0) {
				return i
			}
		}
		assert(0, "No Avaliable Position")
	}

	deposit(amount) {
		logger.debug("amount :", amount)
		logger.debug("this._collateral_balance : ", this._collateral_balance)
		this._collateral_balance += amount
		logger.debug("this._collateral_balance : ", this._collateral_balance)

	}

	withdraw(amount) {
		logger.debug("account withdraw...")
		logger.debug(this._collateral_balance)
		logger.debug(amount)
		assert(BigNumber.from(amount).lte(BigNumber.from(this._collateral_balance)))
		this._collateral_balance -= BigNumber.from(amount).toNumber()
	}



	trade(asset_id, amount, is_buy) {
		let pid = this.getPositionId(asset_id)
		if (pid == -1) {
			pid = this.getAvaliPositionId()
			this._positions[pid].asset_id = asset_id
		}

		if (is_buy) {
			this._positions[pid].balance += amount
		} else {
			this._positions[pid].balance -= amount	// negative seller
		}
	}

	merkle_hash() {
		// TODO : little endian
		let type = [
			"uint160",
			"uint64"
		]

		let data = [
			this._pubkey_hash,
			this._collateral_balance
		]

		for (var i = 0; i < POSITION_PER_ACCOUNT; i++) {
			type.push("uint16")
			type.push("uint64")
			type.push("uint64")
			data.push(this._positions[i].asset_id)
			data.push(this._positions[i].balance)
			data.push(this._positions[i].cached_funding_index)
		}
		return SHA256(ethers.utils.defaultAbiCoder.encode(type, data))
	}

	print() {
		logger.debug("accountId : ", this._accountId)
		logger.debug("pubkey_hash : ", this._pubkey_hash)
		logger.debug("collateral_balance : ", this._collateral_balance)
		for (var i = 0; i < POSITION_PER_ACCOUNT; i++) {
			logger.debug("position ", i, " : ")
			logger.debug("	asset_id : ", this._positions[i].asset_id)
			logger.debug("	balance : ", this._positions[i].balance)
			logger.debug("	cached_funding_index : ", this._positions[i].cached_funding_index)
		}
	}

} // class Account

export class AccountTree {
	_validium_leaves = []
	_rollup_leaves = []
	_leaves = []
	_pubkey2account = new Map()
	constructor(
		account0_l2key,
		fee_account_l2key
	) {
		// reserve acount 0
		this._validium_leaves[0] = new Account(account0_l2key, false, 0)
		// fee acount 1
		this._validium_leaves[1] = new Account(fee_account_l2key, false, 1)
	}

	createAccount(pubKey_hash, is_rollup) : Account {
		let account = new Account(pubKey_hash, is_rollup)
		if (is_rollup) {
			this._rollup_leaves.push(account)
		} else {
			this._validium_leaves.push(account)
		}
		this._pubkey2account.set(pubKey_hash, account._accountId)
		return account
	}


	getAccountById(aid) : Account {
		if (aid < VALIDIUM_END_ACCOUNT_ID) {
			return this._validium_leaves[aid]
		} else {
			return this._validium_leaves[aid - VALIDIUM_END_ACCOUNT_ID]
		}
	}

	getAccount(pubKey_hash) : Account {
		let aid = this._pubkey2account.get(pubKey_hash)
		return this.getAccountById(aid)
	}

	// return : account change pubdata ?
	applyTx(t) {
		// generate witness for prover
		// accountBefore, accountAfter, accountTreeBefore, accountTreeAfter
		let accountBefore = common.deepCopy(this.getAccount(t.pub_key))
		let accountTreeBefore = common.deepCopy(this)
	
		switch (t.type) {
			case common.OpType.Deposit :
				this.deposit(t.pub_key, t.amount)
				break
			case common.OpType.Withdraw :
				this.withdraw(t.pub_key, t.amount)
				break
			default :
				logger.debug("+++++++ Account Not Support OpType :  ", t.type)
				exit(-1)
		}

		let accountAfter = common.deepCopy(this.getAccount(t.pub_key))
		let accountTreeAfter = common.deepCopy(this)
		let witness = {
			transaction : common.deepCopy(t),
			accountBefore : accountBefore,
			accountAfter : accountAfter,
			accountTreeBefore : accountTreeBefore,
			accountTreeAfter : accountTreeAfter
		}
		return witness
	}

	deposit(pubKey_hash, amount) {
		this.getAccount(pubKey_hash).deposit(amount)
	}

	withdraw(pubKey_hash, amount) {
		this.getAccount(pubKey_hash).withdraw(amount)
	}

	trade(pubKey_buyer, pubKey_seller, asset_id, amount) {
		this.getAccount(pubKey_buyer).trade(asset_id, amount, true)
		this.getAccount(pubKey_seller).trade(asset_id, amount, false)
	}

	getValidiumAccountTree() {
		const merkle_leaves = this._validium_leaves.map(account => account.merkle_hash())
		const tree = new MerkleTree(merkle_leaves, SHA256)
		return tree
	}

	getValidiumAccountRoot() {
		const tree = this.getValidiumAccountTree()
		return "0x" + tree.getRoot().toString('hex')
	}

	printValidiumTree() {
		const tree = this.getValidiumAccountTree()
		logger.debug(tree.toString())
		logger.debug(tree.getRoot().toString('hex'))
	}

	getRollupAccountTree() {
		const merkle_leaves = this._rollup_leaves.map(account => account.merkle_hash())
		const tree = new MerkleTree(merkle_leaves, SHA256)
		return tree
	}

	printRollupTree() {
		const tree = this.getRollupAccountTree()
		logger.debug(tree.toString())
	}

	getRollupAccountRoot() {
		const tree = this.getRollupAccountTree()
		return "0x" + tree.getRoot().toString('hex')
	}

	getAccountRoot() {
		const validiumRoot = this.getValidiumAccountRoot()
		if (this._rollup_leaves.length == 0) {
			return validiumRoot
		}

		const rollupRoot = this.getRollupAccountRoot()
		return "0x" + SHA256(ethers.utils.defaultAbiCoder.encode(
			["bytes32", "bytes32"],
			[validiumRoot, rollupRoot]
		)).toString()
	}

	// getProof(leaf) {
	// 	const tree = this.getAccountTree()
	// 	return tree.getProof(leaf)
	// }

	// verify(proof, leaf, root) {
	// 	const tree = this.getAccountTree()
	// 	return tree.verify(proof, leaf, root) // true or false
	// }
}

if (process.env.ACCOUNT_UNIT_TEST) {
describe("Account Tree Test", function() {
	let at : AccountTree
	let owner
	let owner_l2key = 1111
	let validium_l2key = 2222
	let rollup_l2key = 3333
	before(async () => {
		const owners = await ethers.getSigners()
		owner = owners[0]
		at = new AccountTree(owner_l2key, owner_l2key)
		logger.debug("init account root", at.getAccountRoot())
	});

	it("Create Validium Account", async function() {
		let a = at.createAccount(validium_l2key, false)
		logger.debug("account hash : ", a.merkle_hash())
		await AccountDB.initialize().then(async () => {
			logger.debug("save a : ", a)
			await AccountDB.manager.save(a)

			const accounts = await AccountDB.manager.find(Account)
			logger.debug("Loaded accounts: ", accounts)
		}).catch(error => logger.debug(error))
	});

	it("Create Rollup Account", async function() {
		let a = at.createAccount(rollup_l2key, true)
		logger.debug("account hash : ", a.merkle_hash())

	});

	it("get Account", async function() {
		at.getAccount(rollup_l2key).print()
	});

	it("Print Validium Account Tree", async function() {
		at.printValidiumTree()
	});

	it("Print Rollup Account Tree", async function() {
		at.printRollupTree()
	});

	it("Get AccountRoot", async function() {
		logger.debug("arrayify(\"0x01\") : ", arrayify("0x01"))
		logger.debug("ethers.utils.toUtf8String(\"0x01\") : ", ethers.utils.toUtf8String("0x01"))
		logger.debug("ethers.utils.formatBytes32String(\"01\") : ", ethers.utils.formatBytes32String("01"))
		
		logger.debug("hexify(\"0x01\") : ", hexlify("0x01"))
		//logger.debug("(\"0x01\") : ", hexlify("0x01"))
		let str = hexlify("0x12345678")
		logger.debug(str.slice(0, 4))
	});

	it("Get AccountRoot", async function() {
		logger.debug("accountRoot : ", at.getAccountRoot())
	});

	it("Account Deposit", async function() {
		at.deposit(validium_l2key, 1000)
		at.deposit(rollup_l2key, 2000)
		expect(at.getAccount(validium_l2key)._collateral_balance).equal(1000)
		expect(at.getAccount(rollup_l2key)._collateral_balance).equal(2000)
	});

	it("Account Withdraw", async function() {
		at.withdraw(validium_l2key, 500)
		at.withdraw(rollup_l2key, 1000)
		expect(at.getAccount(validium_l2key)._collateral_balance).equal(500)
		expect(at.getAccount(rollup_l2key)._collateral_balance).equal(1000)
	});

	it("Account Trade", async function() {
		const asset_id = 1
		at.trade(rollup_l2key, validium_l2key, 1, 500)
		expect(at.getAccount(rollup_l2key).getPosition(asset_id).balance).equal(500)
		expect(at.getAccount(validium_l2key).getPosition(asset_id).balance).equal(-500)
	});

});
}
