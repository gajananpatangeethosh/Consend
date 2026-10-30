import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/WalletContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Consend — Privacy-First Document Sharing on MST Blockchain",
  description:
    "Consend enables ephemeral, time-limited document sharing with QR consent notices, instant revocation, and verifiable on-chain audit trails on MST Blockchain.",
  keywords: ["consend", "consent", "blockchain", "document sharing", "MST blockchain", "privacy", "QR consent"],
  openGraph: {
    title: "Consend — Ephemeral Document Consent",
    description: "Your documents. Your consent. Temporary, permissioned, and provable — on-chain.",
    type: "website",
  },
  other: {
    "darkreader-lock": "true",
    "color-scheme": "dark",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" content="true" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#03070F] text-slate-100 antialiased"
        suppressHydrationWarning
      >
        <WalletProvider>
          <Suspense
            fallback={
              <div className="h-16 w-full border-b border-white/[0.05] bg-[#03070F]/90" />
            }
          >
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            richColors
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(8, 15, 30, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
