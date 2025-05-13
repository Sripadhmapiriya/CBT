// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // Deploy the NFTTicketing contract
  const NFTTicketing = await hre.ethers.getContractFactory("NFTTicketing");
  const nftTicketing = await NFTTicketing.deploy();
  await nftTicketing.waitForDeployment();

  const nftTicketingAddress = await nftTicketing.getAddress();
  console.log(`NFTTicketing contract deployed to ${nftTicketingAddress}`);

  // Save the contract address to a file for the frontend
  const fs = require("fs");
  const path = require("path");

  // Create .env file in frontend directory with contract address
  const envContent = `VITE_CONTRACT_ADDRESS=${nftTicketingAddress}\n`;
  fs.writeFileSync(
    path.join(__dirname, "../frontend/.env"),
    envContent
  );

  console.log("Contract address saved to frontend/.env file");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
