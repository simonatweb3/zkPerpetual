import { ethers } from "hardhat" 

import {
	GovernanceFactory,
	Governance,
	VerifierFactory,
	Verifier,
	PerpetualFactory,
	Perpetual
  } from "../../typechain"


export const MAX_ASSETS_COUNT = 31
export const MAX_NUMBER_ORACLES = 6
  
  export enum OpType {
    Noop,    // 0
    Deposit,
    ForceTrade,
    ForceWithdraw,
    Withdraw,
    Trade,
    Transfer,
    ConditionalTransfer,
    FundingTick,
    OraclePriceTick,
    Liquidate,
    Deleverage
}

// asset oracle price/timestamp, update per "oracle_price_tick" operation
let oracle_price_tick_timestamp 
let asset_oracle_price = [
	{
		assert_id : 1,
		oracle_price : 0,
	}
]
let global_oracle_price_state = [
	oracle_price_tick_timestamp,
	asset_oracle_price
]

// update per funding tick ?
let global_funding_index_state = [
	{
		assert_id : 1,
		cal_funding_index : 0,	// could be negative
	}
]

//
let assets_info= [
	{
		assert_id : 1,
		resolution : 10^12,			// 10^12 amount in layer2 == 1 BTC, 10^18 layer1
		risk_factor : 1 * 2^32,
		asset_name : "BTCUSD",
		oracle_price_quorum : 5,
		oracle_price_signers_pubkey_hash : "0x"
	}
]

import * as fs from 'fs';

const hre = require('hardhat');
export function is_hardhat_local_network() {
	return hre.hardhatArguments.network == undefined ||
		   hre.hardhatArguments.network == "localhost" ||
		   hre.hardhatArguments.network == "ganache" ||
		   hre.hardhatArguments.network == "hardhat"

}

export function writeToEnv(name:string, value:string) {
	if (is_hardhat_local_network()) {
		name = "TEST_" + name
	}
	console.log(name, " : ", value)
    let str = "\n" + name + " = " + value
    fs.appendFileSync('.env', str)
	process.env[name] = value
}

export function readEnv(name:string) {
	if (is_hardhat_local_network()) {
		name = "TEST_" + name
	}
	return process.env[name]
}

export function sleep(ms) {
	console.log("sleep ", ms, " ms")
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function deepCopy(obj) {
	return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj)
}

export function generateL2PrivKey(l1_priv_key) {
	return ethers.utils.sha256(l1_priv_key)
}

export function generateL2PubKey(l1_priv_key) {
	const l2_priv_key = generateL2PrivKey(l1_priv_key)
	return ethers.utils.computePublicKey(l2_priv_key, true).slice(0,20)
}


export async function restoreFromEnv(owner) {
	let [va,pa] = [
		readEnv("VERIFIER"),
		readEnv("PERPETUAL")
	]

	let v, p
	v = VerifierFactory.connect(va, owner)
	p = PerpetualFactory.connect(pa, owner)
	return [v, p]

}


export function packPubData(data, size) : string {
	let pubData = ethers.utils.hexlify("0x");
	data.forEach((val, idx, array) => {
		pubData = ethers.utils.hexConcat(
    		[	ethers.utils.hexlify(pubData),
        		ethers.utils.hexZeroPad(
          			ethers.utils.hexlify(val), 
					size[idx])
      		])
  	});
  	return pubData
}
if (process.env.COMMON_UNIT_TEST) {
describe("Util Common Test", function() {
	let owner
	before(async () => {
		const owners = await ethers.getSigners()
		owner = owners[0]
		console.log('signer : ', owner.address)
	});

	it("Test generateL2PrivKey", async function() {
		// TODO : use l1 private key
		console.log(generateL2PrivKey(owner.address))
	});

	it("Test generateL2PubKey", async function() {
		console.log(generateL2PubKey(owner.address))
	});

});
}