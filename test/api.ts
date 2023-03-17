
// api

import { DataSource } from "typeorm";
import { Withdraw } from "./transaction";

export class Api {

	db : DataSource

	constructor(
		db : DataSource
	) {
		this.db = db
	}

	// --> transaction
	withdraw(pub_key, amount, fee) {
		let t = new Withdraw(pub_key, amount, fee)
		this.db.manager.save(t)
		return t
	}

}
