# PANGEA Contracts

> 📄 For the full project vision and technical specification, see the [PANGEA White Paper](https://github.com/Pangean1/pangea-backend/blob/main/docs/PANGEA_WhitePaper_Technical_v4.0.docx)

Smart contracts for **PANGEA** — a non-profit peer-to-peer humanitarian donation platform built on Polygon PoS. Donors send stablecoins directly to vetted campaign recipients with zero platform fees, full on-chain transparency, and immutable audit trails.

---

## Table of Contents

- [Project Overview](#project-overview)
- [PangeaDonation.sol](#pangea-donationsol)
  - [Features](#features)
  - [Key Functions](#key-functions)
  - [DonationSent Event](#donationsent-event)
- [MockERC20.sol](#mockerc20sol)
- [Test Suite](#test-suite)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Run Tests](#run-tests)
  - [Deploy to Polygon Amoy Testnet](#deploy-to-polygon-amoy-testnet)
  - [Verify on Polygonscan](#verify-on-polygonscan)
- [Network Configuration](#network-configuration)
- [Security Considerations](#security-considerations)
- [Tech Stack](#tech-stack)
- [Related Repositories](#related-repositories)
- [License](#license)

---

## Project Overview

PANGEA connects donors directly with humanitarian causes on **Polygon PoS** — a low-fee, high-throughput EVM-compatible chain. Every donation flows P2P from the donor's wallet straight to the campaign recipient; the contract never holds funds. All transactions are permanently recorded on-chain, giving donors, recipients, and auditors a verifiable record of every contribution.

**Key principles:**
- **Non-custodial** — funds are never held by the contract
- **Allowlisted tokens** — only owner-approved ERC-20s (e.g. USDC, USDT) can be used
- **Campaign-gated** — donations can only be sent to active, owner-created campaigns
- **Reentrancy-safe** — OpenZeppelin `ReentrancyGuard` on all state-mutating external calls

---

## PangeaDonation.sol

### Features

| Feature | Details |
|---|---|
| Token allowlist | Owner adds/removes ERC-20 tokens that donors may use |
| Campaign management | Owner creates campaigns with a recipient address, name, and description |
| Campaign lifecycle | Campaigns can be paused and reactivated by the owner |
| P2P transfers | `donate()` calls `safeTransferFrom` — tokens go directly from donor to recipient |
| Cumulative tracking | Each campaign records `totalRaised` across all donations |
| Rich event log | `DonationSent` emits 7 fields for full off-chain indexing |
| Access control | OpenZeppelin `Ownable` — all admin functions restricted to the contract owner |
| Reentrancy guard | OpenZeppelin `ReentrancyGuard` on `donate()` |

### Key Functions

```solidity
// ── Admin ─────────────────────────────────────────────────────────────────

// Approve an ERC-20 token for use in donations
function addTokenToAllowlist(address token) external onlyOwner

// Revoke an ERC-20 token from the allowlist
function removeTokenFromAllowlist(address token) external onlyOwner

// Create a new donation campaign (auto-increments campaignCount)
function createCampaign(
    address recipient,
    string calldata name,
    string calldata description
) external onlyOwner returns (uint256 campaignId)

// Pause or resume a campaign
function setCampaignActive(uint256 campaignId, bool active) external onlyOwner

// ── Donor ─────────────────────────────────────────────────────────────────

// Send an ERC-20 donation to an active campaign
// Requires: donor has approved the contract for at least `amount`
function donate(
    uint256 campaignId,
    address token,
    uint256 amount,
    string calldata message
) external nonReentrant
```

### DonationSent Event

Emitted on every successful donation. All seven fields are available for off-chain indexing (e.g. by the PANGEA backend).

```solidity
event DonationSent(
    address indexed donor,      // wallet that sent the donation
    address indexed recipient,  // campaign recipient wallet
    address indexed token,      // ERC-20 token contract address
    uint256 amount,             // token amount (in token's own decimals)
    uint256 campaignId,         // ID of the campaign donated to
    uint256 timestamp,          // block.timestamp at time of donation
    string  message             // optional donor message (may be empty)
);
```

---

## MockERC20.sol

`contracts/mocks/MockERC20.sol` is a minimal ERC-20 used exclusively in tests. It extends OpenZeppelin's `ERC20` and exposes a public `mint(address to, uint256 amount)` function so test fixtures can fund donor wallets with any token balance without needing a live stablecoin.

**It is never deployed to any live network.**

---

## Test Suite

30 unit tests covering all contract functions, access control, event emissions, and revert conditions.

```
  PangeaDonation
    Deployment
      ✔ sets the correct owner
      ✔ starts with zero campaigns
    Token allowlist
      ✔ owner can add a token
      ✔ emits TokenAllowlistUpdated when adding
      ✔ owner can remove a token
      ✔ emits TokenAllowlistUpdated when removing
      ✔ non-owner cannot add a token
      ✔ non-owner cannot remove a token
      ✔ reverts when adding zero address
    createCampaign
      ✔ owner can create a campaign
      ✔ stores campaign data correctly
      ✔ increments campaignCount for each new campaign
      ✔ emits CampaignCreated
      ✔ non-owner cannot create a campaign
      ✔ reverts with zero address recipient
      ✔ reverts with empty name
    setCampaignActive
      ✔ owner can deactivate a campaign
      ✔ owner can reactivate a campaign
      ✔ emits CampaignStatusChanged
      ✔ non-owner cannot change campaign status
      ✔ reverts for non-existent campaign
    donate
      ✔ transfers tokens from donor to recipient
      ✔ updates totalRaised on the campaign
      ✔ accumulates totalRaised across multiple donations
      ✔ emits DonationSent with correct fields
      ✔ reverts when token is not on allowlist
      ✔ reverts with zero amount
      ✔ reverts for non-existent campaign
      ✔ reverts when campaign is inactive
      ✔ reverts when donor has insufficient allowance

  30 passing (1s)
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x LTS |
| npm | 10.x |
| Git | any recent |

### Installation

```bash
git clone https://github.com/pangea-org/contracts.git
cd contracts
npm install
cp .env.example .env   # then fill in your values (see below)
```

---

## Environment Variables

Copy `.env.example` to `.env` and populate all three values before deploying.

| Variable | Required | Description |
|---|---|---|
| `PRIVATE_KEY` | Yes | Hex private key of the deployer wallet (with or without `0x` prefix). **Never commit this.** |
| `POLYGON_AMOY_RPC_URL` | Yes | RPC endpoint for Polygon Amoy testnet. Use the public endpoint or an Alchemy/Infura URL. |
| `POLYGONSCAN_API_KEY` | For verify | API key from [polygonscan.com](https://polygonscan.com/myapikey) used by `hardhat verify`. |

Example `.env.example`:

```dotenv
# Deployer wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Polygon Amoy RPC URL
# Default: https://rpc-amoy.polygon.technology
# Or use Alchemy/Infura: https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# PolygonScan API key for contract verification
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

---

## Usage

### Run Tests

```bash
npm test
```

### Deploy to Polygon Amoy Testnet

Ensure your deployer wallet has Amoy MATIC for gas (faucet: [faucet.polygon.technology](https://faucet.polygon.technology)).

```bash
npm run deploy:amoy
```

Or run the deploy script directly:

```bash
npx hardhat run scripts/deploy/deployLock.js --network amoy
```

### Verify on Polygonscan

After deployment, verify the contract source so users can read it on [amoy.polygonscan.com](https://amoy.polygonscan.com):

```bash
npm run verify:amoy -- <DEPLOYED_CONTRACT_ADDRESS> <CONSTRUCTOR_ARG_1> [CONSTRUCTOR_ARG_2 ...]
```

For `PangeaDonation`, pass the `initialOwner` address as the constructor argument:

```bash
npx hardhat verify --network amoy <DEPLOYED_ADDRESS> <OWNER_ADDRESS>
```

---

## Network Configuration

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| Hardhat (local) | 31337 | `http://127.0.0.1:8545` | — |
| Polygon Amoy (testnet) | 80002 | `https://rpc-amoy.polygon.technology` | [amoy.polygonscan.com](https://amoy.polygonscan.com) |
| Polygon Mainnet | 137 | `https://polygon-rpc.com` | [polygonscan.com](https://polygonscan.com) |

Hardhat and localhost share the same chain ID (31337) and are used for local development and testing.

---

## Security Considerations

- **Non-custodial design** — `donate()` uses `safeTransferFrom` so tokens flow directly from donor to recipient; the contract never holds a balance.
- **Token allowlist** — only tokens explicitly approved by the owner can be used, preventing arbitrary or malicious ERC-20s from being sent through campaigns.
- **Reentrancy guard** — `donate()` is protected by OpenZeppelin's `ReentrancyGuard`, preventing reentrancy attacks even if a non-standard ERC-20 is added to the allowlist.
- **Access control** — all administrative functions (`addTokenToAllowlist`, `createCampaign`, `setCampaignActive`) are restricted to the contract owner via OpenZeppelin's `Ownable`.
- **Input validation** — the contract rejects zero addresses, empty campaign names, zero-amount donations, non-existent or inactive campaigns, and non-allowlisted tokens.
- **Private key hygiene** — `.env` is in `.gitignore`. Never commit a live private key. Use a dedicated deployer wallet with minimal funds.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Smart contract language | Solidity | 0.8.24 |
| Development framework | Hardhat | ^2.28.6 |
| Contract library | OpenZeppelin Contracts | ^5.6.1 |
| JS runtime | Node.js | 20.x LTS |
| Ethers.js | ethers | ^6.16.0 |
| Test runner | Mocha + Chai | (via hardhat-toolbox) |
| Blockchain | Polygon PoS (Amoy testnet / Mainnet) | — |
| Contract verification | Polygonscan (hardhat-verify) | (via hardhat-toolbox) |

---

## Related Repositories

- **pangea-backend** — API server, event indexer, and campaign management backend: [github.com/pangea-org/pangea-backend](https://github.com/pangea-org/pangea-backend)

---

## License

[MIT](./LICENSE)
