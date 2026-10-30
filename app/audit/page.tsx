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
  Copy,
  Check,
  Search,
} from "lucide-react";
import {
  ACTIVE_NETWORK,
  CONSENT_REGISTRY_ADDRESS,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";
import { BlockchainTraceCard } from "@/components/blockchain/BlockchainTraceCard";

type FilterType = "all" | "blockchain" | "access";

export default function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedMasterContract, setCopiedMasterContract] = useState(false);

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

  const copyContract = () => {
    navigator.clipboard.writeText(CONSENT_REGISTRY_ADDRESS);
    setCopiedMasterContract(true);
    setTimeout(() => setCopiedMasterContract(false), 2000);
  };

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All Activity" },
    { key: "blockchain", label: "MST Transactions" },
    { key: "access", label: "Access Events" },
  ];

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.transactionHash?.toLowerCase().includes(q) ||
      item.blockchainTxHash?.toLowerCase().includes(q) ||
      item.contractAddress?.toLowerCase().includes(q) ||
      item.actorWallet?.toLowerCase().includes(q) ||
      item.consentIdHex?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <History className="h-6 w-6 text-cyan-400" />
            Blockchain Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Immutable, chronological trace of consent events and on-chain MST Coral transactions.
          </p>
        </div>
        <button
          onClick={() => fetchAudit(filter)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Explorer contract banner */}
      <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950/80 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm flex items-center gap-2 flex-wrap">
              <span>Consent Registry Smart Contract</span>
              <span className="text-[10px] font-mono rounded bg-cyan-500/10 text-cyan-300 px-2 py-0.5 border border-cyan-500/30">
                {ACTIVE_NETWORK.name} (ID: {ACTIVE_NETWORK.chainId})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-slate-400 flex-wrap">
              <span className="text-slate-500">Contract Address:</span>
              <span className="text-cyan-300 select-all font-semibold break-all">
                {CONSENT_REGISTRY_ADDRESS}
              </span>
              <button
                onClick={copyContract}
                className="text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1 transition"
                title="Copy Master Contract Address"
              >
                {copiedMasterContract ? (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Copied
                  </span>
                ) : (
                  <span className="text-[10px] flex items-center gap-0.5">
                    <Copy className="h-3 w-3" /> Copy
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <a
          href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
          target="_blank"
          rel="noreferrer"
          className="self-start md:self-center inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition shadow-sm"
        >
          <span>View on MST Explorer</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Filter tabs and search */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                filter === tab.key
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/[0.06]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Tx hash, contract, wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500/40 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-shimmer glass-card" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.07] bg-white/[0.01] p-16 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-700 mb-4" />
            <p className="text-sm text-slate-500">No audit records matching this filter or query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isBlockchain = item.category === "BLOCKCHAIN";
              const isDenied = item.type === "ACCESS_DENIED";
              const isAllowed = item.type === "ACCESS_ALLOWED";
              const txHash = item.transactionHash || item.blockchainTxHash;
              const contractAddr = item.contractAddress || CONSENT_REGISTRY_ADDRESS;

              return (
                <div
                  key={item.id}
                  className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col gap-3"
                >
                  {/* Top Bar of the Event */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                                : "bg-white/[0.05] text-slate-400 border border-white/[0.06]"
                            }`}
                          >
                            {item.category}
                          </span>
                          <span
                            className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                              item.status === "confirmed" || item.status === "SUCCESS"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/30"
                                : item.status === "failed"
                                ? "bg-red-950/60 text-red-400 border border-red-800/30"
                                : "bg-amber-950/60 text-amber-300 border border-amber-800/30"
                            }`}
                          >
                            {item.status || "Recorded"}
                          </span>
                        </div>

                        {item.metadata?.reason && (
                          <div className="text-[11px] text-red-400 mt-1">
                            Reason: {item.metadata.reason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-[10px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* Below each event: Contract Address and Activity Trace Address */}
                  <BlockchainTraceCard
                    contractAddress={contractAddr}
                    transactionHash={txHash}
                    actorAddress={item.actorWallet}
                    consentIdHex={item.consentIdHex}
                    action={item.action || item.type}
                    status={item.status}
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
