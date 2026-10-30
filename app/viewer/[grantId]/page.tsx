"use client";

import React, { useEffect, useState, use } from "react";
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

  const handlePrint = () => {
    if (!docData?.permissions?.allowedActions?.includes("PRINT")) {
      toast.error("Printing is disabled by the document owner");
      return;
    }
    window.print();
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
  const payloadRaw = docData?.document?.payload || "";
  let decodedText = "";
  let isImage = false;
  let isPdf = false;

  if (payloadRaw.startsWith("data:image/") || docData?.document?.mime_type?.startsWith("image/")) {
    isImage = true;
  } else if (payloadRaw.startsWith("data:application/pdf") || docData?.document?.mime_type?.includes("pdf")) {
    isPdf = true;
  } else {
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
            onClick={handlePrint}
            disabled={!isPrintAllowed}
            className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-semibold transition ${isPrintAllowed
              ? "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
              : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
              }`}
            title={isPrintAllowed ? "Print document" : "Print action disabled by owner"}
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Protected Document Canvas with Dynamic Watermarking */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#040814] p-6 sm:p-10 shadow-2xl min-h-[500px]">
        {/* Repeating Dynamic Security Watermark */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-[0.05] flex flex-wrap items-center justify-around gap-16 rotate-[-15deg] scale-110 z-10 font-mono text-[10px] text-white">
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
        <div className="relative z-20 max-w-3xl mx-auto space-y-6">
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
              <div className="flex justify-center p-4">
                <img
                  src={payloadRaw}
                  alt={docData?.document?.title}
                  className="max-h-[500px] w-auto rounded-xl object-contain border border-white/[0.06]"
                />
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
          <div className="rounded-2xl border border-white/[0.06] bg-cyan-950/20 p-4 text-[11px] text-slate-400 leading-relaxed flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Tamper-Evident Session: </span>
              This viewing session is watermarked and logged in the immutable audit trail. Any attempt to retain, redistribute, or capture this document violates the terms of consent registered on the MST Blockchain.
            </div>
          </div>
        </div>
      </div>
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
