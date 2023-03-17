const hardhat = require('hardhat');

async function main() {
  const Simple = await hardhat.ethers.getContractFactory("simple");
  const simple = await hardhat.upgrades.deployProxy(Simple);
  await simple.deployed();
  console.log("Simple deployed to:", simple.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
  	console.error(error);
	process.exit(1);
  });