"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { LogoutIcon } from "@/components/icons";
import { SiteHeader } from "@/components/ui/header";

export default function AppShell({
  children,
  maxWidth = "max-w-6xl",
  className = "",
}: {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}) {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col text-zinc-200">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <SiteHeader
        variant="app"
        actions={
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            aria-label="Log out"
            className="glass glass-hover flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            <LogoutIcon size={14} />
            Log Out
          </button>
        }
      />

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className={`relative z-10 mx-auto w-full flex-1 px-6 pb-20 ${maxWidth} ${className}`}>
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto border-t border-emerald-400/10 py-5 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} DraftEdge · Not affiliated with the NFL or Sleeper
      </footer>
    </div>
  );
}
