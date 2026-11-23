import { NextResponse } from "next/server";
import { syncSleeperLeagues } from "@/lib/sleeper-sync";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { username?: unknown; leagueId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const usernameInput = typeof body.username === "string" ? body.username.trim() : "";
  const leagueId = typeof body.leagueId === "string" ? body.leagueId : undefined;
  let username = usernameInput;
  if (!username) {
    let savedQuery = supabase.from("user_leagues").select("sleeper_username").eq("user_id", user.id);
    if (leagueId) savedQuery = savedQuery.eq("platform_league_id", leagueId);
    const { data: saved, error } = await savedQuery.order("last_synced_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return NextResponse.json({ error: `Could not load saved Sleeper account: ${error.message}` }, { status: 500 });
    username = saved?.sleeper_username ?? "";
  }
  if (!username) return NextResponse.json({ error: "Enter a Sleeper username to connect first." }, { status: 400 });

  try {
    const leagues = await syncSleeperLeagues(username, leagueId);
    const rows = leagues.map((league) => ({ ...league, user_id: user.id }));
    const { data, error } = await supabase
      .from("user_leagues")
      .upsert(rows, { onConflict: "user_id,platform,platform_league_id" })
      .select("*");
    if (error) return NextResponse.json({ error: `Could not save leagues. Apply migration 0006_user_leagues.sql first. ${error.message}` }, { status: 500 });
    return NextResponse.json({ leagues: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sleeper sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
