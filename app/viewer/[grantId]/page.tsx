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
} from "lucide-react";
import { toast } from "sonner";

function ProtectedViewerContent({
  params,
}: {
  params: Promise<{ grantId: string }>;
}) {
  const { grantId } = use(params);
  const { address, formatAddress, connectWallet } = useWallet();

  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState<any>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchDocument = async () => {
    try {
      const requesterWallet = address || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
      const res = await fetch(`/api/grants/${grantId}/document?wallet=${requesterWallet}`, {
        headers: { "x-wallet-address": requesterWallet },
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
    fetchDocument();
    // Poll every 4 seconds to enforce real-time revocation detection
    const interval = setInterval(() => {
      fetchDocument();
    }, 4000);
    return () => clearInterval(interval);
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Denied / Revoked / Expired States
  if (errorStatus === "revoked") {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 mb-6 animate-bounce">
          <Ban className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied: Consent Revoked</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          The document owner has revoked consent. Immediate server-side enforcement has cut off document bytes access.
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

  if (errorStatus === "expired") {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-6">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied: Consent Expired</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          The temporary viewing permission duration has elapsed.
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

  if (errorStatus) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Authorization Failed</h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">{errorMessage}</p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={fetchDocument}
            className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            Retry Access Check
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPrintAllowed = docData?.permissions?.allowedActions?.includes("PRINT");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Controls Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">{docData?.document?.title}</h1>
              <span className="rounded bg-cyan-950 text-cyan-300 text-[10px] px-2 py-0.5 border border-cyan-800/40">
                {docData?.document?.doc_type}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Ciphertext SHA-256: <span className="font-mono">{docData?.document?.ciphertext_hash?.substring(0, 16)}...</span>
            </div>
          </div>
        </div>

        {/* Expiry Countdown & Print Action */}
        <div className="flex items-center gap-3">
          {remainingSeconds !== null && (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-xs font-mono font-semibold text-amber-300">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              <span>{formatCountdown(remainingSeconds)}</span>
            </div>
          )}

          <button
            onClick={handlePrint}
            disabled={!isPrintAllowed}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              isPrintAllowed
                ? "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
                : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
            }`}
            title={isPrintAllowed ? "Print document" : "Print action disabled by owner"}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Protected Document Canvas with Dynamic Watermarking */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-8 sm:p-12 shadow-2xl min-h-[500px]">
        {/* Repeating Dynamic Security Watermark */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-[0.06] flex flex-wrap items-center justify-around gap-16 rotate-[-18deg] scale-110 z-10 font-mono text-xs text-white">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="text-center">
              <div>TEMPORARY PERMISSIONED VIEW</div>
              <div>RECIPIENT: {formatAddress(address || "0x3C44Cd...93BC")}</div>
              <div>EXPIRES: {new Date(docData?.permissions?.expiresAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        {/* Document Content Display */}
        <div className="relative z-20 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-semibold text-cyan-400 tracking-wider">
                Authorized Verification Copy
              </div>
              <div className="text-xl font-bold text-white mt-1">{docData?.document?.title}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          {/* Fictional Mock Document Visual Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
              {docData?.document?.payload
                ? atob(docData.document.payload.replace(/^data:.*base64,/, ""))
                : "[ENCRYPTED PAYLOAD ACCESSED — VERIFIED ON MST BLOCKCHAIN]"}
            </div>

            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-[11px] text-slate-400">
              <div>
                <span className="block text-slate-500">Original Filename:</span>
                <span className="text-slate-200">{docData?.document?.original_filename}</span>
              </div>
              <div>
                <span className="block text-slate-500">File Size:</span>
                <span className="text-slate-200">
                  {Math.round((docData?.document?.size_bytes || 0) / 1024)} KB
                </span>
              </div>
            </div>
          </div>

          {/* Watermark Security Notice */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Security Notice: </span>
              This viewing session is watermarked and logged on the MST Blockchain testnet. Any attempt to retain, redistribute, or capture this document violates the terms of consent granted by the owner.
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
