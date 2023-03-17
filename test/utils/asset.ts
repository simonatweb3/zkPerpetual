import { logger } from "ethers"
import { hexZeroPad } from "ethers/lib/utils"
import { ethers } from "hardhat"
import * as common from "./common"

export class Asset {
	asset_id : number
	resolution : number
	risk_factor : number
	asset_name
	oracle_price_quorum
	oracle_price_signers_pubkey_hash

	constructor(
		asset_id,
		resolution,
		risk_factor,
		asset_name,
		oracle_price_quorum,
		oracle_price_signers_pubkey_hash
	) {
		this.asset_id = asset_id
		this.resolution = resolution
		this.risk_factor = risk_factor
		this.asset_name = asset_name
		this.oracle_price_quorum = oracle_price_quorum
		this.oracle_price_signers_pubkey_hash = oracle_price_signers_pubkey_hash
	}

	normalize() {
		return [
			this.resolution, this.risk_factor,
			ethers.utils.hexConcat([
				this.asset_name,
				ethers.utils.hexZeroPad("0x", 12 - this.asset_name.length)
			]),
			this.oracle_price_signers_pubkey_hash
		]
	}

	encode() {
		let real_oracle_num = (this.oracle_price_signers_pubkey_hash.length - 2) / 40
		let lens = [
			8, 4, 12, real_oracle_num * 20, (common.MAX_NUMBER_ORACLES - real_oracle_num) * 20
		]

		let datas = this.normalize()
		datas.push(hexZeroPad("0x", (common.MAX_NUMBER_ORACLES - real_oracle_num) * 20))
		return common.packPubData(datas, lens)
	}
}


if (process.env.ASSET_UNIT_TEST) {
	describe("Asset Unit Test", function() {
		let owner
		let a
		before(async () => {
			const owners = await ethers.getSigners()
			owner = owners[0]
		});

		it("New Asset", async function() {
			const ASSET_BTC = ethers.utils.toUtf8Bytes("BTC-USD")
			a = new Asset(0, 1000000, 100, ASSET_BTC, 3, [owner.address])
		});

		it("Encode Asset", async function() {
			console.log("a.encode() : ", a.encode())
		});


		it("New Asset From Env", async function() {

			console.log("process.env.ASSETS : ", process.env.ASSETS)
			let assets = JSON.parse(process.env.ASSETS)
			console.log("assets : ", assets)
			console.log("assets[0] : ", assets[0])
			console.log("assets[0][2] : ", assets[0][2])
	
			assets.forEach(e => {
				let o = new Asset(e[0], e[1], e[2], ethers.utils.toUtf8Bytes(e[3]), e[4], e[5])
				console.log("o.encode() : ", o.encode())
			});

		});

	});
}