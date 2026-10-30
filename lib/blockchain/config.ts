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
  isRecommended?: boolean;
  deprecationNotice?: string;
}

export const MST_NETWORKS: Record<string, BlockchainNetwork> = {
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
    isRecommended: true,
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
    deprecationNotice: "Deprecated after 31 January 2027",
  },
};

// Default network selection
export const DEFAULT_NETWORK_KEY = process.env.NEXT_PUBLIC_MST_NETWORK === "legacy" ? "legacy" : "coral";
export const ACTIVE_NETWORK = MST_NETWORKS[DEFAULT_NETWORK_KEY];

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
