"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  FileText,
  Upload,
  Lock,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function DocumentVaultPage() {
  const { address, formatAddress, connectWallet } = useWallet();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form state
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Degree Certificate");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const ownerWallet = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const res = await fetch(`/api/documents?wallet=${ownerWallet}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [address]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerWallet = address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setIsUploading(true);
    try {
      const rawContentBase64 = btoa(textContent || `[FICTIONAL MOCK] ${title} - Encrypted for demo`);
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerWallet,
          title,
          docType,
          filename: `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
          mimeType: "application/pdf",
          rawContentBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      toast.success("Document encrypted and stored in vault!");
      setShowUploadModal(false);
      setTitle("");
      setTextContent("");
      fetchDocs();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-cyan-400" />
            <span>Encrypted Document Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Private, client-encrypted document storage. Documents are shared only through explicit time-limited grants.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Safety Banner */}
      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-amber-300">Demo Environment Reminder: </span>
          Use fictional mock documents only. Never upload genuine Aadhaar, PAN, financial statements, or private sensitive records.
        </div>
      </div>

      {/* Document Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-white">No documents in vault yet</h3>
            <p className="text-xs text-slate-400 mt-1">Upload a mock certificate or report to get started.</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
            >
              Upload Mock Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-lg bg-cyan-950/80 border border-cyan-800/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                      {doc.doc_type}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <Lock className="h-3 w-3" />
                      <span>AES-256</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{doc.title}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {doc.original_filename}
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 text-[10px] font-mono text-slate-500">
                    <div className="text-slate-400">Ciphertext SHA-256:</div>
                    <div className="truncate text-cyan-300">{doc.ciphertext_hash}</div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{Math.round((doc.size_bytes || 0) / 1024)} KB</span>
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-400" />
                <span>Upload Document to Vault</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master of Science Degree Certificate"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Document Classification
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Degree Certificate">Degree Certificate</option>
                  <option value="Medical Report">Medical Report</option>
                  <option value="Rental Agreement">Rental Agreement</option>
                  <option value="Income Statement">Income Statement</option>
                  <option value="Identity Proof (Mock)">Identity Proof (Mock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Fictional Document Mock Content
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={4}
                  placeholder="Enter sample mock certificate or document text to be AES-256 encrypted..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:opacity-95 disabled:opacity-50"
                >
                  {isUploading ? "Encrypting & Storing..." : "Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
