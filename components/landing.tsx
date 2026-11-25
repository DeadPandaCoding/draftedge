import { TOOLS } from "@/lib/tools";
import Link from "next/link";
import { DraftEdgeLogo } from "@/components/icons";
import { LandingPrimaryCta } from "@/components/landing/LandingPrimaryCta";
import { SpotlightStages } from "@/components/landing/SpotlightStages";

const tools = [TOOLS.trade, { ...TOOLS.mock, label: "Mock Draft" }, TOOLS.startSit, { label: "League Sync", href: "/leagues" }];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <header className="flex min-h-[6.5rem] items-center border-b border-white/15 md:min-h-[4.5rem]">
        <nav aria-label="Main navigation" className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"><DraftEdgeLogo />DraftEdge</Link>
          <div className="order-last flex w-full justify-between gap-3 text-xs text-zinc-300 md:order-none md:w-auto md:gap-6">
            {tools.map(({ label, href }) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold"><Link href="/signin">Sign In</Link><Link href="/home" className="bg-[#10B981] px-4 py-2 text-black">Launch App</Link></div>
        </nav>
      </header>
      <main>
        <section className="mx-auto flex min-h-[calc(100svh-6.5rem)] max-w-5xl flex-col items-center justify-center px-5 py-8 text-center md:min-h-[calc(100svh-4.5rem)]">
          <h1 className="font-display text-[clamp(3rem,7.3vw,6.6rem)] font-extrabold leading-[.99] tracking-[-.065em]">All your fantasy decisions,<br /> <span className="inline-block border-b-[.085em] border-[#10B981] pb-1 text-[#10B981]">in one spot.</span></h1>
          <p className="mx-auto mb-7 mt-7 max-w-xl text-base leading-relaxed text-zinc-300">Grade trades, practice your draft, and compare weekly starters with your league’s scoring settings.</p>
          <LandingPrimaryCta signedInLabel="Open App" />
        </section>
        <SpotlightStages />
        <section aria-labelledby="closing-title" className="mx-auto my-12 max-w-7xl px-5 sm:my-20 lg:px-8">
          <div className="border border-white/20 bg-[#101012] px-5 py-12 text-center sm:py-16">
            <h2 id="closing-title" className="font-display text-5xl font-extrabold leading-tight tracking-[-.055em] sm:text-7xl">Ready for <span className="text-[#10B981] underline decoration-[.085em] underline-offset-[.1em]">kickoff?</span></h2>
            <p className="mx-auto mb-6 mt-5 text-sm text-zinc-300">Bring your league’s scoring into your next draft, trade, or lineup call.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/signin?next=%2Fleagues" className="bg-[#10B981] px-5 py-3 text-sm font-bold text-black">Sync Your League →</Link>
              <Link href={TOOLS.trade.href} className="border border-white/30 px-5 py-3 text-sm font-semibold hover:border-white">Open Trade Analyzer</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/15"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 text-xs text-zinc-400"><span>© {new Date().getFullYear()} DraftEdge</span><nav aria-label="Legal" className="flex gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/accessibility">Accessibility</Link></nav></div></footer>
    </div>
  );
}
