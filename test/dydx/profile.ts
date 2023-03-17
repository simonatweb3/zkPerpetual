import "@nomiclabs/hardhat-ethers";
import { ethers, network, upgrades } from "hardhat" 
const hre = require('hardhat');

import { ContractInfo, newDB, OnchainDB, OnchainTx, vk_changes } from "../etherscan";
import { DataSource } from "typeorm";
import { Dydx, DydxFactory } from "../../typechain";
import { exit } from "process";


describe("All Contract Test", function() {
	this.timeout(6000000);

	let db : DataSource
	const dydx_proxy = "0xD54f502e184B6B739d7D27a6410a67dc462D69c8"
	let dydx : Dydx
	let owner
	let amount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

	before(async () => {
		db = newDB("./third-party/dydx.sqlite")
		await db.initialize()

		const owners = await ethers.getSigners()
		owner = owners[0]
		dydx = DydxFactory.connect(dydx_proxy, owner)
	});

		async function replay_calldata(tx : OnchainTx) {
			let calldata = tx.calldata
			let desc
			try {
				desc = dydx.interface.parseTransaction({data : calldata})
				//console.log(desc)
				switch (desc.name) {
					case "registerUser":
						//console.log(tx.tid,  ". registerUser (", desc.args[0], ", ", desc.args[1], ")")
					case "registerAndDepositERC20":
						//console.log(tx.tid,  ". registerAndDepositERC20 ", "......txHash : ", tx.transactionHash)
						// if (tx.tid > 23000) {
						// 	console.log(tx.tid, ". r...")
						// }
						break;
					case "deposit":
						//console.log(tx.tid,  ". deposit (", desc.args[0], ", ", desc.args[1], ", ", desc.args[2], ", ", desc.args[3], ")")
						//console.log("d")
						break;
					case "depositCancel":
						console.log(tx.tid,  ". depositCancel (", desc.args[0], ", ", desc.args[1], ", ", desc.args[2], ")", "......txHash : ", tx.transactionHash)
						break;
					case "depositReclaim":
						console.log(tx.tid,  ". depositReclaim (", desc.args[0], ", ", desc.args[1], ", ", desc.args[2], ")", "......txHash : ", tx.transactionHash)
						break;
					case "updateState":
						//console.log(tx.tid,  ". updateState.............")
						//console.log("u")
						break;
					case "withdraw":
					case "withdrawTo":
						//console.log("withdraw......")
						//console.log("w")
						break;
					case "forcedWithdrawalRequest":
						console.log(tx.tid,  ". forcedWithdrawalRequest (", desc.args[0], ", ", desc.args[1], ", ", desc.args[2], ", ", desc.args[3], ")", "......txHash : ", tx.transactionHash)
						break;
					case "forcedTradeRequest":
						console.log(tx.tid,  ". forcedTradeRequest :", desc.args, "......txHash : ", tx.transactionHash)
						break;
					case "addImplementation":
						console.log(tx.tid,  ". addImplementation ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "upgradeTo":
						console.log(tx.tid,  ". upgradeTo ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "registerAvailabilityVerifier":
						console.log(tx.tid,  ". registerAvailabilityVerifier (", desc.args[0], ", ", desc.args[1], ")", "......txHash : ", tx.transactionHash)
						break;
					case "registerVerifier":
						console.log(tx.tid,  ". registerVerifier (", desc.args[0], ", ", desc.args[1], ")", "......txHash : ", tx.transactionHash)
						break;
					case "registerTokenAdmin":
						console.log(tx.tid,  ". registerTokenAdmin ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "unregisterTokenAdmin":
						console.log(tx.tid,  ". unregisterTokenAdmin ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "registerUserAdmin":
						console.log(tx.tid,  ". registerUserAdmin ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "registerOperator":
						console.log(tx.tid,  ". registerOperator ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "unregisterOperator":
						console.log(tx.tid,  ". unregisterOperator ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "registerSystemAssetType":
						console.log(tx.tid,  ". registerSystemAssetType (", desc.args[0], ", ", desc.args[1], ")", "......txHash : ", tx.transactionHash)
						break;
					case "registerGlobalConfigurationChange":
						console.log(tx.tid,  ". registerGlobalConfigurationChange ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "registerAssetConfigurationChange":
						console.log(tx.tid,  ". registerAssetConfigurationChange (", desc.args[0], ", ", desc.args[1], ")", "......txHash : ", tx.transactionHash)
						break;
					case "applyGlobalConfigurationChange":
						console.log(tx.tid,  ". applyGlobalConfigurationChange ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "applyAssetConfigurationChange":
						console.log(tx.tid,  ". applyAssetConfigurationChange (", desc.args[0], ", ", desc.args[1], ")", "......txHash : ", tx.transactionHash)
						break;
					case "mainNominateNewGovernor":
						console.log(tx.tid,  ". mainNominateNewGovernor ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "proxyNominateNewGovernor":
						console.log(tx.tid,  ". proxyNominateNewGovernor ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "proxyAcceptGovernance":
						console.log(tx.tid,  ". proxyAcceptGovernance ", "......txHash : ", tx.transactionHash)
						break;
					case "proxyRemoveGovernor":
						console.log(tx.tid,  ". proxyRemoveGovernor ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "mainRemoveGovernor":
						console.log(tx.tid,  ". mainRemoveGovernor ", desc.args[0], "......txHash : ", tx.transactionHash)
						break;
					case "mainAcceptGovernance":
						console.log(tx.tid,  ". mainAcceptGovernance ", "......txHash : ", tx.transactionHash)
						break;
					case "execTransaction":
						//console.log(tx.tid,  ". execTransaction ", desc.args)
						console.log(tx.tid,  ". execTransaction.................. ", "txHash : ", tx.transactionHash)
						break;
					case "execute":
						console.log(tx.tid,  ". execute.................. ", "txHash : ", tx.transactionHash)
						break;
					case "depositToExchange":
						console.log(tx.tid,  ". depositToExchange..... ", "txHash : ", tx.transactionHash)
						break;
					case "withdrawFromExchange":
						console.log(tx.tid,  ". withdrawFromExchange..... ", "txHash : ", tx.transactionHash)
						break;
					case "depositEth":
						if (++amount[2] % 100 == 1) {
							console.log(tx.tid,  ". depositEth.....,  amount ", amount[2], "txHash : ", tx.transactionHash)
						}
						break;
					case "depositERC20":
						if (++amount[1] % 100 == 1) {
							console.log(tx.tid,  ". depositERC20.....,  amount ", amount[1], "txHash : ", tx.transactionHash)
						}
						break;
					case "approveSwapAndDepositERC20":
						console.log(tx.tid,  ". approveSwapAndDepositERC20..... ", "txHash : ", tx.transactionHash)
						break;
					default:
						console.log("err tx : ", tx)
						exit(-1)
						break;
				}
			} catch (error) {
				if (tx.calldata.startsWith("0x2ecb8162")) {
					console.log(tx.tid,  ". forcedTradeRequest........txHash : ", tx.transactionHash)
				} else if (tx.calldata.startsWith("0x41706c4e")) {
					if (++amount[0] % 1000 == 1) {
						console.log(tx.tid,  ". Deposit Flow 0x41706c4e,  amount ", amount[0],  "........txHash : ", tx.transactionHash)
					}
				} else if (tx.calldata.startsWith("0xa07bb134")) {
					console.log(tx.tid,  ". Deposit Flow 0xa07bb134........txHash : ", tx.transactionHash)
				} else if (tx.calldata.startsWith("0x19597566")) {
					console.log(tx.tid,  ". Deposit Flow 0x19597566........txHash : ", tx.transactionHash)
				} else if (tx.calldata.startsWith("0xc1f12a8c")) {
					console.log(tx.tid,  ". Deposit Flow 0xc1f12a8c........txHash : ", tx.transactionHash)
				} else if (tx.calldata.startsWith("0xf1f6fb8f")) {
					console.log(tx.tid,  ". Deposit Flow 0xf1f6fb8f........txHash : ", tx.transactionHash)
				} else if (tx.calldata.startsWith("0x79cb8958")) {
					console.log(tx.tid,  ". Deposit Flow 0x79cb8958........txHash : ", tx.transactionHash)
				} else {
					console.log("\n\n\n", tx.tid, ".......no match methodID ", tx.calldata.slice(0, 10) , " txHash : ", tx.transactionHash, "\n\n\n")
					exit(-1)
				}
			}

		}

	it("Profile dydx proxy txs", async function() {
		const txs = await db.manager.find(OnchainTx)

		for (let i = 0; i < txs.length; i++) {
			const tx = txs[i];
			await replay_calldata(tx)
		}

	});

});
