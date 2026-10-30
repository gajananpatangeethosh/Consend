"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  MST_NETWORKS,
  ACTIVE_NETWORK,
  DEFAULT_NETWORK_KEY,
  BlockchainNetwork,
} from "@/lib/blockchain/config";
import { toast } from "sonner";
import { WalletConnectModal } from "./WalletConnectModal";

export interface DemoPersona {
  id: string;
  name: string;
  role: string;
  address: string;
  isMainnet: boolean;
  networkKey?: string;
  institution?: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  // ── Mainnet Wallets (Production) ──────────────────────────────────────────
  {
    id: "mainnet_enterprise",
    name: "Consortium Health Authority",
    role: "Mainnet Enterprise Verifier",
    address: "0x4cf31A064e1488F483C658BB6C8886dd38a30A24",
    isMainnet: true,
    networkKey: "mstMainnet",
    institution: "MST Mainnet L1 Consortium",
  },
  {
    id: "mainnet_fintech",
    name: "Apex Financial Registry",
    role: "Institutional Requester",
    address: "0x1111111254fb6c44bac0bed2854e76f90643097d",
    isMainnet: true,
    networkKey: "mstMainnet",
    institution: "Apex Institutional Node",
  },

  // ── Testnet Wallets (Sandbox Development) ─────────────────────────────────
  {
    id: "requester",
    name: "St. Xavier Admissions",
    role: "Academic Requester",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    isMainnet: false,
    networkKey: "coral",
    institution: "St. Xavier University",
  },
  {
    id: "owner",
    name: "Alice Sharma",
    role: "Document Owner (Citizen)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    isMainnet: false,
    networkKey: "coral",
    institution: "Individual Vault",
  },
  {
    id: "clinic",
    name: "Apollo Clinic",
    role: "Clinical Verifier",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    isMainnet: false,
    networkKey: "coral",
    institution: "Apollo Healthcare Systems",
  },
];

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isBridgeKey: boolean;
  isMounted: boolean;
  isMainnet: boolean;
  selectedNetworkKey: string;
  isConnectModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  connectWallet: (targetNetworkKey?: string | any) => Promise<string | null>;
  connectDemoPersona: (personaAddress: string) => void;
  disconnectWallet: () => void;
  switchNetwork: (key: string) => Promise<boolean>;
  formatAddress: (addr?: string | null) => string;
}

const WalletContext = createContext<WalletState>({
  address: null,
  chainId: null,
  isConnecting: false,
  isBridgeKey: false,
  isMounted: false,
  isMainnet: false,
  selectedNetworkKey: DEFAULT_NETWORK_KEY,
  isConnectModalOpen: false,
  openConnectModal: () => { },
  closeConnectModal: () => { },
  connectWallet: async () => null,
  connectDemoPersona: () => { },
  disconnectWallet: () => { },
  switchNetwork: async () => false,
  formatAddress: () => "",
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(ACTIVE_NETWORK.chainId);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBridgeKey, setIsBridgeKey] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string>(DEFAULT_NETWORK_KEY);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const openConnectModal = () => setIsConnectModalOpen(true);
  const closeConnectModal = () => setIsConnectModalOpen(false);

  const currentNetwork = MST_NETWORKS[selectedNetworkKey] || ACTIVE_NETWORK;
  const isMainnet = Boolean(currentNetwork?.isMainnet || chainId === 4646 || chainId === 1);

  // Restore saved wallet address & network from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;

    const savedAddr = localStorage.getItem("consent_wallet_address");
    if (savedAddr) {
      setAddress(savedAddr);
    }

    const savedNet = localStorage.getItem("consent_network_key");
    if (savedNet && MST_NETWORKS[savedNet]) {
      setSelectedNetworkKey(savedNet);
      setChainId(MST_NETWORKS[savedNet].chainId);
    }

    // Detect injected EVM wallet (BridgeKey / MetaMask / etc.)
    if ((window as any).ethereum) {
      const isBk = Boolean(
        (window as any).ethereum?.isBridgeKey ||
        (window as any).bridgekey ||
        (window as any).ethereum?.isMetaMask
      );
      setIsBridgeKey(isBk);

      // Listen for account / chain changes
      (window as any).ethereum.on?.("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          localStorage.setItem("consent_wallet_address", accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      (window as any).ethereum.on?.("chainChanged", (hexId: string) => {
        const id = parseInt(hexId, 16);
        setChainId(id);
        const match = Object.entries(MST_NETWORKS).find(([_, n]) => n.chainId === id);
        if (match) {
          setSelectedNetworkKey(match[0]);
          localStorage.setItem("consent_network_key", match[0]);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWallet = async (targetNetworkKey?: string | any): Promise<string | null> => {
    setIsConnecting(true);
    const targetKey = typeof targetNetworkKey === "string" ? targetNetworkKey : selectedNetworkKey;

    try {
      const ethereum = (window as any).ethereum || (window as any).bridgekey;

      if (!ethereum) {
        // If no web3 extension is detected, open the modal so the user can easily choose a Mainnet or Testnet persona
        openConnectModal();
        setIsConnecting(false);
        return null;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        const addr = accounts[0];
        setAddress(addr);
        localStorage.setItem("consent_wallet_address", addr);

        // Switch to target network (Mainnet or Testnet)
        await switchNetwork(targetKey);

        const netName = MST_NETWORKS[targetKey]?.name || "network";
        toast.success(`Connected to ${netName}: ${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`);
        return addr;
      }
      return null;
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      const msg = err?.message || String(err || "");
      if (
        msg.includes("updated") ||
        msg.includes("Refresh this page") ||
        msg.includes("Extension context invalidated") ||
        msg.includes("context invalidated")
      ) {
        toast.error("Wallet extension was updated. Refresh the page to reconnect.", {
          duration: 10000,
          action: {
            label: "Refresh Page",
            onClick: () => window.location.reload(),
          },
        });
      } else if (err?.code === 4001 || msg.includes("rejected")) {
        toast.info("Wallet connection was cancelled.");
      } else {
        toast.error(msg || "Failed to connect wallet");
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectDemoPersona = (personaAddress: string) => {
    const persona =
      DEMO_PERSONAS.find((p) => p.address.toLowerCase() === personaAddress.toLowerCase()) ||
      DEMO_PERSONAS[0];
    setAddress(persona.address);
    localStorage.setItem("consent_wallet_address", persona.address);

    if (persona.networkKey) {
      setSelectedNetworkKey(persona.networkKey);
      setChainId(MST_NETWORKS[persona.networkKey]?.chainId || null);
      localStorage.setItem("consent_network_key", persona.networkKey);
    }

    const typeBadge = persona.isMainnet ? "Mainnet" : "Testnet";
    toast.success(`Connected as ${persona.name} [${typeBadge}]`);
  };

  const disconnectWallet = () => {
    setAddress(null);
    localStorage.removeItem("consent_wallet_address");
    toast.info("Wallet disconnected");
  };

  const switchNetwork = async (key: string): Promise<boolean> => {
    const net = MST_NETWORKS[key];
    if (!net) return false;

    setSelectedNetworkKey(key);
    localStorage.setItem("consent_network_key", key);

    const ethereum = (window as any).ethereum || (window as any).bridgekey;
    if (!ethereum) {
      setChainId(net.chainId);
      toast.info(`Switched active network to ${net.name}`);
      return true;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: net.hexChainId }],
      });
      setChainId(net.chainId);
      toast.success(`Switched wallet to ${net.name}`);
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: net.hexChainId,
                chainName: net.name,
                rpcUrls: [net.rpcUrl],
                nativeCurrency: net.currency,
                blockExplorerUrls: [net.explorerUrl],
              },
            ],
          });
          setChainId(net.chainId);
          toast.success(`Added & switched to ${net.name}`);
          return true;
        } catch (addError) {
          console.error("Failed to add network to wallet:", addError);
          return false;
        }
      }
      console.error("Failed to switch network:", switchError);
      return false;
    }
  };

  const formatAddress = (addr?: string | null) => {
    const a = addr || address;
    if (!a) return "";
    return `${a.substring(0, 6)}…${a.substring(a.length - 4)}`;
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnecting,
        isBridgeKey,
        isMounted,
        isMainnet,
        selectedNetworkKey,
        isConnectModalOpen,
        openConnectModal,
        closeConnectModal,
        connectWallet,
        connectDemoPersona,
        disconnectWallet,
        switchNetwork,
        formatAddress,
      }}
    >
      {children}
      <WalletConnectModal isOpen={isConnectModalOpen} onClose={closeConnectModal} />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
