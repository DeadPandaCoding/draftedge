"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase/client";

/**
 * Authentication.
 *
 * Primary: Supabase Auth (email/password + Google OAuth) when
 * `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
 *
 * Fallback: local demo auth in localStorage when Supabase is unconfigured, so
 * the app still runs with zero setup. Demo passwords use a deliberately simple
 * hash — it is NOT production-grade and only exists for the fallback mode.
 */

export interface AuthUser {
  id: string; // Supabase user id (demo mode: the email address)
  email: string;
  name: string;
  provider: "email" | "google";
  createdAt: number;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** True when Supabase requires email confirmation before the session exists. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  supabaseEnabled: boolean;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const USERS_KEY = "draftedge.users.v1";
const SESSION_KEY = "draftedge.session.v1";

/** Simple deterministic hash (demo fallback only — not cryptographic). */
function hashPassword(password: string): string {
  let h = 5381;
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) + h + password.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(36)}`;
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Maps a Supabase user to the app's AuthUser shape. */
function mapSupabaseUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (meta.name as string) ||
    (meta.full_name as string) ||
    (meta.display_name as string) ||
    u.email?.split("@")[0] ||
    "Player";
  return {
    id: u.id,
    email: u.email ?? "",
    name: String(name),
    provider: u.app_metadata?.provider === "google" ? "google" : "email",
    createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now(),
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── Demo fallback: hydrate the session from localStorage. ──
    if (!isSupabaseConfigured()) {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as AuthUser;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUser({ ...stored, id: stored.id ?? stored.email });
        }
      } catch {
        // ignore corrupted session
      }
      setLoading(false);
      return;
    }

    // ── Supabase: resolve the session and subscribe to changes. ──
    const supabase = getSupabaseBrowser();
    let active = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!active) return;
      if (data.session?.user) setUser(mapSupabaseUser(data.session.user));
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
        setLoading(false);
      }
    );
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    // ── Demo fallback handlers (Supabase unconfigured). ──
    const persistDemoSession = (u: AuthUser | null) => {
      setUser(u);
      if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      else localStorage.removeItem(SESSION_KEY);
    };
    const demoSignUp = (name: string, email: string, password: string): AuthResult => {
      const normalized = normalizeEmail(email);
      if (!name.trim()) return { ok: false, error: "Please enter your name." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
        return { ok: false, error: "Please enter a valid email address." };
      if (password.length < 6)
        return { ok: false, error: "Password must be at least 6 characters." };
      const users = loadUsers();
      if (users.some((u) => u.email === normalized))
        return { ok: false, error: "An account with that email already exists. Sign in instead." };
      const stored: StoredUser = {
        id: normalized,
        email: normalized,
        name: name.trim(),
        provider: "email",
        createdAt: Date.now(),
        passwordHash: hashPassword(password),
      };
      saveUsers([...users, stored]);
      persistDemoSession({
        id: stored.id,
        email: stored.email,
        name: stored.name,
        provider: stored.provider,
        createdAt: stored.createdAt,
      });
      return { ok: true };
    };
    const demoSignIn = (email: string, password: string): AuthResult => {
      const normalized = normalizeEmail(email);
      const stored = loadUsers().find((u) => u.email === normalized);
      if (!stored || stored.passwordHash !== hashPassword(password))
        return { ok: false, error: "Invalid email or password." };
      persistDemoSession({
        id: stored.id,
        email: stored.email,
        name: stored.name,
        provider: stored.provider,
        createdAt: stored.createdAt,
      });
      return { ok: true };
    };

    if (!isSupabaseConfigured()) {
      return {
        user,
        loading,
        supabaseEnabled: false,
        async signUp(name, email, password) {
          return demoSignUp(name, email, password);
        },
        async signIn(email, password) {
          return demoSignIn(email, password);
        },
        async signInWithGoogle() {
          // Demo stand-in for Google OAuth — instant account, zero setup.
          persistDemoSession({
            id: "demo@draftedge.app",
            email: "demo@draftedge.app",
            name: "Demo Manager",
            provider: "google",
            createdAt: Date.now(),
          });
        },
        async signOut() {
          persistDemoSession(null);
        },
      };
    }

    // ── Supabase handlers. ──
    const supabase = getSupabaseBrowser();
    return {
      user,
      loading,
      supabaseEnabled: true,
      async signUp(name, email, password) {
        if (!name.trim()) return { ok: false, error: "Please enter your name." };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email)))
          return { ok: false, error: "Please enter a valid email address." };
        if (password.length < 6)
          return { ok: false, error: "Password must be at least 6 characters." };
        const { data, error } = await supabase.auth.signUp({
          email: normalizeEmail(email),
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) return { ok: false, error: error.message };
        // If email confirmation is enabled, no session is returned yet.
        if (!data.session?.user) return { ok: true, needsEmailConfirmation: true };
        return { ok: true };
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizeEmail(email),
          password,
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },
      async signInWithGoogle() {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
