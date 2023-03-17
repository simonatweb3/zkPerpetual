import { hexZeroPad, Logger } from "ethers/lib/utils"
import { ethers } from "hardhat"
import * as asset from "./asset"
import * as common from "./common"
import { logger } from "./log"

export class GlobalConfig {
	n_synthetic_assets_info
	funding_validity_period
	price_validity_period
	max_funding_rate

	assets = []

	constructor(
		funding_validity_period,
		price_validity_period,
		max_funding_rate
	) {
		this.n_synthetic_assets_info = 0
		this.funding_validity_period = funding_validity_period
		this.price_validity_period = price_validity_period
		this.max_funding_rate = max_funding_rate
	}

	addAsset(
		asset_id,
		resolution,
		risk_factor,
		asset_name,
		oracle_price_quorum,
		oracle_price_signers_pubkey_hash
	) {
		
		let a = new asset.Asset(
			asset_id, resolution, risk_factor,asset_name,oracle_price_quorum,
			oracle_price_signers_pubkey_hash
		)
		this.assets.push(a)
		this.n_synthetic_assets_info += 1
		return a
	}

	normallizeAssets() {
		let res = []
		this.assets.forEach(a => {
			res.push(a.normalize())
		});
		return res
	}

	encode() {
		let lens = [
			2, 4, 4, 8
		]

		let datas = [
			this.n_synthetic_assets_info,
			this.funding_validity_period,
			this.price_validity_period,
			this.max_funding_rate
		]

		let encodeData = common.packPubData(datas, lens)

		this.assets.forEach(asset => {
			encodeData = ethers.utils.hexConcat(
				[
					encodeData,
					asset.encode()
				])
		});

		encodeData = ethers.utils.hexConcat(
			[
				encodeData,
				hexZeroPad("0x", (common.MAX_ASSETS_COUNT - this.assets.length) * (24 + common.MAX_NUMBER_ORACLES * 20))
			])

		//logger.debug("js globalConfig encode data : ", encodeData)
		return encodeData
	}

	hash() {
		const hash = ethers.utils.sha256(this.encode())
		return hash
	}

	print() {
		logger.debug("+++++++++++ Global Config Dump Start +++++++++++++")
		logger.debug("n_synthetic_assets_info : ", this.n_synthetic_assets_info)
		logger.debug("funding_validity_period : ", this.funding_validity_period)
		logger.debug("price_validity_period : ", this.price_validity_period)
		logger.debug("max_funding_rate : ", this.max_funding_rate)
		logger.debug("assets : ", this.normallizeAssets())
		logger.debug("hash : ", this.hash())
		logger.debug("+++++++++++ Global Config Dump End +++++++++++++")
	}
	
}

if (process.env.GLOBAL_CONFIG_UNIT_TEST) {
	describe("Global Config Unit Test", function() {
		let owner
		let gc
		before(async () => {
			const owners = await ethers.getSigners()
			owner = owners[0]
		});

		it("New GlobalConfig", async function() {
			gc = new GlobalConfig(64, 3600, 3600, 10)
		});


		it("Add Asset", async function() {
			const ASSET_BTC = ethers.utils.toUtf8Bytes("BTC-USD")
			gc.addAsset(0, 1000000, 100, ASSET_BTC, 3, [owner.address])
			const ASSET_ETH = ethers.utils.toUtf8Bytes("ETH-USD")
			gc.addAsset(1, 1000000, 100, ASSET_ETH, 3, [owner.address])
		});

		it("Encode", async function() {
			logger.debug("gc.encode() : ", gc.encode())
		});

		it("Hash", async function() {
			logger.debug("gc.hash() : ", gc.hash())
		});

		it("normallizeAssets", async function() {
			logger.debug("gc.normallizeAssets() : ", await gc.normallizeAssets())
		});
	});
}

// let sol = "0x000c\
// 			 01e13380\
// 			 01e13380\
// 			 0000000100000000\
// 			 00000000000f4240\
// 			 07ae147b\
// 			 425443555344430000000000\
// 			 9158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b4554485553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b4441495553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b5a52585553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b4241545553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b4b4e435553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b4c494e4b55534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b434f4d5055534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b444f474555534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b5348494255534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b5452585553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f424007ae147b444f545553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d66000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// let js  = "0x000c\
// 			 01e13380\
// 			 01e13380\
// 			 0000000100000000\
// 			 00000000000f4240\
// 			 07ae147b\
// 			 425443555344430000000000\
// 			 9158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b4554485553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b4441495553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b5a52585553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b4241545553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b4b4e435553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b4c494e4b55534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b434f4d5055534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b444f474555534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b5348494255534443000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b5452585553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d6600000000000f424007ae147b444f545553444300000000009158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d669158e94270fee7cb6749a77be2d65e40d56c8d66000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000