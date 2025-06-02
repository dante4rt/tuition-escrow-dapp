// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TuitionEscrow.sol";
import "../src/MockERC20.sol";
import "forge-std/console.sol";

/// @title Deployment Script for TuitionEscrow dApp
/// @author Muhammad Ramadhani
/// @notice This script deploys the TuitionEscrow contract and a mock USDC token, simulates a deposit and release.
/// @dev Run using `forge script` with environment variables for private keys.
contract DeployTuitionEscrow is Script {
    /// @notice The admin address (owner of the escrow contract)
    address public admin;

    /// @notice The payer who will deposit USDC into the escrow
    address public payer;

    /// @notice The university address that will receive funds
    address public university;

    /// @notice Initial supply for mock USDC token (1 million tokens with 6 decimals)
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e6;

    /// @notice Deposit amount for tuition payment (1,000 tokens)
    uint256 constant DEPOSIT_AMOUNT = 1_000 * 1e6;

    /// @notice Executes the deployment, funding, deposit, and release process.
    function run() external {
        // Load private keys from environment
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        uint256 payerPk = vm.envUint("PAYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPk);

        admin = vm.addr(deployerPk);
        payer = vm.addr(payerPk);
        university = vm.addr(3); // Deterministically generated address for the university

        // Deploy mock USDC token
        MockERC20 usdc = new MockERC20(
            "Mock USDC",
            "mUSDC",
            INITIAL_SUPPLY / 1e6
        );
        console.log("USDC Token deployed to:", address(usdc));

        // Deploy the TuitionEscrow contract with admin and USDC token address
        TuitionEscrow escrow = new TuitionEscrow(address(usdc), admin);
        console.log("TuitionEscrow deployed to:", address(escrow));

        // Fund payer with USDC
        usdc.transfer(payer, DEPOSIT_AMOUNT * 10);
        console.log("Payer funded:", payer);

        vm.stopBroadcast();

        // Simulate deposit by the payer
        vm.startBroadcast(payerPk);
        usdc.approve(address(escrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = escrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-001"
        );
        console.logBytes32(paymentId);
        console.log("Tuition deposited with Payment ID shown above");

        vm.stopBroadcast();

        // Release the payment to the university
        vm.startBroadcast(deployerPk);
        escrow.releasePayment(paymentId);
        console.log("Tuition released to university");

        vm.stopBroadcast();
    }
}
