import { expect } from "chai"
import axios  from "axios"
import * as fs from 'fs';

import * as utils from "./utils"
import * as deploy from "./deploy"
import { ethers, upgrades } from "hardhat" 
import { is_hardhat_local_network } from "./utils/common";

const hre = require('hardhat');

	async function waitEtherscan(addr: string) {

		// wait deploy contract ready on chain
		while(1) {
		  const code = await ethers.provider.getCode(addr)
		  if (code.length > 2) {
			break
		  } else {
			console.log("waiting ")
			await utils.common.sleep(10000)
		  }
		}
	}

export async function verify(addr: string) {
		if (!is_hardhat_local_network()) {
			await waitEtherscan(addr)
			try {
				await hre.run('verify', {address : addr});
			} catch (e) {
				console.error(e);
			}
		}
	}

export async function verify2(addr: string, args) {
		if (typeof hre.hardhatArguments.network != "undefined") {
			await waitEtherscan(addr)
			try {
				// await hre.run('verify:verify', {address : addr, constructorArguments : args});
				await hre.run('verify', {address : addr, constructorArguments : args});
			} catch (e) {
				console.error(e);
			}
		}
	}
if (process.env.VERIFY_UNIT_TEST) {

describe("Verify", function() {
	this.timeout(6000000);
	let g, v, p
	let owner

	before(async () => {
		const owners = await ethers.getSigners()
		owner = owners[0]
		console.log('signer : ', owner.address)

	});







	
	// it("Verify Etherscan", async function() {
	// 	[v, p] = await utils.common.restoreFromEnv(owner)

	// 	// let args = [
	// 	// 	zt.address, 
	// 	// 	ethers.utils.defaultAbiCoder.encode(
	// 	// 		['address', 'address', 'address', 'address', 'address', 'bytes32'],
	// 	// 		[g.address, v.address, ve.address, s.address, zcbt.address, process.env.CONTRACTS_GENESIS_ROOT]
	// 	// 	)
	// 	// ]
	// 	await verify2(await upgrades.erc1967.getImplementationAddress(g.address), args)

	// });

	it("Etherscan Download Source Code", async function() {
		const DIR = "./third-party/dydx/1inch/"

		let contractAddress = "0xDef1C0ded9bec7F1a1670819833240f027b25EfF"
		const url = "https://api.etherscan.io/api"

		await axios.get(url, {
			params : {
				module : "contract",
				action : "getsourcecode",
				address : contractAddress,
				apiKey : hre.config.etherscan.apiKey
			}
		})
  			.then(function (response) {
    			// handle success
				console.log("response.data.status: ", response.data.status);
				console.log("response.data.message: ", response.data.message);
				console.log("response.data.result[0].CompilerVersion: ", response.data.result[0].CompilerVersion);
				console.log("response.data.result[0].ConstructorArguments: ", response.data.result[0].ConstructorArguments);
				// console.log(response.data.result[0].ABI)

				let codes = JSON.parse(response.data.result[0].SourceCode)
				for (const key of Object.keys(codes)) {
					fs.writeFileSync(DIR+key, codes[key].content)
				}

  			})
			.catch(function (error) {
				console.log(error);
			})
			.then(function () {
				console.log("executed")
			});  
	});

});
}