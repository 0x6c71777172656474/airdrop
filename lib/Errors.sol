// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title Errors Library
 * @dev A library for managing errors in a smart contracts.
 */
library Errors {
    string public constant NOT_EVENLY = "0"; // Total supply not divisible evenly among recipients
    string public constant ALREADY_CLAIMED = "1"; // You have already claimed your airdrop
    string public constant STILL_LOCKED = "2"; // Your tokens are still locked
    string public constant ZERO_ADDRESS = "3"; // Address should not be zero
    string public constant NO_RECIPIENTS = "4"; // Should provide at least one recipient
    string public constant INSUFFICIENT_BALANCE = "5"; // Claimed token amount should be less or equal to contract token's balance
    string public constant ZERO_AMOUNT = "6"; // Amount is zero
}
