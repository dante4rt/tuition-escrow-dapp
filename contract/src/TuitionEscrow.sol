// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TuitionEscrow is Ownable, ReentrancyGuard {
    IERC20 public immutable usdcToken;

    enum PaymentStatus {
        Pending,
        Released,
        Refunded
    }

    struct Payment {
        address payer;
        address university;
        uint256 amount;
        string invoiceRef;
        PaymentStatus status;
        uint256 depositTimestamp;
    }

    mapping(bytes32 => Payment) public payments;
    uint256 public nextPaymentNonce;

    event PaymentDeposited(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed university,
        uint256 amount,
        string invoiceRef,
        uint256 nonce,
        uint256 timestamp
    );

    event PaymentReleased(bytes32 indexed paymentId, address indexed admin, uint256 timestamp);

    event PaymentRefunded(bytes32 indexed paymentId, address indexed admin, uint256 timestamp);

    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);

    constructor(address _usdcTokenAddress, address _initialOwner) Ownable(_initialOwner) {
        require(_usdcTokenAddress != address(0), "TuitionEscrow: Invalid USDC token address");
        usdcToken = IERC20(_usdcTokenAddress);
    }

    function getPaymentId(address _payer, address _university, string memory _invoiceRef, uint256 _nonce)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_payer, _university, _invoiceRef, _nonce));
    }

    function depositTuition(address _university, uint256 _amount, string memory _invoiceRef)
        external
        nonReentrant
        returns (bytes32)
    {
        require(_university != address(0), "TuitionEscrow: Invalid university address");
        require(_amount > 0, "TuitionEscrow: Amount must be greater than zero");
        require(bytes(_invoiceRef).length > 0, "TuitionEscrow: Invoice reference cannot be empty");

        uint256 currentNonce = nextPaymentNonce;
        bytes32 paymentId = getPaymentId(msg.sender, _university, _invoiceRef, currentNonce);

        require(
            payments[paymentId].payer == address(0), "TuitionEscrow: Payment ID conflict (should not happen with nonce)"
        );

        uint256 initialBalance = usdcToken.balanceOf(address(this));
        bool success = usdcToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "TuitionEscrow: USDC transferFrom failed");
        uint256 finalBalance = usdcToken.balanceOf(address(this));
        require(finalBalance == initialBalance + _amount, "TuitionEscrow: USDC transfer amount mismatch");

        payments[paymentId] = Payment({
            payer: msg.sender,
            university: _university,
            amount: _amount,
            invoiceRef: _invoiceRef,
            status: PaymentStatus.Pending,
            depositTimestamp: block.timestamp
        });

        nextPaymentNonce++;

        emit PaymentDeposited(paymentId, msg.sender, _university, _amount, _invoiceRef, currentNonce, block.timestamp);
        return paymentId;
    }

    function releasePayment(bytes32 _paymentId) external onlyOwner nonReentrant {
        Payment storage payment = payments[_paymentId];
        require(payment.payer != address(0), "TuitionEscrow: Payment does not exist");
        require(payment.status == PaymentStatus.Pending, "TuitionEscrow: Payment not pending");

        payment.status = PaymentStatus.Released;

        bool success = usdcToken.transfer(payment.university, payment.amount);
        require(success, "TuitionEscrow: USDC transfer to university failed");

        emit PaymentReleased(_paymentId, msg.sender, block.timestamp);
    }

    function refundPayment(bytes32 _paymentId) external onlyOwner nonReentrant {
        Payment storage payment = payments[_paymentId];
        require(payment.payer != address(0), "TuitionEscrow: Payment does not exist");
        require(payment.status == PaymentStatus.Pending, "TuitionEscrow: Payment not pending");

        payment.status = PaymentStatus.Refunded;

        bool success = usdcToken.transfer(payment.payer, payment.amount);
        require(success, "TuitionEscrow: USDC transfer to payer failed");

        emit PaymentRefunded(_paymentId, msg.sender, block.timestamp);
    }

    function getPaymentDetails(bytes32 _paymentId) external view returns (Payment memory) {
        require(payments[_paymentId].payer != address(0), "TuitionEscrow: Payment does not exist");
        return payments[_paymentId];
    }

    receive() external payable {
        revert("TuitionEscrow: Direct ETH payments not accepted");
    }

    function transferOwnership(address newOwner) public override onlyOwner {
        address oldOwner = owner();
        super.transferOwnership(newOwner);
        emit AdminUpdated(oldOwner, newOwner);
    }
}
