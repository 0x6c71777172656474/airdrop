import { expect } from "chai";
import { ethers } from "hardhat";
import { Airdrop, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Errors, ONE_MONTH, ONE_WEEK, ROLES } from "../scripts/constants";
import { getACErrorText, mine } from "../scripts/common";

describe("Airdrop test", async () => {
  let owner: SignerWithAddress,
    claimer1: SignerWithAddress,
    claimer2: SignerWithAddress,
    claimer3: SignerWithAddress,
    claimer4: SignerWithAddress,
    claimer5: SignerWithAddress;
  let mockErc20: MockERC20;
  let airdrop: Airdrop;

  async function fixture(totalSupply: number) {
    [, owner, claimer1, claimer2, claimer3, claimer4, claimer5] =
      await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
    mockErc20 = await MockERC20.deploy("Airdrop", "AIR", 18);
    await mockErc20.deployed();

    const Airdrop = await ethers.getContractFactory("Airdrop", owner);
    airdrop = await Airdrop.deploy(mockErc20.address, totalSupply);
    await airdrop.deployed();

    return { mockErc20, airdrop };
  }

  describe("Eligible addresses setup", async () => {
    it("Should NOT set eligible addresses because should provide at least one recipient", async () => {
      const { airdrop } = await fixture(0);
      await expect(
        airdrop.connect(owner).setEligibleAddresses([])
      ).revertedWith(Errors.NO_RECIPIENTS);
    });

    it("Should NOT set eligible addresses because caller has no admin role", async () => {
      const { airdrop } = await fixture(0);
      await expect(
        airdrop.connect(claimer1).setEligibleAddresses([])
      ).revertedWith(getACErrorText(claimer1.address, ROLES.ADMIN));
    });

    it("Should NOT set eligible addresses because caller has no admin role", async () => {
      const { airdrop } = await fixture(0);
      await expect(
        airdrop.connect(claimer1).setEligibleAddresses([])
      ).revertedWith(getACErrorText(claimer1.address, ROLES.ADMIN));
    });

    it("Should NOT set eligible addresses because totalSupply lesser than amount of recepients and not evenly divided", async () => {
      const { airdrop } = await fixture(2);
      await expect(
        airdrop
          .connect(owner)
          .setEligibleAddresses([
            claimer1.address,
            claimer2.address,
            claimer3.address,
          ])
      ).revertedWith(Errors.NOT_EVENLY);
    });

    it("Should set eligible addresses", async () => {
      const { airdrop } = await fixture(3);
      const claimers = [claimer1.address, claimer2.address, claimer3.address];
      await expect(airdrop.connect(owner).setEligibleAddresses(claimers))
        .to.emit(airdrop, "AddressesAdded")
        .withArgs(claimers);
    });
  });

  describe("Claim flow", async () => {
    it("Should NOT claim because tokens are still locked", async () => {
      const { airdrop } = await fixture(100);
      await airdrop.connect(owner).setEligibleAddresses([claimer1.address]);
      await expect(airdrop.connect(claimer1).claim()).revertedWith(
        Errors.STILL_LOCKED
      );
    });

    it("Should NOT claim without CLAIMER_ROLE", async () => {
      const { airdrop } = await fixture(100);
      await expect(airdrop.connect(owner).claim()).revertedWith(
        getACErrorText(owner.address, ROLES.CLAIMER_ROLE)
      );
    });

    it("Should NOT claim because tokens are still locked after two weeks", async () => {
      const { airdrop } = await fixture(100);
      await airdrop.connect(owner).setEligibleAddresses([claimer1.address]);
      await mine(ONE_WEEK * 2);
      await expect(airdrop.connect(claimer1).claim()).revertedWith(
        Errors.STILL_LOCKED
      );
    });

    it("Should NOT claim because insufficient token balance", async () => {
      const { airdrop } = await fixture(100);
      await airdrop.connect(owner).setEligibleAddresses([claimer1.address]);

      await mine(ONE_MONTH);

      await expect(airdrop.connect(claimer1).claim()).revertedWith(
        Errors.INSUFFICIENT_BALANCE
      );
    });

    it("Should NOT claim because already claimed", async () => {
      const { airdrop, mockErc20 } = await fixture(100);
      const claimers = [claimer1.address, claimer2.address, claimer3.address];
      await mockErc20.mint(airdrop.address, 100);
      await airdrop.connect(owner).setEligibleAddresses(claimers);

      await mine(ONE_MONTH);

      await airdrop.connect(claimer1).claim();

      await expect(airdrop.connect(claimer1).claim()).revertedWith(
        Errors.ALREADY_CLAIMED
      );
    });

    it("Should claim", async () => {
      const { airdrop, mockErc20 } = await fixture(100);
      const claimers = [claimer1.address, claimer2.address, claimer3.address];
      await mockErc20.mint(airdrop.address, 100);
      await airdrop.connect(owner).setEligibleAddresses(claimers);

      await mine(ONE_MONTH);

      await airdrop.connect(claimer1).claim();
      await airdrop.connect(claimer2).claim();

      await expect(airdrop.connect(claimer3).claim())
        .to.emit(airdrop, "Claimed")
        .withArgs(
          claimer3.address,
          await airdrop.amountPerAddress(claimer3.address)
        );

      for (let i = 0; i < claimers.length; i++) {
        expect(await mockErc20.balanceOf(claimers[i])).to.equal(
          await airdrop.amountPerAddress(claimers[i])
        );
      }
      expect(await mockErc20.balanceOf(airdrop.address)).to.equal(
        await airdrop.remainder()
      );
    });
  });

  describe("Grab remainded amount", async () => {
    it("Should NOT grab remainder because nothing to grab", async () => {
      const { airdrop } = await fixture(10);
      await airdrop
        .connect(owner)
        .setEligibleAddresses([claimer1.address, claimer2.address]);
      await expect(airdrop.connect(owner).grabRemainder()).revertedWith(
        Errors.ZERO_AMOUNT
      );
    });

    it("Should NOT grab remainder because insufficient amount of tokens", async () => {
      const { airdrop } = await fixture(9);
      await airdrop
        .connect(owner)
        .setEligibleAddresses([claimer1.address, claimer2.address]);
      await expect(airdrop.connect(owner).grabRemainder()).revertedWith(
        Errors.INSUFFICIENT_BALANCE
      );
    });

    it("Should NOT grab remainder because has no admin role", async () => {
      const { airdrop } = await fixture(0);
      await expect(airdrop.connect(claimer1).grabRemainder()).revertedWith(
        getACErrorText(claimer1.address, ROLES.ADMIN)
      );
    });

    it("Should grab remainder", async () => {
      const { airdrop, mockErc20 } = await fixture(14);
      const claimers = [claimer1.address, claimer2.address, claimer3.address];
      await mockErc20.mint(airdrop.address, 14);
      await airdrop.connect(owner).setEligibleAddresses(claimers);
      const rem = await airdrop.remainder();
      await airdrop.connect(owner).grabRemainder();
      expect(await airdrop.remainder()).to.equal(0);
      expect(await mockErc20.balanceOf(owner.address)).to.equal(rem);
    });
  });

  describe("Complicated claim", async () => {
    it("Should claim several times after adding new recipients", async () => {
      const { airdrop, mockErc20 } = await fixture(99);
      const firstPortion = [
        claimer1.address,
        claimer2.address,
        claimer3.address,
      ];
      const secondPortion = [claimer4.address, claimer5.address];

      await mockErc20.mint(airdrop.address, 1000);

      await airdrop.connect(owner).setEligibleAddresses(firstPortion);

      await mine(ONE_MONTH);

      await airdrop.connect(claimer1).claim();
      await airdrop.connect(claimer2).claim();

      await airdrop.connect(owner).setEligibleAddresses(secondPortion);

      await mine(ONE_MONTH);

      await airdrop.connect(claimer3).claim();
      await airdrop.connect(claimer4).claim();
      await airdrop.connect(claimer5).claim();

      for (let i = 0; i < firstPortion.length; i++) {
        expect(await airdrop.amountPerAddress(firstPortion[i])).to.equal(
          await mockErc20.balanceOf(firstPortion[i])
        );
      }

      for (let j = 0; j < secondPortion.length; j++) {
        expect(await airdrop.amountPerAddress(secondPortion[j])).to.equal(
          await mockErc20.balanceOf(secondPortion[j])
        );
      }
    });
  });
});
