import { DataSource } from "typeorm"
import { Block } from "./block"
import { Deposit, Transaction, Withdraw } from "./transaction"
import { Account } from "./utils/account"
import { OnchainEvent } from "./watcher"

export const DB = new DataSource({
    type: "sqlite",
    database: "/tmp/db.sqlite",
    synchronize: true,
    logging: false,
    entities: [
		OnchainEvent,
		Account,
		Transaction, Deposit, Withdraw,
		Block
	],
    migrations: [],
    subscribers: [],
})
