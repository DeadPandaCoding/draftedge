import Link from "next/link";
import { BoltIcon } from "@/components/icons";
import { SiteHeader } from "@/components/ui/header";
import { DraftBoardMockup } from "@/components/landing/DraftBoardMockup";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Reveal } from "@/components/ui/reveal";
import { TextReveal } from "@/components/ui/text-reveal";
import { ScrollText } from "@/components/ui/scroll-text";
import BorderGlow, { GLOW_PRESET } from "@/components/ui/BorderGlow";
import { StickyToolShowcase } from "@/components/landing/StickyToolShowcase";

const STEPS = [
  {
    n: "1",
    title: "Set your scoring",
    body: "Choose PPR, Half-PPR, or Standard so the player values fit your league.",
  },
  {
    n: "2",
    title: "Find your best picks",
    body: "Use player rankings, tiers, ADP, and projections to compare the players still available.",
  },
  {
    n: "3",
    title: "Track the board",
    body: "Log picks as they happen and keep your roster needs in view while you draft.",
  },
];

// No social profiles exist yet — links were removed instead of shipping dead `#` hrefs.
const GITHUB_URL = "https://github.com/DeadPandaCoding/draftedge";

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col text-zinc-200">
      {/* Lenis smooth scrolling (client-side island) */}
      <SmoothScroll />
      {/* ── Nav (shared sticky header) ──────────────────────── */}
      <SiteHeader variant="marketing" />

      {/* ── Hero (two-column: left-aligned text, board on the right) ── */}
      <section className="relative z-10 min-h-svh overflow-hidden border-b border-white/[0.07] bg-[#080E0C]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[65%] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(16,185,129,0.13),transparent)]"
        />
        <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-5 pb-16 pt-20 sm:px-6 md:pb-20 md:pt-24">
        <div className="relative grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          {/* Left: headline + CTAs */}
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl leading-[1.08] tracking-wide text-white sm:text-5xl lg:text-[3.75rem]">
              {/* Oversized headline — words slide up, fade in and de-blur. */}
              <TextReveal
                text="Know your best pick before the clock runs out."
                className="block"
                delay={0.05}
                stagger={0.08}
              />
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
              Live rankings, scoring-aware projections, and a draft board that keeps every pick in context.
            </p>
            <Reveal delay={250}>
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/mock"
                  className="inline-flex min-h-12 items-center rounded-lg bg-emerald-500 px-6 py-3 text-base font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Start a Mock Draft
                </Link>
                <Link
                  href="/rankings"
                  className="inline-flex min-h-12 items-center rounded-lg border border-white/[0.12] px-5 py-3 text-base font-semibold text-zinc-200 transition hover:border-emerald-400/40 hover:text-white"
                >
                  Explore Rankings
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right: compact product preview framed with a simple border */}
          <Reveal delay={200} className="w-full min-w-0">
            <BorderGlow {...GLOW_PRESET} className="mx-auto w-full max-w-3xl" borderRadius={24}>
              <DraftBoardMockup />
            </BorderGlow>
          </Reveal>
        </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <StickyToolShowcase />

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 scroll-mt-20 overflow-hidden border-b border-white/[0.07]">
        <div className="relative mx-auto w-full max-w-6xl px-6 py-24">
          <ScrollText
            as="h2"
            text="From scoring settings to your next pick in three steps."
            className="mx-auto max-w-4xl text-center font-display text-4xl leading-[1.15] tracking-wide text-white sm:text-5xl"
          />
          {/* Horizontal timeline — numbered badges joined by a connector line */}
          <Reveal delay={140}>
          <div className="relative mt-14">
            <div className="absolute left-[16%] right-[16%] top-5 hidden h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent md:block" />
            <div className="grid gap-10 md:grid-cols-3 md:gap-6">
              {STEPS.map((s) => (
                <div key={s.n} className="relative">
                  <div className="relative z-10 mb-5 flex justify-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6ee7b7] to-[#10b981] text-sm font-bold text-emerald-950 ring-4 ring-zinc-950">
                      {s.n}
                    </span>
                  </div>
                  <div className="relative rounded-2xl border border-white/[0.08] bg-[#0D1412] p-7 text-center transition hover:-translate-y-1">
                    <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </Reveal>
          <Reveal delay={220}>
          <div className="mt-14 text-center">
            <Link
              href="/signin?mode=signup"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-500 px-7 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              <BoltIcon size={16} />
              Start your draft prep — free
            </Link>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto overflow-hidden border-t border-emerald-400/10 bg-zinc-950/60">
        <div className="relative mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {/* Stay Connected */}
            <div>
              <h3 className="font-display text-2xl leading-tight tracking-wide text-white">
                Stay
                <span className="block">Connected</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Join our newsletter for product updates and draft-day tips.
              </p>
              <NewsletterForm />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white">Quick Links</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
                <li>
                  <Link href="/" className="transition hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <a href="#features" className="transition hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition hover:text-white">
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    Open source
                  </a>
                </li>
                <li>
                  <Link href="/signin" className="transition hover:text-white">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className="text-sm font-semibold text-white">Contact Us</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
                <li>
                  <a href="mailto:support@draftedge.app" className="transition hover:text-white">
                    support@draftedge.app
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    GitHub
                  </a>
                </li>
                <li>Not affiliated with the NFL or Sleeper</li>
              </ul>
            </div>

          </div>
        </div>

        <div className="border-t border-emerald-400/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 text-xs text-zinc-500 sm:flex-row">
            <span>© {new Date().getFullYear()} DraftEdge · All rights reserved.</span>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link href="/privacy" className="transition hover:text-zinc-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition hover:text-zinc-300">
                Terms of Service
              </Link>
              <Link href="/cookies" className="transition hover:text-zinc-300">
                Cookie Settings
              </Link>
              <Link href="/accessibility" className="transition hover:text-zinc-300">
                Accessibility
              </Link>
              <Link href="/disclaimers" className="transition hover:text-zinc-300">
                Disclaimers
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
