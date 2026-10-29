"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  Clock,
  ShieldCheck,
  Ban,
  CheckCircle2,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertTriangle,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { getExplorerTxUrl } from "@/lib/blockchain/config";

export default function ConsentsPage() {
  const { address, formatAddress } = useWallet();
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const targetWallet = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const res = await fetch(`/api/consents?wallet=${targetWallet}`);
      const data = await res.json();
      if (data.success) {
        setGrants(data.grants);
      }
    } catch (err) {
      console.error("Error loading grants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, [address]);

  const handleRevoke = async (grantId: string) => {
    if (!confirm("Are you sure you want to revoke this consent immediately? Access will be terminated on-chain.")) {
      return;
    }

    setRevokingId(grantId);
    try {
      const callerWallet = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const res = await fetch(`/api/grants/${grantId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerWallet }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke consent");
      }

      toast.success("Consent revoked immediately and registered on MST Blockchain!");
      fetchGrants();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke consent");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-cyan-400" />
            <span>Active & Historical Consent Grants</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor all granted document permissions. Revoking a grant blocks subsequent access immediately.
          </p>
        </div>

        <button
          onClick={fetchGrants}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grants Table / Cards */}
      <div className="mt-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : grants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-white">No consent grants found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Grants will appear here once an owner approves a document request.
            </p>
            <Link
              href="/requests/new"
              className="mt-4 inline-block rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
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
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:border-slate-700"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : isRevoked
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {isActive ? "Active Grant" : isRevoked ? "Revoked" : "Expired"}
                      </span>
                      <h3 className="text-sm font-bold text-white">{grant.documentTitle}</h3>
                      <span className="text-xs text-slate-400">({grant.docType})</span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-500">Purpose: </span>
                      <span>{grant.purpose}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 font-mono">
                      <div>
                        <span className="text-slate-500">Requester: </span>
                        <span>{formatAddress(grant.requester_wallet)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Owner: </span>
                        <span>{formatAddress(grant.owner_wallet)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expires: </span>
                        <span>{new Date(grant.expires_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isActive && (
                      <Link
                        href={`/viewer/${grant.id}`}
                        className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Viewer</span>
                      </Link>
                    )}

                    {isActive && (
                      <button
                        onClick={() => handleRevoke(grant.id)}
                        disabled={revokingId === grant.id}
                        className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>{revokingId === grant.id ? "Revoking..." : "Revoke"}</span>
                      </button>
                    )}

                    {isRevoked && (
                      <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                        <Ban className="h-3.5 w-3.5" />
                        <span>Access Terminated</span>
                      </span>
                    )}

                    {isExpired && (
                      <span className="text-xs text-slate-500 font-medium">Window Elapsed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
