import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/WalletContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Consent Chain — Privacy-First Document Sharing & MST Blockchain Audit Trail",
  description:
    "Share documents with colleges, hospitals, and Xerox centres with temporary permissions, QR-based consent, instant revocation, and verifiable on-chain audit on MST Blockchain.",
};

import { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070D1E] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
        <WalletProvider>
          <Suspense fallback={<div className="h-16 w-full border-b border-slate-800 bg-[#0B132B]" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="top-right" theme="dark" />
        </WalletProvider>
      </body>
    </html>
  );
}
