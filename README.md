# Tuition & Donation Escrow dApp

## Take-home Exam (web3)

This project is a submission for the cross-border payment system take-home exam. It implements a minimal dApp for tuition/donation payments using USDC, with all logic on-chain.

---

### 📜 Brief

A cross-border payment system using stablecoins (USDC) to transfer tuition fees or donations from users to universities. Users deposit USDC to an escrow contract, and an admin can release or refund the payment. All logic is on-chain.

---

## ✅ Requirements Mapping

- **Smart Contract:**
  - Solidity, with comments and NatSpec
  - `initialize(address payer, address university, uint256 amount, string calldata invoiceRef)`
  - `deposit()`, `release()`, `refund()`
  - Events: `Deposited`, `Released`, `Refunded`
  - Double release/refund protection
- **Frontend:**
  - React + TypeScript + Tailwind
  - Wallet connect (MetaMask)
  - Form: select university, enter amount/invoiceRef, deposit
  - Admin: view pending payments, release/refund
- **Network:**
  - Sepolia testnet, USDC (mock or public)
- **Deployment:**
  - Contract deployed to Sepolia (address below)
  - README with local run instructions, contract address, ABI, assumptions
  - Foundry test suite
- **Bonus:**
  - (Optional) Deploy to Vercel

---

## Features

- USDC deposits to escrow contract
- Admin can release or refund payments
- All actions emit events for transparency
- User-friendly React frontend with wallet integration
- Type-safe, modern codebase

---

## Getting Started (How to Run Locally)

### 1. Clone the Repository

```bash
git clone https://github.com/dante4rt/tuition-escrow-dapp.git
cd tuition-escrow-dapp
```

### 2. Smart Contract (Foundry)

```bash
cd contract
forge install
forge build
forge test -vvv
```

- Edit `.env` with your Sepolia RPC, private key, payer private key and Etherscan API Key.
- Deploy:

```bash
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY
```

### 3. Frontend

```bash
cd ../frontend
npm install
cp .env.example .env # Edit with your contract addresses
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Contract Details

- **TuitionEscrow Contract Address (Sepolia):** `0xea158C90CD570Cd123be71604CF794EAD6c2F233`
- **USDC Token Address (Sepolia):** `0xb532baA9582a59920026d39d06BBf82fa291cF78`
- **ABI:** See `frontend/src/lib/contracts.ts` or `contract/out/TuitionEscrow.sol/TuitionEscrow.json`

---

## Assumptions

- Universities are a hardcoded list of valid Ethereum addresses.
- Admin is a single wallet address set at deployment.
- USDC is a mock ERC20 deployed to Sepolia (or a public testnet USDC).
- No backend; all logic is on-chain.

---

## Testing

- Run all contract tests:

```bash
cd contract
forge test -vvv
```

---

## Video Walkthrough

- TBA

---

## Deliverables

- [x] GitHub repo with smart contract + frontend
- [x] Contract address on testnet
- [x] 3–5 minute video walkthrough

---

For more details, see the `contract/README.md` and `frontend/README.md`.
