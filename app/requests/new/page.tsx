"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet, DEMO_PERSONAS } from "@/components/wallet/WalletContext";
import {
  QrCode,
  Clock,
  ArrowRight,
  FileCheck,
  Building,
  Check,
  AlertCircle,
  Wallet,
  Info,
  Upload,
  FolderLock,
  FileText,
  File,
  X,
  Paperclip,
  Eye,
  RefreshCw,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_OPTIONS = [
  { value: "Degree Certificate", icon: "🎓" },
  { value: "Medical Report", icon: "🏥" },
  { value: "Rental Agreement", icon: "🏠" },
  { value: "Income Statement", icon: "💰" },
  { value: "Identity Proof", icon: "🪪" },
  { value: "Mark Sheet", icon: "📋" },
  { value: "Employment Letter", icon: "💼" },
  { value: "Bank Statement", icon: "🏦" },
];

const DURATION_OPTIONS = [
  { label: "1 Minute (Quick Test)", minutes: 1 },
  { label: "5 Minutes (Xerox / Print)", minutes: 5 },
  { label: "15 Minutes (Outpatient Visit)", minutes: 15 },
  { label: "30 Minutes (On-site Review)", minutes: 30 },
  { label: "1 Hour (Counseling Session)", minutes: 60 },
  { label: "2 Hours (Physical Admission)", minutes: 120 },
  { label: "24 Hours (Background Check)", minutes: 1440 },
];

export default function NewRequestPage() {
  const router = useRouter();
  const { address, ownerName, connectWallet, openConnectModal, formatAddress, isMounted } = useWallet();

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [targetWallet, setTargetWallet] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [allowedActions, setAllowedActions] = useState<("VIEW" | "PRINT" | "DOWNLOAD")[]>(["VIEW"]);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<"direct" | "qr" | null>(null);

  // Reference document attachment state
  const [attachmentMode, setAttachmentMode] = useState<"none" | "manual" | "vault">("none");
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [loadingVaultDocs, setLoadingVaultDocs] = useState(false);
  const [selectedVaultDocId, setSelectedVaultDocId] = useState<string>("");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualFileBase64, setManualFileBase64] = useState<string>("");
  const [manualDocTitle, setManualDocTitle] = useState<string>("");
  const [manualDocType, setManualDocType] = useState<string>("Reference Document");
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch vault documents for current wallet
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
        console.warn("Could not load vault documents:", err);
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

  const clearManualFile = () => {
    setManualFile(null);
    setManualFileBase64("");
    setManualDocTitle("");
    if (manualFileInputRef.current) {
      manualFileInputRef.current.value = "";
    }
  };

  const toggleDoc = (doc: string) => {
    if (selectedDocs.includes(doc)) {
      if (selectedDocs.length > 1) {
        setSelectedDocs(selectedDocs.filter((d) => d !== doc));
      }
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };

  const toggleAction = (act: "VIEW" | "PRINT" | "DOWNLOAD") => {
    if (allowedActions.includes(act)) {
      if (allowedActions.length > 1) {
        setAllowedActions(allowedActions.filter((a) => a !== act));
      }
    } else {
      setAllowedActions([...allowedActions, act]);
    }
  };

  const handleCreateRequest = async (mode: "direct" | "qr") => {
    if (!address) {
      toast.error("Please connect your wallet to create a consent request");
      return;
    }
    if (!title.trim() || !purpose.trim()) {
      toast.error("Please enter a request title and purpose");
      return;
    }
    if (selectedDocs.length === 0) {
      toast.error("Please select at least one document type");
      return;
    }

    const cleanTarget = targetWallet.trim();
    if (mode === "direct") {
      if (!cleanTarget) {
        toast.error("Please enter or pick a recipient wallet address to send directly");
        return;
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(cleanTarget)) {
        toast.error("Recipient wallet must be a valid 42-character EVM address (0x...)");
        return;
      }
    } else if (cleanTarget && !/^0x[a-fA-F0-9]{40}$/.test(cleanTarget)) {
      toast.error("Recipient wallet must be a valid 42-character EVM address (0x...)");
      return;
    }

    setIsSubmitting(true);
    setSubmittingMode(mode);
    try {
      let finalAttachedDocId: string | undefined = undefined;
      let finalAttachedDocTitle: string | undefined = undefined;

      // Handle manual upload attachment
      if (attachmentMode === "manual") {
        if (!manualFile || !manualFileBase64) {
          toast.error("Please select a file to upload manually or choose 'None'");
          setIsSubmitting(false);
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

        finalAttachedDocId = uploadData.document.id;
        finalAttachedDocTitle = uploadData.document.title;
        toast.success("Attached document encrypted & stored in vault!");
      } else if (attachmentMode === "vault") {
        if (!selectedVaultDocId) {
          toast.error("Please select a document from your vault or choose 'None'");
          setIsSubmitting(false);
          return;
        }
        const found = vaultDocs.find((d) => d.id === selectedVaultDocId);
        finalAttachedDocId = selectedVaultDocId;
        finalAttachedDocTitle = found?.title || "Vault Document";
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          purpose,
          requiredDocumentTypes: selectedDocs,
          allowedActions,
          durationMinutes,
          requesterWallet: address,
          targetWallet: mode === "direct" ? cleanTarget : cleanTarget || undefined,
          attachedDocId: finalAttachedDocId,
          attachedDocTitle: finalAttachedDocTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create request");

      if (data.request?.plainToken) {
        localStorage.setItem(`consent_plain_token_${data.request.id}`, data.request.plainToken);
      }
      localStorage.setItem(`consent_delivery_mode_${data.request.id}`, mode);

      if (mode === "direct") {
        toast.success(
          `Consent request sent directly to ${cleanTarget.substring(0, 6)}…${cleanTarget.substring(cleanTarget.length - 4)}!`
        );
        router.push(`/requests/${data.request.id}?mode=direct`);
      } else {
        toast.success("Consent QR code generated successfully!");
        router.push(`/requests/${data.request.id}?mode=qr`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create request");
    } finally {
      setIsSubmitting(false);
      setSubmittingMode(null);
    }
  };

  // ── Not connected / hydrating ──────────────────────────────────────────────
  if (!isMounted || !address) {
    return (
      <div
        suppressHydrationWarning
        className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="relative mb-8" suppressHydrationWarning>
          <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/20">
            <QrCode className="h-9 w-9 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Connect Wallet to Continue</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
          A connected wallet is required to create consent requests and sign on-chain transactions.
        </p>
        <button
          onClick={openConnectModal}
          className="btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl text-sm shadow-xl shadow-cyan-500/20"
          suppressHydrationWarning
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet (Mainnet & Testnet)
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/25 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cyan-400 mb-4">
          <QrCode className="h-3 w-3" />
          Requester Workflow
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Create Consent Request
        </h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xl">
          Specify the purpose, required documents, and time limit. This generates a temporary QR code for the document owner to scan and approve.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateRequest(targetWallet.trim() ? "direct" : "qr");
        }}
        className="space-y-5"
      >
        {/* Requester identity */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Requester Wallet</div>
              <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2 flex-wrap">
                {ownerName && (
                  <span className="font-semibold text-white bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {ownerName}
                  </span>
                )}
                <span className="font-mono text-cyan-300 text-xs">({formatAddress(address)})</span>
              </div>
            </div>
          </div>
          <span className="pill-active">Connected</span>
        </div>

        {/* Title & Purpose */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Request Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. University Admission Verification"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Specific Purpose <span className="text-slate-600 normal-case">(shown to document owner)</span>
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder="Clearly explain why these documents are required and how they will be used…"
              required
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Target Recipient Wallet (Direct Delivery) */}
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Send To Specific Wallet Address <span className="text-slate-600 normal-case">(Direct Delivery)</span>
            </label>
            <span className="text-[10px] text-cyan-400 font-mono">Auto-Inbox Delivery</span>
          </div>
          <input
            type="text"
            value={targetWallet}
            onChange={(e) => setTargetWallet(e.target.value)}
            placeholder="0x... (paste wallet address or click a test persona below)"
            className="input-field font-mono text-xs"
          />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            When specified, this consent request automatically delivers to this wallet&apos;s dashboard upon login for instant 1-click review and approval.
          </p>

          {/* Quick Select Personas */}
          <div className="pt-2 border-t border-white/[0.05]">
            <div className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              Quick Pick Test Personas:
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_PERSONAS.map((p) => {
                const isSelected = targetWallet.toLowerCase() === p.address.toLowerCase();
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setTargetWallet(isSelected ? "" : p.address)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] border transition ${isSelected
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm"
                      : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]"
                      }`}
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="font-mono text-[9px] text-slate-500">
                      ({p.address.substring(0, 6)}…{p.address.substring(p.address.length - 4)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reference / Attached Document (Optional: Manual or Vault) */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Attach Document / Agreement <span className="text-slate-600 normal-case">(Optional)</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Include a reference contract, agreement, or template for the recipient to inspect.
              </p>
            </div>
            <Paperclip className="h-4 w-4 text-cyan-400" />
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setAttachmentMode("none")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${attachmentMode === "none"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              None
            </button>
            <button
              type="button"
              onClick={() => setAttachmentMode("manual")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${attachmentMode === "manual"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Manually
            </button>
            <button
              type="button"
              onClick={() => setAttachmentMode("vault")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${attachmentMode === "vault"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <FolderLock className="h-3.5 w-3.5" />
              From Vault ({vaultDocs.length})
            </button>
          </div>

          {/* Manual File Upload View */}
          {attachmentMode === "manual" && (
            <div className="space-y-4 pt-2">
              <input
                ref={manualFileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf,image/*,text/plain"
                onChange={handleManualFileChange}
              />

              {!manualFile ? (
                <div
                  onClick={() => manualFileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl p-6 text-center bg-cyan-950/10 hover:bg-cyan-950/20 transition group"
                >
                  <Upload className="h-8 w-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition" />
                  <p className="text-xs font-semibold text-white">Click or drag & drop to attach a file</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PDF, JPG, PNG, or TXT up to 25 MB. Automatically encrypted with AES-256-GCM into your vault.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                        <File className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-xs">{manualFile.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {Math.round(manualFile.size / 1024)} KB · {manualFile.type || "Document"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearManualFile}
                      className="p-1.5 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                        Attachment Title
                      </label>
                      <input
                        type="text"
                        value={manualDocTitle}
                        onChange={(e) => setManualDocTitle(e.target.value)}
                        placeholder="e.g. Terms & Conditions Agreement"
                        className="input-field text-xs py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                        Document Classification
                      </label>
                      <select
                        value={manualDocType}
                        onChange={(e) => setManualDocType(e.target.value)}
                        className="input-field text-xs py-2"
                      >
                        <option value="Rental Agreement">Rental Agreement</option>
                        <option value="Reference Document">Reference Document</option>
                        <option value="Medical Report">Medical Report</option>
                        <option value="Identity Proof">Identity Proof</option>
                        <option value="Employment Letter">Employment Letter</option>
                        <option value="Degree Certificate">Degree Certificate</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vault Documents Selection View */}
          {attachmentMode === "vault" && (
            <div className="space-y-3 pt-2">
              {loadingVaultDocs ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                  Loading your encrypted vault documents...
                </div>
              ) : vaultDocs.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 text-center space-y-2">
                  <FolderLock className="h-8 w-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No documents found in your vault</p>
                  <p className="text-[11px] text-slate-500">
                    Switch to &ldquo;Upload Manually&rdquo; to attach a file directly, or upload documents in your vault first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {vaultDocs.map((doc) => {
                    const isSelected = selectedVaultDocId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedVaultDocId(doc.id)}
                        className={`cursor-pointer rounded-xl p-3 border transition flex items-center justify-between ${isSelected
                          ? "bg-cyan-950/40 border-cyan-500/50 shadow-sm"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-white/[0.05] text-slate-400"
                              }`}
                          >
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              {doc.title}
                              <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[9px] font-semibold text-cyan-400 border border-cyan-800/40">
                                {doc.doc_type}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {doc.original_filename} · {Math.round((doc.size_bytes || 0) / 1024) || 1} KB
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-1 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                              <Check className="h-3 w-3" /> Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="glass-card rounded-2xl p-6">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Required Document Types <span className="text-slate-600 normal-case">(select at least one)</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {DOCUMENT_OPTIONS.map(({ value, icon }) => {
              const isSelected = selectedDocs.includes(value);
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => toggleDoc(value)}
                  className={`flex items-center justify-between rounded-xl p-3 text-xs font-medium transition text-left border ${isSelected
                    ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-200"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12] hover:text-slate-200"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span>{value}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Allowed actions */}
          <div className="glass-card rounded-2xl p-6">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Allowed Actions
            </label>
            <div className="space-y-2.5">
              {(["VIEW", "PRINT", "DOWNLOAD"] as const).map((act) => {
                const isSelected = allowedActions.includes(act);
                const colors =
                  act === "VIEW"
                    ? { on: "border-emerald-500/50 bg-emerald-950/30 text-emerald-200", check: "text-emerald-400" }
                    : act === "PRINT"
                      ? { on: "border-cyan-500/50 bg-cyan-950/30 text-cyan-200", check: "text-cyan-400" }
                      : { on: "border-purple-500/50 bg-purple-950/30 text-purple-200", check: "text-purple-400" };
                const label =
                  act === "VIEW"
                    ? "View-Only (Protected)"
                    : act === "PRINT"
                      ? "Print-Enabled"
                      : "Download-Enabled";
                return (
                  <button
                    type="button"
                    key={act}
                    onClick={() => toggleAction(act)}
                    className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-semibold border transition ${isSelected ? colors.on : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]"
                      }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check className={`h-3.5 w-3.5 ${colors.check}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Time-to-Live (TTL)
              </label>
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="input-field"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.minutes} value={d.minutes}>{d.label}</option>
              ))}
            </select>
            <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-600">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>Server-enforced. Elapsed windows are strictly rejected on every request.</span>
            </div>
          </div>
        </div>

        {/* Two distinct delivery actions: Send to Wallet Owner vs Generate QR Code */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Button 1: Send directly to wallet owner */}
            <button
              type="button"
              onClick={() => handleCreateRequest("direct")}
              disabled={isSubmitting || selectedDocs.length === 0}
              className="relative group flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/30 hover:border-emerald-400 hover:from-emerald-950/60 hover:to-cyan-950/50 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-1 group-hover:text-emerald-300 transition">
                {isSubmitting && submittingMode === "direct" ? (
                  <span className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                )}
                <span>Send to Wallet Owner</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Direct delivery to recipient&apos;s wallet dashboard. No QR code generated.
              </p>
              {targetWallet.trim() && (
                <span className="mt-2 text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full truncate max-w-full">
                  To: {formatAddress(targetWallet.trim())}
                </span>
              )}
            </button>

            {/* Button 2: Generate Consent QR Code */}
            <button
              type="button"
              onClick={() => handleCreateRequest("qr")}
              disabled={isSubmitting || selectedDocs.length === 0}
              className="relative group flex flex-col items-center justify-center p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 to-cyan-950/40 hover:border-cyan-400 hover:from-slate-900 hover:to-cyan-900/50 transition-all shadow-xl shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-1 group-hover:text-cyan-300 transition">
                {isSubmitting && submittingMode === "qr" ? (
                  <span className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 text-cyan-400 group-hover:scale-105 transition-transform" />
                )}
                <span>Generate Consent QR Code</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Creates on-screen &amp; printable QR for in-person mobile camera scanning.
              </p>
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-500">
            Choose <span className="text-emerald-400 font-semibold">Send to Wallet Owner</span> for direct wallet-to-wallet requests, or <span className="text-cyan-400 font-semibold">Generate Consent QR Code</span> for physical or camera-based verification.
          </p>
        </div>
      </form>
    </div>
  );
}
