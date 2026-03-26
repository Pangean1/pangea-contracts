const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Lock", function () {
  async function deployLockFixture() {
    const ONE_YEAR = 365 * 24 * 60 * 60;
    const lockedAmount = ethers.parseEther("1.0");
    const unlockTime = (await time.latest()) + ONE_YEAR;

    const [owner, otherAccount] = await ethers.getSigners();
    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await deployLockFixture();
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await deployLockFixture();
      expect(await lock.owner()).to.equal(owner.address);
    });
  });
});
