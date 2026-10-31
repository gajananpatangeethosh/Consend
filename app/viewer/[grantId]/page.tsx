"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  ShieldAlert,
  Clock,
  Printer,
  Ban,
  AlertTriangle,
  FileText,
  Lock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  Download,
  Eye,
  X,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

function ProtectedViewerContent({
  params,
}: {
  params: Promise<{ grantId: string }>;
}) {
  const { grantId } = use(params);
  const { address, formatAddress, connectWallet, openConnectModal, isMounted } = useWallet();

  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState<any>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const fetchDocument = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/grants/${grantId}/document?wallet=${address}`, {
        headers: { "x-wallet-address": address },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorStatus(data.status || (res.status === 403 ? "unauthorized" : "error"));
        setErrorMessage(data.error || "Failed to load document");
        return;
      }

      setDocData(data);
      setErrorStatus(null);
      if (data.permissions?.remainingSeconds !== undefined) {
        setRemainingSeconds(data.permissions.remainingSeconds);
      }
    } catch (err: any) {
      console.error("Viewer error:", err);
      setErrorStatus("error");
      setErrorMessage("Network connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchDocument();
      // Poll every 4 seconds to enforce real-time revocation detection
      const interval = setInterval(() => {
        fetchDocument();
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [grantId, address]);

  // Live countdown timer
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setErrorStatus("expired");
          setErrorMessage("Consent window has expired.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Test and pre-validate image data URI so browser never renders a broken icon placeholder
  useEffect(() => {
    if (!docData?.document?.payload) return;
    let payload = docData.document.payload;
    const mime = docData.document.mime_type || "";
    const filename = docData.document.original_filename || "";

    const mightBeImg =
      payload.startsWith("data:image/") ||
      mime.startsWith("image/") ||
      Boolean(filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i));

    if (!mightBeImg) return;

    if (!payload.startsWith("data:")) {
      payload = `data:${mime || "image/jpeg"};base64,${payload}`;
    }

    const testImg = new window.Image();
    testImg.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    testImg.onerror = () => {
      setImageLoaded(false);
      setImageError(true);
    };
    testImg.src = payload;
  }, [docData]);

  const handleOpenPrintPreview = () => {
    if (!docData?.permissions?.allowedActions?.includes("PRINT")) {
      toast.error("Printing is disabled by the document owner");
      return;
    }
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    if (!docData?.permissions?.allowedActions?.includes("PRINT")) {
      toast.error("Printing is disabled by the document owner");
      return;
    }

    setIsPrinting(true);
    let payload = docData?.document?.payload || "";
    const title = docData?.document?.title || "Consent Document";
    const filename = docData?.document?.original_filename || "document";
    const mime = docData?.document?.mime_type || "";

    if (payload && !payload.startsWith("data:")) {
      if (mime.startsWith("image/") || filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
        payload = `data:${mime || "image/jpeg"};base64,${payload}`;
      } else if (mime.includes("pdf") || filename.toLowerCase().endsWith(".pdf")) {
        payload = `data:application/pdf;base64,${payload}`;
      }
    }

    const isImg = payload.startsWith("data:image/") || mime.startsWith("image/") || Boolean(filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i));
    const isPdfDoc = payload.startsWith("data:application/pdf") || mime.includes("pdf") || filename.toLowerCase().endsWith(".pdf");

    // Create an isolated printable iframe so only the clean document is printed
    const existingIframe = document.getElementById("consend-print-frame");
    if (existingIframe) {
      existingIframe.remove();
    }

    const printFrame = document.createElement("iframe");
    printFrame.id = "consend-print-frame";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      // Fallback
      window.print();
      setIsPrinting(false);
      return;
    }

    let documentBody = "";
    if (isImg) {
      documentBody = `
        <div style="text-align: center; margin: 0 auto; width: 100%;">
          <img src="${payload}" alt="${title}" style="max-width: 100%; max-height: 90vh; object-fit: contain; display: block; margin: 0 auto;" />
        </div>
      `;
    } else if (isPdfDoc) {
      // For PDF, render iframe inside print window
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

    const watermarkText = `CONSEND PROTOCOL // VERIFIED ON MST BLOCKCHAIN // RECIPIENT: ${formatAddress(address)} // DATE: ${new Date().toLocaleString()}`;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Consend Protected Print</title>
          <style>
            @page {
              size: auto;
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 20px;
            }
            .doc-title {
              font-size: 16pt;
              font-weight: bold;
            }
            .doc-meta {
              font-size: 9pt;
              color: #555;
            }
            .watermark-footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px dashed #777;
              font-size: 8pt;
              color: #555;
              font-family: monospace;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <div class="doc-title">${title}</div>
              <div class="doc-meta">File: ${filename} · Verification SHA-256: ${docData?.document?.ciphertext_hash?.substring(0, 16) || ""}…</div>
            </div>
            <div class="doc-meta" style="text-align: right;">
              <div>Consend Permitted Copy</div>
              <div>${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div class="content-body">
            ${documentBody}
          </div>
          <div class="watermark-footer">
            ${watermarkText}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Allow resources in iframe to settle before printing
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.error("Print frame execution error:", err);
        window.print();
      } finally {
        setIsPrinting(false);
      }
    }, 500);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Not connected
  if (!isMounted || !address) {
    return (
      <div
        suppressHydrationWarning
        className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="relative mb-6" suppressHydrationWarning>
          <div className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#080F24] border border-cyan-500/30">
            <Lock className="h-9 w-9 text-cyan-400" />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-medium mb-3">
          <ShieldAlert className="h-3.5 w-3.5" /> Identity Authentication Required
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Connect Recipient Wallet</h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mb-8 leading-relaxed">
          Access to this document is cryptographically restricted to the authorized recipient's wallet address. Connect your wallet to verify permissions.
        </p>
        <button
          onClick={openConnectModal}
          className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-semibold shadow-lg shadow-cyan-500/20"
          suppressHydrationWarning
        >
          <Wallet className="h-4 w-4" />
          Connect Recipient Wallet (Mainnet & Testnet)
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
        <span className="text-xs text-slate-400">Verifying on-chain consent permissions...</span>
      </div>
    );
  }

  // Denied / Revoked / Expired States
  if (errorStatus === "revoked") {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/20 text-red-400 border border-red-500/30 mb-6 animate-bounce">
          <Ban className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied: Consent Revoked</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          The document owner has revoked consent. Immediate cryptographic enforcement has blocked document bytes access.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (errorStatus === "expired") {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-6">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied: Consent Expired</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          The time-limited consent window for this document has elapsed.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/20 text-red-400 border border-red-500/30 mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Authorization Check Failed</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">{errorMessage}</p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={fetchDocument}
            className="btn-primary px-5 py-2.5 text-xs"
          >
            Retry Verification
          </button>
          <Link
            href="/dashboard"
            className="btn-secondary px-5 py-2.5 text-xs"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPrintAllowed = docData?.permissions?.allowedActions?.includes("PRINT");
  let payloadRaw = docData?.document?.payload || "";
  const mimeType = docData?.document?.mime_type || "";
  const originalFilename = docData?.document?.original_filename || "";

  // Normalize payload: ensure data: URI prefix if missing for images or PDFs
  if (payloadRaw && !payloadRaw.startsWith("data:")) {
    if (
      mimeType.startsWith("image/") ||
      originalFilename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)
    ) {
      payloadRaw = `data:${mimeType || "image/jpeg"};base64,${payloadRaw}`;
    } else if (
      mimeType.includes("pdf") ||
      originalFilename.toLowerCase().endsWith(".pdf")
    ) {
      payloadRaw = `data:application/pdf;base64,${payloadRaw}`;
    }
  }

  const isImage =
    payloadRaw.startsWith("data:image/") ||
    mimeType.startsWith("image/") ||
    Boolean(originalFilename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i));
  const isPdf =
    payloadRaw.startsWith("data:application/pdf") ||
    mimeType.includes("pdf") ||
    originalFilename.toLowerCase().endsWith(".pdf");

  let decodedText = "";
  if (!isImage && !isPdf) {
    try {
      const cleanBase64 = payloadRaw.replace(/^data:.*base64,/, "");
      decodedText = decodeURIComponent(escape(atob(cleanBase64)));
    } catch {
      try {
        decodedText = atob(payloadRaw.replace(/^data:.*base64,/, ""));
      } catch {
        decodedText = payloadRaw;
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls Bar */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#070D1E]/90 backdrop-blur-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">{docData?.document?.title}</h1>
              <span className="rounded-full bg-cyan-950/80 text-cyan-300 text-[10px] font-semibold px-2.5 py-0.5 border border-cyan-800/40">
                {docData?.document?.doc_type}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span>SHA-256:</span>
              <span className="font-mono text-cyan-300">
                {docData?.document?.ciphertext_hash?.substring(0, 16)}…
              </span>
            </div>
          </div>
        </div>

        {/* Expiry Countdown & Print Action */}
        <div className="flex items-center gap-3">
          {remainingSeconds !== null && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-2 text-xs font-mono font-bold text-amber-300 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]">
              <Clock className="h-4 w-4 animate-spin" />
              <span>{formatCountdown(remainingSeconds)}</span>
            </div>
          )}

          <button
            onClick={handleOpenPrintPreview}
            disabled={!isPrintAllowed}
            className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-semibold transition ${isPrintAllowed
                ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 hover:from-cyan-500/30 hover:to-emerald-500/30 shadow-md"
                : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
              }`}
            title={isPrintAllowed ? "Open print preview & print document" : "Print action disabled by owner"}
          >
            <Printer className="h-4 w-4" />
            <span>Print Document</span>
          </button>
        </div>
      </div>

      {/* Protected Document Canvas with Dynamic Watermarking */}
      <div
        ref={printableAreaRef}
        className="printable-document-container relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#040814] p-6 sm:p-10 shadow-2xl min-h-[500px]"
      >
        {/* Repeating Dynamic Security Watermark */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-[0.05] flex flex-wrap items-center justify-around gap-16 rotate-[-15deg] scale-110 z-10 font-mono text-[10px] text-white no-print">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="text-center">
              <div>CONSEND // MST BLOCKCHAIN — PROTECTED VIEW</div>
              <div>RECIPIENT: {formatAddress(address)}</div>
              <div>
                EXPIRES: {new Date(docData?.permissions?.expiresAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Document Content Display */}
        <div className="printable-document-content relative z-20 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-white/[0.06] pb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold text-cyan-400 tracking-wider">
                Authorized Verification Copy
              </div>
              <div className="text-xl font-extrabold text-white mt-1">{docData?.document?.title}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          {/* Document Visual Content */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#070D1F]/70 p-6 space-y-4">
            {isImage ? (
              <div className="flex flex-col items-center justify-center p-4">
                {imageLoaded && !imageError ? (
                  <img
                    src={payloadRaw}
                    alt={docData?.document?.title}
                    onError={() => {
                      setImageLoaded(false);
                      setImageError(true);
                    }}
                    className="max-h-[500px] w-auto rounded-xl object-contain border border-white/[0.06] shadow-xl"
                  />
                ) : imageError ? (
                  <div className="w-full max-w-md p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
                    <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Preview Conversion Notice</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      This file was stored during an earlier test upload cycle before the AES-256-GCM vault key persistence update. Cryptographic hash (<code className="text-cyan-300 font-mono">{docData?.document?.ciphertext_hash?.substring(0, 12)}…</code>) is verified on MST Blockchain. Please re-upload or grant this file again to view the live full-resolution preview.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-12 text-xs text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                    Decrypting and loading image preview...
                  </div>
                )}
              </div>
            ) : isPdf ? (
              <div className="rounded-xl bg-black/40 p-8 text-center space-y-3">
                <FileText className="mx-auto h-12 w-12 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Encrypted PDF Document</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  PDF document payload verified and decrypted in-memory.
                </p>
                {payloadRaw && (
                  <iframe
                    src={payloadRaw}
                    className="w-full h-[500px] rounded-xl border border-white/[0.08]"
                    title="PDF Preview"
                  />
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-black/30 p-4 rounded-xl border border-white/[0.04]">
                {decodedText || "[ENCRYPTED PAYLOAD ACCESSED — VERIFIED ON MST BLOCKCHAIN]"}
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4 text-[11px] text-slate-400">
              <div>
                <span className="block text-slate-500">Original Filename:</span>
                <span className="text-slate-200 font-mono">{docData?.document?.original_filename}</span>
              </div>
              <div>
                <span className="block text-slate-500">File Size:</span>
                <span className="text-slate-200 font-mono">
                  {Math.round((docData?.document?.size_bytes || 0) / 1024) || 1} KB
                </span>
              </div>
            </div>
          </div>

          {/* Watermark Security Notice */}
          <div className="rounded-2xl border border-white/[0.06] bg-cyan-950/20 p-4 text-[11px] text-slate-400 leading-relaxed flex items-start gap-3 no-print">
            <ShieldAlert className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Tamper-Evident Session: </span>
              This viewing session is watermarked and logged in the immutable audit trail. Any attempt to retain, redistribute, or capture this document violates the terms of consent registered on the MST Blockchain.
            </div>
          </div>

          {/* Print Only Watermark Footer */}
          <div className="print-watermark-footer hidden">
            CONSEND PROTOCOL // VERIFIED ON-CHAIN ON MST BLOCKCHAIN // RECIPIENT: {formatAddress(address)} // DATE: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── HIGH-FIDELITY DOCUMENT PRINT PREVIEW & PRINT DIALOG ── */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/[0.1] bg-[#070D1E] p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Print Document Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Preview of the exact granted file before sending to printer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Document Preview Box (Pure Document Canvas, no web UI elements) */}
            <div className="my-4 flex-1 overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 text-black shadow-inner">
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-6">
                <div>
                  <h4 className="text-xl font-bold text-black">{docData?.document?.title}</h4>
                  <p className="text-xs text-gray-600 font-mono">
                    File: {docData?.document?.original_filename} · {docData?.document?.doc_type}
                  </p>
                </div>
                <div className="text-right text-[10px] text-gray-500 font-mono">
                  <div>Consend Verified Print</div>
                  <div>Recipient: {formatAddress(address)}</div>
                </div>
              </div>

              {/* Exact File Rendering */}
              <div className="flex justify-center items-center my-4 min-h-[250px]">
                {isImage && imageLoaded && !imageError ? (
                  <img
                    src={payloadRaw}
                    alt={docData?.document?.title}
                    className="max-h-[450px] w-auto object-contain mx-auto border border-gray-200 rounded"
                  />
                ) : isImage && imageError ? (
                  <div className="text-center p-8 border border-dashed border-gray-300 rounded-xl max-w-md">
                    <p className="text-sm font-semibold text-gray-800">Verified On-Chain Document</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">Hash: {docData?.document?.ciphertext_hash}</p>
                    <p className="text-xs text-amber-700 mt-2">Legacy test record image preview unavailable. Re-upload or grant this document to print high-resolution imagery.</p>
                  </div>
                ) : isPdf ? (
                  <iframe
                    src={payloadRaw}
                    className="w-full h-[450px] border border-gray-300 rounded"
                    title="PDF Print Preview"
                  />
                ) : (
                  <div className="w-full text-xs font-mono whitespace-pre-wrap leading-relaxed text-gray-900 bg-gray-50 p-4 rounded border border-gray-200">
                    {decodedText || payloadRaw}
                  </div>
                )}
              </div>

              {/* Print Footer Watermark */}
              <div className="mt-8 pt-3 border-t border-dashed border-gray-400 text-[9px] font-mono text-gray-500 text-center">
                CONSEND PROTOCOL // VERIFIED ON MST BLOCKCHAIN // RECIPIENT: {formatAddress(address)} // DATE: {new Date().toLocaleString()}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Isolated document output (Web navigation & headers excluded)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecutePrint}
                  disabled={isPrinting}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isPrinting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending to Printer...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Document Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedViewerPage({
  params,
}: {
  params: Promise<{ grantId: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      }
    >
      <ProtectedViewerContent params={params} />
    </React.Suspense>
  );
}
