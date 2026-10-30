export interface BlockchainNetwork {
  name: string;
  chainId: number;
  hexChainId: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  confirmationsRequired: number;
  isMainnet?: boolean;
  environment: "mainnet" | "testnet";
  isRecommended?: boolean;
  deprecationNotice?: string;
  description?: string;
}

export const MST_NETWORKS: Record<string, BlockchainNetwork> = {
  // ── Mainnet Networks ──────────────────────────────────────────────────────────
  mstMainnet: {
    name: "MST Mainnet",
    chainId: 4646,
    hexChainId: "0x1226",
    rpcUrl: process.env.NEXT_PUBLIC_MST_MAINNET_RPC_URL || "https://mariorpc.mstblockchain.com",
    explorerUrl: process.env.NEXT_PUBLIC_MST_MAINNET_EXPLORER_URL || "https://mstscan.com",
    currency: {
      name: "MST Coin",
      symbol: "MSTC",
      decimals: 18,
    },
    confirmationsRequired: 2,
    isMainnet: true,
    environment: "mainnet",
    isRecommended: true,
    description: "Production MST L1 network for high-throughput consent proofs and audits.",
  },
  ethereumMainnet: {
    name: "Ethereum Mainnet",
    chainId: 1,
    hexChainId: "0x1",
    rpcUrl: process.env.NEXT_PUBLIC_ETH_RPC_URL || "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    currency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    confirmationsRequired: 2,
    isMainnet: true,
    environment: "mainnet",
    description: "Decentralized Layer 1 settlement layer for institutional bridge proofs.",
  },

  // ── Testnet Networks ─────────────────────────────────────────────────────────
  coral: {
    name: "MST Coral Testnet",
    chainId: 54635,
    hexChainId: "0xd56b",
    rpcUrl: process.env.NEXT_PUBLIC_MST_RPC_URL || "https://coralrpc.mstblockchain.com",
    explorerUrl: process.env.NEXT_PUBLIC_MST_EXPLORER_URL || "https://coral.mstscan.com",
    currency: {
      name: "MST Coin",
      symbol: "MSTC",
      decimals: 18,
    },
    confirmationsRequired: 1,
    isMainnet: false,
    environment: "testnet",
    isRecommended: true,
    description: "Active development testnet with low gas and live smart contract deployment.",
  },
  legacy: {
    name: "Legacy MST Testnet",
    chainId: 91562037,
    hexChainId: "0x5752035",
    rpcUrl: "https://testnetrpc.mstblockchain.com",
    explorerUrl: "https://testnet.mstscan.com",
    currency: {
      name: "MST Coin",
      symbol: "MSTC",
      decimals: 18,
    },
    confirmationsRequired: 1,
    isMainnet: false,
    environment: "testnet",
    deprecationNotice: "Deprecated after 31 January 2027",
    description: "Legacy testnet being phased out in favour of MST Coral.",
  },
};

// Default network selection
export const DEFAULT_NETWORK_KEY =
  process.env.NEXT_PUBLIC_MST_NETWORK === "mstMainnet" || process.env.NEXT_PUBLIC_MST_NETWORK === "mainnet"
    ? "mstMainnet"
    : process.env.NEXT_PUBLIC_MST_NETWORK === "legacy"
      ? "legacy"
      : "coral";

export const ACTIVE_NETWORK = MST_NETWORKS[DEFAULT_NETWORK_KEY] || MST_NETWORKS.coral;

// Helpers to get networks by category
export function getMainnetNetworks(): Record<string, BlockchainNetwork> {
  return Object.fromEntries(
    Object.entries(MST_NETWORKS).filter(([_, net]) => net.environment === "mainnet")
  );
}

export function getTestnetNetworks(): Record<string, BlockchainNetwork> {
  return Object.fromEntries(
    Object.entries(MST_NETWORKS).filter(([_, net]) => net.environment === "testnet")
  );
}

// Deployed or configured contract address
export const CONSENT_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_CONSENT_REGISTRY_ADDRESS ||
  process.env.CONSENT_REGISTRY_ADDRESS ||
  "0x59b670e9fA9D0A427751Af201D676719a970857b";

export function getExplorerTxUrl(txHash: string, networkKey = DEFAULT_NETWORK_KEY): string {
  const net = MST_NETWORKS[networkKey] || ACTIVE_NETWORK;
  return `${net.explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, networkKey = DEFAULT_NETWORK_KEY): string {
  const net = MST_NETWORKS[networkKey] || ACTIVE_NETWORK;
  return `${net.explorerUrl}/address/${address}`;
}
