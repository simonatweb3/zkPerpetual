import { assert } from "console"
import { ethers } from "hardhat" 
import { expect } from "chai"

import * as utils from "./utils"

export function concatL2KeyHash(l2Keys, l1Addr) {
	let concatKeyHash = ethers.utils.keccak256("0x")

	for (let key of l2Keys) {
		concatKeyHash = ethers.utils.keccak256(
			ethers.utils.defaultAbiCoder.encode(
				["bytes32", "uint256"],
				[concatKeyHash, key]
			)
		)
	}

	let msg = 
		ethers.utils.defaultAbiCoder.encode(
			//["string", "bytes32", "bytes32"],
			["bytes32", "bytes32"],
			[
				//"Starlab Perpetual UserRegistration: ",
				ethers.utils.defaultAbiCoder.encode(
					["address"], [l1Addr]
				),
				concatKeyHash
			]
		)
	return msg
}

export async function register(l1Addr, l2Keys, p, userAdmin)  {

	let msg = concatL2KeyHash(l2Keys, l1Addr)
	let signature = await userAdmin.signMessage(msg)
	console.log("signature : ", signature)
	expect(ethers.utils.verifyMessage(msg, signature)).equal(userAdmin.address)

	let tx = await p.registerUser(l1Addr, l2Keys, signature)
	await tx.wait()

	l2Keys.forEach(l2Key =>async () => {
		expect(await p.ethKeys(l2Key)).equal(l1Addr)
	});

	// let filter = p.filters.LogUserRegistered(null,null,null)
	// let events = await p.queryFilter(filter)
	// let [ethAddr, Keys, sender] = events[0].args
	// expect(ethAddr).equal(l1Addr)
	// expect(sender).equal(userAdmin.address)
	// for (let i = 0; i < Keys.length; i++) {
	// 	expect(Keys[i]).equal(l2Keys[i])
	// }
}

export async function registerAndDeposit(l1Addr, l2Keys, p, userAdmin, ids, amounts)  {
	let msg = concatL2KeyHash(l2Keys, l1Addr)
	let signature = await userAdmin.signMessage(msg)
	expect(ethers.utils.verifyMessage(msg, signature)).equal(userAdmin.address)

	let tx = await p.registerAndDeposit(l1Addr, l2Keys, signature, ids, amounts)
	await tx.wait()
}

if (process.env.USER_UNIT_TEST) {
describe("User Regiter Unit Test", function() {
	this.timeout(6000000);
	let g, v, p
	let owner
	before(async () => {
		const owners = await ethers.getSigners()
		owner = owners[0]
	});

	it("User Register", async function() {
		[v, p] = await utils.common.restoreFromEnv(owner)
		await register(owner.address, [1111, 2222], p, owner)
	});

});
}