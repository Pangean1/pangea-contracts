const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PangeaDonation", function () {
  async function deployFixture() {
    const [owner, recipient, donor, other] = await ethers.getSigners();

    const PangeaDonation = await ethers.getContractFactory("PangeaDonation");
    const donation = await PangeaDonation.deploy(owner.address);

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC");
    const dai = await MockERC20.deploy("Dai Stablecoin", "DAI");

    // Mint tokens for donor
    const MINT_AMOUNT = ethers.parseUnits("10000", 18);
    await usdc.mint(donor.address, MINT_AMOUNT);
    await dai.mint(donor.address, MINT_AMOUNT);

    return { donation, usdc, dai, owner, recipient, donor, other };
  }

  async function deployWithCampaignFixture() {
    const base = await deployFixture();
    const { donation, usdc, owner, recipient } = base;

    await donation.connect(owner).addTokenToAllowlist(await usdc.getAddress());
    const tx = await donation.connect(owner).createCampaign(
      recipient.address,
      "Ocean Cleanup",
      "Remove plastic from the Pacific"
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "CampaignCreated"
    );
    const campaignId = event.args.campaignId;

    return { ...base, campaignId };
  }

  // ── Deployment ─────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the correct owner", async function () {
      const { donation, owner } = await loadFixture(deployFixture);
      expect(await donation.owner()).to.equal(owner.address);
    });

    it("starts with zero campaigns", async function () {
      const { donation } = await loadFixture(deployFixture);
      expect(await donation.campaignCount()).to.equal(0);
    });
  });

  // ── Token allowlist ────────────────────────────────────────────────────────

  describe("Token allowlist", function () {
    it("owner can add a token", async function () {
      const { donation, usdc, owner } = await loadFixture(deployFixture);
      await donation.connect(owner).addTokenToAllowlist(await usdc.getAddress());
      expect(await donation.allowedTokens(await usdc.getAddress())).to.be.true;
    });

    it("emits TokenAllowlistUpdated when adding", async function () {
      const { donation, usdc, owner } = await loadFixture(deployFixture);
      await expect(
        donation.connect(owner).addTokenToAllowlist(await usdc.getAddress())
      )
        .to.emit(donation, "TokenAllowlistUpdated")
        .withArgs(await usdc.getAddress(), true);
    });

    it("owner can remove a token", async function () {
      const { donation, usdc, owner } = await loadFixture(deployFixture);
      await donation.connect(owner).addTokenToAllowlist(await usdc.getAddress());
      await donation.connect(owner).removeTokenFromAllowlist(await usdc.getAddress());
      expect(await donation.allowedTokens(await usdc.getAddress())).to.be.false;
    });

    it("emits TokenAllowlistUpdated when removing", async function () {
      const { donation, usdc, owner } = await loadFixture(deployFixture);
      await donation.connect(owner).addTokenToAllowlist(await usdc.getAddress());
      await expect(
        donation.connect(owner).removeTokenFromAllowlist(await usdc.getAddress())
      )
        .to.emit(donation, "TokenAllowlistUpdated")
        .withArgs(await usdc.getAddress(), false);
    });

    it("non-owner cannot add a token", async function () {
      const { donation, usdc, other } = await loadFixture(deployFixture);
      await expect(
        donation.connect(other).addTokenToAllowlist(await usdc.getAddress())
      ).to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount");
    });

    it("non-owner cannot remove a token", async function () {
      const { donation, usdc, owner, other } = await loadFixture(deployFixture);
      await donation.connect(owner).addTokenToAllowlist(await usdc.getAddress());
      await expect(
        donation.connect(other).removeTokenFromAllowlist(await usdc.getAddress())
      ).to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount");
    });

    it("reverts when adding zero address", async function () {
      const { donation, owner } = await loadFixture(deployFixture);
      await expect(
        donation.connect(owner).addTokenToAllowlist(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token address");
    });
  });

  // ── createCampaign ─────────────────────────────────────────────────────────

  describe("createCampaign", function () {
    it("owner can create a campaign", async function () {
      const { donation, owner, recipient } = await loadFixture(deployFixture);
      await donation.connect(owner).createCampaign(recipient.address, "Test", "Desc");
      expect(await donation.campaignCount()).to.equal(1);
    });

    it("stores campaign data correctly", async function () {
      const { donation, owner, recipient } = await loadFixture(deployFixture);
      await donation.connect(owner).createCampaign(recipient.address, "Ocean Cleanup", "Desc");
      const campaign = await donation.campaigns(1);
      expect(campaign.id).to.equal(1);
      expect(campaign.recipient).to.equal(recipient.address);
      expect(campaign.name).to.equal("Ocean Cleanup");
      expect(campaign.description).to.equal("Desc");
      expect(campaign.active).to.be.true;
      expect(campaign.totalRaised).to.equal(0);
    });

    it("increments campaignCount for each new campaign", async function () {
      const { donation, owner, recipient } = await loadFixture(deployFixture);
      await donation.connect(owner).createCampaign(recipient.address, "C1", "");
      await donation.connect(owner).createCampaign(recipient.address, "C2", "");
      expect(await donation.campaignCount()).to.equal(2);
    });

    it("emits CampaignCreated", async function () {
      const { donation, owner, recipient } = await loadFixture(deployFixture);
      await expect(
        donation.connect(owner).createCampaign(recipient.address, "Ocean Cleanup", "Desc")
      )
        .to.emit(donation, "CampaignCreated")
        .withArgs(1, recipient.address, "Ocean Cleanup");
    });

    it("non-owner cannot create a campaign", async function () {
      const { donation, other, recipient } = await loadFixture(deployFixture);
      await expect(
        donation.connect(other).createCampaign(recipient.address, "Test", "Desc")
      ).to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount");
    });

    it("reverts with zero address recipient", async function () {
      const { donation, owner } = await loadFixture(deployFixture);
      await expect(
        donation.connect(owner).createCampaign(ethers.ZeroAddress, "Test", "Desc")
      ).to.be.revertedWith("Invalid recipient");
    });

    it("reverts with empty name", async function () {
      const { donation, owner, recipient } = await loadFixture(deployFixture);
      await expect(
        donation.connect(owner).createCampaign(recipient.address, "", "Desc")
      ).to.be.revertedWith("Name required");
    });
  });

  // ── setCampaignActive ──────────────────────────────────────────────────────

  describe("setCampaignActive", function () {
    it("owner can deactivate a campaign", async function () {
      const { donation, campaignId } = await loadFixture(deployWithCampaignFixture);
      await donation.setCampaignActive(campaignId, false);
      expect((await donation.campaigns(campaignId)).active).to.be.false;
    });

    it("owner can reactivate a campaign", async function () {
      const { donation, campaignId } = await loadFixture(deployWithCampaignFixture);
      await donation.setCampaignActive(campaignId, false);
      await donation.setCampaignActive(campaignId, true);
      expect((await donation.campaigns(campaignId)).active).to.be.true;
    });

    it("emits CampaignStatusChanged", async function () {
      const { donation, campaignId } = await loadFixture(deployWithCampaignFixture);
      await expect(donation.setCampaignActive(campaignId, false))
        .to.emit(donation, "CampaignStatusChanged")
        .withArgs(campaignId, false);
    });

    it("non-owner cannot change campaign status", async function () {
      const { donation, other, campaignId } = await loadFixture(deployWithCampaignFixture);
      await expect(
        donation.connect(other).setCampaignActive(campaignId, false)
      ).to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount");
    });

    it("reverts for non-existent campaign", async function () {
      const { donation } = await loadFixture(deployWithCampaignFixture);
      await expect(donation.setCampaignActive(999, false)).to.be.revertedWith(
        "Campaign does not exist"
      );
    });
  });

  // ── donate ─────────────────────────────────────────────────────────────────

  describe("donate", function () {
    const DONATE_AMOUNT = ethers.parseUnits("100", 18);

    async function approveAndDonate(ctx, overrides = {}) {
      const {
        donation,
        usdc,
        donor,
        campaignId,
        amount = DONATE_AMOUNT,
        msg = "For the ocean",
      } = { ...ctx, ...overrides };

      await usdc.connect(donor).approve(await donation.getAddress(), amount);
      return donation
        .connect(donor)
        .donate(campaignId, await usdc.getAddress(), amount, msg);
    }

    it("transfers tokens from donor to recipient", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      const { usdc, donor, recipient, donation } = ctx;

      const recipientBefore = await usdc.balanceOf(recipient.address);
      const donorBefore = await usdc.balanceOf(donor.address);

      await approveAndDonate(ctx);

      expect(await usdc.balanceOf(recipient.address)).to.equal(
        recipientBefore + DONATE_AMOUNT
      );
      expect(await usdc.balanceOf(donor.address)).to.equal(
        donorBefore - DONATE_AMOUNT
      );
    });

    it("updates totalRaised on the campaign", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      await approveAndDonate(ctx);
      const campaign = await ctx.donation.campaigns(ctx.campaignId);
      expect(campaign.totalRaised).to.equal(DONATE_AMOUNT);
    });

    it("accumulates totalRaised across multiple donations", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      await approveAndDonate(ctx);
      await approveAndDonate(ctx);
      const campaign = await ctx.donation.campaigns(ctx.campaignId);
      expect(campaign.totalRaised).to.equal(DONATE_AMOUNT * 2n);
    });

    it("emits DonationSent with correct fields", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      const { donation, usdc, donor, recipient, campaignId } = ctx;

      await usdc.connect(donor).approve(await donation.getAddress(), DONATE_AMOUNT);

      const tx = await donation
        .connect(donor)
        .donate(campaignId, await usdc.getAddress(), DONATE_AMOUNT, "For the ocean");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(donation, "DonationSent")
        .withArgs(
          donor.address,
          recipient.address,
          await usdc.getAddress(),
          DONATE_AMOUNT,
          campaignId,
          block.timestamp,
          "For the ocean"
        );
    });

    it("reverts when token is not on allowlist", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      const { donation, dai, donor, campaignId } = ctx;
      await dai.connect(donor).approve(await donation.getAddress(), DONATE_AMOUNT);
      await expect(
        donation
          .connect(donor)
          .donate(campaignId, await dai.getAddress(), DONATE_AMOUNT, "")
      ).to.be.revertedWith("Token not allowed");
    });

    it("reverts with zero amount", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      const { donation, usdc, donor, campaignId } = ctx;
      await usdc.connect(donor).approve(await donation.getAddress(), 0);
      await expect(
        donation.connect(donor).donate(campaignId, await usdc.getAddress(), 0, "")
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("reverts for non-existent campaign", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      const { donation, usdc, donor } = ctx;
      await usdc.connect(donor).approve(await donation.getAddress(), DONATE_AMOUNT);
      await expect(
        donation
          .connect(donor)
          .donate(999, await usdc.getAddress(), DONATE_AMOUNT, "")
      ).to.be.revertedWith("Campaign does not exist");
    });

    it("reverts when campaign is inactive", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      const { donation, usdc, donor, campaignId } = ctx;
      await donation.setCampaignActive(campaignId, false);
      await usdc.connect(donor).approve(await donation.getAddress(), DONATE_AMOUNT);
      await expect(
        donation
          .connect(donor)
          .donate(campaignId, await usdc.getAddress(), DONATE_AMOUNT, "")
      ).to.be.revertedWith("Campaign is not active");
    });

    it("reverts when donor has insufficient allowance", async function () {
      const ctx = await loadFixture(deployWithCampaignFixture);
      const { donation, usdc, donor, campaignId } = ctx;
      // No approval granted
      await expect(
        donation
          .connect(donor)
          .donate(campaignId, await usdc.getAddress(), DONATE_AMOUNT, "")
      ).to.be.revertedWithCustomError(usdc, "ERC20InsufficientAllowance");
    });
  });
});
