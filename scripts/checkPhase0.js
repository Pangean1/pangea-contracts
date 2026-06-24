const { ethers } = require("hardhat");

const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
const CONTRACT_ADDRESS = "0x44393dbFe52026530B6b6a92eEEFF0c0fC347E6e";
const DEPLOYER = "0xea3c014A97c2f0a5302560Cf94A2B1D27b9A9520";

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
];

const CONTRACT_ABI = [
  "function allowedTokens(address) view returns (bool)",
];

async function main() {
  console.log("=== Phase 0 — Prerequisites Check ===\n");

  // POL balance
  const polBalance = await ethers.provider.getBalance(DEPLOYER);
  console.log(`Deployer POL balance: ${ethers.formatEther(polBalance)} POL`);

  // USDC contract
  const usdc = await ethers.getContractAt(ERC20_ABI, USDC_ADDRESS);
  let symbol, decimals, usdcBalance;
  try {
    symbol = await usdc.symbol();
    decimals = await usdc.decimals();
    usdcBalance = await usdc.balanceOf(DEPLOYER);
    console.log(`USDC address: ${USDC_ADDRESS}`);
    console.log(`USDC symbol: ${symbol}`);
    console.log(`USDC decimals: ${decimals}`);
    console.log(`Deployer USDC balance: ${ethers.formatUnits(usdcBalance, decimals)} ${symbol}`);
  } catch (e) {
    console.log(`USDC address check FAILED: ${e.message}`);
  }

  // Allowlist check
  const contract = await ethers.getContractAt(CONTRACT_ABI, CONTRACT_ADDRESS);
  try {
    const allowed = await contract.allowedTokens(USDC_ADDRESS);
    console.log(`\nUSDC on contract allowlist: ${allowed}`);
  } catch (e) {
    console.log(`\nAllowlist check FAILED: ${e.message}`);
  }

  console.log("\n=== Summary ===");
  const polOk = polBalance >= ethers.parseEther("0.05");
  const usdcOk = usdcBalance && usdcBalance > 0n;
  console.log(`POL balance OK (need ≥0.05): ${polOk ? "YES" : "NO — need to fund"}`);
  console.log(`USDC balance OK (need ≥1): ${usdcOk ? "YES" : "NO — need faucet"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
