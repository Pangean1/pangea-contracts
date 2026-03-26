const { ethers } = require("hardhat");

async function main() {
  const ONE_YEAR = 365 * 24 * 60 * 60;
  const unlockTime = Math.floor(Date.now() / 1000) + ONE_YEAR;
  const lockedAmount = ethers.parseEther("0.001");

  console.log("Deploying Lock...");
  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });
  await lock.waitForDeployment();

  const address = await lock.getAddress();
  console.log(`Lock deployed to: ${address}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
