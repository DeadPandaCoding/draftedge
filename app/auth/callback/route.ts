import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function getSafeNextUrl(next: string | null, origin: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return new URL("/home", origin);
  }

  const destination = new URL(next, origin);
  return destination.origin === origin ? destination : new URL("/home", origin);
}

/**
 * Completes PKCE and email confirmation flows, persists their session in
 * cookies, and redirects into the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const destination = getSafeNextUrl(searchParams.get("next"), origin);

  const supabase = await getSupabaseServer();
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(destination);
  } else if (supabase && tokenHash && rawType && EMAIL_OTP_TYPES.has(rawType as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: rawType as EmailOtpType,
    });
    if (!error) return NextResponse.redirect(destination);
  }

  const failure = new URL("/signin", origin);
  failure.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(failure);
}
