const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PangeaDonation with account:", deployer.address);

  const PangeaDonation = await ethers.getContractFactory("PangeaDonation");
  const contract = await PangeaDonation.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`PangeaDonation deployed to: ${address}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
