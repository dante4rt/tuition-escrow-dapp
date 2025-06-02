# TuitionEscrow Solidity Smart Contract

This directory contains the Solidity smart contract and Foundry project for the Tuition Escrow dApp.

## Features

- USDC-based escrow for tuition/donation payments
- Admin can release or refund payments
- Events: Deposited, Released, Refunded
- Double release/refund protection
- Fully tested with Foundry

## Usage

### 1. Install Dependencies

```bash
forge install
```

### 2. Build Contracts

```bash
forge build
```

### 3. Run Tests

```bash
forge test -vvv
```

### 4. Deploy to Sepolia

- Set up `.env` with your RPC URL, deployer private key, payer private key and Etherscan API Key:

```env
RPC_URL="your_sepolia_rpc_url"
PRIVATE_KEY="your_private_key"
PAYER_PRIVATE_KEY="your_payer_private_key"
API_KEY="your_etherscan_key"
```

- Deploy:

```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

- The deployed contract address will be shown in the output.

### 5. ABI

ABI is generated at `out/TuitionEscrow.sol/TuitionEscrow.json` after build.

## Assumptions

- USDC is a mock ERC20 or public testnet token.
- Admin is a single wallet address.
- All logic is on-chain; no backend.

## Documentation

- [Foundry Book](https://book.getfoundry.sh/)

## Scripts

- `script/Deploy.s.sol`: Deployment script for TuitionEscrow.

## Help

```bash
forge --help
anvil --help
cast --help
```
