import { expect } from "chai"

export async function withdraw(p, l2Key, amount, systemToken, l1Addr)  {
	let WithdrawTo = true
	if (l1Addr == undefined) {
		l1Addr = await p.ethKeys(l2Key)
		WithdrawTo = false
	}

	let initRecvAmount = await systemToken.balanceOf(l1Addr)
	let initSenderAmount = await systemToken.balanceOf(p.address)

	if (WithdrawTo) {
		console.log("withdrawTo......")
		await (await p.withdrawTo(l2Key, l1Addr)).wait()
	} else {
		console.log("withdraw......")
		await (await p.withdraw(l2Key)).wait()
	}
	expect(await systemToken.balanceOf(l1Addr)).equal(initRecvAmount.add(amount))
	expect(await systemToken.balanceOf(p.address)).equal(initSenderAmount.sub(amount))
}
