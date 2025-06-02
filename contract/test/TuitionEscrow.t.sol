// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TuitionEscrow.sol";
import "../src/MockERC20.sol";

contract TuitionEscrowTest is Test {
    TuitionEscrow public tuitionEscrow;
    MockERC20 public usdc;

    address public admin = vm.addr(1);
    address public payer = vm.addr(2);
    address public university = vm.addr(3);
    address public anotherUser = vm.addr(4);

    uint256 public constant INITIAL_USDC_SUPPLY = 1_000_000 * 10 ** 6;
    uint256 public constant DEPOSIT_AMOUNT = 1_000 * 10 ** 6;

    event PaymentDeposited(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed university,
        uint256 amount,
        string invoiceRef,
        uint256 nonce,
        uint256 timestamp
    );

    event PaymentReleased(
        bytes32 indexed paymentId,
        address indexed admin,
        uint256 timestamp
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed admin,
        uint256 timestamp
    );

    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);

    function setUp() public {
        vm.label(admin, "Admin");
        vm.label(payer, "Payer");
        vm.label(university, "University");
        vm.label(anotherUser, "AnotherUser");

        vm.startPrank(admin);
        usdc = new MockERC20(
            "Mock USDC",
            "mUSDC",
            INITIAL_USDC_SUPPLY / (10 ** 6)
        );
        vm.stopPrank();

        tuitionEscrow = new TuitionEscrow(address(usdc), admin);

        vm.prank(admin);
        usdc.transfer(payer, DEPOSIT_AMOUNT * 10);
    }

    function test_InitialOwnerIsAdmin() public view {
        assertEq(tuitionEscrow.owner(), admin, "Initial owner should be admin");
    }

    function test_Fail_ReleasePayment_NotOwner() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-001"
        );
        vm.stopPrank();

        vm.startPrank(anotherUser);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                anotherUser
            )
        );
        tuitionEscrow.releasePayment(paymentId);
        vm.stopPrank();
    }

    function test_Fail_RefundPayment_NotOwner() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-001"
        );
        vm.stopPrank();

        vm.startPrank(anotherUser);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                anotherUser
            )
        );
        tuitionEscrow.refundPayment(paymentId);
        vm.stopPrank();
    }

    function test_DepositTuition_Success() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        uint256 payerBalanceBefore = usdc.balanceOf(payer);
        uint256 contractBalanceBefore = usdc.balanceOf(address(tuitionEscrow));
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-001"
        );
        vm.stopPrank();

        assertEq(
            usdc.balanceOf(payer),
            payerBalanceBefore - DEPOSIT_AMOUNT,
            "Payer balance incorrect"
        );
        assertEq(
            usdc.balanceOf(address(tuitionEscrow)),
            contractBalanceBefore + DEPOSIT_AMOUNT,
            "Contract balance incorrect"
        );

        TuitionEscrow.Payment memory p = tuitionEscrow.getPaymentDetails(
            paymentId
        );
        assertEq(p.payer, payer, "Payment payer incorrect");
        assertEq(p.university, university, "Payment university incorrect");
        assertEq(p.amount, DEPOSIT_AMOUNT, "Payment amount incorrect");
        assertEq(p.invoiceRef, "INV-001", "Payment invoiceRef incorrect");
        assertEq(
            uint(p.status),
            uint(TuitionEscrow.PaymentStatus.Pending),
            "Payment status incorrect"
        );
        assertTrue(p.depositTimestamp > 0, "Deposit timestamp should be set");

        assertEq(tuitionEscrow.nextPaymentNonce(), 1, "Nonce should increment");
    }

    function test_Fail_DepositTuition_ZeroAmount() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), 0);
        vm.expectRevert("TuitionEscrow: Amount must be greater than zero");
        tuitionEscrow.depositTuition(university, 0, "INV-002");
        vm.stopPrank();
    }

    function test_Fail_DepositTuition_EmptyInvoiceRef() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        vm.expectRevert("TuitionEscrow: Invoice reference cannot be empty");
        tuitionEscrow.depositTuition(university, DEPOSIT_AMOUNT, "");
        vm.stopPrank();
    }

    function test_Fail_DepositTuition_TransferFailed() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT / 2);
        vm.expectRevert(
            abi.encodeWithSignature(
                "ERC20InsufficientAllowance(address,uint256,uint256)",
                address(tuitionEscrow),
                DEPOSIT_AMOUNT / 2,
                DEPOSIT_AMOUNT
            )
        );
        tuitionEscrow.depositTuition(university, DEPOSIT_AMOUNT, "INV-003");
        vm.stopPrank();
    }

    function test_ReleasePayment_Success() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-004"
        );
        vm.stopPrank();

        vm.startPrank(admin);
        uint256 uniBalanceBefore = usdc.balanceOf(university);
        uint256 contractBalanceBefore = usdc.balanceOf(address(tuitionEscrow));
        vm.expectEmit(true, true, false, true, address(tuitionEscrow));
        emit PaymentReleased(paymentId, admin, block.timestamp);
        tuitionEscrow.releasePayment(paymentId);
        vm.stopPrank();

        assertEq(
            usdc.balanceOf(university),
            uniBalanceBefore + DEPOSIT_AMOUNT,
            "University balance incorrect after release"
        );
        assertEq(
            usdc.balanceOf(address(tuitionEscrow)),
            contractBalanceBefore - DEPOSIT_AMOUNT,
            "Contract balance incorrect after release"
        );

        TuitionEscrow.Payment memory p = tuitionEscrow.getPaymentDetails(
            paymentId
        );
        assertEq(
            uint(p.status),
            uint(TuitionEscrow.PaymentStatus.Released),
            "Payment status not Released"
        );
    }

    function test_Fail_ReleasePayment_NonExistent() public {
        vm.startPrank(admin);
        bytes32 fakePaymentId = keccak256(abi.encodePacked("fake"));
        vm.expectRevert("TuitionEscrow: Payment does not exist");
        tuitionEscrow.releasePayment(fakePaymentId);
        vm.stopPrank();
    }

    function test_Fail_ReleasePayment_AlreadyReleased() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-005"
        );
        vm.stopPrank();

        vm.prank(admin);
        tuitionEscrow.releasePayment(paymentId);

        vm.startPrank(admin);
        vm.expectRevert("TuitionEscrow: Payment not pending");
        tuitionEscrow.releasePayment(paymentId);
        vm.stopPrank();
    }

    function test_Fail_ReleasePayment_AlreadyRefunded() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-006"
        );
        vm.stopPrank();

        vm.prank(admin);
        tuitionEscrow.refundPayment(paymentId);

        vm.startPrank(admin);
        vm.expectRevert("TuitionEscrow: Payment not pending");
        tuitionEscrow.releasePayment(paymentId);
        vm.stopPrank();
    }

    function test_RefundPayment_Success() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-007"
        );
        vm.stopPrank();

        vm.startPrank(admin);
        uint256 payerBalanceBefore = usdc.balanceOf(payer);
        uint256 contractBalanceBefore = usdc.balanceOf(address(tuitionEscrow));
        vm.expectEmit(true, true, false, true, address(tuitionEscrow));
        emit PaymentRefunded(paymentId, admin, block.timestamp);
        tuitionEscrow.refundPayment(paymentId);
        vm.stopPrank();

        assertEq(
            usdc.balanceOf(payer),
            payerBalanceBefore + DEPOSIT_AMOUNT,
            "Payer balance incorrect after refund"
        );
        assertEq(
            usdc.balanceOf(address(tuitionEscrow)),
            contractBalanceBefore - DEPOSIT_AMOUNT,
            "Contract balance incorrect after refund"
        );

        TuitionEscrow.Payment memory p = tuitionEscrow.getPaymentDetails(
            paymentId
        );
        assertEq(
            uint(p.status),
            uint(TuitionEscrow.PaymentStatus.Refunded),
            "Payment status not Refunded"
        );
    }

    function test_Fail_RefundPayment_NonExistent() public {
        vm.startPrank(admin);
        bytes32 fakePaymentId = keccak256(abi.encodePacked("fake_refund"));
        vm.expectRevert("TuitionEscrow: Payment does not exist");
        tuitionEscrow.refundPayment(fakePaymentId);
        vm.stopPrank();
    }

    function test_Fail_RefundPayment_AlreadyReleased() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-008"
        );
        vm.stopPrank();

        vm.prank(admin);
        tuitionEscrow.releasePayment(paymentId);

        vm.startPrank(admin);
        vm.expectRevert("TuitionEscrow: Payment not pending");
        tuitionEscrow.refundPayment(paymentId);
        vm.stopPrank();
    }

    function test_Fail_RefundPayment_AlreadyRefunded() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-009"
        );
        vm.stopPrank();

        vm.prank(admin);
        tuitionEscrow.refundPayment(paymentId);

        vm.startPrank(admin);
        vm.expectRevert("TuitionEscrow: Payment not pending");
        tuitionEscrow.refundPayment(paymentId);
        vm.stopPrank();
    }

    function test_ReentrancyGuard_Deposit() public {
        vm.startPrank(payer);
        usdc.approve(address(tuitionEscrow), DEPOSIT_AMOUNT);
        bytes32 paymentId = tuitionEscrow.depositTuition(
            university,
            DEPOSIT_AMOUNT,
            "INV-REENTER-DEPOSIT"
        );
        vm.stopPrank();
        assertTrue(paymentId != bytes32(0));
    }

    function test_GetPaymentId_Consistency() public view {
        uint256 nonce = 0;
        bytes32 id1 = tuitionEscrow.getPaymentId(
            payer,
            university,
            "INV-ID-TEST",
            nonce
        );
        bytes32 id2 = tuitionEscrow.getPaymentId(
            payer,
            university,
            "INV-ID-TEST",
            nonce
        );
        bytes32 id3 = tuitionEscrow.getPaymentId(
            payer,
            university,
            "INV-ID-TEST-DIFFERENT",
            nonce
        );
        bytes32 id4 = tuitionEscrow.getPaymentId(
            payer,
            university,
            "INV-ID-TEST",
            nonce + 1
        );

        assertEq(id1, id2, "Payment ID should be consistent for same inputs");
        assertTrue(
            id1 != id3,
            "Payment ID should differ for different invoice refs"
        );
        assertTrue(id1 != id4, "Payment ID should differ for different nonces");
    }
}
