import type { SyncedSleeperLeague, SyncedSleeperRoster } from "@/lib/sleeper-sync";

const ESPN_API = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons";
const PLAYER_IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";
const ESPN_ROSTER_SLOTS: Record<number, string> = {
  0: "QB", 2: "RB", 4: "WR", 6: "TE", 23: "FLEX", 7: "SUPERFLEX",
  17: "K", 16: "DEF", 20: "BENCH", 21: "IR",
};
const ESPN_TEAM_CODES: Record<number, string> = {
  1: "ATL", 2: "BUF", 3: "CHI", 4: "CIN", 5: "CLE", 6: "DAL", 7: "DEN", 8: "DET",
  9: "GB", 10: "TEN", 11: "IND", 12: "KC", 13: "LV", 14: "LAR", 15: "MIA", 16: "MIN",
  17: "NE", 18: "NO", 19: "NYG", 20: "NYJ", 21: "PHI", 22: "ARI", 23: "PIT", 24: "LAC",
  25: "SF", 26: "SEA", 27: "TB", 28: "WAS", 29: "CAR", 30: "JAX", 33: "BAL", 34: "HOU",
};

interface EspnPlayer { id?: number; fullName?: string; firstName?: string; lastName?: string; defaultPositionId?: number; proTeamId?: number; }
interface EspnEntry { lineupSlotId?: number; playerId?: number; playerPoolEntry?: { player?: EspnPlayer }; }
interface EspnTeam { id: number; abbrev?: string; location?: string; nickname?: string; name?: string; owners?: string[]; roster?: { entries?: EspnEntry[] }; }
interface EspnLeagueResponse {
  id: number;
  settings?: {
    name?: string;
    size?: number;
    scoringSettings?: { scoringItems?: Array<{ statId?: number; points?: number }> };
    rosterSettings?: { lineupSlotCounts?: Record<string, number> };
  };
  teams?: EspnTeam[];
  draftDetail?: { picks?: Array<{ playerId?: number }> };
}

let playerMapCache: { expiresAt: number; value: Map<string, string> } | null = null;

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { result.push(field); field = ""; }
    else field += char;
  }
  result.push(field);
  return result;
}

async function getEspnPlayerMap(): Promise<Map<string, string>> {
  if (playerMapCache && playerMapCache.expiresAt > Date.now()) return playerMapCache.value;
  const response = await fetch(PLAYER_IDS_URL, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Player ID mapping request failed (${response.status}).`);
  const lines = (await response.text()).split(/\r?\n/);
  if (!lines[0]) throw new Error("Player ID mapping was empty.");
  const headers = splitCsvLine(lines[0]);
  const espnIndex = headers.indexOf("espn_id");
  const sleeperIndex = headers.indexOf("sleeper_id");
  if (espnIndex < 0 || sleeperIndex < 0) throw new Error("Player ID mapping is missing ESPN or Sleeper IDs.");
  const map = new Map<string, string>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = splitCsvLine(line);
    const espnId = cells[espnIndex];
    const sleeperId = cells[sleeperIndex];
    if (espnId && sleeperId && espnId !== "NA" && sleeperId !== "NA") map.set(espnId, sleeperId);
  }
  playerMapCache = { expiresAt: Date.now() + 24 * 60 * 60 * 1000, value: map };
  return map;
}

function formatScoring(points: number): "PPR" | "Half-PPR" | "Standard" {
  if (points >= 0.9) return "PPR";
  if (points >= 0.25) return "Half-PPR";
  return "Standard";
}

function normalizeSwid(value: string): string { return value.replace(/[{}]/g, "").toLowerCase(); }

function mapPlayerId(id: number | undefined, playerMap: Map<string, string>, player?: EspnPlayer): string | null {
  if (id === undefined || !Number.isFinite(id)) return null;
  if (player?.defaultPositionId === 16 && player.proTeamId && ESPN_TEAM_CODES[player.proTeamId]) return ESPN_TEAM_CODES[player.proTeamId];
  return playerMap.get(String(id)) ?? `espn:${id}`;
}

export interface EspnTeamOption { teamId: string; label: string; }
export interface EspnSyncResult { league: SyncedSleeperLeague; teams: EspnTeamOption[]; needsTeamSelection: boolean; }

export async function syncEspnLeague(input: {
  leagueId: string;
  season?: string;
  espnS2?: string;
  swid?: string;
  teamId?: string;
}): Promise<EspnSyncResult> {
  const leagueId = input.leagueId.trim();
  const season = input.season ?? "2026";
  if (!/^\d{1,12}$/.test(leagueId)) throw new Error("Enter a valid ESPN league ID.");
  if (!/^20\d{2}$/.test(season)) throw new Error("Enter a valid NFL season.");
  const headers = new Headers({ Accept: "application/json", "User-Agent": "DraftEdge/1.0" });
  if (input.espnS2 || input.swid) {
    if (!input.espnS2 || !input.swid) throw new Error("Both espn_s2 and SWID are required for a private league.");
    if (input.espnS2.length > 4096 || input.swid.length > 128) throw new Error("ESPN cookie values are too long.");
    if (/[;\r\n]/.test(input.espnS2) || /[;\r\n]/.test(input.swid)) throw new Error("ESPN cookie values contain invalid characters.");
    headers.set("Cookie", `espn_s2=${input.espnS2}; SWID=${input.swid}`);
  }
  const url = `${ESPN_API}/${season}/segments/0/leagues/${encodeURIComponent(leagueId)}?view=mTeam&view=mRoster&view=mSettings&view=mDraftDetail`;
  const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (response.status === 401 || response.status === 403) throw new Error("ESPN denied access. Check the league ID and private league cookies.");
  if (response.status === 404) throw new Error("ESPN league was not found for that season.");
  if (!response.ok) throw new Error(`ESPN request failed (${response.status}).`);
  const data = await response.json() as EspnLeagueResponse;
  if (!data?.id || !Array.isArray(data.teams)) throw new Error("ESPN returned an incomplete league response.");
  const playerMap = await getEspnPlayerMap();
  const settings = data.settings;
  const receptionPoints = Number(settings?.scoringSettings?.scoringItems?.find((item) => item.statId === 53)?.points ?? 0);
  const lineup = settings?.rosterSettings?.lineupSlotCounts ?? {};
  const rosterPositions = Object.entries(lineup).flatMap(([slot, count]) => {
    const position = ESPN_ROSTER_SLOTS[Number(slot)];
    return position ? Array.from({ length: Math.max(0, Math.min(30, Number(count) || 0)) }, () => position) : [];
  });
  const teams: EspnTeamOption[] = data.teams.map((team) => ({
    teamId: String(team.id),
    label: team.name || [team.location, team.nickname].filter(Boolean).join(" ") || `Team ${team.id}`,
  }));
  const swid = input.swid ? normalizeSwid(input.swid) : null;
  const ownerTeam = swid ? data.teams.find((team) => team.owners?.some((owner) => normalizeSwid(owner) === swid)) : undefined;
  const selectedTeamId = ownerTeam ? String(ownerTeam.id) : input.teamId;
  const rosters: SyncedSleeperRoster[] = data.teams.map((team) => {
    const entries = team.roster?.entries ?? [];
    const players = entries.map((entry) => mapPlayerId(entry.playerPoolEntry?.player?.id ?? entry.playerId, playerMap, entry.playerPoolEntry?.player)).filter((id): id is string => Boolean(id));
    const starters = entries.filter((entry) => entry.lineupSlotId !== 20 && entry.lineupSlotId !== 21)
      .map((entry) => mapPlayerId(entry.playerPoolEntry?.player?.id ?? entry.playerId, playerMap, entry.playerPoolEntry?.player)).filter((id): id is string => Boolean(id));
    const label = team.name || [team.location, team.nickname].filter(Boolean).join(" ") || `Team ${team.id}`;
    return { owner_id: team.owners?.[0] ?? String(team.id), team_name: label, avatar: null, starters, players, is_user: String(team.id) === selectedTeamId };
  });
  const draftedPlayerIds = (data.draftDetail?.picks ?? []).map((pick) => mapPlayerId(pick.playerId, playerMap)).filter((id): id is string => Boolean(id));
  return {
    teams,
    needsTeamSelection: !selectedTeamId,
    league: {
      platform: "espn",
      platform_league_id: leagueId,
      platform_user_id: selectedTeamId ?? "espn-public",
      sleeper_username: null,
      league_name: settings?.name ?? `ESPN League ${leagueId}`,
      season,
      scoring_format: formatScoring(receptionPoints),
      te_premium: false,
      total_teams: Number(settings?.size) || data.teams.length || 12,
      roster_positions: rosterPositions,
      rosters,
      draft_id: null,
      drafted_player_ids: [...new Set(draftedPlayerIds)],
      last_synced_at: new Date().toISOString(),
    },
  };
}
