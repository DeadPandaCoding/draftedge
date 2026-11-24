"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ChevronRightIcon } from "@/components/icons";

/**
 * Marketing CTA that becomes a dashboard shortcut for signed-in visitors.
 * The sign-in link preserves /leagues as the post-auth destination.
 */
export function LandingPrimaryCta({
  className = "",
  label = "Sync Your League",
  signedInLabel = "Open Dashboard",
  marketingHref = "/signin?next=%2Fleagues",
}: {
  className?: string;
  label?: string;
  signedInLabel?: string;
  marketingHref?: string;
}) {
  const { user } = useAuth();
  const href = user ? "/home" : marketingHref;

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-emerald-500 px-6 py-3.5 text-sm font-bold text-[#022C22] transition-colors hover:bg-emerald-400 active:bg-emerald-600 ${className}`}
    >
      {user ? signedInLabel : label}
      <ChevronRightIcon size={16} />
    </Link>
  );
}
