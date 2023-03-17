import "@nomiclabs/hardhat-ethers";
import { network } from "hardhat";
import { owner } from "./config";
const hre = require('hardhat');

if (process.env.SNAPSHOT_UNIT_TEST) {
	describe("Evm Snapshot Test", function() {
		let snapshot

		before(async () => {
		});

		it("Save Snapshot", async function() {
			snapshot = await network.provider.send('evm_snapshot', []);
			console.log("snapshot : ", snapshot)
		});

		it("Revert To Snapshot", async function() {
    		await network.provider.send('evm_revert', [snapshot])
		});
	});
}
	

