import "@nomiclabs/hardhat-ethers";
import { ethers, network } from "hardhat";
import { owner } from "./config";
const hre = require('hardhat');

console.log("run snapshot....")


if (process.env.SNAPSHOT_UNIT_TEST) {
	describe("Evm Snapshot Test", function() {
		let snapshot

		before(async () => {
			console.log("hre.config.solpp : ", hre.config.solpp)
		});

		it("Save Snapshot", async function() {
			snapshot = await network.provider.send('evm_snapshot', []);
			console.log("snapshot : ", snapshot)
		});

		it("Revert To Snapshot", async function() {
    		await network.provider.send('evm_revert', [snapshot])
		});

		it("Increase BlockChain Time", async function() {
			await network.provider.send("evm_increaseTime", [3600])
			await network.provider.send("evm_mine")
		});
	});
}
	

