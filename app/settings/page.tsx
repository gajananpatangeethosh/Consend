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
  UserCheck,
  Building,
  Save,
} from "lucide-react";
import { MST_NETWORKS, CONSENT_REGISTRY_ADDRESS, getExplorerAddressUrl } from "@/lib/blockchain/config";
import { toast } from "sonner";

export default function SettingsPage() {
  const {
    address,
    ownerName,
    persona,
    refreshProfile,
    chainId,
    isBridgeKey,
    isMainnet,
    selectedNetworkKey,
    openConnectModal,
    switchNetwork,
    connectWallet,
    formatAddress,
    isMounted,
  } = useWallet();

  const [health, setHealth] = useState<any>(null);
  const [testingRpc, setTestingRpc] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<string | null>(null);

  // Profile editing state
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (ownerName) {
      setDisplayName(ownerName);
    } else {
      setDisplayName("");
    }
    if (persona?.institution) {
      setOrganizationName(persona.institution);
    }
  }, [ownerName, persona]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Connect a wallet first");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          displayName: displayName.trim(),
          organizationName: organizationName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      await refreshProfile();
      toast.success("Wallet owner profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const currentNetwork = MST_NETWORKS[selectedNetworkKey] || MST_NETWORKS.coral;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-white/[0.06]">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="h-6 w-6 text-cyan-400" />
          System & Network Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1.5">
          Wallet connection, owner identity resolution, active MST RPC endpoint, and smart contract registry details.
        </p>
      </div>

      {/* Connected Wallet Box */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white">
            <Wallet className="h-5 w-5 text-cyan-400" />
            BridgeKey / Web3 Wallet
          </div>
          <span className={isMounted && address ? "pill-active" : "pill-expired"}>
            {isMounted && address ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-black/40 border border-white/[0.05] p-3.5">
            <span className="text-slate-600 block text-[10px] uppercase tracking-widest mb-1">Wallet Owner Name</span>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-cyan-400" />
              <span>{isMounted && address ? (ownerName || "Unregistered Persona") : "Not connected"}</span>
              {persona?.role && (
                <span className="text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                  {persona.role}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-black/40 border border-white/[0.05] p-3.5 font-mono text-xs">
            <span className="text-slate-600 block text-[10px] uppercase tracking-widest mb-1">Wallet Address</span>
            <span className="text-cyan-300 break-all">{isMounted && address ? address : "Not connected"}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {!isMounted || !address ? (
            <button
              onClick={openConnectModal}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl shadow-lg shadow-cyan-500/20"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet (Mainnet & Testnet)
            </button>
          ) : (
            <button
              onClick={openConnectModal}
              className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl"
            >
              <Wallet className="h-4 w-4 text-cyan-400" />
              Switch Account or Network
            </button>
          )}
        </div>
      </div>

      {/* Wallet Owner Profile Editor */}
      {isMounted && address && (
        <form onSubmit={handleSaveProfile} className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-bold text-white">
              <UserCheck className="h-5 w-5 text-cyan-400" />
              Wallet Owner Profile & Identity
            </div>
            <span className="text-xs text-slate-500">Auto-resolved on consent flows</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Attach a human-readable display name and organization to your wallet address. This name will appear across your requests, QR codes, document vault, and consent verification screens.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Display Name (Wallet Owner)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alice Sharma or St. Xavier Admissions"
                className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Organization / Institution (Optional)
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. MST Healthcare Network or Individual Vault"
                className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {isSavingProfile ? "Saving Profile..." : "Save Owner Profile"}
            </button>
          </div>
        </form>
      )}

      {/* MST Blockchain Network */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span>MST Blockchain Networks</span>
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

        {/* Network Selector Tabs partitioned into Mainnet and Testnet */}
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Production Mainnets (Live L1)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(MST_NETWORKS)
                .filter(([_, net]) => net.isMainnet)
                .map(([key, net]) => {
                  const isSelected = selectedNetworkKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => switchNetwork(key)}
                      className={`rounded-2xl border p-4 text-left transition ${isSelected
                          ? "border-emerald-500/60 bg-emerald-950/25 text-white shadow-md shadow-emerald-950/30"
                          : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          {net.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 text-[9px] px-1.5 py-0.5 font-mono">
                            Mainnet
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-400 space-y-1">
                        <div>Chain ID: {net.chainId} ({net.hexChainId})</div>
                        <div>Gas Token: {net.currency.symbol}</div>
                        {net.description && (
                          <div className="text-slate-500 text-[11px] font-sans pt-1">
                            {net.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Development & Sandbox Testnets
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(MST_NETWORKS)
                .filter(([_, net]) => !net.isMainnet)
                .map(([key, net]) => {
                  const isSelected = selectedNetworkKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => switchNetwork(key)}
                      className={`rounded-2xl border p-4 text-left transition ${isSelected
                          ? "border-cyan-500/50 bg-cyan-950/25 text-white shadow-md shadow-cyan-950/30"
                          : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-cyan-400" />
                          {net.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 text-[9px] px-1.5 py-0.5 font-mono">
                            Testnet
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-400 space-y-1">
                        <div>Chain ID: {net.chainId} ({net.hexChainId})</div>
                        <div>Gas Token: {net.currency.symbol}</div>
                        {net.deprecationNotice && (
                          <div className="text-amber-400 text-[10px]">{net.deprecationNotice}</div>
                        )}
                        {net.description && (
                          <div className="text-slate-500 text-[11px] font-sans pt-1">
                            {net.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Contract Address & Explorer */}
        <div className="rounded-2xl bg-black/40 border border-white/[0.05] p-4 space-y-3 font-mono text-xs">
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
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-sm font-bold text-white">
          <Server className="h-5 w-5 text-cyan-400" />
          <span>Storage Engine & Supabase Health</span>
        </div>

        {health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-black/40 border border-white/[0.05] p-3.5">
              <span className="text-slate-600 block text-[10px] uppercase tracking-widest mb-1">Storage Mode</span>
              <span className="text-white font-semibold">{health.backend?.storageEngine}</span>
            </div>
            <div className="rounded-xl bg-black/40 border border-white/[0.05] p-3.5">
              <span className="text-slate-600 block text-[10px] uppercase tracking-widest mb-1">Relayer Engine</span>
              <span className="text-cyan-300 font-semibold">
                {health.blockchain?.isRelayerConfigured ? "Server Relayer" : "Browser Wallet Direct"}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-600">Loading system status…</div>
        )}
      </div>
    </div>
  );
}
