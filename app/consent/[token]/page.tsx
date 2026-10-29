"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  KeyRound,
  ExternalLink,
  Ban,
  Lock,
  ArrowRight,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { getExplorerTxUrl } from "@/lib/blockchain/config";

function ConsentNoticeContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { address, formatAddress, connectWallet } = useWallet();

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<any>(null);
  const [ownerDocuments, setOwnerDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<"granted" | "denied" | null>(null);
  const [txResult, setTxResult] = useState<any>(null);

  useEffect(() => {
    const fetchNoticeAndDocs = async () => {
      try {
        // 1. Fetch notice details
        const res = await fetch(`/api/consent/${token}`);
        const data = await res.json();

        if (data.success) {
          setNotice(data.request);

          // 2. Fetch owner's documents from vault
          const ownerAddr = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
          const docRes = await fetch(`/api/documents?wallet=${ownerAddr}`);
          const docData = await docRes.json();

          if (docData.success && docData.documents.length > 0) {
            setOwnerDocuments(docData.documents);
            setSelectedDocId(docData.documents[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading consent notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticeAndDocs();
  }, [token, address]);

  const handleApprove = async () => {
    if (!selectedDocId) {
      toast.error("Please select a document from your vault to grant access");
      return;
    }

    const ownerWallet = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    setSubmitting(true);

    try {
      const res = await fetch(`/api/consent/${token}/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerWallet,
          documentId: selectedDocId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grant consent");
      }

      setDecision("granted");
      setTxResult(data.blockchain);
      toast.success("Consent successfully granted and registered on MST Blockchain!");
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    const ownerWallet = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    setSubmitting(true);

    try {
      const res = await fetch(`/api/consent/${token}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerWallet }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to deny request");
      }

      setDecision("denied");
      toast.info("Consent request has been explicitly denied.");
    } catch (err: any) {
      toast.error(err.message || "Failed to deny request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Invalid or Expired Consent Notice</h2>
        <p className="text-xs text-slate-400 mt-1">This consent token does not exist or has expired.</p>
      </div>
    );
  }

  // Already Decided States
  if (decision === "granted") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-6">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Consent Granted Successfully!</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          The requester has been granted temporary, time-bound permission to view your document. You can revoke this permission at any time from your dashboard.
        </p>

        {txResult?.txHash && (
          <div className="mt-6 rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-xs font-mono text-left">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">MST Blockchain Tx</div>
            <a
              href={getExplorerTxUrl(txResult.txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1.5 mt-1 break-all"
            >
              <span>{txResult.txHash}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/consents"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-xs font-semibold text-slate-950 shadow-lg hover:opacity-95"
          >
            Manage Active Consents
          </Link>
          <Link
            href="/audit"
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Inspect Audit Trail
          </Link>
        </div>
      </div>
    );
  }

  if (decision === "denied" || notice.status === "denied") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 mb-6">
          <Ban className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Request Denied</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          You have explicitly denied consent. No document access has been granted, and no document bytes were shared.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Notice Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300 mb-3">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Explicit Consent Notice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Review Document Access Request
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Opening this page does not grant access. You must explicitly review the purpose and approve the request below.
        </p>
      </div>

      {/* Main Notice Box */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 space-y-6 shadow-2xl">
        {/* Requester Identity */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{notice.requesterName}</div>
            <div className="text-xs text-slate-400">{notice.requesterOrg}</div>
            <div className="text-[11px] font-mono text-cyan-300 mt-0.5 break-all">
              {notice.requesterWallet}
            </div>
          </div>
        </div>

        {/* Purpose & Scope */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Declared Purpose
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3.5 text-xs text-slate-200 leading-relaxed border border-slate-800">
            {notice.purpose}
          </div>
        </div>

        {/* Requested Documents & Allowed Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Requested Document Types
            </div>
            <div className="flex flex-wrap gap-1.5">
              {notice.requiredDocumentTypes?.map((t: string) => (
                <span
                  key={t}
                  className="rounded-lg bg-cyan-950/80 border border-cyan-800/40 px-2.5 py-1 text-xs text-cyan-300 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Allowed Actions
            </div>
            <div className="text-xs font-semibold text-emerald-400">
              {notice.allowedActions?.join(", ")}
            </div>
          </div>
        </div>

        {/* Expiry & Time-To-Live */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-3">
          <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-semibold text-amber-300">Time-Limited Access</div>
            <div className="text-slate-400 mt-0.5">
              Access will automatically terminate on:{" "}
              <span className="font-mono text-slate-200">
                {new Date(notice.expiresAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Document Selection from Owner Vault */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Select Matching Document from Your Vault
          </label>
          {ownerDocuments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
              No documents in your vault yet.{" "}
              <Link href="/documents" className="text-cyan-400 hover:underline">
                Upload a mock document first
              </Link>
            </div>
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {ownerDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.doc_type})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Canonical Terms Hash info */}
        <div className="rounded-xl bg-slate-950/80 p-3 text-[11px] font-mono text-slate-400 border border-slate-800">
          <div className="text-slate-500">Cryptographic Terms Commitment:</div>
          <div className="text-cyan-300 truncate mt-0.5">{notice.termsHash}</div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleApprove}
            disabled={submitting || ownerDocuments.length === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-xs font-bold text-slate-950 shadow-xl shadow-emerald-500/20 hover:opacity-95 transition disabled:opacity-50"
          >
            {submitting ? (
              <span>Recording on MST Blockchain...</span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Approve & Grant On-Chain</span>
              </>
            )}
          </button>

          <button
            onClick={handleDeny}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 px-6 py-3 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition disabled:opacity-50"
          >
            <Ban className="h-4 w-4" />
            <span>Deny</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConsentNoticePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      }
    >
      <ConsentNoticeContent params={params} />
    </React.Suspense>
  );
}
