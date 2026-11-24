import type {
  DraftState,
  LeagueConfig,
  Player,
  RosterEntry,
  ScoringFormat,
} from "./types";
import { SCORING_LABELS } from "./league";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds and downloads a CSV of the user's drafted roster. */
export function exportRosterCsv(
  entries: RosterEntry[],
  playersById: Map<string, Player>,
  state: DraftState,
  league: LeagueConfig
) {
  const header = ["Slot", "Player", "Team", "Pos", "Bye", "ADP", "Proj", "Tier", "Notes"];
  const rows = entries.map((e) => {
    const p = playersById.get(e.playerId);
    return [
      e.slot,
      p?.name ?? e.playerId,
      p?.team ?? "",
      p?.position ?? "",
      p?.bye ?? 0,
      p && p.adp > 0 ? p.adp.toFixed(1) : "",
      p ? p.projection.toFixed(1) : "",
      p?.tier ?? "",
      state.notes[e.playerId] ?? "",
    ];
  });

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = league.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "league";
  a.href = url;
  a.download = `draftedge-${slug}-roster.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ProjectionHorizon = "week" | "ros" | "season";

export interface PlayersCsvOptions {
  /** Projection horizon currently shown in the table. Defaults to season. */
  horizon?: ProjectionHorizon;
  /** Scoring format the exported board belongs to. */
  scoring?: ScoringFormat;
}

const HORIZON_META: Record<
  ProjectionHorizon,
  { rank: string; projection: string; filename: string }
> = {
  week: { rank: "Wk Rank", projection: "Wk Proj", filename: "weekly" },
  ros: { rank: "ROS Rank", projection: "ROS Proj", filename: "ros" },
  season: { rank: "Rank", projection: "Proj", filename: "season" },
};

function projectionForHorizon(player: Player, horizon: ProjectionHorizon): number {
  if (horizon === "week") return player.weekProjection ?? 0;
  if (horizon === "ros") return player.rosProjection ?? 0;
  return player.projection;
}

function rankForHorizon(player: Player, horizon: ProjectionHorizon): number | "" {
  if (horizon === "week") return player.weekRank ?? player.rank;
  if (horizon === "ros") return player.rosRank ?? "";
  return player.rank;
}

/**
 * Builds and downloads a CSV of the currently visible (and currently sorted)
 * cheat-sheet / rankings board, reflecting the active projection horizon and
 * scoring format in both the headers and the filename.
 */
export function exportPlayersCsv(
  players: Player[],
  league: LeagueConfig | null,
  options: PlayersCsvOptions = {}
) {
  const horizon = options.horizon ?? "season";
  const scoring = options.scoring ?? league?.scoring ?? "ppr";
  const meta = HORIZON_META[horizon];
  const scoringLabel = SCORING_LABELS[scoring];
  const header = [
    "Scoring",
    meta.rank,
    "Tier",
    "Player",
    "Team",
    "Pos",
    "Bye",
    "ADP",
    meta.projection,
    "Wk Avg",
  ];
  const rows = players.map((p) => {
    const projection = projectionForHorizon(p, horizon);
    return [
      scoringLabel,
      rankForHorizon(p, horizon),
      `T${p.tier}`,
      p.name,
      p.team,
      p.position,
      p.bye,
      p.adp > 0 ? p.adp.toFixed(1) : "",
      projection > 0 ? projection.toFixed(1) : "",
      p.weeklyAvg > 0 ? p.weeklyAvg.toFixed(1) : "",
    ];
  });

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = league?.name ?? "players";
  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cheatsheet";
  const scoringSlug =
    scoringLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ppr";
  a.href = url;
  a.download = `draftedge-${slug}-${scoringSlug}-${meta.filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
