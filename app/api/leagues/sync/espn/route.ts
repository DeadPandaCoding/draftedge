import { NextResponse } from "next/server";
import { syncEspnLeague } from "@/lib/espn-sync";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  const leagueId = typeof body.leagueId === "string" ? body.leagueId.trim() : "";
  if (!leagueId) return NextResponse.json({ error: "Enter an ESPN league ID." }, { status: 400 });

  try {
    const result = await syncEspnLeague({
      leagueId,
      season: typeof body.season === "string" ? body.season : undefined,
      espnS2: typeof body.espnS2 === "string" ? body.espnS2.trim() : undefined,
      swid: typeof body.swid === "string" ? body.swid.trim() : undefined,
      teamId: typeof body.teamId === "string" ? body.teamId : undefined,
    });
    if (result.needsTeamSelection) return NextResponse.json({ teams: result.teams, needsTeamSelection: true });
    const { data, error } = await supabase.from("user_leagues").upsert({ ...result.league, user_id: user.id }, {
      onConflict: "user_id,platform,platform_league_id",
    }).select("*").single();
    if (error) return NextResponse.json({ error: `Could not save ESPN league. Apply migration 0007_espn_leagues.sql first. ${error.message}` }, { status: 500 });
    return NextResponse.json({ league: data, teams: result.teams });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ESPN sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
