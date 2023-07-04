// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {Roles} from "../lib/Roles.sol";
import {Errors} from "../lib/Errors.sol";

import "hardhat/console.sol";

/**
 * @title Claim-Based Airdrop Contract with simple timelock
 * @dev This contract enables token airdrops to a predefined list of addresses.
 * The airdrop tokens can be claimed after a specified delay period.
 */
contract Airdrop is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    // The token to be airdropped.
    IERC20 public token;

    // Total supply of airdrop tokens.
    uint public totalSupply;

    // Undistributed amount of tokens after division
    uint public remainder;

    address[] airdropClaimers;

    // The delay before an address can claim, in seconds.
    uint public constant CLAIM_DELAY = 30 days;

    // Amount of tokens each address can claim.
    mapping(address => uint) public amountPerAddress;

    // Mapping to track if an address has claimed.
    mapping(address => bool) public hasClaimed;

    // Mapping to track when each address is allowed to claim their airdrop.
    mapping(address => uint) public claimTime;

    // Define events
    event Claimed(address indexed user, uint amount);
    event AddressesAdded(address[] recipients);

    /**
     * @dev Constructor function.
     * @param _token The address of the token to be airdropped.
     * @param _totalSupply The total supply of tokens for airdrop.
     */
    constructor(address _token, uint _totalSupply) {
        _setupRole(Roles.ADMIN, _msgSender());
        token = IERC20(_token);
        totalSupply = _totalSupply;
    }

    /**
     * @dev Set the recipients of the airdrop.
     * Can only be called by an address with the ADMIN role.`
     * @param recipients The addresses to receive the airdrop.
     */
    function setEligibleAddresses(
        address[] calldata recipients
    ) external onlyRole(Roles.ADMIN) {
        require(recipients.length > 0, Errors.NO_RECIPIENTS);

        for (uint i = 0; i < recipients.length; i++) {
            airdropClaimers.push(recipients[i]);
            hasClaimed[recipients[i]] = false;
            _setupRole(Roles.CLAIMER_ROLE, recipients[i]);
            claimTime[recipients[i]] = block.timestamp;
        }

        require(totalSupply.div(airdropClaimers.length) > 0, Errors.NOT_EVENLY);
        // Set claimable amount per address based on recipients count
        for (uint j = 0; j < recipients.length; j++) {
            amountPerAddress[recipients[j]] = totalSupply.div(
                airdropClaimers.length
            );
        }
        // Calculate undistributed amount
        remainder += totalSupply.mod(airdropClaimers.length);
        emit AddressesAdded(recipients);
    }

    /**
     * @dev Grab undistributed amount of tokens by admin.
     * Can only be called by an address with the ADMIN and after the CLAIM_DELAY period.
     */
    function grabRemainder() external onlyRole(Roles.ADMIN) {
        require(remainder > 0, Errors.ZERO_AMOUNT);
        require(
            token.balanceOf(address(this)) > 0,
            Errors.INSUFFICIENT_BALANCE
        );
        token.safeTransfer(msg.sender, remainder);
        remainder = 0;
    }

    /**
     * @dev Claim the airdrop.
     * Can only be called by an address with the CLAIMER_ROLE and after the CLAIM_DELAY period.
     */
    function claim() external nonReentrant onlyRole(Roles.CLAIMER_ROLE) {
        require(!hasClaimed[msg.sender], Errors.ALREADY_CLAIMED);
        require(
            block.timestamp >= claimTime[msg.sender] + CLAIM_DELAY,
            Errors.STILL_LOCKED
        );
        require(
            token.balanceOf(address(this)) >= amountPerAddress[msg.sender],
            Errors.INSUFFICIENT_BALANCE
        );
        hasClaimed[msg.sender] = true;
        token.safeTransfer(msg.sender, amountPerAddress[msg.sender]);
        emit Claimed(msg.sender, amountPerAddress[msg.sender]);
    }
}
