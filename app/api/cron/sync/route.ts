import { NextRequest, NextResponse } from "next/server";
import { GET as getPlayers } from "@/app/api/players/route";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled sync endpoint.
 *
 * GET and POST require the CRON_SECRET bearer token. Each run builds the fresh
 * player board for all scoring formats and stores the complete response in
 * `projections_snapshots`. The public player API serves those snapshots between
 * scheduled runs.
 *
 * Env vars required:
 *   SUPABASE_SERVICE_ROLE_KEY — to write snapshots (bypasses RLS).
 *   CRON_SECRET              — Vercel sends this as `Authorization: Bearer …`.
 *   VERCEL_URL               — auto-set by Vercel; used for the loopback fetch.
 *                              Falls back to localhost:3000 in dev.
 */

const SCORING_FORMATS = ["ppr", "half_ppr", "standard"] as const;

function isAuthorized(req: Request): boolean {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && auth === `Bearer ${secret}`);
}

interface SyncResult {
  scoring: string;
  playerCount: number;
  snapshotId?: string;
  error?: string;
}

async function runSync(): Promise<NextResponse> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured — sync disabled." },
      { status: 503 }
    );
  }

  const results: SyncResult[] = [];

  for (const scoring of SCORING_FORMATS) {
    try {
      // Invoke the protected handler in-process so deployment protection cannot
      // intercept an HTTP loopback request from this Vercel function.
      const request = new NextRequest(
        `http://localhost/api/players?scoring=${scoring}&refresh=1`,
        { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } },
      );
      const res = await getPlayers(request);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as {
        players: unknown[];
        source: "live" | "seed";
        generatedAt: number;
        weeklyRankingsUpdated?: string;
      };
      if (!Array.isArray(body.players) || body.players.length === 0 || body.source !== "live") {
        throw new Error("Live player data unavailable; keeping the previous snapshot.");
      }

      // Insert a new snapshot row (history, not upsert).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (admin as any)
        .from("projections_snapshots")
        .insert({
          scoring,
          player_count: body.players?.length ?? 0,
          data: body,
        })
        .select("id")
        .single();

      if (error) throw error;
      results.push({
        scoring,
        playerCount: body.players?.length ?? 0,
        snapshotId: data?.id ?? undefined,
      });
    } catch (err) {
      results.push({
        scoring,
        playerCount: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: results.every((r) => !r.error),
    synced: results,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSync();
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSync();
}
