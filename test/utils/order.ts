import { ethers } from "hardhat"
import { exit } from "process"
import * as common from './common'
const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')

// refer to lib/types/src/operations/primitives/limit_order.rs
export class Order {
	transaction
	_deal_amount = 0

	constructor(t) {
		this.transaction = t
	}

	hash() {
		// TODO : Poseidon hash
		return this.transaction.hash()
	}

}

export class OrderTree {
	_leaves = []
	hash2order = new Map()

	applyTx(t) {
		// TODO : 1 transaction may result in 2 order, like trade

		if (t.type != common.OpType.Withdraw ||
			t.type != common.OpType.Trade
		) {
			return
		}

		let order = new Order(t)
		this._leaves.push(order)

		this.hash2order[order.hash()] = order
		return order
	}

	updateOrder(orderHash, newDealAmount) {
		this.hash2order[orderHash]._deal_amount = newDealAmount
	}

	tree() {
		const merkle_leaves = this._leaves.map(order => order.hash())
		const tree = new MerkleTree(merkle_leaves, SHA256)
		return tree
	}

	root() {
		//return "0x" + this.tree().getRoot().toString('hex')
		return "0x1111111111111111111111111111111111111111111111111111111111111111"
	}

	stateHash() {
		// return getOrderStateHash()
	}

}

export async function buildOrderRoot(genesisOrderStateHash){

}

export function getOrderStateHashOld() {
	const global_funding_index_hash = ethers.utils.formatBytes32String("0")
	const oracle_price_hash = ethers.utils.formatBytes32String("0")
	let global_state_hash = ethers.utils.sha256(
		ethers.utils.defaultAbiCoder.encode(
			["bytes32", "bytes32"],
			[global_funding_index_hash, oracle_price_hash]
		)
	)

	const orderRoot = ethers.utils.formatBytes32String("0")
	return ethers.utils.sha256(
		ethers.utils.defaultAbiCoder.encode(
			["bytes32", "bytes32"],
			[orderRoot, global_state_hash]
		)
	)
}

export function encodeWithPad(
	data : number[],
	padLen : number
){
	let pad = []
	let d
	for (let i = 0; i < padLen; i++) {
		if (i < data.length) {
			d = data[i]
		} else {
			d = 0
		}

        pad.push(ethers.utils.defaultAbiCoder.encode(
            ["uint64"], [d]))
	}
    
	let encode_data = ethers.utils.hexConcat(pad)
	return encode_data
}
	
export function hashWithPad(
	data : number[],
	padLen : number
){
	return ethers.utils.sha256(encodeWithPad(data, padLen))
}

export function getGlobalFundingIndexHash(
	timestamp : number,
	globalFindingIndex : number[]
){
	let timestamp_data = ethers.utils.defaultAbiCoder.encode(["uint32"],[timestamp])
	let encode_data =  encodeWithPad(globalFindingIndex, common.MAX_ASSETS_COUNT)
	return ethers.utils.sha256(ethers.utils.hexConcat([timestamp_data, encode_data]))
}

export function getOraclePriceHash(
	oraclePrice : number[]
){
	return hashWithPad(oraclePrice, common.MAX_ASSETS_COUNT)
}

export function getGloalStateHash(
	timestamp : number,
	globalFundingIndexHash : string,
	oraclePriceHash : string
) {
	return ethers.utils.sha256(
		ethers.utils.defaultAbiCoder.encode(
			["uint256", "bytes32", "bytes32"],
			[timestamp, globalFundingIndexHash, oraclePriceHash]
		)
	)
}

export function getOrderStateHash(
	orderRoot : string,
	globalStateHash : string
) {
	return ethers.utils.sha256(
		ethers.utils.defaultAbiCoder.encode(
			["bytes32", "bytes32"],
			[orderRoot, globalStateHash]
		)
	)
}