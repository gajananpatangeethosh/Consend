"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MST_NETWORKS, ACTIVE_NETWORK, DEFAULT_NETWORK_KEY } from "@/lib/blockchain/config";
import { toast } from "sonner";

export interface DemoPersona {
  id: string;
  name: string;
  role: string;
  address: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "requester",
    name: "St. Xavier Admissions",
    role: "Requester",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },
  {
    id: "owner",
    name: "Alice Sharma",
    role: "Document Owner",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  {
    id: "clinic",
    name: "Apollo Clinic",
    role: "Verifier",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  },
];

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isBridgeKey: boolean;
  isMounted: boolean;
  selectedNetworkKey: string;
  connectWallet: () => Promise<string | null>;
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
  selectedNetworkKey: DEFAULT_NETWORK_KEY,
  connectWallet: async () => null,
  connectDemoPersona: () => {},
  disconnectWallet: () => {},
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

  // Restore saved wallet address from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;

    const savedAddr = localStorage.getItem("consent_wallet_address");
    if (savedAddr) {
      setAddress(savedAddr);
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
        setChainId(parseInt(hexId, 16));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWallet = async (): Promise<string | null> => {
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum || (window as any).bridgekey;

      if (!ethereum) {
        // Connect default test persona so full application testing works even without extension
        const defaultPersona = DEMO_PERSONAS[0];
        setAddress(defaultPersona.address);
        localStorage.setItem("consent_wallet_address", defaultPersona.address);
        toast.success(`Connected as ${defaultPersona.name} (${defaultPersona.role})`);
        return defaultPersona.address;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        const addr = accounts[0];
        setAddress(addr);
        localStorage.setItem("consent_wallet_address", addr);
        toast.success(`Wallet connected: ${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`);

        // Attempt to switch to the active MST chain
        await switchNetwork(selectedNetworkKey);
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
        toast.error("BridgeKey extension was updated. Refresh the page to reconnect.", {
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
    toast.success(`Switched Persona: ${persona.name} (${persona.role})`);
  };

  const disconnectWallet = () => {
    setAddress(null);
    localStorage.removeItem("consent_wallet_address");
  };

  const switchNetwork = async (key: string): Promise<boolean> => {
    const net = MST_NETWORKS[key];
    if (!net) return false;

    setSelectedNetworkKey(key);
    const ethereum = (window as any).ethereum || (window as any).bridgekey;

    if (!ethereum) {
      setChainId(net.chainId);
      return true;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: net.hexChainId }],
      });
      setChainId(net.chainId);
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
          return true;
        } catch (addError) {
          console.error("Failed to add MST network to wallet:", addError);
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
        selectedNetworkKey,
        connectWallet,
        connectDemoPersona,
        disconnectWallet,
        switchNetwork,
        formatAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
