import type { Metadata } from "next";
import { Chakra_Petch, Geist, Geist_Mono, Russo_One } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { Aurora } from "@/components/ui/aurora";
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

// Command Deck display + data faces (from the generated design system).
const russoOne = Russo_One({
  variable: "--font-russo",
  weight: "400",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DraftEdge — Free Fantasy Draft Assistant",
  description:
    "An intelligent, real-time draft companion featuring automated tiers, live pick tracking, and custom cheat sheets powered by open data. 100% free.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${russoOne.variable} ${chakraPetch.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Aurora />
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
