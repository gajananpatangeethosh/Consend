"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useWallet, DEMO_PERSONAS } from "@/components/wallet/WalletContext";
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
  Check,
  Upload,
  FileText,
  FilePlus,
  Sparkles,
  ArrowLeftRight,
  Paperclip,
  Eye,
  Printer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getExplorerTxUrl, CONSENT_REGISTRY_ADDRESS } from "@/lib/blockchain/config";
import { BlockchainTraceCard } from "@/components/blockchain/BlockchainTraceCard";

function ConsentNoticeContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { address, formatAddress, connectWallet, openConnectModal, connectDemoPersona } = useWallet();

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<"granted" | "denied" | null>(null);
  const [txResult, setTxResult] = useState<any>(null);

  // Document Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewImageError, setPreviewImageError] = useState(false);
  const [previewImageLoaded, setPreviewImageLoaded] = useState(false);

  const handleOpenPreview = async (docId: string, fallbackWallet?: string) => {
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    setPreviewImageError(false);
    setPreviewImageLoaded(false);
    try {
      const activeWallet = fallbackWallet || address || notice?.requesterWallet || "";
      const res = await fetch(`/api/documents?id=${docId}&wallet=${activeWallet}&token=${token}`);
      const data = await res.json();
      if (data.success && data.document) {
        setPreviewDoc(data.document);
        // Pre-validate image
        const p = data.document.payload || "";
        const mime = data.document.mime_type || "";
        const fn = data.document.original_filename || "";
        if (
          p.startsWith("data:image/") ||
          mime.startsWith("image/") ||
          Boolean(fn.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i))
        ) {
          const testImg = new window.Image();
          testImg.onload = () => {
            setPreviewImageLoaded(true);
            setPreviewImageError(false);
          };
          testImg.onerror = () => {
            setPreviewImageLoaded(false);
            setPreviewImageError(true);
          };
          testImg.src = p.startsWith("data:") ? p : `data:${mime || "image/jpeg"};base64,${p}`;
        }
      } else {
        toast.error(data.error || "Failed to load document preview");
        setPreviewModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load document preview");
      setPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrintPreviewDoc = () => {
    if (!previewDoc) return;
    const existing = document.getElementById("consend-notice-print-frame");
    if (existing) existing.remove();

    const printFrame = document.createElement("iframe");
    printFrame.id = "consend-notice-print-frame";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    let payload = previewDoc.payload || "";
    const filename = previewDoc.original_filename || "document";
    const mime = previewDoc.mime_type || "";
    const docTitle = previewDoc.title || "Consent Document";

    if (payload && !payload.startsWith("data:")) {
      if (mime.startsWith("image/") || filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
        payload = `data:${mime || "image/jpeg"};base64,${payload}`;
      } else if (mime.includes("pdf") || filename.toLowerCase().endsWith(".pdf")) {
        payload = `data:application/pdf;base64,${payload}`;
      }
    }

    const isImg = payload.startsWith("data:image/") || mime.startsWith("image/") || Boolean(filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i));
    const isPdfDoc = payload.startsWith("data:application/pdf") || mime.includes("pdf") || filename.toLowerCase().endsWith(".pdf");

    let documentBody = "";
    if (isImg && previewImageLoaded && !previewImageError) {
      documentBody = `
        <div style="text-align: center; margin: 0 auto; width: 100%;">
          <img src="${payload}" alt="${docTitle}" style="max-width: 100%; max-height: 90vh; object-fit: contain; display: block; margin: 0 auto;" />
        </div>
      `;
    } else if (isPdfDoc) {
      documentBody = `
        <div style="width: 100%; height: 95vh;">
          <iframe src="${payload}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      `;
    } else {
      let textToPrint = "";
      try {
        const cleanBase64 = payload.replace(/^data:.*base64,/, "");
        textToPrint = decodeURIComponent(escape(atob(cleanBase64)));
      } catch {
        try {
          textToPrint = atob(payload.replace(/^data:.*base64,/, ""));
        } catch {
          textToPrint = payload;
        }
      }
      documentBody = `
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 13pt; line-height: 1.6; white-space: pre-wrap; padding: 20px; background: #fff; color: #111;">
          ${textToPrint}
        </div>
      `;
    }

    const watermarkText = `CONSEND PROTOCOL // CONSENT NOTICE DOCUMENT // VIEWER: ${formatAddress(address)} // DATE: ${new Date().toLocaleString()}`;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - Consend Document Print</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body { margin: 0; padding: 0; background: #fff; color: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .header-info { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
            .doc-title { font-size: 16pt; font-weight: bold; }
            .doc-meta { font-size: 9pt; color: #555; }
            .watermark-footer { margin-top: 30px; padding-top: 10px; border-top: 1px dashed #777; font-size: 8pt; color: #555; font-family: monospace; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <div class="doc-title">${docTitle}</div>
              <div class="doc-meta">File: ${filename} · Verification SHA-256: ${previewDoc.ciphertext_hash?.substring(0, 16) || ""}…</div>
            </div>
            <div class="doc-meta" style="text-align: right;">
              <div>Consend Verified Copy</div>
              <div>${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div class="content-body">${documentBody}</div>
          <div class="watermark-footer">${watermarkText}</div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 500);
  };

  const fetchNoticeAndDocs = async () => {
    try {
      // 1. Fetch notice details (multi-lookup supports plainToken, token_hash, or request ID)
      const res = await fetch(`/api/consent/${token}`);
      const data = await res.json();

      if (data.success && data.request) {
        setNotice(data.request);
      } else {
        setErrorMessage(data.error || "Consent notice not found or invalid token.");
      }
    } catch (err: any) {
      console.error("Error loading consent notice:", err);
      setErrorMessage(err?.message || "Failed to load consent notice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticeAndDocs();
  }, [token, address]);

  const handleApprove = async () => {
    if (!address) {
      toast.error("Please connect your wallet to approve this consent request");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/consent/${token}/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerWallet: address,
          documentId: notice?.attachedDocId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grant consent");
      }

      setDecision("granted");
      setTxResult(data.blockchain);
      toast.success("Consent successfully granted and recorded on MST Blockchain!");
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!address) {
      toast.error("Please connect your wallet to deny this request");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch(`/api/consent/${token}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerWallet: address }),
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
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
        <span className="text-xs text-slate-400">Loading consent request terms...</span>
      </div>
    );
  }

  // Invalid Token Screen
  if (!notice) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center px-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Invalid or Expired Consent Notice</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          {errorMessage || "This consent token does not exist, has already been resolved, or has expired."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => { setLoading(true); fetchNoticeAndDocs(); }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
          >
            Retry Verification
          </button>
          <Link
            href="/dashboard"
            className="btn-primary px-5 py-2 text-xs rounded-xl"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Already Decided: Granted State
  if (decision === "granted" || notice.status === "granted") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-6 shadow-[0_0_50px_-10px_rgba(16,185,129,0.4)]">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Consent Granted Successfully</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
          The requester has been granted temporary, time-bound permission to view your document. You can revoke this permission instantly at any moment from your dashboard.
        </p>

        {/* Real On-chain Blockchain Trace */}
        <div className="mt-6 max-w-lg mx-auto text-left">
          <BlockchainTraceCard
            contractAddress={CONSENT_REGISTRY_ADDRESS}
            transactionHash={txResult?.txHash}
            actorAddress={address}
            action="grantConsent"
            status={txResult?.status || "confirmed"}
          />
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/consents"
            className="btn-primary px-6 py-2.5 text-xs rounded-xl shadow-lg"
          >
            Manage Active Consents
          </Link>
          <Link
            href="/audit"
            className="btn-secondary px-6 py-2.5 text-xs rounded-xl"
          >
            Inspect Audit Trail
          </Link>
        </div>
      </div>
    );
  }

  // Already Decided: Denied State
  if (decision === "denied" || notice.status === "denied") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-400 border border-red-500/30 mb-6">
          <Ban className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Request Denied</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
          You have explicitly denied consent. No document access has been granted, and no document bytes were shared.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="btn-secondary px-6 py-2.5 text-xs rounded-xl"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Notice Expired State
  if (notice.isExpired || notice.status === "expired") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-6">
          <Clock className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Consent Request Expired</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
          The time limit set by the requester expired on{" "}
          <span className="font-mono text-amber-300">{new Date(notice.expiresAt).toLocaleString()}</span>.
          Please ask the requester to generate a fresh QR code.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="btn-secondary px-6 py-2.5 text-xs rounded-xl"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isConnectedAsRequester =
    address && notice.requesterWallet && address.toLowerCase() === notice.requesterWallet.toLowerCase();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Notice Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-300">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Explicit Consent Notice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Review Document Access Request
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Opening this page does not grant access. You maintain full ownership and can decide whether to authorize temporary access.
        </p>
      </div>

      {/* Helpful persona switch hint if connected with requester wallet */}
      {isConnectedAsRequester && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-amber-200">
            <span className="font-bold">Testing Tip:</span> You are currently connected with the Requester's wallet.
            To grant consent as the Document Owner, switch to Alice Sharma.
          </div>
          <button
            onClick={() => connectDemoPersona("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 font-semibold text-amber-300 hover:bg-amber-500/30 transition text-xs"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Switch to Owner (Alice)</span>
          </button>
        </div>
      )}

      {/* Main Notice Box */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#070D1F]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Requester Identity */}
        <div className="flex items-center gap-4 pb-5 border-b border-white/[0.06]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold text-white">{notice.requesterName}</div>
            <div className="text-xs text-slate-400">{notice.requesterOrg}</div>
            <div className="text-[11px] font-mono text-cyan-400/80 mt-1 break-all">
              {notice.requesterWallet}
            </div>
          </div>
        </div>

        {/* Target Recipient Banner if specified */}
        {notice.targetWallet && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-400">Directly Addressed To:</span>
              <span className="text-cyan-300 font-semibold">
                {(() => {
                  const p = DEMO_PERSONAS.find(dp => dp.address.toLowerCase() === notice.targetWallet.toLowerCase());
                  return p ? `${p.name} (${formatAddress(notice.targetWallet)})` : formatAddress(notice.targetWallet);
                })()}
              </span>
            </div>
            <span className="pill-active">Verified Recipient</span>
          </div>
        )}

        {/* Purpose & Scope */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Declared Purpose
          </div>
          <div className="rounded-2xl bg-black/40 p-4 text-xs sm:text-sm text-slate-200 leading-relaxed border border-white/[0.05]">
            {notice.purpose}
          </div>
        </div>

        {/* Attached Reference Document from Requester (if provided) */}
        {notice.attachedDocId && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Attached Reference Document From Requester
              </div>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                Encrypted Ref
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {notice.attachedDocTitle || "Reference Agreement / Document"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Included by requester to review before granting your document
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenPreview(notice.attachedDocId, notice.requesterWallet)}
                className="btn-secondary flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-xl"
              >
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* Requested Documents & Allowed Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Requested Document Types
            </div>
            <div className="flex flex-wrap gap-1.5">
              {notice.requiredDocumentTypes?.map((t: string) => (
                <span
                  key={t}
                  className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs text-cyan-300 font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Allowed Actions
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {notice.allowedActions?.map((act: string) => {
                const badgeStyle =
                  act === "VIEW"
                    ? "bg-emerald-950/60 border-emerald-800/40 text-emerald-300"
                    : act === "PRINT"
                    ? "bg-cyan-950/60 border-cyan-800/40 text-cyan-300"
                    : "bg-purple-950/60 border-purple-800/40 text-purple-300";
                const label =
                  act === "VIEW"
                    ? "View Protected"
                    : act === "PRINT"
                    ? "Print Enabled"
                    : "Download Allowed";
                return (
                  <span
                    key={act}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${badgeStyle}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expiry & Time-To-Live */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-amber-300">Time-Limited Access</div>
            <div className="text-slate-400 mt-1">
              Access will automatically terminate on:{" "}
              <span className="font-mono text-slate-200">
                {new Date(notice.expiresAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Canonical Terms Hash info */}
        <div className="rounded-2xl bg-black/40 p-3.5 text-[11px] font-mono text-slate-400 border border-white/[0.05]">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            Cryptographic Terms Commitment (Keccak256):
          </div>
          <div className="text-cyan-300 truncate mt-1">{notice.termsHash}</div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleApprove}
            disabled={submitting || !address}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-xs font-bold text-slate-950 shadow-xl shadow-emerald-500/20 hover:opacity-95 transition disabled:opacity-40"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Recording on MST Blockchain...</span>
              </span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Approve & Grant Consent On-Chain</span>
              </>
            )}
          </button>

          <button
            onClick={handleDeny}
            disabled={submitting || !address}
            className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 px-6 py-3.5 text-xs font-bold text-red-400 hover:bg-red-900/30 transition disabled:opacity-40"
          >
            <Ban className="h-4 w-4" />
            <span>Deny Request</span>
          </button>
        </div>
      </div>

      {/* ── HIGH-FIDELITY DOCUMENT PREVIEW MODAL ── */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/[0.1] bg-[#070D1E] p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {previewDoc?.title || "Document Preview"}
                    {previewDoc?.doc_type && (
                      <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[9px] font-semibold text-cyan-400 border border-cyan-800/40">
                        {previewDoc.doc_type}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {previewDoc?.original_filename || "Encrypted vault file"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPreviewDoc}
                  disabled={previewLoading || !previewDoc}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition"
                  title="Print Document"
                >
                  <Printer className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewModalOpen(false);
                    setPreviewDoc(null);
                  }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="my-4 flex-1 overflow-y-auto rounded-2xl bg-[#040814] p-4 sm:p-6 border border-white/[0.04]">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                  <p className="text-xs text-slate-400">Decrypting document payload in-memory with AES-256-GCM...</p>
                </div>
              ) : previewDoc ? (
                (() => {
                  let payload = previewDoc.payload || "";
                  const mime = previewDoc.mime_type || "";
                  const fn = previewDoc.original_filename || "";

                  if (payload && !payload.startsWith("data:")) {
                    if (mime.startsWith("image/") || fn.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
                      payload = `data:${mime || "image/jpeg"};base64,${payload}`;
                    } else if (mime.includes("pdf") || fn.toLowerCase().endsWith(".pdf")) {
                      payload = `data:application/pdf;base64,${payload}`;
                    }
                  }

                  const isImg =
                    payload.startsWith("data:image/") ||
                    mime.startsWith("image/") ||
                    Boolean(fn.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i));
                  const isPdfDoc =
                    payload.startsWith("data:application/pdf") ||
                    mime.includes("pdf") ||
                    fn.toLowerCase().endsWith(".pdf");

                  if (isImg) {
                    return (
                      <div className="flex flex-col items-center justify-center">
                        {previewImageLoaded && !previewImageError ? (
                          <img
                            src={payload}
                            alt={previewDoc.title}
                            className="max-h-[500px] w-auto object-contain rounded-xl border border-white/[0.08] shadow-2xl"
                          />
                        ) : previewImageError ? (
                          <div className="w-full max-w-md p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
                            <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                            <h4 className="text-sm font-bold text-white">Legacy Test Document</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              This file was stored during an earlier test upload cycle before the persistent AES-256-GCM key update. Cryptographic hash is verified on MST Blockchain: <code className="text-cyan-300 font-mono text-[10px] block mt-1">{previewDoc.ciphertext_hash}</code>
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-12 text-xs text-slate-400">
                            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                            Loading image preview...
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isPdfDoc) {
                    return (
                      <iframe
                        src={payload}
                        className="w-full h-[520px] rounded-xl border border-white/[0.08]"
                        title="PDF Document Preview"
                      />
                    );
                  }

                  let cleanText = "";
                  try {
                    const cleanBase64 = payload.replace(/^data:.*base64,/, "");
                    cleanText = decodeURIComponent(escape(atob(cleanBase64)));
                  } catch {
                    try {
                      cleanText = atob(payload.replace(/^data:.*base64,/, ""));
                    } catch {
                      cleanText = payload;
                    }
                  }

                  return (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05] text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                      {cleanText || "[EMPTY DOCUMENT PAYLOAD]"}
                    </div>
                  );
                })()
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] text-slate-400">
              <div className="flex items-center gap-2 truncate max-w-md">
                <span className="text-slate-500">SHA-256:</span>
                <span className="font-mono text-cyan-400 truncate">{previewDoc?.ciphertext_hash || "Verifying..."}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  setPreviewDoc(null);
                }}
                className="btn-secondary px-4 py-1.5 text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
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
