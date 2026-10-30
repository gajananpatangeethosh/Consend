require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mstMainnet: {
      url: process.env.MST_MAINNET_RPC_URL || "https://mariorpc.mstblockchain.com",
      chainId: 4646,
      accounts: process.env.MST_RELAYER_PRIVATE_KEY
        ? [process.env.MST_RELAYER_PRIVATE_KEY]
        : [],
    },
    mstCoral: {
      url: process.env.MST_RPC_URL || "https://coralrpc.mstblockchain.com",
      chainId: 54635,
      accounts: process.env.MST_RELAYER_PRIVATE_KEY
        ? [process.env.MST_RELAYER_PRIVATE_KEY]
        : [],
    },
    mstTestnet: {
      url: "https://testnetrpc.mstblockchain.com",
      chainId: 91562037,
      accounts: process.env.MST_RELAYER_PRIVATE_KEY
        ? [process.env.MST_RELAYER_PRIVATE_KEY]
        : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test/contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
