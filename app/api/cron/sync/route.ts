import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled sync endpoint.
 *
 * GET  — triggered by Vercel Cron (verified via CRON_SECRET bearer token).
 * POST — manual trigger (for testing / admin dashboards).
 *
 * What it does:
 *  1. Fetches `/api/players?scoring=…` for each scoring format, which triggers
 *     the full Sleeper + nflverse + FantasyPros pipeline and caches the result
 *     in Next.js ISR (s-maxage = 3600 s). This "warms" the cache so the next
 *     user request is instant.
 *  2. Stores each format's player array as a JSON snapshot in the
 *     `projections_snapshots` Supabase table, giving a historical time series.
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
  if (secret && auth === `Bearer ${secret}`) return true;
  // Manual POST (no auth required for local testing — gated by service-role check below).
  return req.method === "POST";
}

async function getBaseUrl(): Promise<string> {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Local dev fallback.
  return "http://localhost:3000";
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

  const baseUrl = await getBaseUrl();
  const results: SyncResult[] = [];

  for (const scoring of SCORING_FORMATS) {
    try {
      // Fetch the full player board. cache: "no-store" ensures the route
      // handler actually runs (no stale edge cache), and the response it
      // produces is what gets cached in ISR for subsequent user requests.
      const res = await fetch(`${baseUrl}/api/players?scoring=${scoring}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { players: unknown[]; source: string };

      // Insert a new snapshot row (history, not upsert).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (admin as any)
        .from("projections_snapshots")
        .insert({
          scoring,
          player_count: body.players?.length ?? 0,
          data: body.players ?? [],
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

export async function POST() {
  // Manual trigger — still requires service-role key to be configured.
  return runSync();
}
