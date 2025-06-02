# Tuition Escrow dApp Frontend

This directory contains the React + TypeScript + Vite frontend for the Tuition Escrow dApp.

## Features

- Connect wallet (MetaMask, RainbowKit)
- Deposit USDC to a university (select from hardcoded list)
- Enter amount and invoice reference
- See your USDC balance and quick-select deposit amounts
- Admin dashboard: view pending payments, release or refund
- Responsive, modern UI with Tailwind CSS

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your contract addresses:

```env
VITE_TUITION_ESCROW_CONTRACT_ADDRESS=your_deployed_tuition_escrow_address
VITE_USDC_TOKEN_ADDRESS=your_sepolia_usdc_token_address
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- Connect your wallet (ensure Sepolia network)
- Select a university, enter amount and invoiceRef, deposit USDC
- Admin: view and manage pending payments

## ABI

- The TuitionEscrow contract ABI is in `src/lib/contracts.ts` (copied from `contract/out/TuitionEscrow.sol/TuitionEscrow.json`)

## Assumptions

- Universities are a hardcoded list of valid Ethereum addresses
- Admin is a single wallet address
- USDC is a mock ERC20 or public testnet token

## Tech Stack

- React, TypeScript, Vite
- Tailwind CSS
- Wagmi, Viem, RainbowKit
- Lucide React (icons)
- React Hot Toast (notifications)

## Comments

- All logic is on-chain; no backend
- For contract deployment and ABI, see the main project README
