"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  ShieldCheck,
  QrCode,
  Clock,
  CheckCircle2,
  History,
  FileText,
  ExternalLink,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Ban,
  Activity,
  Layers,
  Wallet,
  AlertCircle,
  Paperclip,
} from "lucide-react";
import {
  ACTIVE_NETWORK,
  CONSENT_REGISTRY_ADDRESS,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";
import { BlockchainTraceCard } from "@/components/blockchain/BlockchainTraceCard";

export default function DashboardPage() {
  const { address, ownerName, connectWallet, openConnectModal, formatAddress, isMounted, isMainnet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeGrants: 0,
    pendingRequests: 0,
    revokedGrants: 0,
    blockchainTxs: 0,
  });
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [recentGrants, setRecentGrants] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [auditRes, grantsRes, requestsRes] = await Promise.all([
        fetch("/api/audit?limit=10"),
        fetch(`/api/consents?wallet=${address}`),
        fetch(`/api/requests?wallet=${address}`),
      ]);

      const auditData = await auditRes.json();
      const grantsData = await grantsRes.json();
      const requestsData = await requestsRes.json();

      if (auditData.success) {
        const txs = auditData.items.filter((i: any) => i.category === "BLOCKCHAIN");
        setRecentTxs(txs.slice(0, 5));
      }

      const pendingIncoming = requestsData.success
        ? (requestsData.incomingRequests || []).filter(
          (r: any) => r.status === "pending" && !r.isExpired
        )
        : [];
      setIncomingRequests(pendingIncoming);

      if (grantsData.success) {
        setRecentGrants(grantsData.grants.slice(0, 5));
        setStats({
          activeGrants: grantsData.grants.filter(
            (g: any) => g.status === "active" && !g.isExpired
          ).length,
          pendingRequests: pendingIncoming.length,
          revokedGrants: grantsData.grants.filter(
            (g: any) => g.status === "revoked"
          ).length,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isMounted || !address) {
    return (
      <div
        suppressHydrationWarning
        className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="relative mb-8" suppressHydrationWarning>
          <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/20">
            <Wallet className="h-9 w-9 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
          Connect your BridgeKey or EVM-compatible wallet to view your consent grants, document vault, and blockchain audit trail.
        </p>
        <button
          onClick={openConnectModal}
          className="btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl text-sm shadow-xl shadow-cyan-500/20"
          suppressHydrationWarning
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet (Mainnet & Testnet)
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Active Grants",
      value: stats.activeGrants,
      icon: Clock,
      color: "emerald",
      sub: "Currently valid & unexpired",
      subColor: "text-emerald-400",
    },
    {
      label: "Revoked Grants",
      value: stats.revokedGrants,
      icon: Ban,
      color: "red",
      sub: "Blocked immediately",
      subColor: "text-red-400",
    },
    {
      label: "Pending Requests",
      value: stats.pendingRequests,
      icon: QrCode,
      color: "amber",
      sub: "Awaiting QR scan & review",
      subColor: "text-amber-400",
    },
    {
      label: "MST Transactions",
      value: stats.blockchainTxs,
      icon: History,
      color: "cyan",
      sub: "On-chain audit events",
      subColor: "text-cyan-400",
    },
  ];

  const iconColorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="h-6 w-6 text-cyan-400" />
            Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">
            Real-time consent grants, access states, and verified MST blockchain transactions
            {ownerName ? (
              <> for <span className="text-cyan-300 font-medium">{ownerName}</span></>
            ) : null}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-white/[0.12] transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/requests/new"
            className="btn-primary flex items-center gap-2 px-4 py-2 text-xs rounded-xl"
          >
            <Plus className="h-3.5 w-3.5" />
            New Request
          </Link>
          <Link
            href="/documents"
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-xs rounded-xl text-cyan-300 border-cyan-500/20"
          >
            <FileText className="h-3.5 w-3.5" />
            Vault
          </Link>
        </div>
      </div>

      {/* Network banner */}
      <div className="mt-6 glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{ACTIVE_NETWORK.name}</span>
              <span className="pill-active">Chain {ACTIVE_NETWORK.chainId}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Connected:</span>
              {ownerName && (
                <span className="font-semibold text-white bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {ownerName}
                </span>
              )}
              <span className="font-mono text-cyan-300">{formatAddress(address)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Registry:</span>
          <a
            href={`${ACTIVE_NETWORK.explorerUrl}/address/${CONSENT_REGISTRY_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            {formatAddress(CONSENT_REGISTRY_ADDRESS)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card glass-card-hover rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${iconColorMap[card.color]}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-1.5">
                {loading ? (
                  <span className="inline-block h-8 w-12 rounded-lg animate-shimmer" />
                ) : (
                  card.value
                )}
              </div>
              <div className={`text-[11px] flex items-center gap-1 ${card.subColor}`}>
                <CheckCircle2 className="h-3 w-3" />
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ACTION REQUIRED: INCOMING CONSENT REQUESTS ── */}
      {incomingRequests.length > 0 && (
        <div className="mt-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-[#080D1F] to-cyan-950/20 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Action Required: Incoming Consent Requests
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold px-2 py-0.5">
                      {incomingRequests.length} Pending
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Consent requests addressed specifically to your wallet ({formatAddress(address)}). Review and choose whether to grant access.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-500/40 transition"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-lg bg-cyan-950/80 border border-cyan-800/40 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-cyan-300">
                        {req.required_document_types?.join(", ") || "Document"}
                      </span>
                      <h3 className="text-sm font-bold text-white">{req.title}</h3>
                    </div>
                    <p className="text-xs text-slate-300">{req.purpose}</p>

                    {req.attachedDocId && (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-200">
                        <Paperclip className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>
                          <strong className="text-white">Requester Attached File: </strong>
                          {req.attachedDocTitle || "Reference Document"}
                        </span>
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
                          Viewable in Notice
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-400 font-mono">
                      <span>
                        <span className="text-slate-500">From Requester: </span>
                        {formatAddress(req.requester_wallet)}
                      </span>
                      <span>
                        <span className="text-slate-500">Expires: </span>
                        {new Date(req.expires_at).toLocaleString()}
                      </span>
                      <span>
                        <span className="text-slate-500">Permissions: </span>
                        {req.allowed_actions?.join(", ")}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={req.consentUrl || `/consent/${req.token_hash || req.id}`}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition"
                  >
                    <span>Review & Grant Consent</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grants */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Consent Grants
            </h2>
            <Link
              href="/consents"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : recentGrants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.06] p-10 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-700 mb-3" />
              <p className="text-xs text-slate-500">
                No grants yet. Create a request or approve a consent to see live records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGrants.map((grant) => {
                const isActive = grant.status === "active" && !grant.isExpired;
                const isRevoked = grant.status === "revoked";
                const isExpired = grant.status === "active" && grant.isExpired;
                return (
                  <div
                    key={grant.id}
                    className="rounded-xl border border-white/[0.05] bg-black/20 p-4 text-xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{grant.documentTitle}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {grant.purpose} · {grant.allowed_actions?.join(", ")}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={
                            isActive ? "pill-active" :
                              isRevoked ? "pill-revoked" :
                                "pill-expired"
                          }
                        >
                          {isActive ? "Active" : isRevoked ? "Revoked" : "Expired"}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          {new Date(grant.granted_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* On-chain trace below grant */}
                    <BlockchainTraceCard
                      contractAddress={grant.contractAddress || CONSENT_REGISTRY_ADDRESS}
                      transactionHash={grant.transactionHash}
                      actorAddress={grant.owner_wallet}
                      action="grantConsent"
                      status={grant.status === "active" ? "confirmed" : grant.status}
                      compact={true}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blockchain Transactions */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" />
              MST Blockchain Events
            </h2>
            <Link
              href="/audit"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              Full Trail <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.06] p-10 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-700 mb-3" />
              <p className="text-xs text-slate-500">
                No blockchain events yet. Perform an on-chain grant or access to view receipts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-white/[0.05] bg-black/20 p-4 text-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span className="truncate">{tx.title}</span>
                        <span className="flex-shrink-0 rounded bg-cyan-950/60 text-cyan-300 text-[9px] px-1.5 py-0.5 border border-cyan-800/30 font-mono">
                          MST Coral
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={
                          tx.status === "confirmed" ? "pill-active" :
                            tx.status === "failed" ? "pill-revoked" :
                              "pill-pending"
                        }
                      >
                        {tx.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Below event: Contract Address and Activity Trace Address */}
                  <BlockchainTraceCard
                    contractAddress={tx.contractAddress || CONSENT_REGISTRY_ADDRESS}
                    transactionHash={tx.transactionHash || tx.blockchainTxHash}
                    actorAddress={tx.actorWallet}
                    consentIdHex={tx.consentIdHex}
                    action={tx.action || tx.type}
                    status={tx.status}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
