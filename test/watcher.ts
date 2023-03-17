import { ethers } from "hardhat" 
import initSqlJs from "sql.js"
import * as fs from "fs"
import * as utils from './utils'

import * as transaction from './transaction'

import {
	PerpetualFactory,
	Perpetual
} from "../typechain"


import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, DataSource } from "typeorm"
import { BigNumber } from "ethers"
import { expect } from "chai"

@Entity()
export class OnchainEvent {

	@PrimaryColumn()
	id : number

	@Column()
	blockNumber : number

	@Column()
	logIndex : number
	@Column()
	processed : boolean

	@Column()
	type : string
	@Column()
	args : string

	constructor() {
		this.processed = false
	}
}

export class Watcher {
	p : Perpetual
	db : DataSource
	at : utils.account.AccountTree

	constructor(
		p : Perpetual,
		db : DataSource,
		at : utils.account.AccountTree
	) {
		this.p = p
		this.db = db
		this.at = at
	}

	async listen() {
		let filter = {}
		// let filter = this.p.filters.LogUserRegistered(null, null, null)
		// filter.topics = filter.topics.concat(this.p.filters.LogDeposit(null, null, null).topics)
		// console.log(filter)

		let fromBlock = 0
		let fromLogIndex = 0
		let saved_event = await this.db.manager.find(OnchainEvent)
		if (saved_event.length !=0 ) {
			fromBlock = saved_event[saved_event.length - 1].blockNumber
			fromLogIndex = saved_event[saved_event.length - 1].logIndex + 1
		}

		let events = await this.p.queryFilter(filter, fromBlock)
		for (let index = 0; index < events.length; index++) {
			let event = events[index]

			if (event.blockNumber == fromBlock &&
				event.logIndex < fromLogIndex
				) {
				continue
			}

			let e = new OnchainEvent()
			e.blockNumber = event.blockNumber
			e.logIndex = event.logIndex
			if (event.event == undefined) {
				e.type = 'undefined'
			} else {
				e.type = event.event
			}

			if (event.args == undefined) {
				e.args = 'undefined'
			} else {
				e.args = JSON.stringify(event.args) 
			}

			await this.db.manager.save(e)
		}
	}

	async process() {
		const events = await this.db.manager.find(OnchainEvent)
	
		let transactions :transaction.Transaction[] = []

		for await (let event of events) {
			if (!event.processed && event.type != undefined) {
				switch (event.type) {
					case 'LogUserRegistered':
						console.error("event LogUserRegistered")
						await this.userRegister(event)
						break;
					case 'LogDeposit':
						console.info("event LogDeposit")
						transactions.push(await this.deposit(event))
						break;
					case 'LogDepositCancel':
						console.info("event LogDepositCancel, ignore")
						event.processed = true
						await this.db.manager.save([event])
						break;
					case 'LogDepositCancelReclaimed':
						console.info("event LogDepositCancelReclaimed clear prev deposit")
						await this.depositCancelReclaimed(event)
						const last_tx = transactions.pop()
						expect(last_tx.type).eq(1)	// hack : prev must be deposit
						break
					default:
						console.error("ignore unexpected event ", event.type)
						break;
				}
			}
		}

		return transactions
	}

	async userRegister(
		event : OnchainEvent
	) {
		let args = JSON.parse(event.args)
		let operations = []
	
		args[1].forEach(key => {
			let a = this.at.createAccount(key.hex, true)		// TODO: validium
			operations.push(a)
		});
	
		event.processed = true
		operations.push(event)
		// Atomic whole db Transaction
		await this.db.manager.save(operations)
	}

	async deposit(
		event : OnchainEvent
	){
		let args = JSON.parse(event.args)
		let operations = []
	
		let t = new transaction.Deposit(
			args[1].hex,
			BigNumber.from(args[2].hex))
		operations.push(t)
	
		event.processed = true
		operations.push(event)
		await this.db.manager.save(operations)
		return t
	}

	async depositCancelReclaimed(
		event : OnchainEvent
	) {
		let operations = []
		let txs = await this.db.manager.find(transaction.Deposit)
		console.log("before reclaim txs :  ", txs)
		await this.db.manager.remove(txs[txs.length-1])

		event.processed = true
		operations.push(event)
		await this.db.manager.save(operations)

		txs = await this.db.manager.find(transaction.Deposit)
		console.log("after reclaim txs :  ", txs)
	}

}

if (process.env.Watcher_UNIT_TEST) {
	describe("Wachter Unit Test", function() {
		this.timeout(6000000);
		let owner
		let w : Watcher
		
		before(async () => {
			const owners = await ethers.getSigners()
			owner = owners[0]
			console.log('signer : ', owner.address)

			let [v, p] = await utils.common.restoreFromEnv(owner)
			let at = new utils.account.AccountTree(0, 0)
			w = new Watcher(p, DB, at)
		});

		it("listen", async function() {
			await w.listen()
		});

		it("process", async function() {
			await w.process()
		});
	});
}

