import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";


describe("Simple", function() {
	this.timeout(60000000);
	let owner


	async function tx_to_contract(
		address		:	string,
		calldata	:	string)
	{
		let tx = {
		   to   : address,
		   data : calldata
		 }
		 console.log("send transaction, wait reciept....")
		 let resp = await owner.sendTransaction(tx)
		 await resp.wait()
		 console.log("get reciept....")
	}

	before(async () => {
		const owners = await ethers.getSigners()
		owner = owners[1]
	});

	it("tx calldata ", async function() {
		const addr = "0x"
		const calldata = "0x"
		await tx_to_contract(addr, calldata)
	});
});