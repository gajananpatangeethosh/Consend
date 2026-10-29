const hre = require("hardhat");

async function main() {
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Deploying ConsentRegistry to network: ${network.name} (Chain ID: ${network.chainId})...`);

  const [deployer] = await hre.ethers.getSigners();
  if (deployer) {
    console.log(`Deployer address: ${deployer.address}`);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} MSTC`);
  }

  const ConsentRegistry = await hre.ethers.getContractFactory("ConsentRegistry");
  const consentRegistry = await ConsentRegistry.deploy();
  await consentRegistry.waitForDeployment();

  const address = await consentRegistry.getAddress();
  console.log(`\n=========================================`);
  console.log(`ConsentRegistry deployed successfully!`);
  console.log(`Contract Address: ${address}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`=========================================\n`);

  return address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
