const { ethers } = require("hardhat");

const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
const TARGET_WALLET = "0xDF0C29DFEd174833c584813A2373646fa7e11594";

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const polBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer POL balance: ${ethers.formatEther(polBalance)} POL`);

  // Send 0.5 POL for gas
  console.log(`\nSending 0.01 POL to ${TARGET_WALLET}...`);
  const polTx = await deployer.sendTransaction({
    to: TARGET_WALLET,
    value: ethers.parseEther("0.01"),
  });
  await polTx.wait();
  console.log(`POL sent: ${polTx.hash}`);

  // Send 10 USDC
  const usdc = await ethers.getContractAt(USDC_ABI, USDC_ADDRESS, deployer);
  const deployerUsdc = await usdc.balanceOf(deployer.address);
  console.log(`\nDeployer USDC balance: ${ethers.formatUnits(deployerUsdc, 6)} USDC`);

  console.log(`Sending 8 USDC to ${TARGET_WALLET}...`);
  const usdcTx = await usdc.transfer(TARGET_WALLET, ethers.parseUnits("8", 6));
  await usdcTx.wait();
  console.log(`USDC sent: ${usdcTx.hash}`);

  // Confirm balances
  const newPol = await ethers.provider.getBalance(TARGET_WALLET);
  const newUsdc = await usdc.balanceOf(TARGET_WALLET);
  console.log(`\nTarget wallet balances:`);
  console.log(`  POL:  ${ethers.formatEther(newPol)}`);
  console.log(`  USDC: ${ethers.formatUnits(newUsdc, 6)}`);
  console.log(`\nDone. Wallet is ready for testing.`);
}

main().catch(e => { console.error(e); process.exit(1); });
