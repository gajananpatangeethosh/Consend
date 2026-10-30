"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  CONSENT_REGISTRY_ADDRESS,
  ACTIVE_NETWORK,
  MST_NETWORKS,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";
import { useWallet } from "@/components/wallet/WalletContext";

interface BlockchainTraceCardProps {
  contractAddress?: string | null;
  transactionHash?: string | null;
  actorAddress?: string | null;
  consentIdHex?: string | null;
  action?: string | null;
  status?: string | null;
  networkKey?: string;
  compact?: boolean;
  className?: string;
}

export function BlockchainTraceCard({
  contractAddress = CONSENT_REGISTRY_ADDRESS,
  transactionHash,
  actorAddress,
  consentIdHex,
  action,
  status = "confirmed",
  networkKey,
  compact = false,
  className = "",
}: BlockchainTraceCardProps) {
  const { selectedNetworkKey } = useWallet();
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  const activeKey = networkKey || selectedNetworkKey || "coral";
  const currentNet = MST_NETWORKS[activeKey] || ACTIVE_NETWORK;
  const isNetMainnet = Boolean(currentNet.isMainnet);

  const finalContract = contractAddress || CONSENT_REGISTRY_ADDRESS;
  const contractExplorerUrl = getExplorerAddressUrl(finalContract, activeKey);
  const txExplorerUrl = transactionHash ? getExplorerTxUrl(transactionHash, activeKey) : null;

  const handleCopyContract = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(finalContract);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleCopyTx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  const isConfirmed = status === "confirmed" || status === "submitted" || status === "SUCCESS" || !status;
  const isPending = status === "pending";

  if (compact) {
    return (
      <div
        className={`mt-2.5 rounded-xl border ${isNetMainnet ? "border-emerald-500/20 bg-emerald-950/20" : "border-cyan-500/20 bg-cyan-950/20"
          } p-2.5 text-xs ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <div
            className={`flex items-center gap-1.5 text-[10px] font-semibold ${isNetMainnet ? "text-emerald-400" : "text-cyan-400"
              }`}
          >
            <Layers className="h-3 w-3" />
            <span>{currentNet.name} Trace</span>
          </div>
          <span
            className={`text-[9px] font-mono rounded px-1.5 py-0.5 border ${isNetMainnet
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/40"
                : "bg-cyan-950/80 text-cyan-300 border-cyan-800/40"
              }`}
          >
            Chain ID {currentNet.chainId} · {isNetMainnet ? "Mainnet" : "Testnet"}
          </span>
        </div>

        {/* Contract */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono py-0.5">
          <span className="text-slate-500 text-[10px]">Contract:</span>
          <div className="flex items-center gap-1">
            <a
              href={contractExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className={`${isNetMainnet ? "text-emerald-300 hover:text-emerald-200" : "text-cyan-300 hover:text-cyan-200"
                } hover:underline flex items-center gap-0.5`}
              title={finalContract}
            >
              {finalContract.substring(0, 8)}…{finalContract.substring(finalContract.length - 6)}
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </a>
            <button
              onClick={handleCopyContract}
              className="text-slate-500 hover:text-slate-300 p-0.5"
              title="Copy Contract Address"
            >
              {copiedContract ? (
                <Check className="h-2.5 w-2.5 text-emerald-400" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
          </div>
        </div>

        {/* Activity Trace */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono py-0.5 border-t border-white/[0.04] mt-1 pt-1">
          <span className="text-slate-500 text-[10px]">Activity Trace:</span>
          {transactionHash ? (
            <div className="flex items-center gap-1">
              <a
                href={txExplorerUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-0.5"
                title={transactionHash}
              >
                {transactionHash.substring(0, 10)}…{transactionHash.substring(transactionHash.length - 6)}
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>
              <button
                onClick={handleCopyTx}
                className="text-slate-500 hover:text-slate-300 p-0.5"
                title="Copy Activity Tx Hash"
              >
                {copiedTx ? (
                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                ) : (
                  <Copy className="h-2.5 w-2.5" />
                )}
              </button>
            </div>
          ) : (
            <a
              href={`${contractExplorerUrl}#transactions`}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400/90 hover:underline flex items-center gap-0.5 text-[10px]"
            >
              <span>On-Chain Ledger</span>
              <ExternalLink className="h-2 w-2" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-3 rounded-2xl border ${isNetMainnet ? "border-emerald-500/25" : "border-cyan-500/20"
        } bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-black p-3.5 sm:p-4 text-xs shadow-lg shadow-black/40 ${className}`}
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/[0.06] flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isNetMainnet ? "bg-emerald-400" : "bg-cyan-400"
                }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${isNetMainnet ? "bg-emerald-500" : "bg-cyan-500"
                }`}
            />
          </div>
          <span className="font-semibold text-white text-[11px] tracking-wide uppercase">
            {currentNet.name} On-Chain Trace
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${isNetMainnet
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
              }`}
          >
            {isNetMainnet ? "Mainnet" : "Testnet"}
          </span>
          {action && (
            <span className="rounded bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
              {action}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">
            Chain ID:{" "}
            <span className={isNetMainnet ? "text-emerald-300" : "text-cyan-300"}>
              {currentNet.chainId}
            </span>
          </span>
          <a
            href={contractExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-medium transition ${isNetMainnet
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20"
                : "bg-cyan-500/10 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20"
              }`}
          >
            Explorer <ArrowUpRight className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Grid: Contract Address & Activity Trace Address */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
        {/* Contract Address */}
        <div className="rounded-xl border border-white/[0.05] bg-black/30 p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300 uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3 text-cyan-400" />
              Contract Address
            </span>
            <button
              onClick={handleCopyContract}
              className="text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1 transition"
              title="Copy Contract Address"
            >
              {copiedContract ? (
                <span className="text-emerald-400 flex items-center gap-0.5 text-[9px]">
                  <Check className="h-2.5 w-2.5" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px]">
                  <Copy className="h-2.5 w-2.5" /> Copy
                </span>
              )}
            </button>
          </div>

          <a
            href={contractExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className="group font-mono text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center justify-between gap-1 break-all transition mt-0.5"
            title={`View Contract on MST Coral Explorer:\n${finalContract}`}
          >
            <span className="break-all">{finalContract}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </a>
        </div>

        {/* Activity Trace (Tx Hash) */}
        <div className="rounded-xl border border-white/[0.05] bg-black/30 p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300 uppercase tracking-wider">
              <Activity className="h-3 w-3 text-emerald-400" />
              Activity Trace Address (Tx Hash)
            </span>
            {transactionHash && (
              <button
                onClick={handleCopyTx}
                className="text-slate-400 hover:text-emerald-300 inline-flex items-center gap-1 transition"
                title="Copy Transaction Hash"
              >
                {copiedTx ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 text-[9px]">
                    <Check className="h-2.5 w-2.5" /> Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[9px]">
                    <Copy className="h-2.5 w-2.5" /> Copy
                  </span>
                )}
              </button>
            )}
          </div>

          {transactionHash ? (
            <a
              href={txExplorerUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="group font-mono text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center justify-between gap-1 break-all transition mt-0.5"
              title={`View Activity Trace on MST Coral Explorer:\n${transactionHash}`}
            >
              <span className="break-all">{transactionHash}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
            </a>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-0.5">
              <span>{isPending ? "Submitting on-chain…" : "Recorded on MST Ledger"}</span>
              <a
                href={`${contractExplorerUrl}#transactions`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px]"
              >
                Trace on Contract <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Extra metadata if present (Actor Wallet / Consent Hex) */}
      {(actorAddress || consentIdHex) && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
          {actorAddress && (
            <div className="flex items-center gap-1 truncate max-w-sm">
              <span className="text-slate-500">Signer / Actor:</span>
              <a
                href={getExplorerAddressUrl(actorAddress)}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-cyan-300 hover:underline truncate"
              >
                {actorAddress}
              </a>
            </div>
          )}
          {consentIdHex && (
            <div className="flex items-center gap-1 truncate max-w-xs ml-auto">
              <span className="text-slate-500">Consent ID:</span>
              <span className="text-slate-400 truncate">{consentIdHex}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

