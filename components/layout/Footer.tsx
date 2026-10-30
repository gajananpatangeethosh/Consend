import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, AlertTriangle } from "lucide-react";
import { ConsendLogo } from "@/components/ui/ConsendLogo";
import {
  ACTIVE_NETWORK,
  CONSENT_REGISTRY_ADDRESS,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";

const footerLinks = {
  application: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/requests/new", label: "New Consent Request" },
    { href: "/documents", label: "Encrypted Vault" },
    { href: "/consents", label: "Consent Grants" },
    { href: "/audit", label: "Audit Trail" },
    { href: "/settings", label: "Settings" },
  ],
  blockchain: [
    { href: "https://mstblockchain.com/", label: "MST Official Portal", external: true },
    { href: "https://coral.mstscan.com", label: "Coral Explorer", external: true },
    { href: "https://faucet.mstblockchain.com/", label: "Testnet Faucet", external: true },
    {
      href: getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS),
      label: "Consent Registry Contract",
      external: true,
    },
  ],
};

export function Footer() {
  return (
    <footer suppressHydrationWarning className="relative w-full border-t border-white/[0.05] bg-[#030710] pt-14 pb-8">
      {/* Top fade */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <ConsendLogo size="md" />
            </Link>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Consend — Ephemeral, permissioned, and provable document sharing on the MST Blockchain.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-1 text-[11px] text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {ACTIVE_NETWORK.name}
            </div>
          </div>

          {/* Application links */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Application</h4>
            <ul className="space-y-2.5">
              {footerLinks.application.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-slate-600 hover:text-slate-300 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Blockchain links */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">MST Blockchain</h4>
            <ul className="space-y-2.5">
              {footerLinks.blockchain.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[12px] text-slate-600 hover:text-slate-300 transition"
                  >
                    {link.label}
                    <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Notice */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Limitations</h4>
            <div className="rounded-2xl border border-amber-500/15 bg-amber-950/10 p-3.5 text-[11px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold mb-1.5">
                <AlertTriangle className="h-3 w-3" />
                MVP Notice
              </div>
              Blockchain proves verifiable timestamps and term hashes; document bytes are encrypted and never stored on-chain. Not a registered DPDP consent manager.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="divider mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-700">
            © 2026 Consend · Built on MST Blockchain · Next.js App Router
          </p>
          <div className="flex items-center gap-5 text-[11px]">
            <Link href="/settings" className="text-slate-700 hover:text-slate-400 transition">
              RPC Settings
            </Link>
            <Link href="/audit" className="text-slate-700 hover:text-slate-400 transition">
              Audit Trail
            </Link>
            <a
              href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="text-slate-700 hover:text-cyan-500 transition flex items-center gap-1"
            >
              Contract <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
