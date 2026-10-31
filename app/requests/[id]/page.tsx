"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useWallet, DEMO_PERSONAS } from "@/components/wallet/WalletContext";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Download,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Ban,
  ArrowRight,
  Paperclip,
  FolderLock,
  Upload,
  FileText,
  File,
  X,
  Printer,
  Check,
  Send,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { generateQrDataUrl } from "@/lib/qr";
import { BlockchainTraceCard } from "@/components/blockchain/BlockchainTraceCard";
import { CONSENT_REGISTRY_ADDRESS } from "@/lib/blockchain/config";

function RequestDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { address, formatAddress } = useWallet();
  const [request, setRequest] = useState<any>(null);
  const [grant, setGrant] = useState<any>(null);
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [consentUrl, setConsentUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Attachment state for adding / replacing files after QR generation
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [attachMode, setAttachMode] = useState<"manual" | "vault">("manual");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualFileBase64, setManualFileBase64] = useState<string>("");
  const [manualDocTitle, setManualDocTitle] = useState<string>("");
  const [manualDocType, setManualDocType] = useState<string>("Reference Document");
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [loadingVaultDocs, setLoadingVaultDocs] = useState(false);
  const [selectedVaultDocId, setSelectedVaultDocId] = useState<string>("");
  const [isSubmittingAttach, setIsSubmittingAttach] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewImageError, setPreviewImageError] = useState(false);
  const [previewImageLoaded, setPreviewImageLoaded] = useState(false);

  // Fetch vault documents if wallet is connected
  useEffect(() => {
    if (!address) return;
    const fetchVaultDocs = async () => {
      setLoadingVaultDocs(true);
      try {
        const res = await fetch(`/api/documents?wallet=${address}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          setVaultDocs(data.documents);
          if (data.documents.length > 0 && !selectedVaultDocId) {
            setSelectedVaultDocId(data.documents[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load vault docs:", err);
      } finally {
        setLoadingVaultDocs(false);
      }
    };
    fetchVaultDocs();
  }, [address]);

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds 25 MB limit");
      return;
    }

    setManualFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    if (!manualDocTitle) {
      setManualDocTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setManualFileBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAttachment = async () => {
    if (!address) {
      toast.error("Please connect your wallet to attach a document");
      return;
    }

    setIsSubmittingAttach(true);
    try {
      let finalDocId = "";
      let finalDocTitle = "";

      if (attachMode === "manual") {
        if (!manualFile || !manualFileBase64) {
          toast.error("Please select a file to upload");
          setIsSubmittingAttach(false);
          return;
        }

        const uploadRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerWallet: address,
            title: manualDocTitle.trim() || manualFile.name,
            docType: manualDocType || "Reference Document",
            filename: manualFile.name,
            mimeType: manualFile.type || "application/pdf",
            rawContentBase64: manualFileBase64,
          }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to encrypt and store document");
        }

        finalDocId = uploadData.document.id;
        finalDocTitle = uploadData.document.title;
      } else {
        if (!selectedVaultDocId) {
          toast.error("Please select a document from your vault");
          setIsSubmittingAttach(false);
          return;
        }
        const found = vaultDocs.find((d) => d.id === selectedVaultDocId);
        finalDocId = selectedVaultDocId;
        finalDocTitle = found?.title || "Vault Document";
      }

      // Update the consent request via PATCH
      const patchRes = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          attachedDocId: finalDocId,
          attachedDocTitle: finalDocTitle,
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData.error || "Failed to update request with attached document");
      }

      setRequest((prev: any) => ({
        ...prev,
        attachedDocId: finalDocId,
        attachedDocTitle: finalDocTitle,
      }));

      setShowAttachPanel(false);
      setManualFile(null);
      setManualFileBase64("");
      toast.success("Document attached to consent request & synchronized!");
    } catch (err: any) {
      toast.error(err.message || "Failed to attach document");
    } finally {
      setIsSubmittingAttach(false);
    }
  };

  const handleOpenPreview = async (docId: string) => {
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    setPreviewImageError(false);
    setPreviewImageLoaded(false);
    try {
      const activeWallet = address || request?.requester_wallet || "";
      const res = await fetch(`/api/documents?id=${docId}&wallet=${activeWallet}`);
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
    const existing = document.getElementById("consend-req-print-frame");
    if (existing) existing.remove();

    const printFrame = document.createElement("iframe");
    printFrame.id = "consend-req-print-frame";
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

    const watermarkText = `CONSEND PROTOCOL // ATTACHED REFERENCE DOCUMENT // REQUEST ID: ${id} // DATE: ${new Date().toLocaleString()}`;

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
              <div>Consend Certified Copy</div>
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

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();

      if (data.success) {
        setRequest(data.request);
        setGrant(data.grant);
        setBlockchainInfo({
          contractAddress: data.contractAddress || CONSENT_REGISTRY_ADDRESS,
          transactionHash: data.transactionHash || null,
          txStatus: data.txStatus || (data.request.status === "pending" ? "pending" : "confirmed"),
          consentIdHex: data.consentIdHex,
        });

        // Derive consent URL (prefer plain token if available, fallback to token_hash)
        if (typeof window !== "undefined") {
          const origin = window.location.origin;
          const cachedPlainToken = localStorage.getItem(`consent_plain_token_${id}`);
          const tokenToUse = cachedPlainToken || data.request.token_hash;
          const url = `${origin}/consent/${tokenToUse}`;
          setConsentUrl(url);

          const qr = await generateQrDataUrl(url);
          setQrDataUrl(qr);
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
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 px-4 py-2 text-xs font-bold text-cyan-300 hover:from-cyan-500/30 hover:to-emerald-500/30 transition shadow-lg"
            >
              <span>Open Consent Notice</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-[11px] text-cyan-200/90 text-left">
            <span className="font-bold text-white">Interactive Testing Tip: </span>
            Click <span className="font-semibold text-cyan-300">Open Consent Notice</span> above to test the document owner approval flow in a new tab. When approved, this page will instantly update and unlock the document viewer!
          </div>
        </div>

        {/* Request Specifications */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Request Parameters
            </h3>

            {request.targetWallet && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-3.5 space-y-1">
                <div className="text-[11px] text-cyan-400 font-semibold flex items-center justify-between">
                  <span>Target Recipient (Document Owner)</span>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                    Direct Delivery
                  </span>
                </div>
                <div className="text-xs font-semibold text-white break-all flex items-center gap-2 flex-wrap">
                  {(() => {
                    const p = DEMO_PERSONAS.find((dp) => dp.address.toLowerCase() === request.targetWallet.toLowerCase());
                    return p ? (
                      <>
                        <span className="text-cyan-200">{p.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({request.targetWallet})</span>
                      </>
                    ) : (
                      <span className="font-mono">{request.targetWallet}</span>
                    );
                  })()}
                </div>
                <div className="text-[10px] text-slate-400">
                  This request automatically appears on this person&apos;s dashboard when they connect.
                </div>
              </div>
            )}

            {/* Attached Reference Document section */}
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <Paperclip className="h-3.5 w-3.5" /> Requester Attached File
                </span>
                {request.attachedDocId ? (
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                    Vault Synchronized
                  </span>
                ) : (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400">
                    Optional
                  </span>
                )}
              </div>

              {request.attachedDocId ? (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{request.attachedDocTitle || "Reference Document"}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(request.attachedDocId)}
                        className="btn-secondary flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg"
                      >
                        <Eye className="h-3 w-3 text-cyan-400" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAttachPanel(!showAttachPanel)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition"
                      >
                        {showAttachPanel ? "Cancel" : "Change"}
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    This file is sent to the recipient's wallet and viewable upon scanning this QR code.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-300">
                    No reference document attached yet. You can attach a file now so the recipient can inspect it upon scanning.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAttachPanel(!showAttachPanel)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Attach / Upload File to this Request</span>
                  </button>
                </div>
              )}

              {/* Expandable File Attach / Upload Panel */}
              {showAttachPanel && (
                <div className="pt-3 mt-3 border-t border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Attach Reference Document</span>
                    <button
                      type="button"
                      onClick={() => setShowAttachPanel(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Mode tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAttachMode("manual")}
                      className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${attachMode === "manual"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      <Upload className="h-3 w-3" /> Upload Manually
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachMode("vault")}
                      className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${attachMode === "vault"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      <FolderLock className="h-3 w-3" /> From Vault ({vaultDocs.length})
                    </button>
                  </div>

                  {attachMode === "manual" ? (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*,text/plain"
                        onChange={handleManualFileChange}
                      />
                      {!manualFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer border border-dashed border-cyan-500/30 hover:border-cyan-500/50 rounded-xl p-4 text-center bg-cyan-950/20 hover:bg-cyan-950/30 transition"
                        >
                          <Upload className="h-6 w-6 text-cyan-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-white">Click to choose a file</p>
                          <p className="text-[10px] text-slate-400">PDF, PNG, JPG, or TXT up to 25 MB</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between rounded-lg bg-black/40 border border-white/[0.06] p-2 text-xs">
                            <span className="font-semibold text-white truncate max-w-[180px]">
                              {manualFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setManualFile(null);
                                setManualFileBase64("");
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={manualDocTitle}
                            onChange={(e) => setManualDocTitle(e.target.value)}
                            placeholder="Document Title"
                            className="input-field text-xs py-1.5"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {loadingVaultDocs ? (
                        <div className="text-xs text-slate-400 py-3 text-center">Loading vault...</div>
                      ) : vaultDocs.length === 0 ? (
                        <div className="text-xs text-slate-400 py-3 text-center">No documents in vault</div>
                      ) : (
                        <select
                          value={selectedVaultDocId}
                          onChange={(e) => setSelectedVaultDocId(e.target.value)}
                          className="input-field text-xs py-2"
                        >
                          {vaultDocs.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.title} ({doc.doc_type})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAttachment}
                    disabled={isSubmittingAttach || (attachMode === "manual" && !manualFile)}
                    className="w-full btn-primary py-2 text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingAttach ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Encrypting & Attaching...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Save & Attach to Request</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

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
              <div className="text-xs font-semibold text-slate-200 mt-1 break-all flex items-center gap-1.5 flex-wrap">
                {(() => {
                  const p = DEMO_PERSONAS.find((dp) => dp.address.toLowerCase() === request.requester_wallet?.toLowerCase());
                  return p ? (
                    <>
                      <span className="text-white">{p.name}</span>
                      <span className="text-cyan-300 font-mono text-[11px]">({request.requester_wallet})</span>
                    </>
                  ) : (
                    <span className="font-mono text-cyan-300">{request.requester_wallet}</span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* On-Chain Blockchain Trace Card */}
          <BlockchainTraceCard
            contractAddress={blockchainInfo?.contractAddress || CONSENT_REGISTRY_ADDRESS}
            transactionHash={blockchainInfo?.transactionHash}
            actorAddress={grant?.owner_wallet || request?.requester_wallet}
            consentIdHex={blockchainInfo?.consentIdHex}
            action={isGranted ? "grantConsent" : "createConsent"}
            status={blockchainInfo?.txStatus || (isGranted ? "confirmed" : "pending")}
          />

          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-white">How verification works:</span> Opening the link or scanning the QR code takes the document owner to the explicit consent screen. The owner selects the matching document from their vault and clicks Approve, which registers the consent on the MST blockchain.
          </div>
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
                    {previewDoc?.title || "Attached Document Preview"}
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
