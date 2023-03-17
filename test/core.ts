
// core : transactions --> block

import { DataSource } from "typeorm"
import { Block } from "./block"
import { Transaction } from "./transaction"
import { AccountTree } from "./utils/account"
import { OrderTree } from "./utils/order"

export class Core {
	db : DataSource
	at : AccountTree
	ot : OrderTree

	constructor(
		db : DataSource,
		at : AccountTree,
		ot : OrderTree
	) {
		this.db = db
		this.at = at
		this.ot = ot
	}

	async addTransToBlock(
		b : Block,
		transactions : Transaction[]
	) {
		transactions.forEach(t => {
			// TODO check if able to apply tx, gas limit
			console.info("block add t ", t)

			// TODO : if depositCancel,  revert pending deposit

			if (!t.wrappedToBlock) {
				b.applyTx(t)
				t.wrappedToBlock = true
				this.db.manager.save([b, t])
			}
		});
	}

	async wrapBlock() {
		let transactions = await this.db.manager.find(Transaction)
		console.log("transactions : ", transactions)

		let b = new Block(this.at, this.ot)
		this.addTransToBlock(b, transactions)
	}
}

if (process.env.CORE_UNIT_TEST) {
	describe("Core Unit Test", function() {
		this.timeout(6000000);
		let c : Core

		before(async () => {
			let at = new AccountTree(1111, 2222)
			let ot = new OrderTree()

			c = new Core(DB, at, ot)
		});

		it("warpBlock", async function() {
			await c.wrapBlock()
		});

	});
}

