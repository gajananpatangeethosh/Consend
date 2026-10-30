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
  Fingerprint,
  Layers,
  Timer,
  ArrowUpRight,
  Sparkles,
  Shield,
  FileCheck,
  UserCheck,
  HardDrive,
} from "lucide-react";
import {
  ACTIVE_NETWORK,
  CONSENT_REGISTRY_ADDRESS,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";
import { ConsendIcon } from "@/components/ui/ConsendLogo";

/* ─── Hero Visual: Next-Gen Aesthetic Consend Interactive Showcase ─── */
function HeroVisual() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none" aria-hidden="true">
      {/* Dynamic atmospheric radial glows */}
      <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/[0.08] to-emerald-500/[0.05] blur-2xl pointer-events-none" />

      {/* Main Glassmorphic Showcase Stage */}
      <div className="relative rounded-3xl border border-white/[0.12] bg-[#050B1A]/85 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_25px_80px_-20px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">

        {/* Subtle grid pattern inside card */}
        <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />

        {/* Card Header Chrome */}
        <div className="relative flex items-center justify-between pb-5 border-b border-white/[0.07] mb-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            </div>
            <span className="ml-2 font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-cyan-400 font-bold">consend://</span>session-54635.view
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              ACTIVE VERIFICATION
            </span>
          </div>
        </div>

        {/* Centerpiece: Active Ephemeral Document Card */}
        <div className="relative space-y-4">

          {/* Document Identity Banner */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-cyan-400/10 to-emerald-400/20 border border-cyan-400/30 text-cyan-300 shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)]">
                <FileText className="h-6 w-6 text-cyan-400" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center border border-[#050B1A]">
                  <Check className="h-2.5 w-2.5 text-slate-950 stroke-[3]" />
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Degree_Certificate_2026.pdf</span>
                  <span className="rounded-md bg-cyan-950/80 text-cyan-300 text-[10px] font-mono font-semibold px-2 py-0.5 border border-cyan-500/30">
                    AES-256-GCM
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Owner: <span className="font-mono text-slate-300">0x7099…79C8</span> (Alice)
                </div>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="text-right">
              <div className="text-[9px] font-mono uppercase tracking-widest text-amber-400/90 font-semibold flex items-center justify-end gap-1">
                <Timer className="h-3 w-3" />
                <span>Expires In</span>
              </div>
              <div className="text-base sm:text-lg font-mono font-extrabold text-amber-300 tracking-tight drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                04:59
              </div>
            </div>
          </div>

          {/* Scope & Verified Watermark Stage */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#02050D]/90 p-4 min-h-[140px] flex flex-col justify-between">
            {/* Repeating Dynamic Security Watermark Overlay */}
            <div className="absolute inset-0 pointer-events-none select-none opacity-[0.07] flex flex-wrap items-center justify-around gap-6 rotate-[-12deg] scale-105 z-10 font-mono text-[9px] text-white">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="text-center font-bold tracking-wider">
                  <div>CONSEND // VERIFIED ACCESS ONLY</div>
                  <div>RECIPIENT: ST. XAVIER [0x3C44…93BC]</div>
                </div>
              ))}
            </div>

            <div className="relative z-20 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Declared Purpose:</span>
                <span className="text-cyan-300 font-semibold">University Admission Counseling</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Recipient Organization:</span>
                <span className="text-white font-mono">St. Xavier Admissions</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Permissions Granted:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> View-Only (Protected Canvas)
                </span>
              </div>
            </div>

            {/* Simulated document lines preview */}
            <div className="relative z-20 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="truncate">Keccak256: 0x8f2a41dc…b491</span>
              <span className="text-emerald-400/90 font-semibold">✓ Non-Revoked</span>
            </div>
          </div>

          {/* Bottom Live Action Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-black/40 border border-white/[0.05] p-2.5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono">Blockchain State</div>
                <div className="text-[11px] font-bold text-white">Confirmed (MST)</div>
              </div>
            </div>

            <div className="rounded-xl bg-black/40 border border-white/[0.05] p-2.5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono">Kill Switch</div>
                <div className="text-[11px] font-bold text-cyan-300">Instant Revocation</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Satellite Chips */}
      {/* Chip 1: Top-Right Smart Contract */}
      <div className="absolute -top-4 -right-4 hidden sm:flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-[#061024]/95 px-3.5 py-2 text-xs font-mono text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-float">
        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
        <div>
          <div className="text-[9px] text-slate-500 uppercase">MST Coral Registry</div>
          <div className="text-[11px] text-cyan-300 font-bold">0x8A9b…6eF1</div>
        </div>
      </div>

      {/* Chip 2: Bottom-Left Identity */}
      <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-[#04121B]/95 px-3.5 py-2 text-xs font-mono text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-float" style={{ animationDelay: "1.2s" }}>
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <div>
          <div className="text-[9px] text-slate-500 uppercase">EIP-1193 BridgeKey</div>
          <div className="text-[11px] text-emerald-300 font-bold">Cryptographically Signed</div>
        </div>
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─── Main Landing Page ────────────────────────────────────────────── */
export default function LandingPage() {
  const steps = [
    {
      num: "01",
      icon: QrCode,
      accent: "cyan",
      title: "Generate Consent Request",
      desc: "Set purpose, requested document categories, permitted actions, and a strict time limit (TTL). Share instantly via high-resolution QR code.",
    },
    {
      num: "02",
      icon: Eye,
      accent: "violet",
      title: "Inspect & Upload / Select",
      desc: "Document owner inspects the declared purpose and time window, selects or uploads their document, and approves access directly.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      accent: "emerald",
      title: "On-Chain Commitment",
      desc: "Deterministic terms hashes and lifecycle states are registered on the MST Blockchain smart contract without exposing plaintext bytes.",
    },
    {
      num: "04",
      icon: Clock,
      accent: "amber",
      title: "Time-Bound Protected Viewing",
      desc: "Authorized recipient views the document with dynamic watermarking. Access auto-terminates when the TTL elapses or if the owner revokes it.",
    },
  ];

  const accentStyles: Record<string, { icon: string; border: string; bg: string; glow: string }> = {
    cyan: { icon: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/[0.08]", glow: "shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]" },
    violet: { icon: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/[0.08]", glow: "shadow-[0_0_20px_-5px_rgba(139,92,246,0.2)]" },
    emerald: { icon: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/[0.08]", glow: "shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]" },
    amber: { icon: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/[0.08]", glow: "shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]" },
  };

  const useCases = [
    {
      icon: GraduationCap,
      title: "University Admissions",
      desc: "Share degree certificates for exactly 2 hours during physical counseling. No permanent copies left on staff hard drives.",
      tag: "Education",
    },
    {
      icon: Printer,
      title: "Xerox & Print Shops",
      desc: "Grant 5-minute print-enabled access to a xerox operator. Automatically revoked once the print job concludes.",
      tag: "Services",
    },
    {
      icon: Hospital,
      title: "Hospitals & Diagnostics",
      desc: "Temporary specialist access to sensitive lab reports and scans during outpatient visits, preserving privacy.",
      tag: "Healthcare",
    },
    {
      icon: Building,
      title: "Tenant Verification",
      desc: "Time-limited viewing of employment or identity proofs for landlords and brokers without permanent document leakage.",
      tag: "Real Estate",
    },
  ];

  const securityPoints = [
    {
      icon: KeyRound,
      title: "Canonical Terms Hash",
      desc: "Purpose, requester, document type, and expiry are hashed with Keccak256 and committed on-chain.",
    },
    {
      icon: Clock,
      title: "Server-Enforced Expiry",
      desc: "Never relies on browser clocks. Every access attempt is server-validated against live revocation and server timestamp.",
    },
    {
      icon: Lock,
      title: "Zero PII On-Chain",
      desc: "Only pseudonymous identifiers and cryptographic hashes live on the blockchain. Document bytes remain AES-256 encrypted.",
    },
    {
      icon: Zap,
      title: "Instant 1-Click Revocation",
      desc: "Owner can revoke consent at any moment. The contract state updates immediately, terminating active viewer sessions.",
    },
  ];

  return (
    <div className="flex flex-col">

      {/* ════════════════════════════════════════════════════════════════
          HERO SECTION
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-6 pb-16 lg:py-0">
        {/* Deep ambient backdrop */}
        <div className="absolute inset-0 bg-[#02050E]" />
        <div className="absolute inset-0 grid-bg opacity-35" />
        <div className="hero-glow-1 absolute inset-0" />
        <div className="hero-glow-2 absolute inset-0" />

        {/* Ambient atmospheric lighting */}
        <div className="absolute top-[8%] left-[12%] h-80 w-80 rounded-full bg-cyan-600/[0.07] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[15%] right-[10%] h-96 w-96 rounded-full bg-emerald-600/[0.05] blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[85vh]">

            {/* Left Column: Core Message & Actions */}
            <div className="lg:col-span-7 text-center lg:text-left">

              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-emerald-950/30 px-4 py-1.5 text-[11px] font-medium text-cyan-300 mb-8 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="font-semibold text-white">Consend Protocol</span>
                <span className="text-slate-500">·</span>
                <span>MST Coral Testnet (Chain {ACTIVE_NETWORK.chainId})</span>
                <ArrowRight className="h-3 w-3 text-cyan-400 ml-0.5" />
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black tracking-tight text-white leading-[1.06] mb-6">
                Send documents with
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.35)]">
                  verifiable consent.
                </span>
                <br />
                <span className="text-slate-400 text-[0.62em] font-semibold tracking-normal">
                  Temporary. Permissioned. On-Chain.
                </span>
              </h1>

              {/* Paragraph */}
              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
                Consend transforms irreversible document sharing into temporary, permissioned viewing sessions.
                Colleges, clinics, and print shops access only what you approve — with server-enforced countdowns,
                dynamic watermarks, and instant 1-click revocation on the <span className="text-cyan-300 font-semibold">MST Blockchain</span>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-12">
                <Link
                  href="/requests/new"
                  className="btn-primary flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold rounded-2xl w-full sm:w-auto shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_-5px_rgba(6,182,212,0.7)] transition-all"
                  id="hero-cta-create"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Create Consent Request</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/documents"
                  className="btn-secondary flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-2xl w-full sm:w-auto border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] transition"
                  id="hero-cta-vault"
                >
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span>Encrypted Vault</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-[12px] text-slate-400 border-t border-white/[0.06] pt-6">
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

            {/* Right Column: High-End Hero Visual Canvas */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroVisual />
            </div>

          </div>
        </div>

        {/* Bottom Atmospheric Fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#03070F] to-transparent pointer-events-none" />
      </section>

      {/* ════════════════════════════════════════════════════════════════
          STATS BAR
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative -mt-10 z-10 pb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "Zero", label: "PII On-Chain", color: "text-white" },
              { value: "100%", label: "Server-Enforced TTL", color: "text-cyan-400" },
              { value: "< 1s", label: "Instant Kill Switch", color: "text-emerald-400" },
              { value: "EVM", label: "MST Coral Verified", color: "text-violet-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="glass-card rounded-2xl p-4 text-center border border-white/[0.06] hover:border-cyan-500/30 transition-colors duration-300 shadow-lg"
              >
                <div className={`text-xl sm:text-2xl font-extrabold ${s.color} mb-0.5`}>{s.value}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 leading-tight font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-[#03070F]" />
        <div className="absolute inset-0 grid-bg opacity-20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-cyan-400 mb-5">
              Protocol Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Four steps to
              <span className="gradient-text-cyan"> verifiable document consent</span>
            </h2>
            <p className="mt-4 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              From QR request creation to cryptographic verification — every transmission is time-bound and revocable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const style = accentStyles[s.accent];
              return (
                <div
                  key={s.num}
                  className="group glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden transition-all duration-300"
                >
                  <div className="absolute -top-2 -right-1 text-[80px] font-black text-white/[0.02] leading-none select-none pointer-events-none group-hover:text-white/[0.04] transition-colors duration-500">
                    {s.num}
                  </div>

                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-2 w-4 border-t border-dashed border-white/[0.08]" />
                  )}

                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${style.border} ${style.bg} ${style.glow} mb-5 transition-shadow duration-300`}>
                    <Icon className={`h-5 w-5 ${style.icon}`} />
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-semibold">Step {s.num}</div>
                  <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight">{s.title}</h3>
                  <p className="text-[12px] leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECURITY ARCHITECTURE
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#03070F] via-[#04091A] to-[#03070F]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400 mb-6">
                <Lock className="h-3 w-3" />
                Security Architecture
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Privacy-first engineering.
                <br />
                <span className="gradient-text-cyan">Zero plaintext on-chain.</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-10 max-w-lg">
                Personal identity documents should never live permanently in public ledgers.
                Consend stores only cryptographic commitments on the MST blockchain,
                while encrypted document bytes remain in private, access-controlled storage.
              </p>

              <div className="space-y-5">
                {securityPoints.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.title} className="flex items-start gap-4 group">
                      <div className="flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/[0.06] border border-cyan-500/15 group-hover:border-cyan-500/30 transition-colors">
                        <Icon className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                        <p className="text-[12px] text-slate-400 mt-0.5 leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative lg:mt-8">
              <div className="absolute -inset-6 bg-cyan-500/[0.03] rounded-3xl blur-3xl pointer-events-none" />

              <div className="relative glass-card rounded-3xl border border-white/[0.07] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05] bg-black/20">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-[11px] font-mono text-slate-500">ConsentRegistry.sol</span>
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    deployed
                  </span>
                </div>

                <div className="p-5">
                  <div className="rounded-xl bg-black/40 border border-white/[0.04] p-4 font-mono text-[11px] sm:text-[12px] space-y-2 leading-relaxed">
                    <div className="text-slate-600">{"// Consend on-chain record — zero PII"}</div>
                    <div>
                      <span className="text-violet-400">struct</span>
                      <span className="text-cyan-300 ml-1">ConsentRecord</span>
                      <span className="text-slate-600 ml-1">{"{"}</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-slate-500">consentId  </span>
                      <span className="text-cyan-300">bytes32</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-slate-500">requester  </span>
                      <span className="text-slate-300">address</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-slate-500">termsHash  </span>
                      <span className="text-cyan-300">bytes32</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-slate-500">status     </span>
                      <span className="text-emerald-400">Granted</span>
                      <span className="text-slate-600"> | </span>
                      <span className="text-red-400/70">Revoked</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-slate-500">expiresAt  </span>
                      <span className="text-amber-400">uint256</span>
                    </div>
                    <div><span className="text-slate-600">{"}"}</span></div>
                  </div>

                  <a
                    href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex items-center justify-between rounded-xl bg-cyan-950/20 border border-cyan-500/15 p-3.5 hover:border-cyan-500/30 transition-colors group"
                  >
                    <div>
                      <div className="text-[11px] text-cyan-300 font-semibold mb-0.5">Live Registry Contract</div>
                      <div className="text-[10px] font-mono text-slate-500 break-all">{CONSENT_REGISTRY_ADDRESS}</div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-cyan-500/60 flex-shrink-0 ml-3 group-hover:text-cyan-400 transition-colors" />
                  </a>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: "Network", val: "Coral" },
                      { label: "Gas", val: "~0 fee" },
                      { label: "Finality", val: "< 3s" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-black/30 border border-white/[0.03] p-2 text-center">
                        <div className="text-[11px] font-bold text-white">{s.val}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          USE CASES
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-[#03070F]" />
        <div className="absolute inset-0 grid-bg opacity-15" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-950/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-violet-400 mb-5">
              <Globe className="h-3 w-3" />
              Real-World Workflows
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Where ephemeral consent
              <br className="hidden sm:block" />
              <span className="gradient-text"> matters most</span>
            </h2>
            <p className="mt-4 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Real-world scenarios where time-bound, verifiable document access replaces irreversible copy sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCases.map((uc, idx) => {
              const Icon = uc.icon;
              return (
                <div
                  key={idx}
                  className="group glass-card glass-card-hover rounded-2xl p-6 flex items-start gap-5 transition-all duration-300"
                >
                  <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/[0.06] border border-cyan-500/15 text-cyan-400 group-hover:border-cyan-500/30 group-hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)] transition-all duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <h3 className="text-[15px] font-bold text-white tracking-tight">{uc.title}</h3>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800/80 rounded-full px-2 py-0.5">
                        {uc.tag}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-slate-400">{uc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28 sm:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#03070F] via-[#050B18] to-[#03070F]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.06] blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Experience the full
            <br />
            <span className="gradient-text">Consend workflow</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
            Create a consent request, scan the QR code, approve with your BridgeKey wallet,
            and verify the tamper-evident on-chain audit trail — end to end.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/requests/new"
              className="btn-primary flex items-center gap-2.5 px-8 py-4 text-sm font-bold rounded-2xl w-full sm:w-auto justify-center"
              id="cta-start-requester"
            >
              <span>Start as Requester</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/documents"
              className="btn-secondary flex items-center gap-2.5 px-8 py-4 text-sm font-semibold rounded-2xl w-full sm:w-auto justify-center"
              id="cta-document-vault"
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>Document Vault</span>
            </Link>
          </div>

          <div className="mt-14 inline-flex items-center gap-3 rounded-full border border-white/[0.05] bg-white/[0.02] px-5 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-500">Contract live on {ACTIVE_NETWORK.name}</span>
            </div>
            <div className="h-3 w-px bg-white/[0.08]" />
            <a
              href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              View on Explorer
              <ArrowUpRight className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
