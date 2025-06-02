export const TUITION_ESCROW_ADDRESS =
    import.meta.env.VITE_TUITION_ESCROW_CONTRACT_ADDRESS ||
    "0xea158C90CD570Cd123be71604CF794EAD6c2F233";
export const USDC_ADDRESS =
    import.meta.env.VITE_USDC_TOKEN_ADDRESS || "0xb532baA9582a59920026d39d06BBf82fa291cF78";

export const TUITION_ESCROW_ABI = [
    {
        inputs: [
            { internalType: "address", name: "_usdcTokenAddress", type: "address" },
            { internalType: "address", name: "_initialOwner", type: "address" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "OwnableInvalidOwner",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "OwnableUnauthorizedAccount",
        type: "error",
    },
    { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "oldAdmin", type: "address" },
            { indexed: true, internalType: "address", name: "newAdmin", type: "address" },
        ],
        name: "AdminUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "bytes32", name: "paymentId", type: "bytes32" },
            { indexed: true, internalType: "address", name: "payer", type: "address" },
            { indexed: true, internalType: "address", name: "university", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
            { indexed: false, internalType: "string", name: "invoiceRef", type: "string" },
            { indexed: false, internalType: "uint256", name: "nonce", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        name: "PaymentDeposited",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "bytes32", name: "paymentId", type: "bytes32" },
            { indexed: true, internalType: "address", name: "admin", type: "address" },
            { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        name: "PaymentRefunded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "bytes32", name: "paymentId", type: "bytes32" },
            { indexed: true, internalType: "address", name: "admin", type: "address" },
            { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        name: "PaymentReleased",
        type: "event",
    },
    {
        inputs: [
            { internalType: "address", name: "_university", type: "address" },
            { internalType: "uint256", name: "_amount", type: "uint256" },
            { internalType: "string", name: "_invoiceRef", type: "string" },
        ],
        name: "depositTuition",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "bytes32", name: "_paymentId", type: "bytes32" }],
        name: "getPaymentDetails",
        outputs: [
            {
                components: [
                    { internalType: "address", name: "payer", type: "address" },
                    { internalType: "address", name: "university", type: "address" },
                    { internalType: "uint256", name: "amount", type: "uint256" },
                    { internalType: "string", name: "invoiceRef", type: "string" },
                    { internalType: "enum TuitionEscrow.PaymentStatus", name: "status", type: "uint8" },
                    { internalType: "uint256", name: "depositTimestamp", type: "uint256" },
                ],
                internalType: "struct TuitionEscrow.Payment",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "_payer", type: "address" },
            { internalType: "address", name: "_university", type: "address" },
            { internalType: "string", name: "_invoiceRef", type: "string" },
            { internalType: "uint256", name: "_nonce", type: "uint256" },
        ],
        name: "getPaymentId",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "pure",
        type: "function",
    },
    {
        inputs: [],
        name: "nextPaymentNonce",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        name: "payments",
        outputs: [
            { internalType: "address", name: "payer", type: "address" },
            { internalType: "address", name: "university", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "string", name: "invoiceRef", type: "string" },
            { internalType: "enum TuitionEscrow.PaymentStatus", name: "status", type: "uint8" },
            { internalType: "uint256", name: "depositTimestamp", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "bytes32", name: "_paymentId", type: "bytes32" }],
        name: "refundPayment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "bytes32", name: "_paymentId", type: "bytes32" }],
        name: "releasePayment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "usdcToken",
        outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    { stateMutability: "payable", type: "receive" },
];

export const USDC_ABI = [
    {
        inputs: [
            { internalType: "string", name: "name", type: "string" },
            { internalType: "string", name: "symbol", type: "string" },
            { internalType: "uint256", name: "initialSupply", type: "uint256" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "allowance", type: "uint256" },
            { internalType: "uint256", name: "needed", type: "uint256" },
        ],
        name: "ERC20InsufficientAllowance",
        type: "error",
    },
    {
        inputs: [
            { internalType: "address", name: "sender", type: "address" },
            { internalType: "uint256", name: "balance", type: "uint256" },
            { internalType: "uint256", name: "needed", type: "uint256" },
        ],
        name: "ERC20InsufficientBalance",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "approver", type: "address" }],
        name: "ERC20InvalidApprover",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "receiver", type: "address" }],
        name: "ERC20InvalidReceiver",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "sender", type: "address" }],
        name: "ERC20InvalidSender",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "spender", type: "address" }],
        name: "ERC20InvalidSpender",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "burn",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "mint",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "value", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "value", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
];
