"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Ban,
  CheckCircle2,
  Layers,
  AlertCircle,
} from "lucide-react";
import {
  ACTIVE_NETWORK,
  CONSENT_REGISTRY_ADDRESS,
  getExplorerTxUrl,
} from "@/lib/blockchain/config";

type FilterType = "all" | "blockchain" | "access";

export default function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  const fetchAudit = async (f: FilterType = filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?filter=${f}&limit=50`);
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (err) {
      console.error("Error fetching audit trail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All Activity" },
    { key: "blockchain", label: "MST Transactions" },
    { key: "access", label: "Access Events" },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <History className="h-6 w-6 text-cyan-400" />
            Blockchain Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">
            Immutable, chronological record of consent events and on-chain MST transactions.
          </p>
        </div>
        <button
          onClick={() => fetchAudit(filter)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="mt-5 rounded-2xl border border-cyan-500/15 bg-cyan-950/10 p-4 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">Tamper-Evident Ledger: </span>
          All blockchain events verified against the{" "}
          <span className="font-semibold text-cyan-300">{ACTIVE_NETWORK.name}</span> smart
          contract (
          <span className="font-mono text-slate-200">{CONSENT_REGISTRY_ADDRESS.substring(0, 10)}…</span>
          ).{" "}
          <a
            href={`${ACTIVE_NETWORK.explorerUrl}/address/${CONSENT_REGISTRY_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
          >
            View on Explorer <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              filter === tab.key
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/[0.06]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl animate-shimmer glass-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.07] bg-white/[0.01] p-16 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-700 mb-4" />
            <p className="text-sm text-slate-500">No audit records matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isBlockchain = item.category === "BLOCKCHAIN";
              const isDenied = item.type === "ACCESS_DENIED";
              const isAllowed = item.type === "ACCESS_ALLOWED";

              return (
                <div
                  key={item.id}
                  className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border mt-0.5 ${
                        isBlockchain
                          ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
                          : isDenied
                          ? "bg-red-500/10 border-red-500/25 text-red-400"
                          : isAllowed
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                          : "bg-white/[0.04] border-white/[0.07] text-slate-400"
                      }`}
                    >
                      {isBlockchain ? (
                        <Layers className="h-4 w-4" />
                      ) : isDenied ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">{item.title}</span>
                        <span
                          className={`text-[10px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wider ${
                            isBlockchain
                              ? "bg-cyan-950/60 text-cyan-300 border border-cyan-800/30"
                              : "bg-white/[0.05] text-slate-500 border border-white/[0.06]"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>

                      {item.actorWallet && (
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          Actor:{" "}
                          <span className="text-slate-300">{item.actorWallet}</span>
                        </div>
                      )}

                      {item.consentIdHex && (
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                          ID: <span className="text-slate-400">{item.consentIdHex}</span>
                        </div>
                      )}

                      {item.metadata?.reason && (
                        <div className="text-[11px] text-red-400 mt-0.5">
                          Reason: {item.metadata.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left md:text-right flex-shrink-0">
                    {item.transactionHash || item.blockchainTxHash ? (
                      <a
                        href={getExplorerTxUrl(
                          item.transactionHash || item.blockchainTxHash
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:underline"
                      >
                        Tx:{" "}
                        {(
                          item.transactionHash || item.blockchainTxHash
                        ).substring(0, 14)}
                        …
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600 uppercase tracking-wide">
                        {item.status || "Recorded"}
                      </span>
                    )}
                    <div className="text-[10px] text-slate-600 mt-1">
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
