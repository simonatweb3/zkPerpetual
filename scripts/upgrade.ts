const hardhat = require('hardhat');

async function main() {
  const SimpleV2 = await hardhat.ethers.getContractFactory("simple");
  const PROXY = "0xcEecd3d9901dE3C0344984dD5aE10cB09321EceE"
  const simple = await hardhat.upgrades.upgradeProxy(PROXY, SimpleV2);
  console.log("SimpleV2 upgraded");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
  	console.error(error);
	process.exit(1);
  });