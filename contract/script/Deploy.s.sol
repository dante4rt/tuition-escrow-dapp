// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TuitionEscrow.sol";
import "../src/MockERC20.sol";
import "forge-std/console.sol";

contract DeployTuitionEscrow is Script {
    address public admin;
    address public payer;
    address public university;

    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e6; // Mock USDC, 6 decimals
    uint256 constant DEPOSIT_AMOUNT = 1_000 * 1e6;

    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY"); // this key will be used for admin

        vm.startBroadcast(deployerPk);

        admin = vm.addr(deployerPk);
        payer = vm.addr(2);
        university = vm.addr(3);

        MockERC20 usdc = new MockERC20("Mock USDC", "mUSDC", INITIAL_SUPPLY / 1e6);
        console.log("USDC Token deployed to:", address(usdc));

        TuitionEscrow escrow = new TuitionEscrow(address(usdc), admin);
        console.log("TuitionEscrow deployed to:", address(escrow));

        usdc.transfer(payer, DEPOSIT_AMOUNT * 10);
        console.log("Payer funded:", payer);

        vm.prank(payer);
        usdc.approve(address(escrow), DEPOSIT_AMOUNT);

        vm.prank(payer);
        bytes32 paymentId = escrow.depositTuition(university, DEPOSIT_AMOUNT, "INV-001");
        console.logBytes32(paymentId);
        console.log("Tuition deposited with Payment ID shown above");

        vm.prank(admin);
        escrow.releasePayment(paymentId);
        console.log("Tuition released to university");

        vm.stopBroadcast();
    }
}
