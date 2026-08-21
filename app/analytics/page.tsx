"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import KineticGrid from "@/components/ui/kinetic-grid";
import { BarChartIcon, BoltIcon, LogoutIcon } from "@/components/icons";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Guards: must be signed in to see analytics.
  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <div className="relative flex min-h-screen flex-col text-zinc-200">
      {/* Kinetic grid background — warps toward the pointer, ripples on click */}
      <KineticGrid globalColor="default" className="pointer-events-none fixed inset-0 z-0" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-30 flex items-center justify-between gap-3 px-6 py-4">
        <Link href="/home" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={16} />
          </span>
          <span className="font-display text-lg tracking-wide text-white">
            Draft<span className="text-emerald-400">Edge</span>
          </span>
        </Link>
        <button
          onClick={() => {
            signOut();
            router.push("/");
          }}
          className="glass glass-hover flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white"
        >
          <LogoutIcon size={14} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </header>

      {/* ── Placeholder ──────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="glass-strong w-full max-w-md rounded-2xl p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BarChartIcon size={26} />
          </span>
          <h1 className="mt-5 font-display text-2xl tracking-wide text-white">Draft Analytics</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            This is on the way. Soon you&apos;ll review your draft, spot value picks, and grade your
            team right here.
          </p>
          <span className="mt-4 inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            Coming soon
          </span>
          <div className="mt-6">
            <Link
              href="/home"
              className="btn-glass-primary inline-block w-full rounded-xl py-3 text-sm font-bold transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto border-t border-emerald-400/10 py-5 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} DraftEdge · Not affiliated with the NFL or Sleeper
      </footer>
    </div>
  );
}
