"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  ShieldCheck,
  QrCode,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  ExternalLink,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Ban,
  Activity,
  Layers,
} from "lucide-react";
import { ACTIVE_NETWORK, CONSENT_REGISTRY_ADDRESS, getExplorerTxUrl } from "@/lib/blockchain/config";

export default function DashboardPage() {
  const { address, activeRole, formatAddress } = useWallet();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeGrants: 0,
    pendingRequests: 0,
    revokedGrants: 0,
    blockchainTxs: 0,
  });
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentGrants, setRecentGrants] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Audit items
      const auditRes = await fetch("/api/audit?limit=10");
      const auditData = await auditRes.json();

      if (auditData.success) {
        const txs = auditData.items.filter((i: any) => i.category === "BLOCKCHAIN");
        const evts = auditData.items.filter((i: any) => i.category === "ACCESS");
        setRecentTxs(txs.slice(0, 5));
        setRecentEvents(evts.slice(0, 5));
      }

      // 2. Fetch Grants for active wallet if available
      const targetWallet = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const grantsRes = await fetch(`/api/consents?wallet=${targetWallet}`);
      const grantsData = await grantsRes.json();

      if (grantsData.success) {
        setRecentGrants(grantsData.grants.slice(0, 5));
        const active = grantsData.grants.filter((g: any) => g.status === "active" && !g.isExpired).length;
        const revoked = grantsData.grants.filter((g: any) => g.status === "revoked").length;

        setStats({
          activeGrants: active,
          pendingRequests: grantsData.grants.filter((g: any) => g.status === "pending").length,
          revokedGrants: revoked,
          blockchainTxs: auditData.counts?.blockchain || 0,
        });
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [address]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-cyan-400" />
            <span>Consent Overview Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time consent grants, access authorization state, and verified MST blockchain transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/requests/new"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 hover:opacity-95 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Request</span>
          </Link>

          <Link
            href="/documents"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Vault</span>
          </Link>
        </div>
      </div>

      {/* Network & Role Status Banner */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Active Network: {ACTIVE_NETWORK.name}</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 font-mono">
                Chain ID {ACTIVE_NETWORK.chainId}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Connected Address:</span>
              <span className="font-mono text-cyan-300">{formatAddress(address)}</span>
              <span className="capitalize text-slate-500 font-medium">({activeRole})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Registry Contract:</span>
          <a
            href={`${ACTIVE_NETWORK.explorerUrl}/address/${CONSENT_REGISTRY_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            {formatAddress(CONSENT_REGISTRY_ADDRESS)} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Grants</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.activeGrants}</div>
          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Currently valid & unexpired</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Revoked Grants</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.revokedGrants}</div>
          <div className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
            <span>Blocked immediately</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Requests</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.pendingRequests}</div>
          <div className="mt-1 text-[11px] text-amber-400">Awaiting QR scan & review</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">MST Transactions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.blockchainTxs}</div>
          <div className="mt-1 text-[11px] text-cyan-400">On-Chain audit events</div>
        </div>
      </div>

      {/* Main Content Grid: Recent Grants & Blockchain Activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Grants */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Consent Grants Lifecycle</span>
            </h2>
            <Link href="/consents" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {recentGrants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              No grants found for this wallet. Create a request or approve a consent to see live records.
            </div>
          ) : (
            <div className="space-y-3">
              {recentGrants.map((grant) => (
                <div
                  key={grant.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{grant.documentTitle}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Purpose: {grant.purpose} • Actions: {grant.allowed_actions?.join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        grant.status === "active" && !grant.isExpired
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : grant.status === "revoked"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {grant.status === "active" && grant.isExpired ? "Expired" : grant.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(grant.granted_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Blockchain Transactions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" />
              <span>MST Blockchain Audit Events</span>
            </h2>
            <Link href="/audit" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              Full Audit Trail <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {recentTxs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              No blockchain events recorded yet. Perform an on-chain grant or access to view receipts.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{tx.title}</span>
                      <span className="rounded bg-cyan-950 text-cyan-300 text-[9px] px-1.5 py-0.5 border border-cyan-800/40 font-mono">
                        MST Coral
                      </span>
                    </div>
                    {tx.transactionHash ? (
                      <a
                        href={getExplorerTxUrl(tx.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        {tx.transactionHash.substring(0, 16)}... <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Pending Confirmation</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        tx.status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : tx.status === "failed"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {tx.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
