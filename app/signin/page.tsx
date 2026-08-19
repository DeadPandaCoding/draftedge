"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import KineticGrid from "@/components/ui/kinetic-grid";
import {
  AtSignIcon,
  BoltIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  LockIcon,
  UserIcon,
} from "@/components/icons";

function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, supabaseEnabled, signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → land on the home dashboard (setup card or league
  // overview is decided there based on whether a league exists).
  useEffect(() => {
    if (loading || !user) return;
    router.replace("/home");
  }, [user, loading, router]);

  const flipMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result =
      mode === "signup" ? await signUp(name, email, password) : await signIn(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    if (result.needsEmailConfirmation) {
      // Supabase requires email confirmation — stay here and prompt.
      setError("Account created! Check your email to confirm, then sign in.");
      return;
    }
    // Redirect to the app is handled by the effect watching `user`.
  };

  const handleGoogle = async () => {
    setError(null);
    await signInWithGoogle();
    // Supabase OAuth navigates away; demo mode signs in and the effect redirects.
  };

  const inputClass =
    "glass-input w-full rounded-lg px-3.5 py-2.5 pl-9 pr-10 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition";

  const socialCircle =
    "glass glass-hover flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 hover:-translate-y-0.5 hover:text-white";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      {/* Kinetic grid background — warps toward the pointer, ripples on click */}
      <KineticGrid globalColor="default" className="pointer-events-none fixed inset-0 z-0" />

      {/* Brand glow above the grid */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[880px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={18} />
          </span>
          <span className="font-display text-xl tracking-wide text-white">
            Draft<span className="text-emerald-400">Edge</span>
          </span>
        </Link>

        <div className="glass-strong overflow-hidden rounded-3xl">
          <div className="flex flex-col md:flex-row">
            {/* ── Left CTA panel ─────────────────────────────────── */}
            <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 px-8 py-10 text-center md:w-[42%] md:py-16">
              <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-emerald-950/30 blur-2xl" />
              <h2 className="font-display text-3xl tracking-wide text-white">
                {mode === "signin" ? "New here?" : "Already have an account?"}
              </h2>
              <p className="max-w-[28ch] text-sm leading-relaxed text-emerald-50/85">
                {mode === "signin"
                  ? "Join us today and discover a world of possibilities. Create your account in seconds!"
                  : "Welcome back! Sign in to pick up your draft right where you left off."}
              </p>
              <button
                onClick={flipMode}
                className="mt-3 rounded-full border-2 border-white/85 px-9 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-emerald-700"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>

              {/* Curved wave edge bleeding into the form panel */}
              <svg
                aria-hidden
                className="absolute right-0 top-0 hidden h-full w-10 md:block"
                viewBox="0 0 40 100"
                preserveAspectRatio="none"
              >
                <path d="M0 0 H40 V100 H0 C 20 25, 20 75, 0 100 Z" fill="rgba(255,255,255,0.05)" />
              </svg>
            </div>

            {/* ── Right form panel ───────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-8 py-10 md:px-12 md:py-16">
              <h1 className="font-display text-3xl tracking-wide text-white">
                {mode === "signin" ? "Sign in" : "Create account"}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-400">
                {mode === "signin"
                  ? "Access your draft room and cheat sheet."
                  : "Set up your league and start drafting."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div className="relative">
                    <UserIcon
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="relative">
                  <AtSignIcon
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === "signin" ? "Email" : "you@example.com"}
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <LockIcon
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signin" ? "Password" : "At least 6 characters"}
                    className={inputClass}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-700/50 hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>

                {error && (
                  <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-glass-primary font-display w-full rounded-full py-3 text-sm uppercase tracking-wider transition"
                >
                  {submitting ? "One sec…" : mode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
                <span className="h-px flex-1 bg-zinc-800" />
                Or continue with
                <span className="h-px flex-1 bg-zinc-800" />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogle}
                  aria-label="Sign in with Google"
                  title={supabaseEnabled ? "Continue with Google" : "Continue with Google (demo)"}
                  className={socialCircle}
                >
                  <GoogleIcon size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-500">
          {supabaseEnabled
            ? "Accounts and draft data are stored securely with Supabase."
            : "Demo mode: local account, no data leaves your browser."}
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <AuthCard />
    </Suspense>
  );
}
