const { ethers } = require("hardhat");

const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
const CONTRACT_ADDRESS = "0x44393dbFe52026530B6b6a92eEEFF0c0fC347E6e";
const CAMPAIGN_ID = 1;
const AMOUNT = 1_000_000n; // 1 USDC (6 decimals)
const MESSAGE = "test donation";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

const CONTRACT_ABI = [
  "function donate(uint256 campaignId, address token, uint256 amount, string calldata message) external",
  "function campaigns(uint256) view returns (uint256 id, address recipient, uint256 totalRaised, uint256 goal, bool active, string name, string description)",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Donor: ${deployer.address}`);

  const usdc = await ethers.getContractAt(ERC20_ABI, USDC_ADDRESS, deployer);
  const contract = await ethers.getContractAt(CONTRACT_ABI, CONTRACT_ADDRESS, deployer);

  // Check campaign exists and is active
  const campaign = await contract.campaigns(CAMPAIGN_ID);
  console.log(`\nCampaign ${CAMPAIGN_ID}: "${campaign.name}"`);
  console.log(`Recipient: ${campaign.recipient}`);
  console.log(`Total raised before: ${ethers.formatUnits(campaign.totalRaised, 6)} USDC`);
  console.log(`Active: ${campaign.active}`);

  if (!campaign.active) {
    console.error("Campaign is not active — cannot donate.");
    process.exit(1);
  }

  // Step 1: Approve
  console.log(`\nStep 1: Approving contract to spend ${ethers.formatUnits(AMOUNT, 6)} USDC...`);
  const approveTx = await usdc.approve(CONTRACT_ADDRESS, AMOUNT);
  console.log(`Approve TX: ${approveTx.hash}`);
  await approveTx.wait();
  console.log("Approval confirmed.");

  // Step 2: Donate
  console.log(`\nStep 2: Calling donate()...`);
  const donateTx = await contract.donate(CAMPAIGN_ID, USDC_ADDRESS, AMOUNT, MESSAGE);
  console.log(`Donate TX: ${donateTx.hash}`);
  console.log("Waiting for confirmation...");
  await donateTx.wait();
  console.log("Donation confirmed.");

  // Verify on-chain
  const campaignAfter = await contract.campaigns(CAMPAIGN_ID);
  console.log(`\nTotal raised after: ${ethers.formatUnits(campaignAfter.totalRaised, 6)} USDC`);
  console.log(`\nView on Amoy explorer:`);
  console.log(`https://amoy.polygonscan.com/tx/${donateTx.hash}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
