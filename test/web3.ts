import { web3 } from "hardhat"

describe("Hardhat-web3 Unit Test", function() {
	let owner
	before(async () => {
		const owners = await web3.eth.getSigners()
		owner = owners[0]
	});

	it("call", async function() {
		console.log("owner : ", owner)
	});
});
