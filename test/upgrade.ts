import * as deploy from './deploy'
import { ethers, upgrades } from "hardhat" 

import {
	GovernanceFactory,
	Governance,
	VerifierFactory,
	Verifier,
	PerpetualFactory,
	Perpetual
  } from "../typechain"
import { is_hardhat_local_network, readEnv, restoreFromEnv, writeToEnv } from './utils/common';
import { verify } from './verify';

const hre = require('hardhat');
import * as fs from 'fs';

describe("Upgrade Test", function() {
	this.timeout(60000000);
	let owner
	let v, p

	before(async () => {
		const owners = await ethers.getSigners()
		//if (is_hardhat_local_network()) {
			owner = owners[0]
		// } else {
		// 	owner = owners[1]
		// }

	 	let [_v, _p] = await restoreFromEnv(owner)
		v = _v
		p = _p
		//console.log("owner : ", owner)
	});

	// it("transfer admin ", async function() {
	// 	console.log("hre.network.provider : ", hre.network.provider)
	// 	console.log("p.address : ", p.address)
	// 	const c = await upgrades.admin.getInstance()
	// 	console.log("admin address : ", await upgrades.erc1967.getAdminAddress(p.address))
	// 	console.log("impl address : ", await upgrades.erc1967.getImplementationAddress(p.address))
	// 	//console.log("beacon address : ", await upgrades.erc1967.getBeaconAddress(p.address))
	// 	await upgrades.admin.changeProxyAdmin(p.address, "0xbB41B4FD140980DD74C465DeEF375099B2AACb90") // using hardhat default signer 0
	// 	//await upgrades.admin.transferProxyAdminOwnership(owner.address)
	// });

	it("upgrade ", async function() {
		let old_target = await upgrades.erc1967.getImplementationAddress(readEnv("PERPETUAL"))
		console.log("old target : ", old_target)
		const pf = new PerpetualFactory(owner)
		let c = await upgrades.upgradeProxy(
			readEnv("PERPETUAL"), pf
			// ,{
			// 	call : {
			// 		fn : "upgrade",
			// 		args : ["0x1234"]
			// 	}
			// }
			);
		await c.deployed()
		
		let new_target = await upgrades.erc1967.getImplementationAddress(readEnv("PERPETUAL"))
		let upgrade_flag = "\n# ++++++ upgrade " + hre.hardhatArguments.network + " on " + new Date().toUTCString() + " ++++++++++++"
		fs.appendFileSync('.env', upgrade_flag)
			console.log("process.env.VERIFY_ETHERSCAN ", process.env.VERIFY_ETHERSCAN)
		if (old_target.toLowerCase() != new_target.toLowerCase()) {
			console.log("upgrade perpetual to ", new_target)
			writeToEnv("PERPETUAL_TARGET", new_target)
			if (process.env.VERIFY_ETHERSCAN != "0") {
				await verify(new_target)
			}
		}

		old_target = await upgrades.erc1967.getImplementationAddress(readEnv("VERIFIER"))
		const vf = new VerifierFactory(owner)
		let vc = await upgrades.upgradeProxy(
			readEnv("VERIFIER"),
			vf);
		await vc.deployed()

		new_target = await upgrades.erc1967.getImplementationAddress(readEnv("VERIFIER"))
		if (old_target.toLowerCase() != new_target.toLowerCase()) {
			console.log("upgrade verifier to ", new_target)
			writeToEnv("VERIFIER_TARGET", new_target)
			if (process.env.VERIFY_ETHERSCAN != "0") {
				await verify(new_target)
			}
		}
	});
});