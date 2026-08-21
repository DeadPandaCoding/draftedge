"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpIcon,
  BarChartIcon,
  BoltIcon,
  ChevronDownIcon,
  ClockIcon,
  EyeIcon,
  FlaskIcon,
  LockIcon,
  MenuIcon,
  SwapIcon,
  TableIcon,
  UsersIcon,
  XIcon,
} from "@/components/icons";

type HeaderItem = {
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
  external?: boolean;
};

const GITHUB_URL = "https://github.com/DeadPandaCoding/draftedge";

const TOOLS: HeaderItem[] = [
  {
    label: "Trade Analyzer",
    href: "/trade",
    icon: <SwapIcon size={18} />,
    description: "See who wins a deal before you accept.",
  },
  {
    label: "Cheat Sheets",
    href: "/cheatsheet",
    icon: <TableIcon size={18} />,
    description: "A draft board tuned to your league.",
  },
  {
    label: "Mock Drafts",
    href: "/mock",
    icon: <ClockIcon size={18} />,
    description: "Practice against position-aware picks.",
  },
  {
    label: "Player Rankings",
    href: "/rankings",
    icon: <ArrowUpIcon size={18} />,
    description: "Projections, tiers, and ADP.",
  },
  {
    label: "Draft Analytics",
    href: "/analytics",
    icon: <BarChartIcon size={18} />,
    description: "Grade your draft and spot value.",
  },
  {
    label: "Research Hub",
    href: "/research",
    icon: <FlaskIcon size={18} />,
    description: "Value leaders and positional depth.",
  },
];

const COMPANY: HeaderItem[] = [
  {
    label: "How it works",
    href: "#how-it-works",
    icon: <ClockIcon size={18} />,
    description: "Three steps from setup to draft day.",
  },
  {
    label: "Open source",
    href: GITHUB_URL,
    icon: <UsersIcon size={18} />,
    description: "Built in the open on GitHub.",
    external: true,
  },
  {
    label: "Terms of Service",
    href: "/terms",
    icon: <LockIcon size={18} />,
    description: "The fine print.",
  },
  {
    label: "Privacy Policy",
    href: "/privacy",
    icon: <EyeIcon size={18} />,
    description: "How we handle your data.",
  },
];

const NAV = {
  marketing: {
    menus: [
      { trigger: "Product", items: TOOLS },
      { trigger: "Company", items: COMPANY },
    ],
    links: [{ label: "Features", href: "#features" }],
  },
  app: {
    menus: [{ trigger: "Tools", items: TOOLS }],
    links: [{ label: "Home", href: "/home" }],
  },
} as const;

function MenuLink({ item, onNavigate }: { item: HeaderItem; onNavigate?: () => void }) {
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/70 text-zinc-300 ring-1 ring-inset ring-zinc-700/60">
        {item.icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-zinc-100">{item.label}</span>
        {item.description && (
          <span className="truncate text-xs text-zinc-500">{item.description}</span>
        )}
      </span>
    </>
  );

  const cls =
    "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-zinc-800/70";

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={cls}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} onClick={onNavigate} className={cls}>
      {inner}
    </Link>
  );
}

/**
 * Shared DraftEdge header, adapted from the shadcn reference into the project's
 * Liquid Glass system. Two variants:
 *   - "marketing": Product/Company dropdowns + Features link + Sign In / Get Started
 *   - "app":        Tools dropdown + Home link + caller-supplied actions (e.g. Log Out)
 */
export function SiteHeader({
  variant,
  actions,
}: {
  variant: "marketing" | "app";
  actions?: ReactNode;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { menus, links } = NAV[variant];
  const logoHref = variant === "marketing" ? "/" : "/home";

  // Close the dropdown/mobile menu on outside pointer or Escape.
  useEffect(() => {
    if (!openMenu && !mobileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu, mobileOpen]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const rightActions =
    variant === "marketing" ? (
      <>
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
      </>
    ) : (
      actions
    );

  return (
    <div ref={rootRef}>
      <header className="glass-nav sticky top-0 z-50">
        <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href={logoHref} className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                <BoltIcon size={16} />
              </span>
              <span className="font-display text-lg tracking-wide text-white">
                Draft<span className="text-emerald-400">Edge</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              {menus.map((menu) => (
                <div key={menu.trigger} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu(openMenu === menu.trigger ? null : menu.trigger)}
                    aria-expanded={openMenu === menu.trigger}
                    aria-haspopup="menu"
                    className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-white/5 hover:text-white ${
                      openMenu === menu.trigger ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {menu.trigger}
                    <ChevronDownIcon
                      size={14}
                      className={`transition-transform duration-200 ${
                        openMenu === menu.trigger ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openMenu === menu.trigger && (
                    <div className="glass-popover absolute left-0 top-full z-40 mt-2 w-[430px] overflow-hidden rounded-xl p-1.5">
                      <div className="grid grid-cols-2 gap-1">
                        {menu.items.map((item) => (
                          <MenuLink key={item.label} item={item} onNavigate={() => setOpenMenu(null)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">{rightActions}</div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="glass flex h-10 w-10 items-center justify-center rounded-lg text-zinc-200 transition hover:text-white md:hidden"
          >
            {mobileOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
          </button>
        </nav>
      </header>

      {/* Mobile menu — sibling of the header so the header's backdrop-filter
          doesn't trap the fixed overlay as a containing block. */}
      {mobileOpen && (
        <div
          id="site-mobile-menu"
          className="fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex h-full flex-col overflow-y-auto px-4 pb-10 pt-24 sm:px-6">
            {menus.map((menu) => (
              <div key={menu.trigger} className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {menu.trigger}
                </p>
                <div className="space-y-1">
                  {menu.items.map((item) => (
                    <MenuLink key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                </div>
              </div>
            ))}
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-2 border-t border-emerald-400/10 pt-4">
              {rightActions}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
