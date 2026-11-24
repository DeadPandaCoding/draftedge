"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  AtSignIcon,
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

  // Preserve the deep link the user was sent here for (path + query string).
  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/home";
    return next;
  }, [searchParams]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Already authenticated → return to the originally requested tool, or the
  // home dashboard when the sign-in link did not include a deep link.
  useEffect(() => {
    if (loading || !user) return;
    router.replace(nextPath);
  }, [user, loading, router, nextPath]);

  const flipMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result =
      mode === "signup"
        ? await signUp(name, email, password, nextPath)
        : await signIn(email, password);
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
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle(nextPath);
      if (!result.ok) setError(result.error ?? "Google sign-in failed. Check that Google OAuth is enabled in Supabase.");
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Google sign-in failed. Check the Supabase Google provider configuration.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/[0.1] bg-[#080E0C] px-3.5 py-2.5 pl-9 pr-10 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-emerald-500/50";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#080E0C] px-4 py-10 text-zinc-100">
      <div className="w-full max-w-[880px]">
        <Link href="/" className="mb-8 flex items-center justify-center">
          <span className="font-display text-2xl font-extrabold tracking-tight text-white">
            Draft<span className="text-emerald-400">Edge</span><span className="text-[#FF3E9D]">.</span>
          </span>
        </Link>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1412]">
          <div className="flex flex-col md:flex-row">
            {/* ── Left CTA panel ─────────────────────────────────── */}
            <div className="flex flex-col items-center justify-center gap-3 border-b border-white/[0.08] bg-[#101C18] px-8 py-10 text-center md:w-[42%] md:border-b-0 md:border-r md:py-16">
              <h2 className="font-display text-3xl tracking-tight text-white">
                {mode === "signin" ? "New here?" : "Already have an account?"}
              </h2>
              <p className="max-w-[28ch] text-sm leading-relaxed text-zinc-400">
                {mode === "signin"
                  ? "Set up your account and put your draft tools in one place."
                  : "Sign in to get back to your league tools and draft boards."}
              </p>
              <button
                type="button"
                onClick={flipMode}
                className="mt-3 rounded-lg border border-white/[0.12] px-6 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.05] hover:text-white"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>

            </div>

            {/* ── Right form panel ───────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-8 py-10 md:px-12 md:py-16">
              <h1 className="font-display text-3xl tracking-tight text-white">
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
                      maxLength={80}
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
                    maxLength={254}
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
                    maxLength={128}
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
                  <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "One sec…" : mode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
                <span className="h-px flex-1 bg-white/[0.08]" />
                Or continue with
                <span className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading || submitting}
                  aria-label="Continue with Google"
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/[0.1] bg-[#080E0C] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {googleLoading ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" /> : <GoogleIcon size={18} />}
                  {googleLoading ? "Connecting…" : "Continue with Google"}
                </button>
                {!supabaseEnabled && <p className="mt-2 text-center text-[10px] text-zinc-500">Google sign-in uses demo mode while Supabase is not configured.</p>}
                <p className="mt-3 text-center text-xs leading-relaxed text-zinc-400">
                  By continuing, you confirm you are 13 years of age or older and agree to our{" "}
                  <Link href="/terms" className="font-semibold text-emerald-300 underline underline-offset-2 hover:text-emerald-200">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-semibold text-emerald-300 underline underline-offset-2 hover:text-emerald-200">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
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
