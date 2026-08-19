import type { DraftState, LeagueConfig, Player, RosterEntry } from "./types";

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
