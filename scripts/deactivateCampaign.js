const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0x44393dbFe52026530B6b6a92eEEFF0c0fC347E6e";

// Pass campaign IDs via env var (Hardhat 2.x doesn't support CLI passthrough args), e.g.:
//   CAMPAIGN_IDS=1,3,4,5 npx hardhat run scripts/deactivateCampaign.js --network amoy
// Falls back to campaign 2 (the original single-ID use of this script) if none given.
const campaignIds = (process.env.CAMPAIGN_IDS || "")
  .split(",")
  .map(s => s.trim())
  .filter(s => /^\d+$/.test(s))
  .map(Number);

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("PangeaDonation", CONTRACT_ADDRESS, signer);

  const ids = campaignIds.length > 0 ? campaignIds : [2];
  for (const campaignId of ids) {
    console.log(`Deactivating campaign ${campaignId}…`);
    const tx = await contract.setCampaignActive(campaignId, false);
    await tx.wait();
    console.log(`  Done. Tx: ${tx.hash}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
