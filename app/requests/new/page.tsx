"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletContext";
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
  const { address, connectWallet, formatAddress, isMounted } = useWallet();

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [allowedActions, setAllowedActions] = useState<("VIEW" | "PRINT")[]>(["VIEW"]);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDoc = (doc: string) => {
    if (selectedDocs.includes(doc)) {
      if (selectedDocs.length > 1) {
        setSelectedDocs(selectedDocs.filter((d) => d !== doc));
      }
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };

  const toggleAction = (act: "VIEW" | "PRINT") => {
    if (allowedActions.includes(act)) {
      if (allowedActions.length > 1) {
        setAllowedActions(allowedActions.filter((a) => a !== act));
      }
    } else {
      setAllowedActions([...allowedActions, act]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsSubmitting(true);
    try {
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create request");

      if (data.request?.plainToken) {
        localStorage.setItem(`consent_plain_token_${data.request.id}`, data.request.plainToken);
      }

      toast.success("Consent request & QR code created!");
      router.push(`/requests/${data.request.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create request");
    } finally {
      setIsSubmitting(false);
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
          onClick={connectWallet}
          className="btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl text-sm"
          suppressHydrationWarning
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Requester identity */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Requester Wallet</div>
              <div className="text-sm font-mono font-semibold text-white mt-0.5">{formatAddress(address)}</div>
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

        {/* Required document types */}
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
                  className={`flex items-center justify-between rounded-xl p-3 text-xs font-medium transition text-left border ${
                    isSelected
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
              {(["VIEW", "PRINT"] as const).map((act) => {
                const isSelected = allowedActions.includes(act);
                const colors = act === "VIEW"
                  ? { on: "border-emerald-500/50 bg-emerald-950/30 text-emerald-200", check: "text-emerald-400" }
                  : { on: "border-cyan-500/50 bg-cyan-950/30 text-cyan-200", check: "text-cyan-400" };
                return (
                  <button
                    type="button"
                    key={act}
                    onClick={() => toggleAction(act)}
                    className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-semibold border transition ${
                      isSelected ? colors.on : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]"
                    }`}
                  >
                    <span>{act === "VIEW" ? "View-Only (Protected)" : "Print-Enabled"}</span>
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

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || selectedDocs.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2.5 py-4 text-sm rounded-2xl disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Generating QR & Registering on MST…
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4" />
              Generate Consent QR Code
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
