const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0x44393dbFe52026530B6b6a92eEEFF0c0fC347E6e";

const ABI = [
  "function campaignCount() view returns (uint256)",
  "function campaigns(uint256) view returns (address recipient, string name, string description, bool active, uint256 totalRaised)",
];

async function main() {
  const contract = await ethers.getContractAt(ABI, CONTRACT_ADDRESS);
  const count = await contract.campaignCount();
  console.log(`campaignCount() on-chain: ${count}\n`);
  for (let i = 1; i <= Number(count); i++) {
    try {
      const c = await contract.campaigns(i);
      console.log(`Campaign ${i}:`, JSON.stringify({
        recipient: c[0], name: c[1], active: c[3], totalRaised: c[4].toString()
      }));
    } catch (e) {
      console.log(`Campaign ${i}: ERROR ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
