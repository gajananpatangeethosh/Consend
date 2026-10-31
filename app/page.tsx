import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Clock,
  Lock,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  FileText,
  KeyRound,
  Eye,
  Building,
  GraduationCap,
  Hospital,
  Printer,
  Zap,
  Globe,
  Timer,
  ArrowUpRight,
  Shield,
  Layers,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  ACTIVE_NETWORK,
  CONSENT_REGISTRY_ADDRESS,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";

/* ─── Hero Visual: Precision-Engineered Consent Session Inspector ─── */
function HeroVisual() {
  return (
    <div className="relative w-full max-w-[540px] mx-auto select-none" aria-hidden="true">
      {/* Subtle, refined atmospheric backlighting */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/10 via-transparent to-emerald-500/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Main Glass Console */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#070C18]/90 backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        
        {/* Console Header Chrome */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700/80" />
            </div>
            <div className="h-3 w-px bg-white/[0.08] mx-0.5" />
            <span className="font-mono text-[11px] text-slate-400">
              consend://session/<span className="text-slate-200">grant_8f2a…41dc</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span>LIVE SESSION</span>
          </div>
        </div>

        {/* Document Status Header Card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                  <span>Degree_Certificate_2026.pdf</span>
                  <span className="text-[9px] font-mono font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/25 px-1.5 py-0.2 rounded">
                    AES-256
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span>Owner:</span>
                  <span className="font-mono text-slate-300">0x7099…79C8</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">1.8 MB</span>
                </div>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="text-right shrink-0">
              <div className="text-[9px] font-mono uppercase tracking-wider text-amber-400/90 font-medium flex items-center justify-end gap-1">
                <Timer className="h-3 w-3" />
                <span>Expires In</span>
              </div>
              <div className="text-sm sm:text-base font-mono font-bold text-amber-300 tracking-tight">
                04:59
              </div>
            </div>
          </div>

          {/* Micro Progress Track */}
          <div className="mt-3 w-full bg-slate-800/60 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-amber-400 h-1 rounded-full w-[62%]" />
          </div>
        </div>

        {/* Verification Policy Matrix */}
        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 mb-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Declared Purpose</span>
            <span className="text-white font-medium">University Admission Counseling</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Recipient</span>
            <span className="text-slate-200 font-mono text-[11px]">St. Xavier Admissions (0x3C44…93BC)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Permissions</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
              <Check className="h-3 w-3" /> View-Only · Protected Canvas
            </span>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Keccak256</span>
            <span className="text-slate-400">0x8f2a41dc…b491</span>
          </div>
        </div>

        {/* Bottom Status & Sovereign Control Bar */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-400 font-mono">MST Block #849,201</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/15 transition-colors cursor-default">
              <Zap className="h-3 w-3" />
              <span>Revoke Access</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Main Landing Page ────────────────────────────────────────────── */
export default function LandingPage() {
  const steps = [
    {
      num: "01",
      icon: QrCode,
      title: "Define Purpose & Policy",
      desc: "Specify permitted document categories, declared intent, dynamic watermarking, and a strict time limit (TTL). Share instantly via secure QR code.",
    },
    {
      num: "02",
      icon: Eye,
      title: "Owner Inspects & Approves",
      desc: "The document holder verifies the requester's identity and terms, unlocks their encrypted file, and signs the time-limited consent grant.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "On-Chain Commitment",
      desc: "Deterministic terms hashes and lifecycle states are registered on the MST Blockchain smart contract without exposing raw plaintext bytes.",
    },
    {
      num: "04",
      icon: Clock,
      title: "Protected Ephemeral Viewing",
      desc: "Authorized recipient views via protected canvas with forensic watermarking. Access terminates automatically when the TTL elapses or if revoked.",
    },
  ];

  const useCases = [
    {
      icon: GraduationCap,
      title: "University Admissions",
      desc: "Share degree certificates and transcripts for exactly 2 hours during physical counseling. No permanent copies left on staff hard drives.",
      tag: "Higher Education",
      ttl: "2 Hours TTL",
    },
    {
      icon: Printer,
      title: "Commercial Print & Xerox",
      desc: "Grant 5-minute single-print access to a xerox operator. Automatically terminated once the print job concludes.",
      tag: "Services",
      ttl: "5 Minutes TTL",
    },
    {
      icon: Hospital,
      title: "Clinical Diagnostics",
      desc: "Temporary specialist access to sensitive lab reports and scans during outpatient visits, preventing data leakage in hospital archives.",
      tag: "Healthcare",
      ttl: "1 Hour TTL",
    },
    {
      icon: Building,
      title: "Tenant & KYC Verification",
      desc: "Time-limited viewing of employment proofs and identity documents for landlords and brokers without permanent document retention.",
      tag: "Real Estate",
      ttl: "24 Hours TTL",
    },
  ];

  const securityPoints = [
    {
      icon: KeyRound,
      title: "Canonical Terms Hash",
      desc: "Purpose, requester identity, document type, and expiry timestamp are deterministically hashed with Keccak256 and committed on-chain.",
    },
    {
      icon: Clock,
      title: "Server-Enforced Expiration",
      desc: "Never relies on browser clocks. Every access request is cryptographically validated on the server against the live contract timestamp.",
    },
    {
      icon: Lock,
      title: "Zero Plaintext On-Chain",
      desc: "Only pseudonymous identifiers and cryptographic hashes live on the blockchain. Document bytes remain AES-256-GCM encrypted off-chain.",
    },
    {
      icon: Zap,
      title: "Instant 1-Click Revocation",
      desc: "The owner can terminate consent at any second. The smart contract state updates immediately, instantly disconnecting active viewers.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100">

      {/* ════════════════════════════════════════════════════════════════
          HERO SECTION
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden border-b border-white/[0.06]">
        {/* Subtle, restrained ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.08),_transparent_70%)] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 text-center lg:text-left">
              
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs text-slate-300 mb-6 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">Consend Protocol</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Verifiable Ephemeral Document Sharing</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.08] mb-6">
                Document sharing with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  verifiable consent.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
                Transform permanent document handoffs into temporary, permissioned viewing sessions.
                Recipients access strictly what you approve — with server-enforced countdowns, forensic watermarks,
                and instant revocation on the <span className="text-slate-200 font-medium">MST Blockchain</span>.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
                <Link
                  href="/requests/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3.5 text-sm font-semibold transition-colors shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)]"
                  id="hero-cta-create"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Create Consent Request</span>
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </Link>

                <Link
                  href="/documents"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white px-6 py-3.5 text-sm font-medium transition-colors"
                  id="hero-cta-vault"
                >
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>Encrypted Vault</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>AES-256-GCM Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Zero Plaintext On-Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Server-Enforced TTL</span>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Visual Console */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroVisual />
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          METRIC PROOF STRIP
         ════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-white/[0.06] bg-[#050914]/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            <div className="pt-4 md:pt-0">
              <div className="text-2xl font-bold text-white tracking-tight">0 bytes</div>
              <div className="text-xs text-slate-400 mt-1">Plaintext stored on-chain</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl font-bold text-cyan-400 tracking-tight">&lt; 1 sec</div>
              <div className="text-xs text-slate-400 mt-1">Instant kill-switch revocation</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">100%</div>
              <div className="text-xs text-slate-400 mt-1">Server & contract verified TTL</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl font-bold text-slate-200 tracking-tight">MST L1</div>
              <div className="text-xs text-slate-400 mt-1">Mainnet & Coral Testnet</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS (WORKFLOW)
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-3">
              Workflow Architecture
            </h2>
            <p className="text-3xl font-bold text-white tracking-tight">
              Four steps to verifiable document consent
            </p>
            <p className="mt-3 text-sm text-slate-400">
              From cryptographic request generation to time-limited viewing, every transition is provable and revocable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs text-slate-500 font-medium">
                        STEP {step.num}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECURITY ARCHITECTURE
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 border-b border-white/[0.06] bg-[#02050E]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left: Security Pillars */}
            <div className="lg:col-span-6">
              <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold mb-3">
                Security Engineering
              </h2>
              <p className="text-3xl font-bold text-white tracking-tight mb-4">
                Privacy by design. Zero plaintext on public ledgers.
              </p>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                Personal identity records and sensitive files must never be persisted on immutable public blockchains.
                Consend separates cryptographic commitment from content storage.
              </p>

              <div className="space-y-4">
                {securityPoints.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-cyan-400">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-white">{item.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Contract Inspector Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-white/[0.08] bg-[#070C18] p-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                    <span className="font-mono text-xs text-slate-400 ml-2">ConsentRegistry.sol</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    VERIFIED CONTRACT
                  </span>
                </div>

                <div className="rounded-xl bg-black/40 border border-white/[0.04] p-4 font-mono text-xs text-slate-300 leading-relaxed mb-4">
                  <div className="text-slate-500 mb-2">{"// Immutable On-Chain Record Structure"}</div>
                  <div><span className="text-purple-400">struct</span> <span className="text-cyan-300">ConsentRecord</span> {"{"}</div>
                  <div className="pl-4 text-slate-400">bytes32 <span className="text-slate-200">consentId;</span></div>
                  <div className="pl-4 text-slate-400">address <span className="text-slate-200">requester;</span></div>
                  <div className="pl-4 text-slate-400">bytes32 <span className="text-slate-200">termsHash;</span> <span className="text-slate-500">// Keccak-256</span></div>
                  <div className="pl-4 text-slate-400">uint8   <span className="text-slate-200">status;</span>    <span className="text-slate-500">// Granted | Revoked</span></div>
                  <div className="pl-4 text-slate-400">uint256 <span className="text-slate-200">expiresAt;</span> <span className="text-slate-500">// Unix Epoch</span></div>
                  <div>{"}"}</div>
                </div>

                <a
                  href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs hover:border-white/[0.12] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white mb-0.5">Deployment Address</div>
                    <div className="font-mono text-[11px] text-slate-400 truncate">{CONSENT_REGISTRY_ADDRESS}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500 shrink-0 ml-3" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          USE CASES
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold mb-3">
              Application Scenarios
            </h2>
            <p className="text-3xl font-bold text-white tracking-tight">
              Where ephemeral consent solves document exposure
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Replace irreversible document attachment downloads with controlled, auto-expiring access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <div
                  key={uc.title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/[0.14] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-cyan-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 border border-white/[0.08] rounded-md px-2 py-0.5">
                        {uc.tag}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-0.5">
                        {uc.ttl}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2">{uc.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{uc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CLOSING CALL TO ACTION
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-28 relative overflow-hidden">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Take sovereign control of your sensitive documents.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Create a consent request, approve via your BridgeKey wallet, and verify tamper-evident cryptographic provenance end to end.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/requests/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3.5 text-sm font-semibold transition-colors"
              id="cta-start-requester"
            >
              <span>Create Consent Request</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/documents"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white px-6 py-3.5 text-sm font-medium transition-colors"
              id="cta-document-vault"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              <span>Document Vault</span>
            </Link>
          </div>

          <div className="mt-10 inline-flex items-center gap-2 text-xs text-slate-500">
            <span>Contract verified on {ACTIVE_NETWORK.name}</span>
            <span>·</span>
            <a
              href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors underline underline-offset-4 flex items-center gap-0.5"
            >
              <span>View Explorer</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
