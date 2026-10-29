"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MST_NETWORKS, ACTIVE_NETWORK, DEFAULT_NETWORK_KEY } from "@/lib/blockchain/config";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isBridgeKey: boolean;
  selectedNetworkKey: string;
  activeRole: "owner" | "requester" | "custom";
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  switchNetwork: (key: string) => Promise<boolean>;
  setDemoRole: (role: "owner" | "requester") => void;
  formatAddress: (addr?: string | null) => string;
}

const DEMO_ACCOUNTS = {
  owner: {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    name: "Priya Sharma (Owner Vault)",
  },
  requester: {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    name: "St. Xavier Admissions (Requester)",
  },
};

const WalletContext = createContext<WalletState>({
  address: null,
  chainId: null,
  isConnecting: false,
  isBridgeKey: false,
  selectedNetworkKey: DEFAULT_NETWORK_KEY,
  activeRole: "owner",
  connectWallet: async () => null,
  disconnectWallet: () => {},
  switchNetwork: async () => false,
  setDemoRole: () => {},
  formatAddress: () => "",
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(ACTIVE_NETWORK.chainId);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBridgeKey, setIsBridgeKey] = useState(false);
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string>(DEFAULT_NETWORK_KEY);
  const [activeRole, setActiveRole] = useState<"owner" | "requester" | "custom">("owner");

  // Load persisted wallet from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedAddr = localStorage.getItem("consent_wallet_address");
    const savedRole = localStorage.getItem("consent_active_role") as any;

    if (savedAddr) {
      setAddress(savedAddr);
      if (savedRole) setActiveRole(savedRole);
    } else {
      // Default to demo owner for immediate seamless preview
      setAddress(DEMO_ACCOUNTS.owner.address);
      setActiveRole("owner");
    }

    // Check if BridgeKey / EVM wallet is injected in window
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
          setActiveRole("custom");
          localStorage.setItem("consent_wallet_address", accounts[0]);
          localStorage.setItem("consent_active_role", "custom");
        } else {
          disconnectWallet();
        }
      });

      (window as any).ethereum.on?.("chainChanged", (hexId: string) => {
        setChainId(parseInt(hexId, 16));
      });
    }
  }, []);

  const connectWallet = async (): Promise<string | null> => {
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum || (window as any).bridgekey;

      if (!ethereum) {
        // Fallback: If browser has no Web3 extension installed, prompt with notice and use demo account
        alert(
          "BridgeKey or Web3 wallet extension not detected. Switching to pre-configured MST Testnet demo account for full feature testing."
        );
        const demoAddr = DEMO_ACCOUNTS.owner.address;
        setAddress(demoAddr);
        setActiveRole("owner");
        localStorage.setItem("consent_wallet_address", demoAddr);
        localStorage.setItem("consent_active_role", "owner");
        return demoAddr;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        const addr = accounts[0];
        setAddress(addr);
        setActiveRole("custom");
        localStorage.setItem("consent_wallet_address", addr);
        localStorage.setItem("consent_active_role", "custom");

        // Verify/switch to active MST chain
        await switchNetwork(selectedNetworkKey);
        return addr;
      }
      return null;
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    localStorage.removeItem("consent_wallet_address");
    localStorage.removeItem("consent_active_role");
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
      // Chain 4902 error indicates network needs to be added
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

  const setDemoRole = (role: "owner" | "requester") => {
    const account = DEMO_ACCOUNTS[role];
    setAddress(account.address);
    setActiveRole(role);
    localStorage.setItem("consent_wallet_address", account.address);
    localStorage.setItem("consent_active_role", role);
  };

  const formatAddress = (addr?: string | null) => {
    const a = addr || address;
    if (!a) return "";
    return `${a.substring(0, 6)}...${a.substring(a.length - 4)}`;
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnecting,
        isBridgeKey,
        selectedNetworkKey,
        activeRole,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        setDemoRole,
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
