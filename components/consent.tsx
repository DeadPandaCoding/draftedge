"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui";

/**
 * Cookie consent.
 *
 * Records the user's consent decision for optional cookie categories and
 * persists it to both localStorage and a first-party cookie so it survives
 * across sessions and (in future) can be read server-side.
 *
 * The only cookies DraftEdge actually sets today are strictly necessary ones
 * (Supabase auth session). The Preferences / Analytics / Marketing categories
 * are recorded so the framework is in place before optional integrations are
 * added — nothing is loaded against them yet.
 */

export type ConsentCategory = "preferences" | "analytics" | "marketing";

export interface ConsentCategories {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = "draftedge.consent.v1";
const CONSENT_COOKIE = "draftedge_consent";
const ONE_YEAR = 60 * 60 * 24 * 365;

const ALL_ACCEPTED: ConsentCategories = {
  necessary: true,
  preferences: true,
  analytics: true,
  marketing: true,
};

const NECESSARY_ONLY: ConsentCategories = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

function readConsent(): ConsentCategories | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    // fall through to cookie
  }
  try {
    const pair = document.cookie
      .split("; ")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    if (pair) return normalize(JSON.parse(decodeURIComponent(pair.slice(CONSENT_COOKIE.length + 1))));
  } catch {
    // ignore malformed cookie
  }
  return null;
}

function normalize(raw: unknown): ConsentCategories | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.necessary !== "boolean") return null;
  return {
    necessary: true,
    preferences: r.preferences === true,
    analytics: r.analytics === true,
    marketing: r.marketing === true,
  };
}

function writeConsent(c: ConsentCategories) {
  if (typeof window === "undefined") return;
  const value = JSON.stringify(c);
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // storage may be unavailable (private mode) — cookie still works
  }
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; max-age=${ONE_YEAR}; path=/; SameSite=Lax`;
}

const OPTIONAL: {
  key: ConsentCategory;
  label: string;
  description: string;
}[] = [
  {
    key: "preferences",
    label: "Preferences",
    description: "Remember your choices, such as this consent decision and display settings.",
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Help us understand how the product is used so we can improve it.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Enable personalized promotions. Not currently used.",
  },
];

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
        checked ? "bg-emerald-500" : "bg-zinc-700",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function ConsentOptions({
  value,
  onChange,
}: {
  value: ConsentCategories;
  onChange: (c: ConsentCategories) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-xl bg-zinc-900/50 p-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Necessary</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Required for the site to function — sign-in, security, and saving your draft. Always active.
          </p>
        </div>
        <Toggle checked disabled label="Necessary cookies (always active)" onChange={() => {}} />
      </div>
      {OPTIONAL.map((opt) => (
        <div key={opt.key} className="flex items-start justify-between gap-4 rounded-xl bg-zinc-900/50 p-3">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{opt.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{opt.description}</p>
          </div>
          <Toggle
            checked={value[opt.key]}
            label={`${opt.label} cookies`}
            onChange={(v) => onChange({ ...value, [opt.key]: v })}
          />
        </div>
      ))}
    </div>
  );
}

/** Floating first-visit banner. Mounted once in the root layout. */
export function CookieConsent() {
  // undefined = hydrating; null = no decision yet; object = decided.
  const [consent, setConsent] = useState<ConsentCategories | null | undefined>(undefined);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentCategories>(NECESSARY_ONLY);

  useEffect(() => {
    // Read the saved decision after hydration (localStorage/cookies are not
    // available during server render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readConsent());
  }, []);

  const decide = (c: ConsentCategories) => {
    writeConsent(c);
    setConsent(c);
    setPrefsOpen(false);
  };

  if (consent === undefined) return null; // hydrating
  if (consent !== null) return null; // already decided

  return (
    <>
      <div
        role="region"
        aria-label="Cookie consent"
        className="fixed inset-x-0 bottom-0 z-50 p-4"
      >
        <div className="glass-strong mx-auto max-w-3xl rounded-2xl p-4">
          <p className="text-sm leading-relaxed text-zinc-200">
            We use necessary cookies to keep you signed in and make DraftEdge work. Optional cookies
            remember your preferences and help us improve the product. We do not use advertising or
            third-party tracking cookies.{" "}
            <a href="/cookies" className="font-semibold text-emerald-300 underline-offset-2 hover:underline">
              Learn more
            </a>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => decide(ALL_ACCEPTED)}
              className="btn-glass-primary rounded-lg px-3.5 py-1.5 text-sm font-bold"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => decide(NECESSARY_ONLY)}
              className="glass glass-hover rounded-lg px-3.5 py-1.5 text-sm font-semibold text-zinc-200"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(NECESSARY_ONLY);
                setPrefsOpen(true);
              }}
              className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-zinc-400 underline-offset-2 hover:text-zinc-100 hover:underline"
            >
              Preferences
            </button>
          </div>
        </div>
      </div>

      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)} title="Cookie preferences">
        <ConsentOptions value={draft} onChange={setDraft} />
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => decide(NECESSARY_ONLY)}
            className="glass glass-hover rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={() => decide(draft)}
            className="btn-glass-primary rounded-lg px-4 py-2 text-sm font-bold"
          >
            Save preferences
          </button>
        </div>
      </Modal>
    </>
  );
}

/** Inline manager for the /cookies page — view and change your current consent. */
export function CookiePreferences() {
  const [value, setValue] = useState<ConsentCategories | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(readConsent() ?? NECESSARY_ONLY);
  }, []);

  if (value === undefined) return null;

  const save = (c: ConsentCategories) => {
    writeConsent(c);
    setValue(c);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="glass rounded-2xl p-5">
      <ConsentOptions value={value} onChange={setValue} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-500" role="status" aria-live="polite">
          {saved ? "Preferences saved." : "Your choices apply to this browser only."}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => save(NECESSARY_ONLY)}
            className="glass glass-hover rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={() => save(ALL_ACCEPTED)}
            className="btn-glass-primary rounded-lg px-4 py-2 text-sm font-bold"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => save(value)}
            className="glass glass-hover rounded-lg px-4 py-2 text-sm font-semibold text-zinc-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
