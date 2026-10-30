"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet, DEMO_PERSONAS } from "../wallet/WalletContext";
import { ConsendLogo } from "@/components/ui/ConsendLogo";
import { MST_NETWORKS } from "@/lib/blockchain/config";
import {
  ShieldCheck,
  QrCode,
  FileText,
  Clock,
  History,
  Settings,
  Wallet,
  ChevronDown,
  Layers,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  Zap,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Layers },
  { href: "/requests/new", label: "New Request", icon: QrCode },
  { href: "/documents", label: "Vault", icon: FileText },
  { href: "/consents", label: "Grants", icon: Clock },
  { href: "/audit", label: "Audit Trail", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    address,
    isConnecting,
    isMainnet,
    selectedNetworkKey,
    openConnectModal,
    connectWallet,
    connectDemoPersona,
    disconnectWallet,
    switchNetwork,
    formatAddress,
  } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const networkRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  const currentNetwork = MST_NETWORKS[selectedNetworkKey] || MST_NETWORKS.coral;
  const isNetMainnet = Boolean(currentNetwork.isMainnet);

  const mainnetNets = Object.entries(MST_NETWORKS).filter(([_, n]) => n.isMainnet);
  const testnetNets = Object.entries(MST_NETWORKS).filter(([_, n]) => !n.isMainnet);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (networkRef.current && !networkRef.current.contains(e.target as Node)) {
        setShowNetworkMenu(false);
      }
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setShowWalletMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      suppressHydrationWarning
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? "border-b border-white/[0.06] bg-[#03070F]/90 backdrop-blur-xl shadow-[0_4px_30px_-10px_rgba(6,182,212,0.08)]"
        : "border-b border-transparent bg-transparent"
        }`}
    >
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Brand ─────────────────────────────── */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link href="/" className="flex items-center">
            <ConsendLogo size="md" />
          </Link>

          {/* ── Desktop Nav ────────────────────── */}
          {mounted && address && (
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 ${isActive
                      ? "text-cyan-300 bg-cyan-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-cyan-400" />
                    )}
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : ""}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* ── Right Controls ───────────────────── */}
        <div className="flex items-center gap-2">
          {/* Network Selector */}
          <div className="relative hidden sm:block" ref={networkRef}>
            <button
              onClick={() => setShowNetworkMenu(!showNetworkMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-cyan-500/30 hover:text-slate-100"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isNetMainnet ? "bg-emerald-400" : "bg-cyan-400"
                    }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isNetMainnet ? "bg-emerald-400" : "bg-cyan-400"
                    }`}
                />
              </span>
              <span className="font-semibold">{currentNetwork.name}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${isNetMainnet
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/40"
                    : "bg-cyan-950/80 text-cyan-300 border border-cyan-800/40"
                  }`}
              >
                {isNetMainnet ? "Mainnet" : "Testnet"}
              </span>
              <ChevronDown
                className={`h-3 w-3 text-slate-500 transition-transform ${showNetworkMenu ? "rotate-180" : ""
                  }`}
              />
            </button>

            {showNetworkMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/[0.08] bg-[#080F20]/95 backdrop-blur-xl p-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] z-50">
                {/* Mainnets Section */}
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Production Mainnets
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">Live</span>
                </div>
                {mainnetNets.map(([key, net]) => (
                  <button
                    key={key}
                    onClick={() => {
                      switchNetwork(key);
                      setShowNetworkMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition mb-0.5 ${selectedNetworkKey === key
                        ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                  >
                    <div className="text-left">
                      <div>{net.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Chain ID: {net.chainId} · {net.currency.symbol}
                      </div>
                    </div>
                    {selectedNetworkKey === key && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Testnets Section */}
                <div className="px-2 pt-3 pb-1.5 flex items-center justify-between border-t border-white/[0.05] mt-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    Sandbox Testnets
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">Free Gas</span>
                </div>
                {testnetNets.map(([key, net]) => (
                  <button
                    key={key}
                    onClick={() => {
                      switchNetwork(key);
                      setShowNetworkMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition mb-0.5 ${selectedNetworkKey === key
                        ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                  >
                    <div className="text-left">
                      <div>{net.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Chain ID: {net.chainId} · {net.currency.symbol}
                      </div>
                    </div>
                    {selectedNetworkKey === key && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Wallet Button */}
          <div suppressHydrationWarning className="flex items-center">
            {mounted && address ? (
              <div className="relative" ref={walletRef}>
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] font-mono text-slate-200 transition hover:border-cyan-500/30"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isNetMainnet ? "bg-emerald-400" : "bg-cyan-400"
                      }`}
                  />
                  <span>{formatAddress(address)}</span>
                  <ChevronDown
                    className={`h-3 w-3 text-slate-500 transition-transform ${showWalletMenu ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {showWalletMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/[0.08] bg-[#080F20]/95 backdrop-blur-xl p-2.5 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] z-50">
                    <div className="px-3 py-2 border-b border-white/[0.05] mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                          Connected Wallet
                        </p>
                        <p className="text-xs font-mono text-cyan-300 break-all font-semibold">
                          {formatAddress(address)}
                        </p>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${isNetMainnet
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
                          }`}
                      >
                        {currentNetwork.name}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setShowWalletMenu(false);
                        openConnectModal();
                      }}
                      className="w-full mb-2 flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-300 transition"
                    >
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <Wallet className="h-3.5 w-3.5" />
                        Mainnet / Testnet Options
                      </span>
                      <ChevronDown className="h-3 w-3 -rotate-90 text-slate-500" />
                    </button>

                    <div className="mb-2 max-h-48 overflow-y-auto pr-1">
                      <p className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500">
                        Switch Persona
                      </p>
                      <div className="space-y-1">
                        {DEMO_PERSONAS.map((p) => {
                          const isCurrent =
                            address?.toLowerCase() === p.address.toLowerCase();
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                connectDemoPersona(p.address);
                                setShowWalletMenu(false);
                              }}
                              className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition ${isCurrent
                                  ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                                }`}
                            >
                              <div className="min-w-0">
                                <div className="truncate">{p.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {p.role} · {p.address.substring(0, 6)}…
                                </div>
                              </div>
                              <span
                                className={`text-[9px] font-mono rounded px-1 ml-1 flex-shrink-0 ${p.isMainnet
                                    ? "bg-emerald-950/60 text-emerald-400"
                                    : "bg-cyan-950/60 text-cyan-400"
                                  }`}
                              >
                                {p.isMainnet ? "Main" : "Test"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setShowWalletMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition border-t border-white/[0.05] mt-1 pt-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openConnectModal}
                disabled={isConnecting}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-xs rounded-xl shadow-lg shadow-cyan-500/15"
              >
                {isConnecting ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-3.5 w-3.5" />
                    Connect Wallet
                  </>
                )}
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-slate-200 transition"
          >
            {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#03070F]/98 backdrop-blur-xl px-4 py-3 space-y-1">
          {mounted && address &&
            navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : ""}`} />
                  {link.label}
                </Link>
              );
            })}
          <div className="pt-2 mt-2 border-t border-white/[0.05]" suppressHydrationWarning>
            {!mounted || !address ? (
              <button
                onClick={() => { openConnectModal(); setShowMobileMenu(false); }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl shadow-lg shadow-cyan-500/20"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet (Mainnet & Testnet)
              </button>
            ) : (
              <button
                onClick={() => { disconnectWallet(); setShowMobileMenu(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="h-4 w-4" />
                Disconnect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
