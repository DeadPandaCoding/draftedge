import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn-standard class merge helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize free-text player search so punctuation never blocks a match.
 * Apostrophes are removed (Jamarr -> Ja'Marr), periods are dropped
 * (St Brown -> St. Brown), hyphens become spaces (Amon Ra -> Amon-Ra), and
 * repeated whitespace collapses.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/\./g, "")
    .replace(/[\u2010-\u2015\u2212-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
