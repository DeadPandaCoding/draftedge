import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { CookieConsent } from "@/components/consent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Plus_Jakarta_Sans({
  variable: "--font-russo",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

// Nonce-based CSP (proxy.ts) requires every page to render per-request so
// Next.js can inject the per-request nonce into inline scripts/styles.
// This app is a small dashboard — the per-request render cost is negligible.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DraftEdge — Free Fantasy Draft Assistant",
  description:
    "Live fantasy football rankings, automated tiers, trade tools, and custom cheat sheets powered by daily player snapshots. Free to use.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#080E0C] text-zinc-100" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
