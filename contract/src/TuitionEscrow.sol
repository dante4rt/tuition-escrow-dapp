// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title TuitionEscrow
/// @author Muhammad Ramadhani
/// @notice Escrow contract for tuition payments using USDC
/// @dev Allows deposit, release, and refund of stablecoin funds between users and universities. Only owner can release/refund.
contract TuitionEscrow is Ownable, ReentrancyGuard {
    /// @notice ERC20 token used for payments (e.g. USDC)
    IERC20 public immutable usdcToken;

    /// @notice Enum representing current status of a payment
    enum PaymentStatus {
        Pending,
        Released,
        Refunded
    }

    /// @notice Payment metadata stored on-chain
    struct Payment {
        address payer;
        address university;
        uint256 amount;
        string invoiceRef;
        PaymentStatus status;
        uint256 depositTimestamp;
    }

    /// @notice Mapping of paymentId (hash) to Payment struct
    mapping(bytes32 => Payment) public payments;

    /// @notice Incrementing counter to avoid paymentId collisions
    uint256 public nextPaymentNonce;

    /// @notice Emitted when a payment is deposited
    event PaymentDeposited(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed university,
        uint256 amount,
        string invoiceRef,
        uint256 nonce,
        uint256 timestamp
    );

    /// @notice Emitted when a payment is released to the university
    event PaymentReleased(
        bytes32 indexed paymentId,
        address indexed admin,
        uint256 timestamp
    );

    /// @notice Emitted when a payment is refunded to the payer
    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed admin,
        uint256 timestamp
    );

    /// @notice Emitted when contract ownership is transferred
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);

    /// @param _usdcTokenAddress The address of the ERC20 token used (USDC)
    /// @param _initialOwner The address set as the contract's owner
    constructor(
        address _usdcTokenAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(
            _usdcTokenAddress != address(0),
            "TuitionEscrow: Invalid USDC token address"
        );
        usdcToken = IERC20(_usdcTokenAddress);
    }

    /// @notice Computes a unique ID for each payment
    /// @param _payer The address of the user depositing
    /// @param _university The destination university address
    /// @param _invoiceRef Reference string (e.g., invoice ID)
    /// @param _nonce A nonce to ensure uniqueness
    /// @return A unique payment ID
    function getPaymentId(
        address _payer,
        address _university,
        string memory _invoiceRef,
        uint256 _nonce
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(_payer, _university, _invoiceRef, _nonce)
            );
    }

    /// @notice Deposit tuition USDC into the escrow
    /// @param _university Destination university address
    /// @param _amount Amount of USDC to deposit
    /// @param _invoiceRef Off-chain reference to invoice
    /// @return paymentId Unique ID of the payment
    function depositTuition(
        address _university,
        uint256 _amount,
        string memory _invoiceRef
    ) external nonReentrant returns (bytes32 paymentId) {
        require(
            _university != address(0),
            "TuitionEscrow: Invalid university address"
        );
        require(_amount > 0, "TuitionEscrow: Amount must be greater than zero");
        require(
            bytes(_invoiceRef).length > 0,
            "TuitionEscrow: Invoice reference cannot be empty"
        );

        uint256 currentNonce = nextPaymentNonce;
        paymentId = getPaymentId(
            msg.sender,
            _university,
            _invoiceRef,
            currentNonce
        );

        require(
            payments[paymentId].payer == address(0),
            "TuitionEscrow: Payment ID conflict (should not happen with nonce)"
        );

        uint256 initialBalance = usdcToken.balanceOf(address(this));
        bool success = usdcToken.transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(success, "TuitionEscrow: USDC transferFrom failed");

        uint256 finalBalance = usdcToken.balanceOf(address(this));
        require(
            finalBalance == initialBalance + _amount,
            "TuitionEscrow: USDC transfer amount mismatch"
        );

        payments[paymentId] = Payment({
            payer: msg.sender,
            university: _university,
            amount: _amount,
            invoiceRef: _invoiceRef,
            status: PaymentStatus.Pending,
            depositTimestamp: block.timestamp
        });

        nextPaymentNonce++;

        emit PaymentDeposited(
            paymentId,
            msg.sender,
            _university,
            _amount,
            _invoiceRef,
            currentNonce,
            block.timestamp
        );
    }

    /// @notice Release funds from escrow to the university
    /// @dev Only callable by owner (admin)
    /// @param _paymentId The ID of the payment to release
    function releasePayment(
        bytes32 _paymentId
    ) external onlyOwner nonReentrant {
        Payment storage payment = payments[_paymentId];
        require(
            payment.payer != address(0),
            "TuitionEscrow: Payment does not exist"
        );
        require(
            payment.status == PaymentStatus.Pending,
            "TuitionEscrow: Payment not pending"
        );

        payment.status = PaymentStatus.Released;

        bool success = usdcToken.transfer(payment.university, payment.amount);
        require(success, "TuitionEscrow: USDC transfer to university failed");

        emit PaymentReleased(_paymentId, msg.sender, block.timestamp);
    }

    /// @notice Refund funds from escrow to the payer
    /// @dev Only callable by owner (admin)
    /// @param _paymentId The ID of the payment to refund
    function refundPayment(bytes32 _paymentId) external onlyOwner nonReentrant {
        Payment storage payment = payments[_paymentId];
        require(
            payment.payer != address(0),
            "TuitionEscrow: Payment does not exist"
        );
        require(
            payment.status == PaymentStatus.Pending,
            "TuitionEscrow: Payment not pending"
        );

        payment.status = PaymentStatus.Refunded;

        bool success = usdcToken.transfer(payment.payer, payment.amount);
        require(success, "TuitionEscrow: USDC transfer to payer failed");

        emit PaymentRefunded(_paymentId, msg.sender, block.timestamp);
    }

    /// @notice View payment details for a given ID
    /// @param _paymentId The ID of the payment
    /// @return Payment struct with details
    function getPaymentDetails(
        bytes32 _paymentId
    ) external view returns (Payment memory) {
        require(
            payments[_paymentId].payer != address(0),
            "TuitionEscrow: Payment does not exist"
        );
        return payments[_paymentId];
    }

    /// @notice Reject any ETH sent directly to the contract
    receive() external payable {
        revert("TuitionEscrow: Direct ETH payments not accepted");
    }

    /// @notice Transfer ownership and emit AdminUpdated event
    /// @param newOwner The new owner (admin) of the contract
    function transferOwnership(address newOwner) public override onlyOwner {
        address oldOwner = owner();
        super.transferOwnership(newOwner);
        emit AdminUpdated(oldOwner, newOwner);
    }
}
