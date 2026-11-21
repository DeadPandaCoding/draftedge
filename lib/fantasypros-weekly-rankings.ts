import { cellNumber, csvToRecords, parseCsv } from "./csv-parse";
import { normalizeName } from "./seed-data";
import type { Position } from "./types";

const RANKINGS_URL =
  "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv";
const REVALIDATE_SECONDS = 3600;
const MAX_AGE_MS = 8 * 24 * 60 * 60 * 1000;

export interface WeeklyRanking {
  position: Position;
  positionRank: number;
}

export interface WeeklyRankings {
  byName: Map<string, WeeklyRanking>;
  updatedAt?: string;
}

function parsePosition(value: string): Position | undefined {
  const position = value.trim().toUpperCase();
  if (position === "DST" || position === "D/ST") return "DEF";
  if (["QB", "RB", "WR", "TE", "K", "DEF"].includes(position)) {
    return position as Position;
  }
  return undefined;
}

/** Fetches the latest weekly FantasyPros ECR snapshot published by DynastyProcess. */
export async function fetchWeeklyRankings(): Promise<WeeklyRankings> {
  const response = await fetch(RANKINGS_URL, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Weekly rankings failed (${response.status})`);

  const records = csvToRecords(parseCsv(await response.text()));
  const dates = records
    .map((record) => record.scrape_date?.trim())
    .filter((date): date is string => Boolean(date))
    .sort();
  const updatedAt = dates[dates.length - 1];
  if (!updatedAt) return { byName: new Map() };

  const updatedTime = Date.parse(`${updatedAt}T23:59:59Z`);
  const age = Date.now() - updatedTime;
  if (!Number.isFinite(updatedTime) || age > MAX_AGE_MS || age < -24 * 60 * 60 * 1000) {
    return { byName: new Map(), updatedAt };
  }

  const byName = new Map<string, WeeklyRanking>();
  for (const record of records) {
    const name = normalizeName(record.player_name ?? "");
    const position = parsePosition(record.pos ?? "");
    const positionRank = cellNumber(record.rank);
    if (!name || !position || positionRank < 1) continue;

    const existing = byName.get(name);
    if (!existing || positionRank < existing.positionRank) {
      byName.set(name, { position, positionRank });
    }
  }

  return { byName, updatedAt };
}
