import Link from "next/link";
import type { ReactNode } from "react";
import { BoltIcon } from "@/components/icons";

/**
 * Shared shell + prose primitives for the legal pages (Privacy, Terms,
 * Cookies). Keeps the same Liquid Glass identity as the rest of the site.
 */

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/accessibility", label: "Accessibility" },
];

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="glass-nav sticky top-0 z-30 mx-auto flex w-full items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={16} />
          </span>
          <span className="font-display text-lg tracking-wide text-white">
            Draft<span className="text-emerald-400">Edge</span>
          </span>
        </Link>
        <Link
          href="/"
          className="glass glass-hover rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white"
        >
          ← Back to site
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="glass rounded-2xl p-8 md:p-10">
          <h1 className="font-display text-2xl tracking-wide text-white md:text-3xl">{title}</h1>
          <p className="mt-2 text-xs font-medium text-zinc-500">Last updated: {updated}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-emerald-400/10 bg-zinc-950/50">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <span className="text-xs text-zinc-500">
            © {new Date().getFullYear()} DraftEdge · Not affiliated with the NFL or Sleeper
          </span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-medium text-zinc-500 transition hover:text-zinc-200"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 mb-3 text-lg font-semibold text-white">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-2 text-base font-semibold text-zinc-100">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="my-3 text-sm leading-relaxed text-zinc-400">{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="my-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-400">{children}</ul>;
}

export function Li({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-zinc-200">{children}</strong>;
}
