const { ethers } = require("ethers");

const NETWORKS = [
  {
    name: "MST Mainnet",
    rpcUrl: "https://mariorpc.mstblockchain.com",
    expectedChainId: 4646n,
    explorerUrl: "https://mstscan.com",
    symbol: "MSTC",
    isRecommended: true,
  },
  {
    name: "MST Coral Testnet",
    rpcUrl: "https://coralrpc.mstblockchain.com",
    expectedChainId: 54635n,
    explorerUrl: "https://coral.mstscan.com",
    symbol: "MSTC",
    isRecommended: true,
  },
  {
    name: "Legacy MST Testnet",
    rpcUrl: "https://testnetrpc.mstblockchain.com",
    expectedChainId: 91562037n,
    explorerUrl: "https://testnet.mstscan.com",
    symbol: "MSTC",
    deprecationNotice: "Deprecated after 31 January 2027",
  },
];

async function verifyNetworks() {
  console.log("=== Verifying MST Blockchain Networks ===");

  for (const net of NETWORKS) {
    console.log(`\nTesting ${net.name}...`);
    console.log(`RPC: ${net.rpcUrl}`);
    try {
      const provider = new ethers.JsonRpcProvider(net.rpcUrl);
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const feeData = await provider.getFeeData();

      const chainIdMatch = network.chainId === net.expectedChainId;

      console.log(`✓ Status: ONLINE`);
      console.log(`  Reported Chain ID: ${network.chainId} (Expected: ${net.expectedChainId}) [${chainIdMatch ? "MATCH" : "MISMATCH"}]`);
      console.log(`  Current Block Number: ${blockNumber}`);
      console.log(`  Gas Price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "N/A"}`);
      console.log(`  Explorer Base URL: ${net.explorerUrl}`);
      if (net.deprecationNotice) {
        console.log(`  Notice: ${net.deprecationNotice}`);
      }
    } catch (err) {
      console.error(`✗ Failed to reach ${net.name}:`, err.message);
    }
  }
}

verifyNetworks();
