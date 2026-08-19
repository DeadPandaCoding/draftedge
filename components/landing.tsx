import Link from "next/link";
import {
  BoltIcon,
  CheckIcon,
  GridIcon,
  UsersIcon,
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedInIcon,
} from "@/components/icons";
import { TIER_STYLES } from "@/lib/tiers";
import { DraftBoardMockup } from "@/components/landing/DraftBoardMockup";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import KineticGrid from "@/components/ui/kinetic-grid";
import { RotatingText } from "@/components/ui/rotating-text";
import FoldText from "@/components/ui/FoldText";
import BorderGlow, { GLOW_PRESET } from "@/components/ui/BorderGlow";

const FEATURES = [
  {
    icon: <GridIcon size={20} />,
    title: "Tier-Based Rankings",
    body: "Move beyond rigid numerical lists. Group players into visual tiers so you never miss a positional run.",
  },
  {
    icon: <CheckIcon size={20} />,
    title: "Real-Time Draft Sync",
    body: "Cross off players as they fly off the board in your actual league draft and instantly see updated value projections.",
  },
  {
    icon: <UsersIcon size={20} />,
    title: "100% Free & Open Data",
    body: "Powered directly by public NFL and Sleeper data feeds with zero subscription fees or hidden paywalls.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Configure Your League",
    body: "Input your scoring format (PPR, Half-PPR, Standard) and league size (e.g., 12-team).",
  },
  {
    n: "2",
    title: "Open Your Cheat Sheet",
    body: "Access your custom-sorted dashboard optimized for desktop or mobile tablet view.",
  },
  {
    n: "3",
    title: "Dominate Your Draft",
    body: "Check off players as your league drafts, track your roster balance, and secure your championship trophy.",
  },
];

const [featureTiers, featureSync, featureFree] = FEATURES;

// Mini board used inside the featured bento panel (matches the draft-room tiers).
const TIER_PREVIEW = [
  { tier: 1, label: "Tier 1", players: ["Ja'Marr Chase", "Bijan Robinson", "Justin Jefferson"] },
  { tier: 2, label: "Tier 2", players: ["Jahmyr Gibbs", "Puka Nacua", "CeeDee Lamb"] },
  { tier: 3, label: "Tier 3", players: ["Malik Nabers", "Amon-Ra St. Brown"] },
];

// Replace the `#` hrefs with real social profile URLs when they exist.
const SOCIALS = [
  { label: "Facebook", href: "#", icon: <FacebookIcon size={16} /> },
  { label: "X (Twitter)", href: "#", icon: <TwitterIcon size={16} /> },
  { label: "Instagram", href: "#", icon: <InstagramIcon size={16} /> },
  { label: "LinkedIn", href: "#", icon: <LinkedInIcon size={16} /> },
];

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col text-zinc-200">
      {/* Kinetic grid background: warps toward the pointer, ripples on click */}
      <KineticGrid globalColor="default" className="pointer-events-none fixed inset-0 z-0" />

      {/* Brand glows layered above the grid */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[560px] rounded-full bg-taupe/10 blur-[120px]" />
      </div>

      {/* ── Nav (sticky glass) ──────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-30 mx-auto flex w-full max-w-full items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={16} />
          </span>
          <span className="font-display text-lg tracking-wide text-white">
            Draft<span className="text-emerald-400">Edge</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
          >
            Open source
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signin?mode=signup"
            className="btn-glass-primary rounded-lg px-4 py-2 text-sm font-bold transition"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* ── Hero (two-column: left-aligned text, board on the right) ── */}
      <section className="relative z-10 mx-auto w-full max-w-6xl overflow-hidden px-6 pb-20 pt-16 md:pt-24">
        {/* ambient emerald/amber aura behind the mockup column */}
        <div className="pointer-events-none absolute right-[-4%] top-[2%] h-[520px] w-[620px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(225,226,239,0.16),rgba(191,172,170,0.08)_55%,transparent_70%)] blur-2xl" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10">
          {/* Left: headline + CTAs */}
          <div className="max-w-xl">
            <h1 className="font-display text-4xl leading-[1.12] tracking-wide text-white sm:text-5xl lg:text-[3.4rem]">
              {/* Word-fold entrance (React Bits FoldText + GSAP); inherits the
                  h1's responsive size/weight/color. */}
              <span className="block">
                <FoldText
                  text="Master Your Fantasy Draft."
                  splitBy="word"
                  hinge="top"
                  trigger="mount"
                  duration={0.65}
                  stagger={0.05}
                  ease="power3.out"
                  perspective={700}
                  creaseShading={0.55}
                  fontSize="inherit"
                  fontWeight="inherit"
                  color="inherit"
                />
              </span>
              <span className="flex min-h-[2.24em] items-center">
                <RotatingText
                  phrases={["Zero Cost.", "Maximum Advantage.", "No Paywalls."]}
                  caret={false}
                  className="bg-gradient-to-r from-[#e1e2ef] via-[#c9cde4] to-[#bfacaa] bg-clip-text text-transparent"
                />
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/50">
              An intelligent, real-time draft companion featuring automated tiers, live pick
              tracking, and custom cheat sheets powered by open data.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signin?mode=signup"
                className="btn-glass-primary rounded-xl px-7 py-3.5 text-base font-bold transition"
              >
                Get Started Free
              </Link>
              <Link
                href="/signin"
                className="glass glass-hover rounded-xl px-7 py-3.5 text-base font-semibold text-zinc-200"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right: product preview — pointer-reactive mesh-glow frame (React Bits BorderGlow) */}
          <div className="w-full min-w-0">
            <BorderGlow {...GLOW_PRESET} className="mx-auto w-full max-w-2xl" borderRadius={24} animated>
              <DraftBoardMockup />
            </BorderGlow>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="relative z-10 border-t border-zinc-900 bg-zinc-950/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
            Everything you need on draft day
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-zinc-400">
            Built for the pre-draft grind and the two minutes you actually have on the clock.
          </p>
          {/* Bento — one large feature panel with a live tier preview, two compact panels */}
          <div className="mt-12 grid gap-5 md:grid-cols-3 md:grid-rows-2">
            <div className="glass glass-hover group relative overflow-hidden rounded-2xl p-7 md:col-span-2 md:row-span-2 hover:-translate-y-1">
              <span className="font-mono absolute right-6 top-6 text-[11px] font-bold text-zinc-700 transition group-hover:text-emerald-500/70">
                01
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/25">
                {featureTiers.icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{featureTiers.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{featureTiers.body}</p>

              {/* Mini tier board */}
              <div className="mt-8 space-y-2.5">
                {TIER_PREVIEW.map((t) => (
                  <div
                    key={t.tier}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-zinc-900/40 px-3.5 py-2.5"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${TIER_STYLES[t.tier].pill}`}
                    >
                      {t.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {t.players.map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass glass-hover group relative overflow-hidden rounded-2xl p-6 hover:-translate-y-1">
              <span className="font-mono absolute right-5 top-5 text-[11px] font-bold text-zinc-700 transition group-hover:text-emerald-500/70">
                02
              </span>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/25 transition group-hover:bg-emerald-500/15">
                {featureSync.icon}
              </div>
              <h3 className="text-base font-semibold text-white">{featureSync.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{featureSync.body}</p>
            </div>

            <div className="glass glass-hover group relative overflow-hidden rounded-2xl p-6 hover:-translate-y-1">
              <span className="font-mono absolute right-5 top-5 text-[11px] font-bold text-zinc-700 transition group-hover:text-emerald-500/70">
                03
              </span>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/25 transition group-hover:bg-emerald-500/15">
                {featureFree.icon}
              </div>
              <h3 className="text-base font-semibold text-white">{featureFree.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{featureFree.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 border-t border-zinc-900">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
            From signup to championship in three steps
          </h2>
          {/* Horizontal timeline — numbered badges joined by a connector line */}
          <div className="relative mt-14">
            <div className="absolute left-[16%] right-[16%] top-5 hidden h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent md:block" />
            <div className="grid gap-10 md:grid-cols-3 md:gap-6">
              {STEPS.map((s) => (
                <div key={s.n} className="relative">
                  <div className="relative z-10 mb-5 flex justify-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e1e2ef] to-[#b6bcd4] text-sm font-bold text-emerald-950 ring-4 ring-zinc-950">
                      {s.n}
                    </span>
                  </div>
                  <div className="glass glass-hover relative rounded-2xl p-7 text-center">
                    <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 text-center">
            <Link
              href="/signin?mode=signup"
              className="btn-glass-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold transition"
            >
              <BoltIcon size={16} />
              Start your draft prep — free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto border-t border-zinc-900 bg-zinc-950/60">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
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
                    href="https://github.com"
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
                    href="https://github.com"
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

            {/* Follow Us */}
            <div>
              <h4 className="text-sm font-semibold text-white">Follow Us</h4>
              <div className="mt-4 flex gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition hover:border-emerald-500/50 hover:text-white"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 text-xs text-zinc-600 sm:flex-row">
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
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
