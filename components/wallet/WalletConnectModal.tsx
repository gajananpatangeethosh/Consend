"use client";

import React, { useState } from "react";
import {
  X,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
  Globe,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Flame,
} from "lucide-react";
import {
  MST_NETWORKS,
  getMainnetNetworks,
  getTestnetNetworks,
  BlockchainNetwork,
} from "@/lib/blockchain/config";
import { useWallet, DEMO_PERSONAS, DemoPersona } from "./WalletContext";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const {
    connectWallet,
    connectDemoPersona,
    switchNetwork,
    selectedNetworkKey,
    isConnecting,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<"mainnet" | "testnet">("mainnet");
  const [selectedTargetNet, setSelectedTargetNet] = useState<string>("mstMainnet");

  if (!isOpen) return null;

  const mainnetNets = getMainnetNetworks();
  const testnetNets = getTestnetNetworks();

  const currentTabNetworks = activeTab === "mainnet" ? mainnetNets : testnetNets;
  const currentTabPersonas = DEMO_PERSONAS.filter((p) =>
    activeTab === "mainnet" ? p.isMainnet : !p.isMainnet
  );

  const handleSelectNetwork = async (key: string) => {
    setSelectedTargetNet(key);
    await switchNetwork(key);
  };

  const handleConnectInjected = async () => {
    await connectWallet(selectedTargetNet);
    onClose();
  };

  const handleConnectPersona = (persona: DemoPersona) => {
    connectDemoPersona(persona.address);
    if (persona.networkKey) {
      switchNetwork(persona.networkKey);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#070D1E] p-6 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Connect Wallet
              </h2>
              <p className="text-xs text-slate-400">
                Choose between Production Mainnet or Sandboxed Testnet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-slate-400 hover:text-white hover:bg-white/[0.07] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mainnet vs Testnet Tab Toggle */}
        <div className="relative mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.08] bg-black/40 p-1">
          <button
            onClick={() => {
              setActiveTab("mainnet");
              setSelectedTargetNet("mstMainnet");
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
              activeTab === "mainnet"
                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>Mainnet (Production)</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
              L1 Live
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("testnet");
              setSelectedTargetNet("coral");
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
              activeTab === "testnet"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Testnet (Sandbox)</span>
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
              Free Gas
            </span>
          </button>
        </div>

        {/* Network Selection within Active Tab */}
        <div className="mt-4 space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">
            Target Blockchain Network
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(currentTabNetworks).map(([key, net]) => {
              const isSelected = selectedTargetNet === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectNetwork(key)}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition ${
                    isSelected
                      ? "border-cyan-500/50 bg-cyan-950/30 text-white shadow-sm"
                      : "border-white/[0.06] bg-black/20 text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          net.isMainnet ? "bg-emerald-400" : "bg-cyan-400"
                        }`}
                      />
                      {net.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                    <span>Chain ID: {net.chainId}</span>
                    <span className="text-slate-400">{net.currency.symbol}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Action: Connect Injected Web3 Wallet */}
        <div className="mt-5 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">
            Connect Browser Extension
          </div>
          <button
            onClick={handleConnectInjected}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:opacity-95 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950/20">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div>MetaMask / BridgeKey / EVM Wallet</div>
                <div className="text-[10px] font-medium opacity-80">
                  Auto-switch to {MST_NETWORKS[selectedTargetNet]?.name || "Network"}
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Demo / Sandbox Personas */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">
            <span>Or Connect with 1-Click Persona</span>
            <span className="text-[9px] text-slate-600 lowercase font-normal">
              (No extension required)
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {currentTabPersonas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => handleConnectPersona(persona)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/[0.05] bg-black/20 hover:border-cyan-500/30 hover:bg-white/[0.02] transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300 font-mono text-[10px] group-hover:text-cyan-300 transition">
                    {persona.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                      {persona.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {persona.role} · {persona.address.substring(0, 6)}…
                      {persona.address.substring(persona.address.length - 4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${
                      persona.isMainnet
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                        : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
                    }`}
                  >
                    {persona.isMainnet ? "Mainnet" : "Testnet"}
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer info note */}
        <div className="mt-5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-cyan-400" />
            <span>Cryptographic proof verification enforced</span>
          </div>
          <a
            href={MST_NETWORKS[selectedTargetNet]?.explorerUrl || "https://mstscan.com"}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-0.5"
          >
            Explorer <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

