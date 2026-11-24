import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpIcon,
  BoltIcon,
  ChevronRightIcon,
  ClockIcon,
  DraftEdgeLogo,
  LinkIcon,
  ListCheckIcon,
  SwapIcon,
  TableIcon,
} from "@/components/icons";
import { SiteHeader } from "@/components/ui/header";
import { Reveal } from "@/components/ui/reveal";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import {
  LandingHeroPreview,
  type HeroPreviewData,
  type PreviewPlayer,
} from "@/components/landing/LandingHeroPreview";
import { LandingPrimaryCta } from "@/components/landing/LandingPrimaryCta";
import { buildSeedPlayers } from "@/lib/seed-data";
import { buildTradeValues, gradeTrade, packageTradeValue } from "@/lib/trade-value";
import type { Player } from "@/lib/types";

const GITHUB_URL = "https://github.com/DeadPandaCoding/draftedge";

const QUICK_LAUNCH = [
  {
    label: "Evaluate a Trade",
    href: "/trade?get=puka-nacua,bijan-robinson&send=jamarr-chase&scoring=ppr&teams=12&qb=1",
    icon: <SwapIcon size={13} />,
  },
  {
    label: "PPR Cheat Sheet",
    href: "/cheatsheet",
    icon: <TableIcon size={13} />,
  },
  {
    label: "Start/Sit Compare",
    href: "/start-sit?player=jamarr-chase",
    icon: <ListCheckIcon size={13} />,
  },
] as const;

const PLATFORMS = [
  { label: "Sleeper", mark: "S", className: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300" },
  { label: "ESPN", mark: "E", className: "border-[#FF3E9D]/25 bg-[#FF3E9D]/[0.08] text-[#FF8BC4]" },
] as const;

const FORMATS = ["PPR", "Half-PPR", "Standard", "Superflex"] as const;

const STEPS = [
  {
    n: "01",
    title: "Connect your league",
    body: "Import scoring, rosters, and draft slots from Sleeper or ESPN. No spreadsheet setup.",
    icon: <LinkIcon size={17} />,
  },
  {
    n: "02",
    title: "Build your board",
    body: "Turn VORP values, tiers, and ADP into a cheat sheet that fits the way your league scores.",
    icon: <TableIcon size={17} />,
  },
  {
    n: "03",
    title: "Win the week",
    body: "Grade trades, pressure-test mocks, and make the start/sit call before Sunday locks.",
    icon: <BoltIcon size={17} />,
  },
] as const;

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function toPreview(player: Player): PreviewPlayer {
  return {
    name: player.name,
    position: player.position,
    team: player.team,
    projection: round1(player.projection),
  };
}

/** Build a compact, serializable snapshot from the same seed board the tools use. */
function buildHeroPreview(): HeroPreviewData {
  const players = buildSeedPlayers("ppr");
  const named = (name: string, fallbackIndex: number) => {
    const match = players.find((player) => player.name === name);
    return match ?? players[Math.min(fallbackIndex, players.length - 1)]!;
  };

  const values = buildTradeValues(players, 12);
  const valueFor = (player: Player) => round1(values.get(player.id) ?? 0);
  const packageFor = (group: Player[], opposingCount: number) =>
    round1(packageTradeValue(group.map(valueFor), opposingCount));

  const getPlayers = [named("Puka Nacua", 1), named("Bijan Robinson", 3)];
  const sendPlayers = [named("Ja'Marr Chase", 0)];
  const valueA = packageFor(getPlayers, sendPlayers.length);
  const valueB = packageFor(sendPlayers, getPlayers.length);
  const net = round1(valueA - valueB);
  const grade = gradeTrade(net, valueA + valueB, true);
  const tone: HeroPreviewData["trade"]["tone"] = net > 0.05 ? "positive" : net < -0.05 ? "negative" : "neutral";

  const byAdp = players
    .filter((player) => player.adp > 0)
    .sort((a, b) => a.adp - b.adp);
  const mockPlayers = byAdp.length >= 9 ? byAdp : players;
  const mockPicks = mockPlayers.slice(0, 6).map((player, index) => ({
    ...toPreview(player),
    pick: `1.0${index + 1}`,
  }));
  const available = mockPlayers.slice(6, 9).map(toPreview);

  const startPlayer = named("Ja'Marr Chase", 0);
  const sitPlayer = named("CeeDee Lamb", 7);
  const startProjection = startPlayer.projection;
  const sitProjection = sitPlayer.projection;
  const gap = round1(startProjection - sitProjection);
  const startPct = Math.max(
    8,
    Math.min(92, Math.round((startProjection / Math.max(1, startProjection + sitProjection)) * 100)),
  );

  return {
    scoring: "PPR · 12 TEAM · 1QB",
    trade: {
      sideA: getPlayers.map((player) => ({ ...toPreview(player), value: valueFor(player) })),
      sideB: sendPlayers.map((player) => ({ ...toPreview(player), value: valueFor(player) })),
      valueA,
      valueB,
      grade: grade.letter,
      gradeLabel: grade.label,
      net,
      tone,
    },
    mock: {
      picks: mockPicks,
      available,
      onClock: "1.07",
    },
    startSit: {
      start: toPreview(startPlayer),
      sit: toPreview(sitPlayer),
      gap: Math.abs(gap),
      verdict: `Start ${startPlayer.name} over ${sitPlayer.name}`,
      confidence:
        gap >= 25
          ? "Clear projection edge · matchup upside still matters"
          : gap >= 8
            ? "A real edge, but not a locked-in call"
            : "Essentially even — tiebreak on matchup or ceiling",
      startPct,
    },
    rankings: players.slice(0, 5).map((player, index) => ({
      ...toPreview(player),
      rank: player.rank || index + 1,
      tier: player.tier || 1,
      adp: player.adp,
    })),
  };
}

function FeatureCard({
  href,
  ariaLabel,
  className = "",
  children,
}: {
  href: string;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1412] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-400/25 hover:bg-[#111D18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:p-6 ${className}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {children}
    </Link>
  );
}

function FeatureHead({
  icon,
  kicker,
  title,
  body,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative z-10 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-500">{kicker}</p>
          <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h3>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-zinc-400">{body}</p>
        </div>
      </div>
      <ChevronRightIcon size={16} className="mt-1 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-300" />
    </div>
  );
}

function MiniTrade({ data }: { data: HeroPreviewData["trade"] }) {
  const total = Math.max(1, data.valueA + data.valueB);
  const share = Math.min(100, Math.max(0, Math.round((data.valueA / total) * 100)));

  return (
    <div className="relative mt-auto overflow-hidden rounded-xl border border-white/[0.07] bg-[#080E0C]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Package comparison</span>
        <span className={`flex size-7 items-center justify-center rounded-lg border font-display text-xs font-extrabold ${data.tone === "positive" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/15 bg-white/[0.05] text-zinc-200"}`}>
          {data.grade}
        </span>
      </div>
      <div className="divide-y divide-white/[0.055]">
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
          <span className="min-w-0">
            <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-400">You get</span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-white">
              {data.sideA.map((player) => player.name).join(" + ")}
            </span>
          </span>
          <span className="shrink-0 font-display text-lg font-extrabold tabular-nums text-emerald-300">{data.valueA.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
          <span className="min-w-0">
            <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">You send</span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-zinc-300">
              {data.sideB.map((player) => player.name).join(" + ")}
            </span>
          </span>
          <span className="shrink-0 font-display text-lg font-extrabold tabular-nums text-zinc-300">{data.valueB.toFixed(1)}</span>
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-white/[0.018] px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-3 font-mono text-[9px]">
          <span className="font-bold uppercase tracking-[0.12em] text-zinc-500">Net value</span>
          <span className={data.tone === "negative" ? "font-bold text-rose-300" : "font-bold text-emerald-300"}>
            {data.net >= 0 ? "+" : ""}{data.net.toFixed(1)} for you
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${share}%` }} />
        </div>
      </div>
    </div>
  );
}

function MiniMock({ data }: { data: HeroPreviewData["mock"] }) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#080E0C]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Round 1 · PPR</span>
        <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-300">
          <span className="size-1 animate-pulse rounded-full bg-emerald-400" /> Live room
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-white/[0.06]">
        {data.picks.slice(0, 3).map((player) => (
          <div key={player.pick} className="min-w-0 bg-[#0A1511] px-2 py-2">
            <span className="block font-mono text-[8px] text-zinc-600">{player.pick}</span>
            <span className="mt-0.5 block truncate text-[10px] font-semibold text-zinc-200">{player.name}</span>
            <span className={`mt-1 inline-flex rounded border px-1 py-0.5 font-mono text-[8px] font-bold ${
              player.position === "WR"
                ? "border-sky-400/25 bg-sky-500/10 text-sky-300"
                : "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
            }`}>{player.position}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[#FF3E9D]/20 bg-[#FF3E9D]/[0.06] px-3 py-2.5">
        <span className="font-mono text-[9px] font-bold text-[#FF8BC4]">{data.onClock} · YOU</span>
        <span className="font-mono text-[8px] font-bold text-[#FF8BC4]">ON THE CLOCK</span>
      </div>
    </div>
  );
}

function MiniStartSit({ data }: { data: HeroPreviewData["startSit"] }) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#080E0C]">
      <div className="divide-y divide-white/[0.055]">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-1 py-0.5 font-mono text-[8px] font-bold text-emerald-300">START</span>
            <span className="truncate text-xs font-semibold text-white">{data.start.name}</span>
          </span>
          <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-emerald-300">{data.start.projection.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="rounded border border-rose-400/20 bg-rose-400/[0.07] px-1 py-0.5 font-mono text-[8px] font-bold text-rose-300">SIT</span>
            <span className="truncate text-xs font-semibold text-zinc-300">{data.sit.name}</span>
          </span>
          <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-500">{data.sit.projection.toFixed(1)}</span>
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-white/[0.018] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-zinc-200">Start the higher projection</span>
          <span className="font-mono text-[9px] font-bold text-emerald-300">+{data.gap.toFixed(1)}</span>
        </div>
        <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <span className="h-full bg-emerald-400" style={{ width: `${data.startPct}%` }} />
          <span className="h-full bg-white/15" style={{ width: `${100 - data.startPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function MiniRankings({ data }: { data: HeroPreviewData["rankings"] }) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#080E0C]">
      <div className="grid grid-cols-[28px_20px_minmax(0,1fr)_28px_44px] items-center gap-1.5 border-b border-white/[0.06] px-3 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
        <span>Tier</span><span>Rk</span><span>Player</span><span className="text-right">Pos</span><span className="text-right">Proj</span>
      </div>
      <div className="divide-y divide-white/[0.055]">
        {data.slice(0, 4).map((player) => (
          <div key={player.name} className="grid grid-cols-[28px_20px_minmax(0,1fr)_28px_44px] items-center gap-1.5 px-3 py-2">
            <span className="font-mono text-[9px] font-bold text-amber-300">T{player.tier}</span>
            <span className="font-mono text-[9px] tabular-nums text-zinc-600">{String(player.rank).padStart(2, "0")}</span>
            <span className="truncate text-[11px] font-semibold text-zinc-100">{player.name}</span>
            <span className={`text-right font-mono text-[8px] font-bold ${
              player.position === "WR" ? "text-sky-300" : player.position === "RB" ? "text-emerald-300" : "text-zinc-300"
            }`}>{player.position}</span>
            <span className="text-right font-mono text-[10px] font-semibold tabular-nums text-zinc-200">{player.projection.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLeagueSync() {
  return (
    <div className="relative mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#080E0C] p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="space-y-1.5">
          {PLATFORMS.map((platform) => (
            <div key={platform.label} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${platform.className}`}>
              <span className="flex size-5 items-center justify-center rounded bg-current/10 font-mono text-[9px] font-bold">{platform.mark}</span>
              <span className="text-[10px] font-bold text-zinc-100">{platform.label}</span>
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="relative flex w-7 flex-col items-center gap-1">
          <span className="size-1 rounded-full bg-zinc-600" />
          <span className="h-5 w-px bg-gradient-to-b from-emerald-400/70 to-[#FF3E9D]/40" />
          <span className="size-1 rounded-full bg-[#FF3E9D]/70" />
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.055] p-2">
          <DraftEdgeLogo size={18} />
          <p className="mt-1.5 text-[10px] font-bold text-white">DraftEdge</p>
          <p className="mt-0.5 font-mono text-[8px] leading-relaxed text-zinc-500">Rules imported</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {["PPR", "12-team", "1QB", "Snake"].map((tag) => (
          <span key={tag} className="rounded bg-white/[0.045] px-1.5 py-0.5 font-mono text-[8px] text-zinc-400">{tag}</span>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const preview = buildHeroPreview();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip text-zinc-200">
      <SmoothScroll />
      <SiteHeader variant="marketing" />

      {/* ── Asymmetric hero ───────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.07] bg-[#080E0C]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-40 size-[34rem] rounded-full bg-emerald-500/[0.09] blur-[120px]" />
          <div className="absolute -right-40 top-20 size-[30rem] rounded-full bg-[#FF3E9D]/[0.075] blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 xl:gap-16">
            <div className="min-w-0 max-w-2xl">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#FF3E9D]/25 bg-[#FF3E9D]/[0.06] px-3 py-1.5 shadow-[0_0_30px_rgba(255,62,157,0.10)]">
                <span aria-hidden="true" className="size-1.5 shrink-0 animate-pulse rounded-full bg-[#FF3E9D]" />
                <span className="font-mono text-[9px] font-bold uppercase leading-relaxed tracking-[0.15em] text-[#FF9CCB] sm:text-[10px]">
                  2026 Season · VORP-powered fantasy edge
                </span>
              </div>

              <h1 className="mt-7 text-balance font-display text-[2.9rem] font-extrabold leading-[0.97] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.15rem] xl:text-[4.75rem]">
                <span className="block">Win Your League</span>
                <span className="block">
                  Before <span className="text-emerald-300">Kickoff</span><span className="text-[#FF3E9D]">.</span>
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
                Projections, trade grades, and draft-room calls built on value over replacement — tuned to your exact scoring format.
              </p>

              <Reveal delay={140}>
                <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-center">
                  <LandingPrimaryCta className="w-full min-[430px]:w-auto" />
                  <Link
                    href="/mock"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.025] px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/30 hover:bg-white/[0.05] hover:text-white"
                  >
                    Try Mock Draft
                    <span aria-hidden="true" className="text-zinc-500">→</span>
                  </Link>
                </div>
              </Reveal>

              <div className="mt-8">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">Quick launch</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_LAUNCH.map((chip) => (
                    <Link
                      key={chip.label}
                      href={chip.href}
                      className="group inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-[#0C1713] px-2.5 py-2 text-[11px] font-semibold text-zinc-400 transition hover:border-emerald-400/25 hover:bg-emerald-400/[0.055] hover:text-emerald-200"
                    >
                      <span className="text-zinc-500 transition group-hover:text-emerald-400">{chip.icon}</span>
                      {chip.label}
                      <ChevronRightIcon size={11} className="text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5 font-mono text-[9px] uppercase tracking-[0.1em] text-zinc-600">
                <span className="inline-flex items-center gap-1.5"><span className="size-1 rounded-full bg-emerald-400" /> No credit card</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-1 rounded-full bg-emerald-400" /> Sleeper + ESPN sync</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-1 rounded-full bg-[#FF3E9D]" /> 2026 board live</span>
              </div>
            </div>

            <Reveal delay={220} className="min-w-0">
              <LandingHeroPreview data={preview} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Platform + scoring credibility strip ──────────────── */}
      <section
        aria-label="League sync and scoring formats"
        className="relative z-10 border-b border-white/[0.07] bg-[#06100D]"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">Native league sync</span>
            <div className="flex items-center gap-2">
              {PLATFORMS.map((platform) => (
                <span key={platform.label} className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${platform.className}`}>
                  <span className="flex size-4 items-center justify-center rounded bg-current/10 font-mono text-[8px] font-bold">{platform.mark}</span>
                  <span className="text-[11px] font-bold text-zinc-100">{platform.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div aria-hidden="true" className="hidden h-6 w-px bg-white/[0.08] lg:block" />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">Built for</span>
            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map((format) => (
                <span key={format} className="rounded-md border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-zinc-300">
                  {format}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-400/80">
            <BoltIcon size={12} />
            Values adjusted to your rules
          </div>
        </div>
      </section>

      {/* ── 5-card bento grid ─────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 border-b border-white/[0.07]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">The full playbook</p>
              <h2 className="mt-3 max-w-2xl text-balance font-display text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
                Five tools. One connected edge.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-right">
              Every call draws from the same scoring-aware player board, so your draft, trades, and lineup stay in sync.
            </p>
          </div>

          <Reveal delay={100}>
            <div className="mt-10 grid gap-3 lg:grid-cols-12">
              <FeatureCard
                href="/trade"
                ariaLabel="Open the Trade Analyzer"
                className="min-h-[540px] lg:col-span-7 lg:row-span-2"
              >
                <FeatureHead
                  icon={<SwapIcon size={17} />}
                  kicker="Trade Analyzer"
                  title="Know who won before you hit accept."
                  body="Compare both packages against live player values, contract the bench, and get a letter grade with the reasoning behind it."
                />
                <div className="mt-8 flex flex-1 flex-col">
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {[
                      { label: "Package values", value: "2-way" },
                      { label: "QB-aware", value: "1QB / 2QB" },
                      { label: "Grades", value: "A+ → F" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                        <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] font-bold text-zinc-200">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <MiniTrade data={preview.trade} />
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    Open Trade Analyzer <ChevronRightIcon size={13} />
                  </span>
                </div>
              </FeatureCard>

              <FeatureCard
                href="/mock"
                ariaLabel="Open the Mock Draft Simulator"
                className="min-h-[285px] lg:col-span-5"
              >
                <FeatureHead
                  icon={<ClockIcon size={17} />}
                  kicker="Mock Draft Simulator"
                  title="Practice the room."
                  body="Draft against position-aware bots that punish reaches and reward value."
                />
                <MiniMock data={preview.mock} />
              </FeatureCard>

              <FeatureCard
                href="/start-sit"
                ariaLabel="Open the Start/Sit Comparator"
                className="min-h-[285px] lg:col-span-5"
              >
                <FeatureHead
                  icon={<ListCheckIcon size={17} />}
                  kicker="Start/Sit Comparator"
                  title="Make the close call."
                  body="See the projection gap, matchup context, and the verdict in one scan."
                />
                <MiniStartSit data={preview.startSit} />
              </FeatureCard>

              <FeatureCard
                href="/cheatsheet"
                ariaLabel="Open Cheat Sheets and Rankings"
                className="min-h-[290px] lg:col-span-7"
              >
                <FeatureHead
                  icon={<TableIcon size={17} />}
                  kicker="Cheat Sheets & Rankings"
                  title="A board built for your format."
                  body="VORP tiers, projections, and ADP in a printable, sortable draft sheet."
                />
                <MiniRankings data={preview.rankings} />
              </FeatureCard>

              <FeatureCard
                href="/leagues"
                ariaLabel="Connect a league"
                className="min-h-[290px] lg:col-span-5"
              >
                <FeatureHead
                  icon={<LinkIcon size={17} />}
                  kicker="League Sync"
                  title="Your rules, imported."
                  body="Sleeper and ESPN settings flow into every tool without a single manual entry."
                />
                <MiniLeagueSync />
              </FeatureCard>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 3-step workflow ───────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-white/[0.07] bg-[#06100D]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8BC4]">Setup to Sunday</p>
              <h2 className="mt-3 max-w-2xl text-balance font-display text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
                Three moves from league chaos to a locked-in edge.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400 lg:justify-self-end">
              No 40-tab spreadsheet. No manual scoring math. Connect once, and every DraftEdge tool starts from the same source of truth.
            </p>
          </div>

          <Reveal delay={100}>
            <div className="mt-10 grid overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.07] md:grid-cols-3 md:gap-px">
              {STEPS.map((step, index) => (
                <div key={step.n} className="group relative bg-[#0A1511] p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-zinc-600">STEP {step.n}</span>
                    <span className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-500 transition group-hover:border-emerald-400/25 group-hover:text-emerald-300">
                      {step.icon}
                    </span>
                  </div>
                  <span aria-hidden="true" className="mt-7 block font-display text-5xl font-extrabold tracking-[-0.05em] text-white/[0.09]">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.body}</p>
                  {index < STEPS.length - 1 && (
                    <span aria-hidden="true" className="absolute bottom-7 right-5 hidden text-zinc-700 md:block">→</span>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          <div className="mt-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
            <ArrowUpIcon size={11} className="text-emerald-400/70" />
            Sync better inputs → make sharper calls
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[#0A1712] px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute -left-24 top-1/2 size-72 -translate-y-1/2 rounded-full bg-emerald-500/[0.13] blur-[90px]" />
              <div className="absolute -right-20 top-0 size-64 rounded-full bg-[#FF3E9D]/[0.10] blur-[100px]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">DraftEdge 2026</p>
                <h2 className="mt-3 max-w-2xl text-balance font-display text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
                  Preparation wins. <span className="text-emerald-300">Start now.</span>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Sync your league, build your VORP board, and make every pick with a plan. Free to start.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <LandingPrimaryCta className="w-full whitespace-nowrap sm:w-auto" />
                <Link
                  href="/mock"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.025] px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/30 hover:bg-white/[0.05] hover:text-white"
                >
                  Try a Mock Draft <ChevronRightIcon size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto overflow-hidden border-t border-emerald-400/10 bg-zinc-950/60">
        <div className="relative mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-white">Quick Links</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
                <li>
                  <Link href="/" className="transition hover:text-white">Home</Link>
                </li>
                <li>
                  <a href="#features" className="transition hover:text-white">Features</a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                </li>
                <li>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">Open source</a>
                </li>
                <li>
                  <Link href="/signin" className="transition hover:text-white">Sign in</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Contact Us</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
                <li>
                  <a href="mailto:anshtolat@gmail.com" className="transition hover:text-white">anshtolat@gmail.com</a>
                </li>
                <li>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">GitHub</a>
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
              <Link href="/privacy" className="transition hover:text-zinc-300">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-zinc-300">Terms of Service</Link>
              <Link href="/cookies" className="transition hover:text-zinc-300">Cookie Settings</Link>
              <Link href="/accessibility" className="transition hover:text-zinc-300">Accessibility</Link>
              <Link href="/disclaimers" className="transition hover:text-zinc-300">Disclaimers</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
