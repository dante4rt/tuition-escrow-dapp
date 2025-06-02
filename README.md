# Tuition & Donation Escrow dApp

## Project Overview

A decentralized application (dApp) for managing tuition fees or donations using USDC stablecoin. This project features a Solidity smart contract for escrowing funds and a React frontend for user interaction. Payers can deposit USDC, and an administrator can release these funds to designated universities/recipients or refund them to the payer.

**Key Features:**
* USDC Deposits: Users can deposit USDC into an escrow contract.
* Admin Control: A designated admin can release or refund payments.
* Secure: Utilizes OpenZeppelin contracts for Ownable and ReentrancyGuard.
* Event-Driven: Emits events for all major actions (deposits, releases, refunds).
* Transparent: All transactions are recorded on the blockchain.
* User-Friendly UI: React frontend with Tailwind CSS for a clean interface.
* Wallet Integration: Connects with MetaMask (or other Web3 wallets).

## Tech Stack

**Smart Contract (Backend):**
* Solidity ^0.8.20
* Foundry (for development, testing, deployment)
* OpenZeppelin Contracts (for Ownable, ReentrancyGuard, ERC20 interface)

**Frontend:**
* React (with TypeScript)
* Vite (build tool)
* Tailwind CSS (styling)
* Wagmi, Viem, and Rainbowkit (blockchain interaction)
* Lucide React (icons)
* Framer Motion (animations - optional)
* React Hot Toast (notifications)

**Blockchain:**
* Deployed on Sepolia Testnet
* USDC (Testnet version)

## Prerequisites

* Node.js (v18+ recommended)
* npm or yarn
* Foundry (Solidity toolkit): [Installation Guide](https://getfoundry.sh/)
* MetaMask browser extension (or other Web3 wallet)

## Project Structure

```
.
├── contract/  # Foundry project
│   ├── src/                  # Solidity contracts (TuitionEscrow.sol, MockERC20.sol)
│   ├── test/                 # Solidity tests (TuitionEscrow.t.sol)
│   ├── lib/                  # Dependencies (e.g., OpenZeppelin)
│   ├── foundry.toml
│   └── ...
├── frontend/  # React project
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   ├── lib/              # ABIs, contract addresses
│   │   └── pages/
│   ├── public/
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── ...
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/dante4rt/tuition-escrow-dapp.git
cd tuition-escrow-dapp
```

### 2. Setup Smart Contract (Foundry)

```bash
cd contract
forge install OpenZeppelin/openzeppelin-contracts
forge build
```

### 3. Run Smart Contract Tests

```bash
forge test -vvv
```

### 4. Deploy Smart Contract (to Sepolia)

* **Environment Variables:** Create a `.env` file in `contract` (or set them in your shell):
    ```env
    SEPOLIA_RPC_URL="your_sepolia_rpc_url_from_infura_or_alchemy"
    DEPLOYER_PRIVATE_KEY="your_deployer_wallet_private_key"
    ETHERSCAN_API_KEY="your_etherscan_api_key_for_verification" # Optional
    
    # You'll need the address of a USDC token on Sepolia
    # Either a public one or one you deploy (MockERC20.sol)
    USDC_TOKEN_ADDRESS_SEPOLIA="address_of_usdc_on_sepolia"
    ADMIN_WALLET_ADDRESS="your_admin_wallet_address" # This will be the owner
    ```

* **Deployment Script (Example using `forge create`):**
    You can create a deployment script in `script/Deploy.s.sol` or run directly:
    ```bash
    # First, deploy MockERC20 if you need your own (optional)
    # forge create --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY src/MockERC20.sol:MockERC20 --constructor-args "Mock USDC" "mUSDC" "1000000" --verify --etherscan-api-key $ETHERSCAN_API_KEY
    # Note the deployed address for USDC_TOKEN_ADDRESS_SEPOLIA

    # Deploy TuitionEscrow
    forge create --rpc-url $SEPOLIA_RPC_URL \
                 --private-key $DEPLOYER_PRIVATE_KEY \
                 src/TuitionEscrow.sol:TuitionEscrow \
                 --constructor-args "$USDC_TOKEN_ADDRESS_SEPOLIA" "$ADMIN_WALLET_ADDRESS" \
                 --verify --etherscan-api-key $ETHERSCAN_API_KEY # Add --legacy if needed for some RPCs
    ```
    Note the deployed `TuitionEscrow` contract address.

### 5. Setup Frontend

```bash
cd ../tuition_escrow_frontend # Or your frontend directory name
npm install
```

* **Environment Variables:** Create a `.env` file in the `frontend` root:
    ```env
    VITE_TUITION_ESCROW_CONTRACT_ADDRESS="your_deployed_tuition_escrow_address"
    VITE_USDC_TOKEN_ADDRESS="your_sepolia_usdc_token_address"
    VITE_SEPOLIA_CHAIN_ID="11155111" # Sepolia Chain ID
    # VITE_SEPOLIA_RPC_URL="your_sepolia_rpc_url" # Optional, if you need a specific provider beyond MetaMask
    ```
* **Update Contract ABIs:**
    * Copy the ABI from `contract/out/TuitionEscrow.sol/TuitionEscrow.json` (the `abi` array) into `frontend/src/lib/contracts.ts` (or a similar file).
    * Ensure you have a standard ERC20 ABI for USDC as well.

### 6. Run Frontend Development Server

```bash
npm run dev
```
Open your browser to `http://localhost:5173` (or the port Vite assigns).

## Usage

1.  **Connect Wallet:** Click "Connect Wallet" and choose MetaMask (ensure it's set to Sepolia network).
2.  **Payer View (Home Page):**
    * Select a university from the dropdown.
    * Enter the amount of USDC to deposit.
    * Provide an invoice reference.
    * Click "Approve & Deposit". This will trigger two MetaMask transactions:
        1.  Approve the `TuitionEscrow` contract to spend your USDC.
        2.  Deposit the USDC into the escrow.
3.  **Admin View (Admin Page):**
    * If the connected wallet is the admin address, you'll see the Admin Dashboard.
    * A list of pending payments will be displayed.
    * For each pending payment, the admin can choose to:
        * **Release:** Transfer the USDC to the university.
        * **Refund:** Return the USDC to the original payer.

## Deployed Contract Addresses (Sepolia)

* **TuitionEscrow Contract:** `YOUR_DEPLOYED_TUITION_ESCROW_ADDRESS`
* **USDC Token (if you deployed a mock):** `YOUR_DEPLOYED_MOCK_USDC_ADDRESS`
* (If using a public USDC, list that one)

## Video Walkthrough Link

* [Link to your video walkthrough] (e.g., YouTube, Loom)

## Future Improvements / Considerations

* Implement a more robust payment ID retrieval system for the admin (e.g., using a subgraph or backend indexer).
* Add pagination for the admin payment list.
* More detailed user transaction history.
* Support for WalletConnect or other wallet providers.
* Formal verification for the smart contract.
* Gas optimizations.
