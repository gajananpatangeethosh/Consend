import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, AlertTriangle } from "lucide-react";
import { ACTIVE_NETWORK, CONSENT_REGISTRY_ADDRESS, getExplorerAddressUrl } from "@/lib/blockchain/config";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-[#070D1E] py-12 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <span className="font-bold text-white text-sm">Consent Chain</span>
            </div>
            <p className="leading-relaxed">
              Your documents. Your consent. Temporary, permissioned, and provable — on-chain with MST Blockchain.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 text-[11px] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Network: {ACTIVE_NETWORK.name}</span>
            </div>
          </div>

          {/* MST Blockchain Resources */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">MST Blockchain</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://mstblockchain.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition"
                >
                  Official Portal <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://coral.mstscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition"
                >
                  MST Coral Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.mstblockchain.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition"
                >
                  MST Testnet Faucet <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href={getExplorerAddressUrl(CONSENT_REGISTRY_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition"
                >
                  Consent Registry Contract <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Product Routes */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Application</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition">
                  Overview Dashboard
                </Link>
              </li>
              <li>
                <Link href="/requests/new" className="hover:text-cyan-400 transition">
                  Create Consent Request
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-cyan-400 transition">
                  Encrypted Document Vault
                </Link>
              </li>
              <li>
                <Link href="/audit" className="hover:text-cyan-400 transition">
                  Blockchain Audit Trail
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Honesty Notice */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Privacy Positioning</h4>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-slate-300">
              <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Notice & Limitations</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                MVP demonstration uses fictional documents only. Blockchain proves verifiable timestamps and terms hashes; document bytes are encrypted and never stored on-chain. Not registered as a statutory DPDP consent manager.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026 Consent Chain. Built for MST Blockchain & Next.js.</p>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="hover:text-slate-300">
              RPC Settings
            </Link>
            <Link href="/audit" className="hover:text-slate-300">
              Verifiable Trail
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
