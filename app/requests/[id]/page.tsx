"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Download,
  AlertCircle,
  RefreshCw,
  Eye,
  Ban,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { generateQrDataUrl } from "@/lib/qr";

function RequestDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [request, setRequest] = useState<any>(null);
  const [grant, setGrant] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [consentUrl, setConsentUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();

      if (data.success) {
        setRequest(data.request);
        setGrant(data.grant);

        // Derive consent URL
        if (typeof window !== "undefined") {
          const origin = window.location.origin;
          const url = `${origin}/consent/${data.request.token_hash}`;
          setConsentUrl(url);

          if (!qrDataUrl) {
            const qr = await generateQrDataUrl(url);
            setQrDataUrl(qr);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching request status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 3 seconds while pending
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const copyLink = () => {
    if (!consentUrl) return;
    navigator.clipboard.writeText(consentUrl);
    toast.success("Consent link copied to clipboard!");
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `consent-request-${id.substring(0, 8)}.png`;
    a.click();
  };

  if (loading && !request) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Consent Request Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">The request ID may be invalid or expired.</p>
        <Link href="/requests/new" className="mt-4 inline-block text-xs text-cyan-400 hover:underline">
          Create New Request
        </Link>
      </div>
    );
  }

  const isGranted = request.status === "granted" && grant;
  const isDenied = request.status === "denied";
  const isExpired = request.status === "expired" || new Date(request.expires_at).getTime() <= Date.now();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300 mb-2">
            <QrCode className="h-3.5 w-3.5" />
            <span>Step 2: Awaiting Owner Approval</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{request.title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Purpose: {request.purpose}</p>
        </div>

        {/* Live Status Pill */}
        <div>
          {isGranted ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Consent Granted on MST!</span>
            </div>
          ) : isDenied ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-1.5 text-xs font-semibold text-red-400">
              <Ban className="h-4 w-4" />
              <span>Consent Denied</span>
            </div>
          ) : isExpired ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Request Expired</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Waiting for Scan & Approval...</span>
            </div>
          )}
        </div>
      </div>

      {/* Granted Banner with Link to Viewer */}
      {isGranted && (
        <div className="mb-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Document Access Authorized</div>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Owner approved this request and recorded the grant on MST Blockchain.
              </p>
            </div>
          </div>

          <Link
            href={`/viewer/${grant.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
          >
            <Eye className="h-4 w-4" />
            <span>Open Protected Viewer</span>
          </Link>
        </div>
      )}

      {/* Main Grid: QR Code & Request Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* QR Code Presentation Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center flex flex-col items-center">
          <div className="text-xs font-semibold text-slate-300 mb-4">
            Scan with Document Owner Phone or Camera
          </div>

          {qrDataUrl ? (
            <div className="relative rounded-2xl bg-white p-4 shadow-2xl">
              <img
                src={qrDataUrl}
                alt="Consent QR Code"
                className="h-60 w-60 object-contain rounded-lg"
              />
              <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-2xl pointer-events-none" />
            </div>
          ) : (
            <div className="h-60 w-60 rounded-2xl bg-slate-800 animate-pulse" />
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Link</span>
            </button>

            <button
              onClick={downloadQr}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save QR</span>
            </button>

            <a
              href={consentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <span>Test Scan</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Request Specifications */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Request Parameters
            </h3>

            <div>
              <div className="text-[11px] text-slate-500">Required Documents</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {request.required_document_types?.map((t: string) => (
                  <span
                    key={t}
                    className="rounded-lg bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 text-xs text-cyan-300 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Allowed Actions</div>
              <div className="flex gap-2 mt-1 text-xs font-semibold text-emerald-400">
                {request.allowed_actions?.join(", ")}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Expires At (Server Enforced)</div>
              <div className="text-xs font-mono text-slate-300 mt-1">
                {new Date(request.expires_at).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Requester Address</div>
              <div className="text-xs font-mono text-slate-300 mt-1 break-all">
                {request.requester_wallet}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-white">How verification works:</span> Opening the link or scanning the QR code takes the document owner to the explicit consent screen. The owner selects the matching document from their vault and clicks Approve, which registers the consent on the MST blockchain.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      }
    >
      <RequestDetailsContent params={params} />
    </React.Suspense>
  );
}
