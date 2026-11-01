"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  Clock,
  Ban,
  CheckCircle2,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertCircle,
  Wallet,
  History,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  CONSENT_REGISTRY_ADDRESS,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";
import { BlockchainTraceCard } from "@/components/blockchain/BlockchainTraceCard";

export default function ConsentsPage() {
  const { address, connectWallet, openConnectModal, formatAddress, isMounted } = useWallet();
  const [grants, setGrants] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"grants" | "incoming">("grants");
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchGrants = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [grantsRes, requestsRes] = await Promise.all([
        fetch(`/api/consents?wallet=${address}`),
        fetch(`/api/requests?wallet=${address}`),
      ]);
      const grantsData = await grantsRes.json();
      const requestsData = await requestsRes.json();

      if (grantsData.success) setGrants(grantsData.grants);

      if (requestsData.success) {
        const pending = (requestsData.incomingRequests || []).filter(
          (r: any) => r.status === "pending" && !r.isExpired
        );
        setIncomingRequests(pending);
        // If there are incoming requests and no grants yet, auto-select incoming tab
        if (pending.length > 0 && (!grantsData.grants || grantsData.grants.length === 0)) {
          setActiveTab("incoming");
        }
      }
    } catch (err) {
      console.error("Error loading grants and requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleRevoke = async (grantId: string) => {
    if (
      !confirm(
        "Revoke this consent immediately?\n\nAccess will be terminated on-chain and all subsequent requests will be blocked."
      )
    )
      return;

    setRevokingId(grantId);
    try {
      const res = await fetch(`/api/grants/${grantId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerWallet: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke");
      toast.success("Consent revoked and registered on MST Blockchain!");
      fetchGrants();
    } catch (err: any) {
      toast.error(err.message || "Revocation failed");
    } finally {
      setRevokingId(null);
    }
  };

  // ── Not connected ────────────────────────────────────────────────────────
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
          Connect your wallet to view and manage your active consent grants.
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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clock className="h-6 w-6 text-cyan-400" />
            Consent Grants
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">
            Monitor all granted document permissions. Revoke any grant to block access immediately.
          </p>
        </div>
        <button
          onClick={fetchGrants}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <button
          onClick={() => setActiveTab("grants")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "grants"
              ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Granted Consents</span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-slate-300">
            {grants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("incoming")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "incoming"
              ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Incoming Requests</span>
          {incomingRequests.length > 0 && (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 text-[10px] font-mono font-bold animate-pulse">
              {incomingRequests.length} Pending
            </span>
          )}
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="mt-6">
        {activeTab === "incoming" ? (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl animate-shimmer glass-card" />
                ))}
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/[0.07] bg-white/[0.01] p-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900/80 border border-white/[0.06] mb-5">
                  <CheckCircle2 className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No incoming requests pending</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  When someone sends a consent request specifically to your wallet address ({formatAddress(address)}), it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-amber-500/30"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                          Action Required
                        </span>
                        <h3 className="text-sm font-bold text-white">{req.title}</h3>
                        <span className="text-xs text-slate-500 font-mono">
                          ({req.required_document_types?.join(", ")})
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-slate-500">Purpose: </span>
                        {req.purpose}
                      </div>

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
            )}
          </div>
        ) : (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl animate-shimmer glass-card" />
                ))}
              </div>
            ) : grants.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/[0.07] bg-white/[0.01] p-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900/80 border border-white/[0.06] mb-5">
                  <Clock className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No consent grants found</h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                  Grants appear here once a document owner approves a consent request.
                </p>
                <Link
                  href="/requests/new"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs rounded-xl"
                >
                  Create New Request
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {grants.map((grant) => {
                  const isActive = grant.status === "active" && !grant.isExpired;
                  const isRevoked = grant.status === "revoked";
                  const isExpired = grant.status === "active" && grant.isExpired;

                  // Clean any legacy or unparsed metadata tags from purpose
                  const cleanPurpose = (grant.purpose || "")
                    .replace(/\[consend_meta:[^\]]+\]/g, "")
                    .trim() || "Document Verification";

                  return (
                    <div
                      key={grant.id}
                      className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col gap-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span
                              className={
                                isActive ? "pill-active" :
                                  isRevoked ? "pill-revoked" :
                                    "pill-expired"
                              }
                            >
                              {isActive ? "Active" : isRevoked ? "Revoked" : "Expired"}
                            </span>
                            <h3 className="text-sm font-bold text-white">{grant.documentTitle}</h3>
                            <span className="text-xs text-slate-500 font-mono">({grant.docType})</span>
                          </div>

                          <div className="text-xs text-slate-300 break-words">
                            <span className="text-slate-500">Purpose: </span>
                            {cleanPurpose}
                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-400 font-mono">
                            <span>
                              <span className="text-slate-500">Requester: </span>
                              {formatAddress(grant.requester_wallet)}
                            </span>
                            <span>
                              <span className="text-slate-500">Owner (QR Scanner): </span>
                              {formatAddress(grant.owner_wallet)}
                            </span>
                            {grant.targetWallet && (
                              <span>
                                <span className="text-slate-500">Shared To: </span>
                                <span className="text-cyan-300 font-semibold">{formatAddress(grant.targetWallet)}</span>
                              </span>
                            )}
                            <span>
                              <span className="text-slate-500">Expires: </span>
                              {new Date(grant.expires_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 flex-shrink-0 self-start lg:self-center">
                          {isActive && (
                            <Link
                              href={`/viewer/${grant.id}`}
                              className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                          )}
                          {isActive && (
                            <button
                              onClick={() => handleRevoke(grant.id)}
                              disabled={revokingId === grant.id}
                              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition disabled:opacity-50"
                            >
                              {revokingId === grant.id ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  Revoking…
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" />
                                  Revoke
                                </>
                              )}
                            </button>
                          )}
                          {isRevoked && (
                            <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                              <Ban className="h-3.5 w-3.5" />
                              Access Terminated
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-xs text-slate-500 font-medium">
                              Window Elapsed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Below grant: Contract Address and Activity Trace Address */}
                      <BlockchainTraceCard
                        contractAddress={grant.contractAddress || CONSENT_REGISTRY_ADDRESS}
                        transactionHash={grant.transactionHash}
                        actorAddress={grant.owner_wallet}
                        action="grantConsent"
                        status={grant.status === "active" ? "confirmed" : grant.status}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
