# NFT Ticketing DApp

A decentralized application for event ticketing using NFTs, blockchain technology, and AI-generated ticket images.

## Features

- **NFT-Based Tickets**: Each ticket is a unique NFT on the Ethereum blockchain
- **Event Creation and Management**: Create and manage events with customizable details
- **AI-Generated Ticket Images**: Unique ticket designs generated based on event themes
- **QR Code Verification**: Secure entry with QR code verification at venues
- **Transfer Control**: Lock tickets to prevent unauthorized transfers
- **Role-Based Access Control**: Admin, Organizer, and User roles with different permissions

## Technology Stack

- **Smart Contracts**: Solidity, OpenZeppelin
- **Development Environment**: Hardhat
- **Frontend**: React, Vite
- **Web3 Integration**: ethers.js
- **Storage**: IPFS via Pinata
- **Network**: Sepolia Testnet

## Project Structure

```
nft-ticketing-dapp/
├── contracts/            # Smart contracts
│   └── NFTTicketing.sol  # Main NFT ticketing contract
├── scripts/              # Deployment scripts
├── test/                 # Contract tests
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── utils/        # Utility functions
│   │   └── contracts/    # Contract ABIs
│   └── public/
└── .env                  # Environment variables
```

## Getting Started

### Prerequisites

- Node.js and npm
- MetaMask wallet
- Sepolia testnet ETH

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd nft-ticketing-dapp
   ```

2. Install dependencies:
   ```
   npm install
   cd frontend
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   SEPOLIA_RPC_URL=<your-sepolia-rpc-url>
   PRIVATE_KEY=<your-private-key>
   ETHERSCAN_API_KEY=<your-etherscan-api-key>
   PINATA_API_KEY=<your-pinata-api-key>
   PINATA_API_SECRET_KEY=<your-pinata-api-secret>
   ```

### Smart Contract Deployment

1. Compile the contracts:
   ```
   npx hardhat compile
   ```

2. Deploy to Sepolia testnet:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. The contract address will be saved to `frontend/.env` automatically.

### Running the Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

### Admin Functions

- Add or remove event organizers
- Manage platform settings

### Organizer Functions

- Create new events
- Verify tickets at the venue

### User Functions

- Browse and purchase tickets
- View owned tickets
- Transfer or lock tickets
- Use tickets at events

## Testing

Run the test suite:

```
npx hardhat test
```

## Deployment

The smart contract is deployed on the Sepolia testnet. The frontend can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenZeppelin for secure contract libraries
- Hardhat for the development environment
- React and Vite for the frontend framework
- ethers.js for Web3 integration
