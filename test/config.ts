import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat" 
import { hashMessage } from "@ethersproject/hash";
import { expect } from "chai"
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";

import { BytesLike } from "@ethersproject/bytes";

import * as utils from './utils'
import * as user from './user'




import {
  Erc20Factory,
  UsdcFactory,
  VerifierFactory,
  Verifier,
  PerpetualFactory,
  Perpetual,
  Erc20
} from "../typechain"
import { GlobalConfig } from "./utils/globalConfig";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { buildOrderRoot } from "./utils/order";
import { is_hardhat_local_network, readEnv } from "./utils/common";
import { DataSource } from "typeorm";
import { logger } from "./utils/log";
import { config } from "process";

export let owners, owner : SignerWithAddress, owner_l2_privkey, owner_l2_validium_pubkey, owner_l2_rollup_pubkey
export let other : SignerWithAddress
export let at : utils.account.AccountTree
// export let va : utils.account.Account
// export let ra : utils.account.Account
export let ot : utils.order.OrderTree

export let curAccountRoot
export let curOrderStateHash
export let genesisGovernor
export let genesisValidator
export let userAdmin
export let systemToken : Erc20
export let initTokenAmount : BigNumber
export let dacs
export let globalConfig : GlobalConfig

export function setAccountRoot(newRoot) {
	curAccountRoot = newRoot
}

export function setOrderStateHash(newHash) {
	curOrderStateHash = newHash
}

export async function build_account_tree(genesisAccountRoot) {
	owner_l2_privkey = utils.common.generateL2PrivKey(owner.address)
	owner_l2_validium_pubkey = utils.common.generateL2PubKey(owner.address)
	owner_l2_rollup_pubkey = utils.common.generateL2PubKey(owner_l2_validium_pubkey)
	at = new utils.account.AccountTree(1111, 2222)
	ot = new utils.order.OrderTree()
}


export async function init_config(db : DataSource)  {

	await db.initialize()
	owners = await ethers.getSigners()
	owner = owners[0]
	other = owners[1]

	dacs = JSON.parse(process.env.DAC)

	let assets = JSON.parse(process.env.ASSETS)
	globalConfig = new utils.globalConfig.GlobalConfig(
			process.env.funding_validity_period,
			process.env.price_validity_period,
			process.env.max_funding_rate)
	assets.forEach(e => {
		globalConfig.addAsset(e[0], e[1], e[2], ethers.utils.toUtf8Bytes(e[3]), e[4], e[5])
	});

	curAccountRoot = process.env.GENESIS_ACCOUNT_ROOT
	curOrderStateHash = process.env.GENESIS_ORDER_STATE_HASH
	
	userAdmin = process.env.USER_ADMIN
	if (!is_hardhat_local_network()) {
		await build_account_tree(curAccountRoot)
		await buildOrderRoot(curOrderStateHash)

		genesisGovernor = process.env.GENESIS_GOVERNOR
		genesisValidator = process.env.GENESIS_VALIDATOR

		systemToken = Erc20Factory.connect(readEnv("SYSTEM_TOKEN"), owner)
		initTokenAmount = await systemToken.balanceOf(owner.address)

		// initTokenAmount = ethers.utils.parseEther("1000000000.0")
		// systemToken = await(new UsdcFactory(owner)).deploy(initTokenAmount)
	} else {
		userAdmin = owner.address
		dacs.push(owners[0].address)
		dacs.push(owners[1].address)
		dacs.push(owners[2].address)

		await db.dropDatabase()
		await db.destroy()
		await db.initialize()

		await build_account_tree(curAccountRoot)
		await buildOrderRoot(curOrderStateHash)

		genesisGovernor = owner.address
		genesisValidator = owner.address


		if (process.env.REPLAY_CONTINUE_ID &&
			0 < parseInt(process.env.REPLAY_CONTINUE_ID, 10)) {
			systemToken = UsdcFactory.connect(readEnv("SYSTEM_TOKEN"), owner)
			initTokenAmount = await systemToken.balanceOf(owner.address)
		} else {
			initTokenAmount = ethers.utils.parseEther("10000.0")
			systemToken = await(new UsdcFactory(owner)).deploy(initTokenAmount)
		}
	}
	logger.info("genesisGovernor : ", genesisGovernor)
	logger.debug("genesisValidator : ", genesisValidator)
	logger.debug("curAccountRoot : ", curAccountRoot)
	logger.debug("curOrderStateHash : ", curOrderStateHash)
	logger.debug("systemToken.address : ", systemToken.address)
	logger.debug("userAdmin : ", userAdmin)
	logger.debug("dacs : ", dacs)
	globalConfig.print()
}
