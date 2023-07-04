import { ethers } from "hardhat";

/**
 * Mines a new block with optional sleep duration.
 *
 * @param {number} [sleepDuration] - Optional sleep duration in seconds before mining the block.
 * @returns {Promise<void>} A promise that resolves when the block is mined.
 */
export const mine = async (sleepDuration?: number): Promise<void> => {
  if (sleepDuration) {
    await ethers.provider.send("evm_increaseTime", [sleepDuration]);
  }

  return ethers.provider.send("evm_mine", []);
};

/**
 * Generates an error message for a missing role in AccessControl.
 *
 * @param {string} address - The account address.
 * @param {string} role - The missing role.
 * @returns {string} The error message.
 */
export const getACErrorText = (address: string, role: string): string =>
  `AccessControl: account ${address.toLowerCase()} is missing role ${role}`;
