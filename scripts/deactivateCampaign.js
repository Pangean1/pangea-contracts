const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0x44393dbFe52026530B6b6a92eEEFF0c0fC347E6e";

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("PangeaDonation", CONTRACT_ADDRESS, signer);

  const campaignId = 2;
  console.log(`Deactivating campaign ${campaignId}…`);
  const tx = await contract.setCampaignActive(campaignId, false);
  await tx.wait();
  console.log("Done. Tx:", tx.hash);
}

main().catch((err) => { console.error(err); process.exit(1); });
