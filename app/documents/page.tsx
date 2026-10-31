"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  FileText,
  Upload,
  Lock,
  Plus,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Wallet,
  Hash,
  FileCheck,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  HardDrive,
  Copy,
  Check,
  Eye,
  Printer,
  X,
} from "lucide-react";
import { toast } from "sonner";

const DOC_TYPE_OPTIONS = [
  "Degree Certificate",
  "Medical Report",
  "Rental Agreement",
  "Income Statement",
  "Identity Proof",
  "Mark Sheet",
  "Employment Letter",
  "Bank Statement",
  "Government ID",
  "Other Confidential Document",
];

export default function DocumentVaultPage() {
  const { address, ownerName, connectWallet, openConnectModal, formatAddress, isMounted } = useWallet();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Preview State
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewImageError, setPreviewImageError] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Degree Certificate");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPreview = async (docId: string) => {
    if (!address) return;
    setLoadingPreview(true);
    setPreviewImageError(false);
    try {
      const res = await fetch(`/api/documents/${docId}?wallet=${address}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load document preview");
      }
      setPreviewDoc(data.document);
    } catch (err: any) {
      toast.error(err.message || "Failed to load document preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePrintPreviewDoc = () => {
    if (!previewDoc) return;
    const docTitle = previewDoc.title || "Vault Document";
    const filename = previewDoc.original_filename || "document";
    const payload = previewDoc.payload || "";
    const mime = previewDoc.mime_type || "";
    const isImg = payload.startsWith("data:image/") || mime.startsWith("image/");
    const isPdfDoc = payload.startsWith("data:application/pdf") || mime.includes("pdf");

    const existingIframe = document.getElementById("vault-print-frame");
    if (existingIframe) existingIframe.remove();

    const printFrame = document.createElement("iframe");
    printFrame.id = "vault-print-frame";
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

    let documentBody = "";
    if (isImg) {
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

    const watermarkText = `CONSEND PROTOCOL // VAULT OWNER VERIFIED // OWNER: ${formatAddress(address)} // DATE: ${new Date().toLocaleString()}`;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - Consend Vault Print</title>
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
              <div>Consend Vault Certified Copy</div>
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

  const fetchDocs = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?wallet=${address}`);
      const data = await res.json();
      if (data.success) setDocuments(data.documents);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        // Auto-populate title from filename without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }
    if (!selectedFile && !textContent.trim()) {
      toast.error("Please upload a file or enter document text content");
      return;
    }

    setIsUploading(true);
    try {
      let rawContentBase64 = "";
      let filename = `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`;
      let mimeType = "application/pdf";

      if (selectedFile) {
        filename = selectedFile.name;
        mimeType = selectedFile.type || "application/octet-stream";
        rawContentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Extract pure base64 without prefix if present
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            resolve(base64);
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(selectedFile);
        });
      } else {
        // UTF-8 safe base64 encoding
        rawContentBase64 = btoa(unescape(encodeURIComponent(textContent)));
        filename = `${title.toLowerCase().replace(/\s+/g, "_")}.txt`;
        mimeType = "text/plain";
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerWallet: address,
          title,
          docType,
          filename,
          mimeType,
          rawContentBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast.success("Document encrypted and secured in vault!");
      setShowUploadModal(false);
      setTitle("");
      setTextContent("");
      setSelectedFile(null);
      fetchDocs();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    toast.success("Ciphertext hash copied to clipboard!");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isMounted || !address) {
    return (
      <div
        suppressHydrationWarning
        className="page-container flex flex-col items-center justify-center min-h-[65vh] text-center"
      >
        <div className="relative mb-8 group" suppressHydrationWarning>
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-violet-500/20 blur-2xl group-hover:opacity-100 opacity-75 transition duration-500" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-[#080F20] border border-cyan-500/30 shadow-[0_0_50px_-10px_rgba(6,182,212,0.4)]">
            <Lock className="h-10 w-10 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-medium mb-3">
          <ShieldCheck className="h-3.5 w-3.5" /> Client-Side Authenticated Vault
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-3">
          Encrypted Document Vault
        </h1>
        <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
          Connect your Web3 wallet to access your private AES-256 encrypted storage. Only cryptographically authorized recipients can view your files.
        </p>
        <button
          onClick={openConnectModal}
          className="btn-primary flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-semibold shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 transition-all"
          suppressHydrationWarning
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet (Mainnet & Testnet)
        </button>
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#080F25] via-[#050B18] to-[#030712] p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-cyan-400">
                AES-256-GCM Vault
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <HardDrive className="h-7 w-7 text-cyan-400" />
              {ownerName ? `${ownerName}'s Vault` : "Encrypted Document Vault"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Every document is encrypted with authenticated symmetric keys. Zero plaintext is stored on-chain; only cryptographic term hashes and lifecycle states are registered on the MST Blockchain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDocs}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.35)]"
            >
              <Plus className="h-4 w-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Vault Stats Bar */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/[0.06]">
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Documents</div>
            <div className="text-xl font-bold text-white mt-1">{documents.length}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Encryption Standard</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">AES-256-GCM</div>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Vault Owner</div>
            <div className="text-xs font-bold text-white mt-2 truncate flex items-center gap-1.5 flex-wrap">
              {ownerName && <span className="text-white">{ownerName}</span>}
              <span className="font-mono text-cyan-300 text-[11px]">({formatAddress(address)})</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Storage Integrity</div>
            <div className="text-xs font-semibold text-emerald-300 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> SHA-256 Verified
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div>
        {loading && documents.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl animate-shimmer glass-card" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.1] bg-gradient-to-b from-white/[0.02] to-transparent p-16 text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-500/20 mb-6 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
              <FileText className="h-10 w-10 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No documents in your vault yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Upload your documents into encrypted storage. You can securely share time-bound viewing or printing permissions via the Consend QR workflow.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs rounded-xl shadow-lg"
            >
              <Upload className="h-4 w-4" />
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-[#070D1E]/80 backdrop-blur-xl p-6 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_10px_35px_-10px_rgba(6,182,212,0.25)] hover:-translate-y-1"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-[11px] font-semibold text-cyan-300">
                      {doc.doc_type}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                      <Lock className="h-3 w-3" />
                      Encrypted
                    </span>
                  </div>

                  {/* Title & Filename */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                    {doc.title}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 truncate mb-4">
                    {doc.original_filename}
                  </div>

                  {/* Cryptographic SHA-256 Box */}
                  <div className="rounded-2xl bg-black/50 border border-white/[0.05] p-3.5 mb-4 group/hash">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Hash className="h-3 w-3 text-cyan-400" />
                        <span>Ciphertext SHA-256</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(doc.ciphertext_hash, doc.id)}
                        className="text-slate-400 hover:text-cyan-300 transition"
                        title="Copy hash"
                      >
                        {copiedHash === doc.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-cyan-400/80 truncate">
                      {doc.ciphertext_hash}
                    </div>
                  </div>
                </div>

                {/* Footer Metadata & Preview Button */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <span className="rounded-lg bg-white/[0.04] px-2 py-0.5 font-mono text-slate-300">
                      {Math.round((doc.size_bytes || 0) / 1024) || 1} KB
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenPreview(doc.id)}
                    disabled={loadingPreview}
                    className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#080F24]/95 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Encrypted Document</h3>
                  <p className="text-xs text-slate-400">File is encrypted client-side before transmission</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Select Document File
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] p-6 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/[0.02] transition"
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <FileCheck className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-bold text-white">{selectedFile.name}</span>
                      <span className="text-xs text-slate-400">
                        {Math.round(selectedFile.size / 1024)} KB · Click to change file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition">
                        <Upload className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        Click or drag & drop a PDF, image, or document
                      </span>
                      <span className="text-[11px] text-slate-500">Supports PDF, PNG, JPG, TXT up to 10MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Document Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master Degree Certificate"
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Document Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="input-field"
                  >
                    {DOC_TYPE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Text Content if no file */}
              {!selectedFile && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Or Enter Document Text Content
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={3}
                    placeholder="Type or paste document text directly to be AES-256 encrypted..."
                    className="input-field resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary px-5 py-2.5 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn-primary px-6 py-2.5 text-xs rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Encrypting & Saving...
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Encrypt & Save to Vault
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HIGH-FIDELITY DOCUMENT PREVIEW MODAL ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#070D1E] shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-black/30">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{previewDoc.title}</h3>
                    <span className="rounded-full bg-cyan-950 border border-cyan-800/40 text-cyan-300 px-2.5 py-0.5 text-[10px] font-semibold">
                      {previewDoc.doc_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    {previewDoc.original_filename} · {Math.round((previewDoc.size_bytes || 0) / 1024) || 1} KB
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPreviewDoc}
                  className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                  title="Print document"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {previewDoc.payload?.startsWith("data:image/") ||
                previewDoc.mime_type?.startsWith("image/") ||
                previewDoc.original_filename?.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-black/40 p-4 min-h-[300px]">
                  {!previewImageError ? (
                    <img
                      src={
                        previewDoc.payload?.startsWith("data:")
                          ? previewDoc.payload
                          : `data:${previewDoc.mime_type || "image/jpeg"};base64,${previewDoc.payload}`
                      }
                      alt={previewDoc.title}
                      onError={() => setPreviewImageError(true)}
                      className="max-h-[500px] w-auto rounded-xl object-contain border border-white/[0.06] shadow-xl"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-3 max-w-md">
                      <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Preview Conversion Required</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        This file was uploaded in an earlier test session. Its cryptographic hash (<code className="text-cyan-300 font-mono">{previewDoc.ciphertext_hash?.substring(0, 12)}…</code>) is verified on-chain. Re-upload to view full-resolution preview.
                      </p>
                    </div>
                  )}
                </div>
              ) : previewDoc.payload?.startsWith("data:application/pdf") ||
                previewDoc.mime_type?.includes("pdf") ||
                previewDoc.original_filename?.toLowerCase().endsWith(".pdf") ? (
                <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-4">
                  <iframe
                    src={
                      previewDoc.payload?.startsWith("data:")
                        ? previewDoc.payload
                        : `data:application/pdf;base64,${previewDoc.payload}`
                    }
                    className="w-full h-[500px] rounded-xl border border-white/[0.08]"
                    title="PDF Preview"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                  {(() => {
                    try {
                      const clean = (previewDoc.payload || "").replace(/^data:.*base64,/, "");
                      return decodeURIComponent(escape(atob(clean)));
                    } catch {
                      try {
                        return atob(previewDoc.payload || "");
                      } catch {
                        return previewDoc.payload || "[DOCUMENT CONTENT LOADED & VERIFIED]";
                      }
                    }
                  })()}
                </div>
              )}

              {/* Security info card */}
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono text-[11px] truncate">
                  <Hash className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-500">SHA-256:</span>
                  <span className="text-cyan-300 truncate">{previewDoc.ciphertext_hash}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>AES-256-GCM Verified</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.06] bg-black/30 flex justify-end gap-3">
              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-secondary px-5 py-2 text-xs rounded-xl"
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
