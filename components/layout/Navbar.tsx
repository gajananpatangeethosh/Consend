"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "../wallet/WalletContext";
import { MST_NETWORKS } from "@/lib/blockchain/config";
import {
  ShieldCheck,
  QrCode,
  FileText,
  Clock,
  History,
  Settings,
  Wallet,
  ExternalLink,
  ChevronDown,
  Layers,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const {
    address,
    chainId,
    isConnecting,
    selectedNetworkKey,
    activeRole,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    setDemoRole,
    formatAddress,
  } = useWallet();

  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Layers },
    { href: "/requests/new", label: "New Request", icon: QrCode },
    { href: "/documents", label: "Document Vault", icon: FileText },
    { href: "/consents", label: "Consent Grants", icon: Clock },
    { href: "/audit", label: "Blockchain Audit", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const currentNetwork = MST_NETWORKS[selectedNetworkKey] || MST_NETWORKS.coral;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0B132B]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0B132B]">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Consent <span className="text-cyan-400">Chain</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                MST Blockchain MVP
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Network Selector & BridgeKey Wallet */}
        <div className="flex items-center gap-3">
          {/* Network Selector */}
          <div className="relative">
            <button
              onClick={() => setShowNetworkMenu(!showNetworkMenu)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500/40"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentNetwork.name}</span>
              <span className="text-[10px] text-slate-400">({currentNetwork.chainId})</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showNetworkMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select MST Network
                </div>
                {Object.entries(MST_NETWORKS).map(([key, net]) => (
                  <button
                    key={key}
                    onClick={() => {
                      switchNetwork(key);
                      setShowNetworkMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                      selectedNetworkKey === key
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span>{net.name}</span>
                      <span className="text-[10px] text-slate-400">Chain ID: {net.chainId}</span>
                    </div>
                    {selectedNetworkKey === key && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-900/40"
              title="Switch demo persona for testing"
            >
              <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Role:</span>
              <span className="font-semibold text-white capitalize">{activeRole}</span>
              <ChevronDown className="h-3 w-3 text-cyan-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Persona Switcher
                </div>
                <button
                  onClick={() => {
                    setDemoRole("owner");
                    setShowRoleMenu(false);
                  }}
                  className={`flex w-full flex-col rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    activeRole === "owner" ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="font-semibold text-white">Priya Sharma (Document Owner)</span>
                  <span className="text-[10px] text-slate-400">Vault with Degree, Lab, Lease docs</span>
                </button>
                <button
                  onClick={() => {
                    setDemoRole("requester");
                    setShowRoleMenu(false);
                  }}
                  className={`mt-1 flex w-full flex-col rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    activeRole === "requester" ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="font-semibold text-white">St. Xavier Admissions (Requester)</span>
                  <span className="text-[10px] text-slate-400">Creates QR requests and views approved docs</span>
                </button>
              </div>
            )}
          </div>

          {/* BridgeKey Wallet Connect Button */}
          {address ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>{formatAddress(address)}</span>
              <button
                onClick={disconnectWallet}
                className="text-[10px] text-slate-400 hover:text-red-400 transition ml-1"
                title="Disconnect wallet"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:opacity-95 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>{isConnecting ? "Connecting..." : "Connect BridgeKey"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
