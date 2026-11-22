"use client";

import { Analytics } from "@vercel/analytics/next";
import { useSyncExternalStore } from "react";

const CONSENT_KEY = "draftedge.consent.v1";
const CONSENT_CHANGE_EVENT = "draftedge:consent-change";

function hasAnalyticsConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const consent: unknown = JSON.parse(raw);
    return (
      typeof consent === "object" &&
      consent !== null &&
      "analytics" in consent &&
      consent.analytics === true
    );
  } catch {
    return false;
  }
}

function subscribeToConsent(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ConsentAwareAnalytics() {
  const allowed = useSyncExternalStore(subscribeToConsent, hasAnalyticsConsent, () => false);
  return allowed ? <Analytics /> : null;
}
