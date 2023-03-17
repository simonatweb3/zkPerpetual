const hardhat = require('hardhat');

async function main() {

	const [deployer] = await hardhat.ethers.getSigners();
      
	console.log(
	  "Deploying contracts with the account:",
	  deployer.address
	);
	
	console.log("Account balance:", (await deployer.getBalance()).toString());
      
	const cf = await hardhat.ethers.getContractFactory("simple");
	const c = await cf.deploy();
      
	console.log("Contract Address:", c.address);
      }
      
      main()
	.then(() => process.exit(0))
	.catch(error => {
	  console.error(error);
	  process.exit(1);
	});