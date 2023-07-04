// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title Roles Library
 * @dev A library for managing roles in a smart contracts
 */
library Roles {
    // Admin can set eligible addresses and grab remainded amount of tokens
    bytes32 public constant ADMIN =
        bytes32(
            0xb055000000000000000000000000000000000000000000000000000000000000
        );
    // Claimers can claim their airdrop
    bytes32 public constant CLAIMER_ROLE =
        bytes32(
            0xdeb7000000000000000000000000000000000000000000000000000000000000
        );
}
