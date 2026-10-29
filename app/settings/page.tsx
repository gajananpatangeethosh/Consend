"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  Settings,
  Wallet,
  Activity,
  Layers,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Server,
  KeyRound,
} from "lucide-react";
import { MST_NETWORKS, CONSENT_REGISTRY_ADDRESS, getExplorerAddressUrl } from "@/lib/blockchain/config";
import { toast } from "sonner";

export default function SettingsPage() {
  const {
    address,
    chainId,
    isBridgeKey,
    selectedNetworkKey,
    activeRole,
    switchNetwork,
    connectWallet,
    formatAddress,
  } = useWallet();

  const [health, setHealth] = useState<any>(null);
  const [testingRpc, setTestingRpc] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error("Health fetch error:", err);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const testRpcConnection = async () => {
    setTestingRpc(true);
    setRpcStatus(null);
    try {
      const currentNet = MST_NETWORKS[selectedNetworkKey] || MST_NETWORKS.coral;
      const res = await fetch(currentNet.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      });
      const data = await res.json();
      if (data.result) {
        const block = parseInt(data.result, 16);
        setRpcStatus(`Online (Latest Block: ${block})`);
        toast.success(`Connected to ${currentNet.name} — Block #${block}`);
      } else {
        setRpcStatus("Error: Unexpected response");
      }
    } catch (err: any) {
      setRpcStatus(`Failed: ${err.message}`);
      toast.error("RPC endpoint unreachable");
    } finally {
      setTestingRpc(false);
    }
  };

  const currentNetwork = MST_NETWORKS[selectedNetworkKey] || MST_NETWORKS.coral;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-cyan-400" />
          <span>System & Network Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          BridgeKey wallet connection parameters, active MST testnet RPC, and smart contract registry details.
        </p>
      </div>

      {/* Connected Wallet Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white">
            <Wallet className="h-5 w-5 text-cyan-400" />
            <span>BridgeKey / Web3 Wallet Identity</span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
              address
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {address ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Active Wallet Address</span>
            <span className="text-slate-200 mt-0.5 block break-all">
              {address || "Not connected"}
            </span>
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Active Persona / Role</span>
            <span className="text-cyan-300 capitalize mt-0.5 block font-bold">
              {activeRole}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {!address ? (
            <button
              onClick={connectWallet}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
            >
              Connect BridgeKey Wallet
            </button>
          ) : (
            <button
              onClick={connectWallet}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-300 hover:text-white"
            >
              Switch Account
            </button>
          )}
        </div>
      </div>

      {/* MST Blockchain Network */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span>MST Blockchain Network</span>
          </div>
          <button
            onClick={testRpcConnection}
            disabled={testingRpc}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${testingRpc ? "animate-spin" : ""}`} />
            <span>Ping RPC</span>
          </button>
        </div>

        {rpcStatus && (
          <div className="rounded-xl bg-slate-950 p-3 border border-cyan-800/40 text-xs text-cyan-300 font-mono">
            Ping Result: {rpcStatus}
          </div>
        )}

        {/* Network Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(MST_NETWORKS).map(([key, net]) => {
            const isSelected = selectedNetworkKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => switchNetwork(key)}
                className={`rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-950/30 text-white"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">{net.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                </div>
                <div className="text-xs font-mono text-slate-400 space-y-1">
                  <div>Chain ID: {net.chainId} ({net.hexChainId})</div>
                  <div>Gas Token: {net.currency.symbol}</div>
                  {net.deprecationNotice && (
                    <div className="text-amber-400 text-[10px]">{net.deprecationNotice}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Contract Address & Explorer */}
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">ConsentRegistry Contract Address:</span>
            <a
              href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-slate-200 break-all">{CONSENT_REGISTRY_ADDRESS}</div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[11px]">
            <span>Active RPC Endpoint:</span>
            <span className="text-slate-200">{currentNetwork.rpcUrl}</span>
          </div>
        </div>
      </div>

      {/* Backend & Supabase Status */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-sm font-bold text-white">
          <Server className="h-5 w-5 text-cyan-400" />
          <span>Storage Engine & Supabase Health</span>
        </div>

        {health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Storage Mode</span>
              <span className="text-white font-semibold mt-1 block">
                {health.backend?.storageEngine}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Relayer Engine</span>
              <span className="text-cyan-300 font-semibold mt-1 block">
                {health.blockchain?.isRelayerConfigured ? "Server Relayer Configured" : "Browser Wallet Direct Mode"}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Loading system status...</div>
        )}
      </div>
    </div>
  );
}
