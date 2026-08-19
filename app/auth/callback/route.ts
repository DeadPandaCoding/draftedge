import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * OAuth callback: exchanges the auth code for a session (stored in cookies),
 * then sends the user into the app. If they have no league yet, the /draft
 * guard bounces them to onboarding.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/draft";

  const supabase = await getSupabaseServer();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/signin?error=OAuth+sign-in+failed`);
}
