"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Clock,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Filter,
} from "lucide-react";
import { ACTIVE_NETWORK, CONSENT_REGISTRY_ADDRESS, getExplorerTxUrl } from "@/lib/blockchain/config";

export default function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "blockchain" | "access">("all");
  const [loading, setLoading] = useState(true);

  const fetchAudit = async (f = filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?filter=${f}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Error fetching audit trail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit(filter);
  }, [filter]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="h-6 w-6 text-cyan-400" />
            <span>Verifiable Blockchain Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological, immutable record of consent requests, owner grants, access attempts, and on-chain MST transactions.
          </p>
        </div>

        <button
          onClick={() => fetchAudit(filter)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Disclaimers & Info */}
      <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Tamper-Evident Ledger: </span>
          All blockchain events are verified against the{" "}
          <span className="font-semibold text-cyan-300">{ACTIVE_NETWORK.name}</span> smart contract (
          <span className="font-mono text-slate-200">{CONSENT_REGISTRY_ADDRESS.substring(0, 10)}...</span>).
          Notice: Recording an access event on-chain proves the authorized recipient requested bytes; it does not independently guarantee human reading or retention.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "all"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilter("blockchain")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "blockchain"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          MST Blockchain Transactions
        </button>
        <button
          onClick={() => setFilter("access")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "access"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Document Access Events
        </button>
      </div>

      {/* Timeline List */}
      <div className="mt-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500">
            No audit records matching this filter.
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {items.map((item) => {
              const isBlockchain = item.category === "BLOCKCHAIN";
              const isAccessDenied = item.type === "ACCESS_DENIED";
              const isAccessAllowed = item.type === "ACCESS_ALLOWED";
              const isRevoked = item.type === "CONSENT_REVOKED";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border mt-0.5 ${
                        isBlockchain
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                          : isAccessDenied
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : isAccessAllowed
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      {isBlockchain ? (
                        <Layers className="h-4 w-4" />
                      ) : isAccessDenied ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-white text-sm">
                          {item.title}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            isBlockchain
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800/40"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>

                      {item.actorWallet && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Actor: <span className="text-slate-200">{item.actorWallet}</span>
                        </div>
                      )}

                      {item.consentIdHex && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                          Consent ID: <span className="text-slate-300">{item.consentIdHex}</span>
                        </div>
                      )}

                      {item.metadata?.reason && (
                        <div className="text-[11px] text-red-400 mt-0.5">
                          Reason: {item.metadata.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blockchain Link & Timestamp */}
                  <div className="text-left md:text-right shrink-0">
                    {item.transactionHash || item.blockchainTxHash ? (
                      <a
                        href={getExplorerTxUrl(item.transactionHash || item.blockchainTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
                      >
                        <span>
                          Tx: {(item.transactionHash || item.blockchainTxHash).substring(0, 14)}...
                        </span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500 uppercase">
                        {item.status || "Recorded"}
                      </span>
                    )}

                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
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
