// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PangeaDonation is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Campaign {
        uint256 id;
        address recipient;
        string name;
        string description;
        bool active;
        uint256 totalRaised;
    }

    event DonationSent(
        address indexed donor,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 campaignId,
        uint256 timestamp,
        string message
    );

    event CampaignCreated(uint256 indexed campaignId, address indexed recipient, string name);
    event CampaignStatusChanged(uint256 indexed campaignId, bool active);
    event TokenAllowlistUpdated(address indexed token, bool allowed);

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;
    mapping(address => bool) public allowedTokens;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ── Token allowlist ──────────────────────────────────────────────────────

    function addTokenToAllowlist(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        allowedTokens[token] = true;
        emit TokenAllowlistUpdated(token, true);
    }

    function removeTokenFromAllowlist(address token) external onlyOwner {
        allowedTokens[token] = false;
        emit TokenAllowlistUpdated(token, false);
    }

    // ── Campaigns ────────────────────────────────────────────────────────────

    function createCampaign(
        address recipient,
        string calldata name,
        string calldata description
    ) external onlyOwner returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(name).length > 0, "Name required");

        uint256 id = ++campaignCount;
        campaigns[id] = Campaign({
            id: id,
            recipient: recipient,
            name: name,
            description: description,
            active: true,
            totalRaised: 0
        });

        emit CampaignCreated(id, recipient, name);
        return id;
    }

    function setCampaignActive(uint256 campaignId, bool active) external onlyOwner {
        require(campaigns[campaignId].id != 0, "Campaign does not exist");
        campaigns[campaignId].active = active;
        emit CampaignStatusChanged(campaignId, active);
    }

    // ── Donations ────────────────────────────────────────────────────────────

    function donate(
        uint256 campaignId,
        address token,
        uint256 amount,
        string calldata message
    ) external nonReentrant {
        require(allowedTokens[token], "Token not allowed");
        require(amount > 0, "Amount must be > 0");

        Campaign storage campaign = campaigns[campaignId];
        require(campaign.id != 0, "Campaign does not exist");
        require(campaign.active, "Campaign is not active");

        IERC20(token).safeTransferFrom(msg.sender, campaign.recipient, amount);
        campaign.totalRaised += amount;

        emit DonationSent(
            msg.sender,
            campaign.recipient,
            token,
            amount,
            campaignId,
            block.timestamp,
            message
        );
    }
}
