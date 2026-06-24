const { ethers } = require("hardhat");

const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
const CONTRACT_ADDRESS = "0x44393dbFe52026530B6b6a92eEEFF0c0fC347E6e";

const CONTRACT_ABI = [
  "function addTokenToAllowlist(address token) external",
  "function allowedTokens(address) view returns (bool)",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const contract = await ethers.getContractAt(CONTRACT_ABI, CONTRACT_ADDRESS, deployer);

  const before = await contract.allowedTokens(USDC_ADDRESS);
  console.log(`USDC on allowlist before: ${before}`);

  if (before) {
    console.log("Already allowed — nothing to do.");
    return;
  }

  console.log("Sending addTokenToAllowlist transaction...");
  const tx = await contract.addTokenToAllowlist(USDC_ADDRESS);
  console.log(`TX hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  await tx.wait();

  const after = await contract.allowedTokens(USDC_ADDRESS);
  console.log(`USDC on allowlist after: ${after}`);
  console.log(after ? "SUCCESS" : "FAILED — check contract owner");
}

main().catch((e) => { console.error(e); process.exit(1); });
