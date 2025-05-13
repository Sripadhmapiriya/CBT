require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/dc593dffa60a46e291de3ac3082a538c";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "3f827f36b689cde28761672fbe3170a6671a13fdfb93fb9071bb8ed5cede0697";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "9G91NYHD7XY6X9WWJ4ZT4CISQB9KUFZ26U";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
