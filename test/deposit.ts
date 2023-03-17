import { ethers } from "hardhat" 
import { expect } from "chai"
import * as utils from './utils'

import {
	Erc20Factory,
	GovernanceFactory,
	Governance,
	VerifierFactory,
	Verifier,
	PerpetualFactory,
	Perpetual
  } from "../typechain"
import { BigNumber } from "ethers"
import { readEnv } from "./utils/common"

export async function deposit(p, l2Key, amount, systemToken)  {
	let l1Addr = await p.ethKeys(l2Key)
	let initRecvAmount = await systemToken.balanceOf(p.address)
	let initSenderAmount = await systemToken.balanceOf(l1Addr)

	// await systemToken.increaseAllowance(p.address, amount)
	await (await systemToken.approve(p.address, amount)).wait()
	await (await p.deposit(l2Key, amount, {gasLimit : 1000000})).wait()
	expect(await systemToken.balanceOf(l1Addr)).equal(initSenderAmount.sub(amount))
	expect(await systemToken.balanceOf(p.address)).equal(initRecvAmount.add(amount))

	expect(await p.pendingDeposits(l2Key)).equal(amount)

	let filter = p.filters.LogDeposit(null,null,null)
	let events = await p.queryFilter(filter)
	let [ethAddr,Key, amount2] = events[0].args
	expect(await p.ethKeys(Key)).equal(ethAddr)
	expect(Key).equal(l2Key)
	expect(amount2).equal(amount)
}

export async function depositCancel(p, l2Key)  {
	await (await p.depositCancel(l2Key)).wait()

	console.log("cancellationRequests timestamp",
				await p.cancellationRequests(l2Key))

	let filter = p.filters.LogDepositCancel(null)
	let events = await p.queryFilter(filter)
	let [Key] = events[0].args
	expect(Key).equal(l2Key)
}


export async function depositReclaim(p, l2Key, amount, systemToken)  {
	let l1Addr = await p.ethKeys(l2Key)
	let initRecvAmount = await systemToken.balanceOf(l1Addr)
	let initSenderAmount = await systemToken.balanceOf(p.address)

	await (await p.depositReclaim(l2Key)).wait()
	expect(await systemToken.balanceOf(l1Addr)).equal(initRecvAmount.add(amount))
	expect(await systemToken.balanceOf(p.address)).equal(initSenderAmount.sub(amount))

	expect(await p.pendingDeposits(l2Key)).equal(0)
	expect(await p.cancellationRequests(l2Key)).equal(0)

	let filter = p.filters.LogDepositCancelReclaimed(null, null)
	let events = await p.queryFilter(filter)
	let [Key, amount2] = events[0].args
	expect(Key).equal(l2Key)
	expect(amount2).equal(amount)
}


if (process.env.DEPOSIT_UNIT_TEST) {
describe("Deposit Unit Test", function() {
	this.timeout(6000000);

	let g, v, p
	let owner
	before(async () => {
		const owners = await ethers.getSigners()
		owner = owners[0]
	});

	it("Deposit", async function() {
		[v, p] = await utils.common.restoreFromEnv(owner)
		let systemToken = Erc20Factory.connect(readEnv("SYSTEM_TOKEN"), owner)
		// await deposit(p, 1111, 1000000, systemToken)
		await deposit(p, "0xfbd1c3722203a8310013200ecbb3a08d63e72b8e", 1000000000, systemToken)
	});

});
}