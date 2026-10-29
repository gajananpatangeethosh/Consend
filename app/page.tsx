import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Clock,
  Lock,
  Layers,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Ban,
  FileText,
  KeyRound,
  Eye,
  Building,
  GraduationCap,
  Hospital,
  Printer,
} from "lucide-react";
import { ACTIVE_NETWORK, CONSENT_REGISTRY_ADDRESS, getExplorerAddressUrl } from "@/lib/blockchain/config";

export default function LandingPage() {
  const steps = [
    {
      num: "01",
      icon: QrCode,
      title: "Requester Generates QR",
      desc: "A college, clinic, or Xerox shop creates a purpose-specific request (e.g., 'Admission Verification', 15 mins view-only) and generates a temporary QR code.",
    },
    {
      num: "02",
      icon: Eye,
      title: "Owner Scans & Reviews",
      desc: "Document owner scans the QR code on their device, inspects the exact requested purpose, permitted actions, and time limit before making a decision.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Consent Recorded on MST",
      desc: "Owner approves the request. The cryptographic terms hash and grant lifecycle state are committed to the MST Blockchain smart contract.",
    },
    {
      num: "04",
      icon: Clock,
      title: "Time-Bound Access & Revoke",
      desc: "Requester accesses the authorized document in the protected viewer. Access automatically expires, or can be instantly revoked by the owner at any time.",
    },
  ];

  const useCases = [
    {
      icon: GraduationCap,
      title: "College Admissions & Scholarships",
      desc: "Share your degree certificates or income statements with university admissions for 2 hours during physical counseling without leaving permanent digital copies.",
    },
    {
      icon: Printer,
      title: "Xerox & Cyber Cafes",
      desc: "Allow a printing shop to access your document for exactly 5 minutes with print-enabled permissions, automatically revoking access once the print queue finishes.",
    },
    {
      icon: Hospital,
      title: "Hospitals & Diagnostics",
      desc: "Grant consulting specialists temporary access to previous diagnostic panels during an outpatient visit, preserving medical confidentiality.",
    },
    {
      icon: Building,
      title: "Tenant Background Checks",
      desc: "Provide prospective landlords time-limited viewing of employment or identity proofs for verification without giving away raw file ownership.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-medium text-cyan-300 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MST Blockchain Testnet Powered • Chain ID {ACTIVE_NETWORK.chainId}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Your documents. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Your consent.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Temporary, permissioned, and provable — on-chain. Share documents with colleges, Xerox centres, and landlords with strict time limits, instant revocation, and a tamper-evident MST blockchain audit trail.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/requests/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:opacity-95 hover:scale-[1.02]"
            >
              <span>Create Consent Request</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:border-cyan-500/40"
            >
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Explore Dashboard</span>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">Zero</div>
              <div className="text-xs text-slate-400 mt-1">Plaintext Docs On-Chain</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-cyan-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Server-Enforced Expiry</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-emerald-400">&lt; 1 sec</div>
              <div className="text-xs text-slate-400 mt-1">Instant Revocation Check</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">EVM / MST</div>
              <div className="text-xs text-slate-400 mt-1">Immutable Audit Trail</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full py-20 bg-[#091126] border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">How Consent Chain Works</h2>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
              Four steps from QR request to verifiable revocation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-cyan-500/30 hover:bg-slate-900"
                >
                  <div className="text-3xl font-black text-slate-800 mb-4">{s.num}</div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Privacy Architecture */}
      <section className="w-full py-20 bg-[#070D1E] border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-300 mb-4">
                <Lock className="h-3.5 w-3.5" />
                <span>Honest Security & Privacy Architecture</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Privacy-first engineering. <br />
                <span className="text-cyan-400">Minimal on-chain commitments.</span>
              </h2>
              <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                Personal identity documents should never live permanently in public ledgers. Consent Chain stores only cryptographic commitments on the MST blockchain, while encrypted document bytes remain in private, access-controlled storage.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Canonical Terms Hash</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      The requester, purpose, document type, permitted actions (View/Print), and expiry are hashed deterministically with Keccak256.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Server-Enforced Expiry & Revocation</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Never relies on browser clocks. Every document byte request is validated by the server against active revocation and server timestamp.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">No Wallet Required for Notice Review</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Recipients and owners can inspect the terms transparently via web notice. BridgeKey wallet is used for signing and on-chain verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Box */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2 text-cyan-400">
                  <KeyRound className="h-4 w-4" />
                  <span>ConsentRegistry.sol (MST)</span>
                </div>
                <span className="text-emerald-400">Online • Block mined</span>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="rounded-lg bg-black/40 p-3 border border-slate-800">
                  <span className="text-slate-500">// On-Chain Record (Zero PII)</span>
                  <div className="text-slate-300 mt-1">consentId: 0x8f2a...91e4</div>
                  <div className="text-slate-300">requester: 0x3C44Cd...93BC</div>
                  <div className="text-slate-300">termsHash: 0x4e7b...18a2</div>
                  <div className="text-emerald-400">status: Granted (2)</div>
                </div>

                <div className="rounded-lg bg-cyan-950/20 p-3 border border-cyan-800/30">
                  <div className="flex items-center justify-between text-cyan-300 font-semibold mb-1">
                    <span>Live Smart Contract</span>
                    <a
                      href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] hover:underline"
                    >
                      View on Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="text-[11px] text-slate-400 break-all">
                    {CONSENT_REGISTRY_ADDRESS}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Use Cases */}
      <section className="w-full py-20 bg-[#091126] border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Everyday Use Cases</h2>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
              Where temporary document consent matters most
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((uc, idx) => {
              const Icon = uc.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-start gap-4 transition hover:border-slate-700"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">{uc.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-400">{uc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 bg-gradient-to-b from-[#070D1E] to-[#0B132B] text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Experience the End-to-End Consent Workflow
          </h2>
          <p className="mt-4 text-slate-300 text-sm max-w-xl mx-auto">
            Test creating a document request, scanning the QR code, granting consent with simulated or live BridgeKey wallet, and verifying the on-chain audit trail.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/requests/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:opacity-95"
            >
              <span>Start as Requester</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/documents"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <span>View Document Vault</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
