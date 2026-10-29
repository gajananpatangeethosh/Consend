"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletContext";
import {
  QrCode,
  ShieldAlert,
  Clock,
  ArrowRight,
  FileCheck,
  Building,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_OPTIONS = [
  "Degree Certificate",
  "Medical Report",
  "Rental Agreement",
  "Income Statement",
  "Identity Proof (Mock)",
];

const DURATION_OPTIONS = [
  { label: "1 Minute (Fast Test)", minutes: 1 },
  { label: "2 Minutes", minutes: 2 },
  { label: "5 Minutes (Xerox / Print)", minutes: 5 },
  { label: "15 Minutes (Outpatient)", minutes: 15 },
  { label: "1 Hour (Counseling)", minutes: 60 },
  { label: "24 Hours (Background Check)", minutes: 1440 },
];

export default function NewRequestPage() {
  const router = useRouter();
  const { address, formatAddress, connectWallet } = useWallet();

  const [title, setTitle] = useState("University Admission Verification");
  const [purpose, setPurpose] = useState("Verify B.Tech academic credentials for candidate physical counseling session.");
  const [selectedDocs, setSelectedDocs] = useState<string[]>(["Degree Certificate"]);
  const [allowedActions, setAllowedActions] = useState<("VIEW" | "PRINT")[]>(["VIEW"]);
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
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

    const requesterWallet = address || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

    if (!title.trim() || !purpose.trim()) {
      toast.error("Please enter a request title and purpose");
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
          requesterWallet,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create request");
      }

      toast.success("Consent request and QR code created!");
      router.push(`/requests/${data.request.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300 mb-3">
          <QrCode className="h-3.5 w-3.5" />
          <span>Step 1: Requester Workflow</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Document Consent Request
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          Specify the purpose, documents required, and precise time limit. Generating this request creates a temporary QR code for the document owner to scan and approve.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Requester Identity Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Requester Wallet (BridgeKey / EVM)</div>
              <div className="text-xs font-mono font-semibold text-white">
                {address || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (St. Xavier College)"}
              </div>
            </div>
          </div>

          {!address && (
            <button
              type="button"
              onClick={connectWallet}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Title & Purpose */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Request Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. University Admission Verification"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Specific Purpose (Notice to Document Owner)
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder="Explain why these documents are required..."
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Required Document Types */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Required Document Types (Select 1 or more)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DOCUMENT_OPTIONS.map((doc) => {
              const isSelected = selectedDocs.includes(doc);
              return (
                <button
                  type="button"
                  key={doc}
                  onClick={() => toggleDoc(doc)}
                  className={`flex items-center justify-between rounded-xl p-3 text-xs font-medium transition text-left border ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-950/40 text-cyan-300"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className={`h-4 w-4 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                    <span>{doc}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allowed Actions & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Allowed Actions
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleAction("VIEW")}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-medium border transition ${
                  allowedActions.includes("VIEW")
                    ? "border-emerald-500 bg-emerald-950/30 text-emerald-300"
                    : "border-slate-800 bg-slate-950/40 text-slate-400"
                }`}
              >
                <span>View-Only (Protected Screen)</span>
                {allowedActions.includes("VIEW") && <Check className="h-4 w-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => toggleAction("PRINT")}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-medium border transition ${
                  allowedActions.includes("PRINT")
                    ? "border-cyan-500 bg-cyan-950/30 text-cyan-300"
                    : "border-slate-800 bg-slate-950/40 text-slate-400"
                }`}
              >
                <span>Print-Enabled (Xerox / Physical Print)</span>
                {allowedActions.includes("PRINT") && <Check className="h-4 w-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Duration */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Time-to-Live (TTL)</span>
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.minutes} value={d.minutes}>
                  {d.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-slate-500">
              Server-enforced. Once elapsed, all subsequent access attempts are strictly rejected.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Generating QR & Registering on MST...</span>
          ) : (
            <>
              <span>Generate Request QR Code</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
