import "@nomiclabs/hardhat-ethers";
import { ethers, upgrades } from "hardhat" 
import { hashMessage } from "@ethersproject/hash";
import { expect } from "chai"
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";

import { BytesLike } from "@ethersproject/bytes";

import * as fs from 'fs';
import * as utils from './utils'
require('dotenv').config()
const hre = require('hardhat');

import {
  VerifierFactory,
  Verifier,
  PerpetualFactory,
  Perpetual,
  DepositProxyFactory,
  TrustForwarderFactory,
  UsdcExchangeProxyFactory,
  TokenExchangeProxyFactory
} from "../typechain"
import { concat, hexlify, keccak256 } from "ethers/lib/utils";

export async function deployAll(
	signer,
	genesisGovernor,
	curAccountRoot,
	curOrderStateHash,
	dacs,
	systemToken,
	userAdmin,
	assets
) {
	const vf = new VerifierFactory(signer)
	//console.log("vf.bytecode : ", vf.bytecode)
	const v = await upgrades.deployProxy(vf);
	await v.deployed();
	console.log('Verifier Proxy : ', v.address)
	const verifier_target_address = await upgrades.erc1967.getImplementationAddress(v.address)
	console.log("Verifier Target ", verifier_target_address)

	const pf = new PerpetualFactory(signer)
	
	const deploy_parameters = {
		verifierAddress 		: v.address,
		// verifierEscapeAddress : v.address,
		accountRoot 			: curAccountRoot,
		orderStateHash	 		: curOrderStateHash,
		collateralToken			: systemToken.address,
		innerDecimal			: process.env.INNER_DECIMAL,
		userAdmin 				: userAdmin,
		genesisGovernor			: genesisGovernor,
		genesisValidator		: genesisValidator,
		dacMembers 				: dacs,
		dac_reg_timelock		: process.env.DAC_REG_TIMELOCK,
		global_config_change_timelock : process.env.GLOBAL_CONFIG_CHANGE_TIMELOCK,  // TODO
		funding_validity_period : globalConfig.funding_validity_period,
		price_validity_period	: globalConfig.price_validity_period,
		max_funding_rate 		: globalConfig.max_funding_rate,
		max_asset_num			: process.env.MAX_ASSETS_COUNT,
		max_oracle_num			: process.env.MAX_NUMBER_ORACLES,
		synthetic_assets		: assets,
		deposit_cancel_timelock	: process.env.DEPOSIT_CANCEL_TIMELOCK,
		forced_action_expire_time	: process.env.FORECE_ACTION_EXPIRE_TIME
	}
	const p = await upgrades.deployProxy(pf, [deploy_parameters])
	await p.deployed()
	console.log('Perpetual Proxy : ', p.address)
	const perpetual_target_address = await upgrades.erc1967.getImplementationAddress(p.address)
	console.log("Perpetual Target ", perpetual_target_address)
	console.log("globalConfigHash : ", await p.globalConfigHash())

	await verify2(perpetual_target_address, deploy_parameters)

	let deploy_flag = "\n# ++++++ depoly " + hre.hardhatArguments.network + " on " + new Date().toUTCString() + " ++++++++++++"
	fs.appendFileSync('.env', deploy_flag)
	utils.common.writeToEnv("VERIFIER", v.address)
	utils.common.writeToEnv("VERIFIER_TARGET", verifier_target_address)
	utils.common.writeToEnv("PERPETUAL", p.address)
	utils.common.writeToEnv("PERPETUAL_TARGET", perpetual_target_address)

	if (is_hardhat_local_network()) {
		const tf = await (new TrustForwarderFactory(owner)).deploy()
		const dp = await (new DepositProxyFactory(owner)).deploy(
			p.address,
			systemToken.address,
			tf.address
		)
		const tep = await (new TokenExchangeProxyFactory(owner)).deploy(systemToken.address)

		utils.common.writeToEnv("TRUST_FOWRADER", tf.address)
		utils.common.writeToEnv("DEPOSIT_PROXY", dp.address)
		utils.common.writeToEnv("EXCHANGE_PROXY", tep.address)
	}

	utils.common.writeToEnv("GLOBAL_CONFIG_HASH", await p.globalConfigHash())
	utils.common.writeToEnv("SYSTEM_TOKEN", systemToken.address)
	//return [v, p, tf, dp, tep]
}


import
{
	owner,
	curAccountRoot,
	curOrderStateHash,
	genesisGovernor,
	userAdmin,
	systemToken,
	dacs,
	globalConfig,
	init_config,
	genesisValidator
} from "./config";
import { verify2 } from "./verify";
import { DB } from "./db";
import { is_hardhat_local_network } from "./utils/common";

if (process.env.DEPLOY_ONLY) {

describe("Only Deploy Contract", function() {
	this.timeout(60000000);

	let v, p
	before(async () => {
		let signers = await ethers.getSigners()
		console.log(signers[0].address)
		await init_config(DB)
	});

	it("Deploy", async function() {
		await deployAll(
			owner,
			genesisGovernor,
			curAccountRoot,
			curOrderStateHash,
			dacs,
			systemToken,
			userAdmin,
			globalConfig.normallizeAssets()
		)
	});

	// it("Block State", async function() {
	// 	[v, p] = await utils.common.restoreFromEnv(owner)
	// 	console.log("collateralToken : ", await p.collateralToken())
	// 	expect(await p.callStatic.accountRoot()).equal(curAccountRoot)
	// 	expect(await p.accountRoot()).equal(curAccountRoot)
	// 	expect(await p.dacNum()).equal(dacs.length)
	// });

});
}
