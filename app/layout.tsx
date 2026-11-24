import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { CookieConsent } from "@/components/consent";
import { ConsentAwareAnalytics } from "@/components/analytics";
import { LeagueContextProvider } from "@/lib/league-context";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-tech",
  subsets: ["latin"],
});

// Nonce-based CSP (proxy.ts) requires every page to render per-request so
// Next.js can inject the per-request nonce into inline scripts/styles.
// This app is a small dashboard — the per-request render cost is negligible.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://draftedge.vercel.app"),
  title: {
    default: "DraftEdge — Redraft Fantasy Football Draft & Trade Assistant",
    template: "%s | DraftEdge",
  },
  description:
    "Free redraft fantasy football player rankings, trade analysis, custom cheat sheets, mock drafts, and start/sit tools.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DraftEdge",
    title: "DraftEdge — Redraft Fantasy Football Draft & Trade Assistant",
    description:
      "Free redraft fantasy football player rankings, trade analysis, custom cheat sheets, mock drafts, and start/sit tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DraftEdge — Redraft Fantasy Football Draft & Trade Assistant",
    description:
      "Free redraft fantasy football player rankings, trade analysis, custom cheat sheets, mock drafts, and start/sit tools.",
  },
  verification: {
    google: "lWRtvvTII8sDTausv0Q-4m5C3JIlXbf85MnLMBHeGI0",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#080E0C] text-zinc-100" suppressHydrationWarning>
        <AuthProvider>
          <LeagueContextProvider>{children}</LeagueContextProvider>
        </AuthProvider>
        <CookieConsent />
        <ConsentAwareAnalytics />
      </body>
    </html>
  );
}
