import Link from "next/link";
import { DraftEdgeLogo } from "@/components/icons";
import { LandingPrimaryCta } from "@/components/landing/LandingPrimaryCta";
import { SpotlightStages } from "@/components/landing/SpotlightStages";

const tools = [["Trade Analyzer", "/trade"], ["Mock Draft", "/mock"], ["Start/Sit", "/start-sit"], ["League Sync", "/leagues"]];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <header className="border-b border-white/15">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"><DraftEdgeLogo />DraftEdge</Link>
          <div className="order-last flex w-full justify-between gap-3 text-xs text-zinc-300 md:order-none md:w-auto md:gap-6">
            {tools.map(([label, href]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold"><Link href="/signin">Sign In</Link><Link href="/home" className="bg-[#10B981] px-4 py-2 text-black">Launch App</Link></div>
        </nav>
      </header>
      <main>
        <section className="mx-auto max-w-5xl px-5 py-20 text-center sm:py-24">
          <h1 className="font-display text-[clamp(3rem,7.3vw,6.6rem)] font-extrabold leading-[.99] tracking-[-.065em]">All your fantasy decisions,<br /> <span className="inline-block border-b-[.085em] border-[#10B981] pb-1 text-[#10B981]">in one spot.</span></h1>
          <p className="mx-auto mb-7 mt-7 max-w-xl text-base leading-relaxed text-zinc-300">Grade trades, practice your draft, and compare weekly starters with your league’s scoring settings.</p>
          <LandingPrimaryCta signedInLabel="Open App" />
        </section>
        <SpotlightStages />
      </main>
      <footer className="border-t border-white/15"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 text-xs text-zinc-400"><span>© {new Date().getFullYear()} DraftEdge</span><nav aria-label="Legal" className="flex gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/accessibility">Accessibility</Link></nav></div></footer>
    </div>
  );
}