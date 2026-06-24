const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0x44393dbFe52026530B6b6a92eEEFF0c0fC347E6e";

const TEST_CAMPAIGNS = [
  {
    recipient: "0xc0B8B9765276c8877884d917A0d8a8107d4c29Bb",
    name: "Clean Water for Rural Communities",
    description: "Providing clean drinking water access to 500 families in underserved rural areas through well construction and filtration systems.",
  },
  {
    recipient: "0x6375741B57Efe858701a889b0d4D234119B012a5",
    name: "School Supplies for Children in Need",
    description: "Delivering backpacks, notebooks, and essential school supplies to 200 children who cannot afford basic educational materials.",
  },
  {
    recipient: "0x0FE73451a84459c35281E4435ef1cc8D3854Dd52",
    name: "Emergency Food Relief",
    description: "Distributing food packages to 300 displaced families affected by recent flooding in coastal communities.",
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const abi = [
    "function createCampaign(address recipient, string calldata name, string calldata description) external returns (uint256)",
    "function campaignCount() external view returns (uint256)",
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, deployer);

  const countBefore = await contract.campaignCount();
  console.log(`Campaigns on-chain before: ${countBefore}\n`);

  for (const c of TEST_CAMPAIGNS) {
    console.log(`Creating campaign: "${c.name}"`);
    console.log(`  Recipient: ${c.recipient}`);
    const tx = await contract.createCampaign(c.recipient, c.name, c.description);
    const receipt = await tx.wait();
    console.log(`  Tx: ${receipt.hash}`);
    console.log(`  Done.\n`);
  }

  const countAfter = await contract.campaignCount();
  console.log(`Campaigns on-chain after: ${countAfter}`);
  console.log("All test campaigns created successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
