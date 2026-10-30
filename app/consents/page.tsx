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
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchGrants = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/consents?wallet=${address}`);
      const data = await res.json();
      if (data.success) setGrants(data.grants);
    } catch (err) {
      console.error("Error loading grants:", err);
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

      {/* Grants list */}
      <div className="mt-8">
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

                      <div className="text-xs text-slate-400">
                        <span className="text-slate-500">Purpose: </span>
                        {grant.purpose}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-400 font-mono">
                        <span>
                          <span className="text-slate-500">Requester: </span>
                          {formatAddress(grant.requester_wallet)}
                        </span>
                        <span>
                          <span className="text-slate-500">Owner: </span>
                          {formatAddress(grant.owner_wallet)}
                        </span>
                        <span>
                          <span className="text-slate-500">Expires: </span>
                          {new Date(grant.expires_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
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
    </div>
  );
}
