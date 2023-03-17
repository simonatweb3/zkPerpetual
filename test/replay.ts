import "@nomiclabs/hardhat-ethers";
import { ethers, network, upgrades } from "hardhat" 
import { hashMessage } from "@ethersproject/hash";
import { expect } from "chai"
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";

import { BytesLike } from "@ethersproject/bytes";

import * as utils from './utils'
import * as user from './user'
import * as deposit from './deposit'
import * as withdraw from './withdraw'
import * as deploy from './deploy'
import * as block from './block'
import * as transaction from './transaction'
import * as fs from "fs"

import './config'

const hre = require('hardhat');

import {
	VerifierFactory,
	Verifier,
	PerpetualFactory,
	Perpetual,
	TrustForwarderFactory,
	DepositProxyFactory,
	TrustForwarder,
	DepositProxy,
	ExchangeFactory,
	TokenExchangeProxy,
	TokenExchangeProxyFactory
  } from "../typechain"

import
{
	owners,
	owner, owner_l2_privkey, owner_l2_validium_pubkey, owner_l2_rollup_pubkey,
	at,
	ot,
	curAccountRoot,
	curOrderStateHash,
	genesisGovernor,
	userAdmin,
	systemToken,
	dacs,
	globalConfig,
	init_config
} from "./config";

import * as config from "./config"
import { Sender} from "./sender";
import { Watcher } from "./watcher";
import { Core } from "./core";
import { Api } from "./api";
import { exit } from "process";
import { ContractInfo, OnchainDB, OnchainTx, vk_changes } from "./etherscan";
import { verifier_bytecodes } from "./calldata";
import { DB } from "./db";
import { logger } from "./utils/log";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("All Contract Test", function() {
	this.timeout(6000000);

	let v : Verifier
	let p : Perpetual
	let tf : TrustForwarder
	let dp : DepositProxy
	let tep : TokenExchangeProxy

	let watcher : Watcher
	let api : Api
	let core : Core
	let sender : Sender

	let block1 : block.Block
	let block2 : block.Block
	before(async () => {
		await init_config(DB)
		block1 = new block.Block(at, ot)
		block2 = new block.Block(at, ot)
		await OnchainDB.initialize()
	});

	it("Deploy", async function() {
		if (process.env.REPLAY_CONTINUE_ID && 0 < parseInt(process.env.REPLAY_CONTINUE_ID, 10)) {
		console.log("already depoly....")
		} else {
		console.log("really depoly....")

		await deploy.deployAll(
			owner,
			genesisGovernor,
			curAccountRoot,
			curOrderStateHash,
			dacs,
			systemToken,
			userAdmin,
			globalConfig.normallizeAssets()
		)
		}
	});

	it("Block State", async function() {
		[v, p] = await utils.common.restoreFromEnv(owner)

		expect(await (await p.callStatic.accountRoot()).toLowerCase()).equal(curAccountRoot.toLowerCase())

		expect(await p.dacNum()).equal(dacs.length)
		for await (const member of dacs) {
			expect(await p.dacs(member)).equal(true)
		}

		console.log("globalConfigHash : ", await p.globalConfigHash())
	});

		async function tx_to_contract(
			address		:	string,
			calldata	:	string)
		{
			let tx = {
			   gasLimit : 20000000,
			   to   : address,
			   data : calldata
			 }
			 console.log("send transaction, wait reciept....")
			 SignerWithAddress
			 let resp = await owner.sendTransaction(tx)
			 await resp.wait()
			 console.log("get reciept....")
		}


		const calldata = "0xd7399e93000000000000000000000000de5599e5ee1eb71267915cd683042c0ccbffdcf300000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000af5ac74690a7678089d5f17adbd4ff4d0737f0770000000000000000000000008fec8d8e1a587364020428012f291b934b9d704d0000000000000000000000000000000000000000000000000000000000000041af3c0062d03e8329b100881ac02d7091107994a1ef2ce50e764f65581c6456c5543fc428906bd3e6af44e714180459cf18a48b3878c093c42c57bc55cc713b971c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000e8d4a510000000000000000000000000000000000000000000000000000000000000000000"
	it("Replay", async function() {
		//await (await p.setValidator(owner.address, true)).wait()

		async function tx_to_perpeture(calldata : string) {
			await tx_to_contract(p.address, calldata)
		}

		async function registerAndDeposit(call_data:string) {
			let decode_data = p.interface.decodeFunctionData("registerAndDeposit", call_data)
			let amount = Math.pow(10, 12)

			let ethAddr = decode_data[0]

			let balance_before = await systemToken.balanceOf(ethAddr)
			await (await systemToken.transfer(ethAddr, amount)).wait()
			expect(await systemToken.balanceOf(ethAddr)).equal(balance_before.add(amount))
			
			// contract using msg.sender, that is who send the tx, so approve both.
			await (await systemToken.approve(p.address, amount)).wait()
			await (await systemToken.approveOther(ethAddr, p.address, amount)).wait()
			expect(await systemToken.allowance(ethAddr, p.address)).equal(amount)
			await tx_to_perpeture(call_data)
		}

		async function deposit(call_data:string) {
			let decode_data = p.interface.decodeFunctionData("deposit", call_data)
			let amount = Math.pow(10, 12)

			let ethAddr = await p.ethKeys(decode_data[0])

			let balance_before = await systemToken.balanceOf(ethAddr)
			await (await systemToken.transfer(ethAddr, amount)).wait()
			expect(await systemToken.balanceOf(ethAddr)).equal(balance_before.add(amount))
			
			await (await systemToken.approve(p.address, amount)).wait()
			await (await systemToken.approveOther(ethAddr, p.address, amount)).wait()
			expect(await systemToken.allowance(ethAddr, p.address)).equal(amount)
			await tx_to_perpeture(call_data)
		}

		async function updateBlocks(call_data:string) {
			await tx_to_perpeture(call_data)
		}

		async function replay_calldata(calldata : string) {
			let desc
			try {
				desc = p.interface.parseTransaction({data : calldata})
				switch (desc.name) {
					case "registerAndDeposit":
						console.log("registerAndDeposit")
						await registerAndDeposit(calldata)
						break;
					case "deposit":
						console.log("deposit")
						await deposit(calldata)
						break;
					case "updateBlocks":
						console.log("updateBlocks")
						console.log(desc.args[0][1][5])
						await updateBlocks(calldata)
						break;
					case "withdraw":
						console.log("withdraw")
						await tx_to_perpeture(calldata)
						break;
					case "upgrade":
						console.log("ignore not perpetual function (upgrade)!!!")
						logger.debug(desc)
						break;
					default:
						console.log("run ", desc.name)
						console.log(desc.args[0])
						await tx_to_perpeture(calldata)
						break;
				}
			} catch (error) {
				console.log(error)
				exit(-1)
			}

		}

		async function repaly_onChain() {

				const txs = await OnchainDB.manager.find(OnchainTx)
				const cis = await OnchainDB.manager.find(ContractInfo)

				for (let i = 0; i < txs.length; i++) {
					const tx = txs[i];
					console.log("tid : ", tx.tid, "   hash : ", tx.transactionHash)

					if (process.env.REPLAY_CONTINUE_ID && tx.tid < parseInt(process.env.REPLAY_CONTINUE_ID, 10)) {
						continue
					}

					const index = vk_changes.indexOf(tx.transactionHash)
					if (index != -1) {
						console.log("meet vk change hash, need upgrade verifier")
						// refer to https://rinkeby.etherscan.io/tx/0x9b6776aeb1d4801b8d9582414b8e2e48cf2e83e820aa765060aced3005323dec

						// const vf = new VerifierFactory(owner)
						// let deployByteCode = vf.bytecode
						const deployByteCode = verifier_bytecodes[index]
			 			const recipt = await (await owner.sendTransaction({data : deployByteCode})).wait()
						const new_verifier_target = recipt.contractAddress

						const admin_address = await upgrades.erc1967.getAdminAddress(v.address)
						const upgrade_raw_data = p.interface.encodeFunctionData("upgrade", [v.address, new_verifier_target])

						await tx_to_contract(admin_address, upgrade_raw_data)

						// TODO : simple using hardhat setCode
						// await network.provider.send("hardhat_setCode", [
						// 	"0x0d2026b3EE6eC71FC6746ADb6311F6d3Ba1C000B",
						// 	"0xa1a2a3...",
						//   ]);
					}

					await replay_calldata(tx.calldata)
					tx.blockchain_snapshot_id = await network.provider.send('evm_snapshot', []);
					await OnchainDB.manager.save([tx])
				}

		}

		// //calldata here already lost first array.
		// let data = Buffer.from(fs.readFileSync("/tmp/verifier_calldata"))
		// console.log("verifier calldata : ", data)
		
		// let calldata = "0x" + data.toString("hex")
		// console.log("verifier calldata.toString() : ", calldata)
		// let desc = v.interface.parseTransaction({data : calldata})
		// console.log("verifier desc : ", desc)

		const curAccountRoot = "0x03ea9d6c83ac8b64fe00bbd9e16645c8c10ea53e22fcbc31e929eccd4a47391a"
		const curOrderStateHash = "0xf6c356cc56814e2283ceb9fbe10054f70d1ad325a44bba594cbc6199666b1250"
		const curGlobalConfigHash = "0x76910a6c7eefabcc7157ba6e205f7b9ba15dd0f3ac3d5587b15be9aaf147a9c6"
		// const curNewGlobalConfigHash = "0x02b655018c04c7982ef2c18954eee0c80e9dd8308f4c370152caf3c472796334"
		await (await p.set_accountRoot(curAccountRoot)).wait()
		await (await p.set_orderStateHash(curOrderStateHash)).wait()
		await (await p.set_globalConfigHash(curGlobalConfigHash)).wait()


		//await (await p.set_newGlobalConfigHash(curNewGlobalConfigHash)).wait()
		//await (await p.set_newGlobalConfigValidBlockNum(2049)).wait()
		//await replay_calldata(add_asset_calldata)

		await replay_calldata(cdata)
		//await repaly_onChain()
	});


	// it("call ", async function() {
		
	// 	const vaddr = "0x686cD2d7Ac2C442241ABfeFC0b803FdD813f76A4"
	// 	const ver = VerifierFactory.connect(vaddr, owner)

	// 	console.log("Old Ver Target ", await upgrades.erc1967.getImplementationAddress(ver.address))

	// 	const other = owners[1]
	// 	const vf = new VerifierFactory(other)
	// 	let vc = await upgrades.upgradeProxy(ver.address, vf);
	// 	await vc.deployed()

	// 	console.log("New Ver Target ", await upgrades.erc1967.getImplementationAddress(ver.address))

	// 	const paddr = "0xa7e7b05eab63710833c21fe9e2444daeddbdfa4b"
	// 	console.log("Old Pep Target ", await upgrades.erc1967.getImplementationAddress(paddr))

	// 	const pf = new PerpetualFactory(other)
	// 	let pc = await upgrades.upgradeProxy(paddr, pf);
	// 	await pc.deployed()

	// 	console.log("New Pep Target ", await upgrades.erc1967.getImplementationAddress(paddr))


	// 	const pep = PerpetualFactory.connect(paddr, owner)
	// 	console.log("globalConfig Hash : ", await pep.globalConfigHash())
	// 	await (await pep.setValidator(owner.address, true)).wait()

	// 	const l2Key = "784527736214645084361163541421759615128503447751"
	// 	let amount = 210000000
	// 	await (await pep.set_pendingDeposit(l2Key, amount)).wait()
	// 	await (await pep.set_systemTokenDecimal(6)).wait()

	// 	await tx_to_contract(pep.address, calldata)

	// });

});

