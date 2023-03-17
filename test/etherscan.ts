import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat" 
import * as utils from './utils'
import axios from "axios";
import { Column, Entity, PrimaryColumn, DataSource } from "typeorm";
import { Perpetual, Verifier } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { readEnv, sleep } from "./utils/common";
import { DB } from "./db";
import { exit } from "process";
import { Dydx } from "../typechain/Dydx";
import { DydxFactory } from "../typechain/DydxFactory";
import { boolean } from "hardhat/internal/core/params/argumentTypes";
const hre = require('hardhat');

@Entity()
export class OnchainTx {
	@PrimaryColumn()
	tid : number

	@Column()
	blockNumber : string

	@Column()
	transactionHash : string

	@Column()
	calldata : string

	@Column()
	blockchain_snapshot_id : number	// used to revert blockchain status

	constructor(
		_tid, _blockNum, _hash, _calldata
	){
		this.tid = _tid
		this.blockNumber = _blockNum
		this.transactionHash = _hash
		this.calldata = _calldata
		this.blockchain_snapshot_id = -1
	}

}


@Entity()
export class ContractInfo {
	@PrimaryColumn()
	cid : number

	@Column()
	address : string

	@Column()
	deployHash : string

	@Column()
	deployBytecode : string

	constructor(
		_id, _address, _hash, _bytecode
	){
		this.cid = _id
		this.address = _address
		this.deployHash = _hash
		this.deployBytecode = _bytecode
	}

}

export function newDB(file_pos) {

	return new DataSource({
		type: "sqlite",
		database: file_pos,
		synchronize: true,
		logging: false,
		entities: [
			OnchainTx, ContractInfo
		],
		migrations: [],
		subscribers: [],
	})

}

export const OnchainDB = newDB("./third-party/calldata.sqlite")

// https://api-rinkeby.etherscan.io/api?module=logs&action=getLogs&fromBlock=10683766&toBlock=latest&address=0xa7e7b05eab63710833c21fe9e2444daeddbdfa4b&apikey=PET6CJHW44RUBYAJ97MKMKTXS7JCWKS2B2
export async function fetchContractTx(
	db : DataSource,
	owner : SignerWithAddress, url, contractAddress, fromBlock) {
	const txs = await db.manager.find(OnchainTx)
	let curTid = 0
	if (txs.length >= 1) {
		fromBlock = txs[txs.length - 1].blockNumber
		curTid = txs[txs.length - 1].tid + 1
	}

	const params = {
		module : "logs",
		action : "getLogs",
		fromBlock : fromBlock,
		toBlock : "latest",
		address : contractAddress,
		apiKey : hre.config.etherscan.apiKey
	}

	await axios.get(url, {
		params : params
	}).then(async function (response) {
		const results = response.data.result

		let m = new Map<string, number>()
		results.forEach(e => {
			m.set(e.transactionHash, e.blockNumber)
		});

		let txHashs = []
		m.forEach((blockNum, txHash) => {
			txHashs.push(txHash)	// Note : map keep insert order
		})

		let pending_tx = []
		let init_enter = true
		for(let thash of txHashs){

			let exist : Boolean = false
			if (init_enter) {
				init_enter = false

				for (let i = 0; i < txs.length; i++) {
					const tx = txs[i];
					if (tx.transactionHash.toLowerCase() === thash.toLowerCase()) {
						exist = true
						break;
					}
				}
			}

			if (exist == false) {
				let resp = await owner.provider.getTransaction(thash)
				await resp.wait()
				const t = new OnchainTx(curTid, resp.blockNumber, thash, resp.data)
				curTid += 1
				console.log("save txHash ", thash, " to DB...")
				await db.manager.save([t])
				console.log(t)
				//pending_tx.push(t)
			} else {
				console.log("txHash ", thash, " already in DB!!")
			}
		}
		// console.log("save pendingTx to DB...")
		// await db.manager.save(pending_tx)
	}).catch(function (error) {
		console.log(error);
	}).then(function () {
		console.log("Done !!!")
	});  
}

export const vk_targets = [
	"0x789c5c997ce9C91aebA40F1e3D62fb03e0DcE12F",
	"0x3eeD852F38647cbD25B986696010e3a030b1b887"
]

// test5
export const vk_changes = [
	"0xef72bd04a01c0adaf2613f33120579a9be948398a99fcd1489c5c07b0471fd0f",
	"0x5b25f946d4ea2f3ebf7860a7a46cf03b8ce8036228d434135720894b9fdf382f",
	"0x55e633e9885a915e445270a11f2a9bbbccf7de427dd04d5b2e9c409a2cdf24a5"
]


// test1
export const vk_changes_test1 = [
	"0x8c002f842ed583786ef2e25fa8689f6b5a68422839991b7d242e59140a4d837c"
]

export async function getContractInfo(owner, contracts) {

	const cs = await OnchainDB.manager.find(ContractInfo)
	let curCid = 0
	if (cs.length >= 1) {
		curCid = cs[cs.length - 1].cid + 1
	}
	
	for (let i = 0; i < contracts.length; i++) {
		const caddr = contracts[i];

		let exist : Boolean = false
		for (let i = 0; i < cs.length; i++) {
			const c = cs[i];
			if (c.address.toLowerCase() === caddr.toLowerCase()) {
				exist = true
				break;
			}
		}


		if (exist == false) {
			const deployByteCode = await owner.provider.getCode(caddr)
			const ci = new ContractInfo(curCid, caddr, "0x", deployByteCode)
			await OnchainDB.manager.save([ci])
			console.log("save contract ", caddr, " to DB...")
			console.log(ci)
		} else {
			console.log("contract ", caddr, " already in DB!!")
		}
	}

}

if (process.env.ETHERSCAN_UNIT_TEST) {
// describe("Etherscan Fetch Rinkeby Tx", function() {
// 	this.timeout(6000000);

// 	let v : Verifier
// 	let p : Perpetual
// 	before(async () => {
// 		await init_config(DB)
// 		await OnchainDB.initialize()
// 	});

// 	it("Block State", async function() {
// 		[v, p] = await utils.common.restoreFromEnv(owner)
// 	});

// 	it("Delete Some Tail Item", async function() {
// 		let txs = await OnchainDB.manager.find(OnchainTx)
// 		const LAST_TID = txs[txs.length-1].tid
// 		//const LAST_TID = 113

// 		for (let i = 0; i < txs.length; i++) {
// 			let tx = txs[i];
// 			if (tx.tid > LAST_TID) {
// 				await OnchainDB.manager.remove(tx)
// 			}	
// 		}

// 		txs = await OnchainDB.manager.find(OnchainTx)
// 		console.log("last tx : ", txs[txs.length-1])
// 	});

// 	it("Fetch Onchain Contract Transaction", async function() {
// 		const txs = await OnchainDB.manager.find(OnchainTx)
// 		console.log("last tx : ", txs[txs.length-1])
// 		const url = "https://api-rinkeby.etherscan.io/api"
// 		await fetchContractTx(OnchainDB, owner, url, readEnv("PERPETUAL"), "10644125")
// 	});

// 	// it("Fetch Onchain Contract Info", async function() {
// 	// 	await getContractInfo(vk_targets)
// 	// });

// });

describe("Etherscan Fetch dydx Tx", function() {
	this.timeout(600000000);

	let v : Verifier
	let p : Perpetual
	let db : DataSource
	let dydx : Dydx
	let owner
	const dydx_proxy = "0xD54f502e184B6B739d7D27a6410a67dc462D69c8"
	before(async () => {
		const owners = await ethers.getSigners()
		owner = owners[0]
		db = newDB("./third-party/dydx.sqlite")
		//await init_config(db)
		await db.initialize()
	});

	// https://api.etherscan.io/api
	//    ?module=logs
	//    &action=getLogs
	//    &fromBlock=379224
	//    &toBlock=latest
	//    &address=0xD54f502e184B6B739d7D27a6410a67dc462D69c8
	//    &topic0=0x617a24590fcf7d5a2650aa9c10572915cb4bf853b1ef135cc1918460946a7a2f
	//    &apikey=PET6CJHW44RUBYAJ97MKMKTXS7JCWKS2B2
	// it("Fetch dydx event", async function() {
	// 	dydx = DydxFactory.connect(dydx_proxy, owner)
	// 	//let filter = dydx.filters.LogGlobalConfigurationApplied(null)
	// 	let filter = dydx.filters.LogAssetConfigurationRegistered(null, null)
	// 	console.log("filter : ",filter)

	// 	const params = {
	// 		module : "logs",
	// 		action : "getLogs",
	// 		fromBlock : 0,
	// 		toBlock : "latest",
	// 		address : dydx_proxy,
	// 		topic0 :filter.topics[0],
	// 		apiKey : hre.config.etherscan.apiKey
	// 	}
	
	// 	const url = "https://api.etherscan.io/api"
	// 	await axios.get(url, {
	// 		params : params
	// 	}).then(async function (response) {
	// 		const results = response.data.result
	// 		console.log(results)
	// 		console.log("results.len ", results.length)
	// 	})
	// 	//let events = await dydx.queryFilter(filter)
	// 	//console.log("event : ", events)

	// 	console.log("globalConfigurationHash :",  await dydx.globalConfigurationHash())
	// });

       it("Fetch Onchain Contract Transaction", async function() {
            const txs = await db.manager.find(OnchainTx)
            if (txs.length > 0) {
                    console.log("last tx : ", txs[txs.length-1])
            }
            const url = "https://api.etherscan.io/api"
			while(1) {
				try {
					await fetchContractTx(db, owner, url, dydx_proxy, "0")
				} catch(e) {
					console.log("catch error ", e)
					console.log("sleep 10s....")
					sleep(10000)
					console.log("continue....")
					continue;
				}
			}
       });


});

}


