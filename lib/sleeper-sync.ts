export type SleeperScoringFormat = "PPR" | "Half-PPR" | "Standard";

export interface SyncedSleeperRoster {
  owner_id: string | null;
  team_name: string;
  avatar: string | null;
  starters: string[];
  players: string[];
  is_user: boolean;
}

export interface SyncedSleeperLeague {
  id?: string;
  user_id?: string;
  platform: "sleeper" | "espn";
  platform_league_id: string;
  platform_user_id: string;
  sleeper_username: string | null;
  league_name: string;
  season: string;
  scoring_format: SleeperScoringFormat;
  te_premium: boolean;
  total_teams: number;
  roster_positions: string[];
  rosters: SyncedSleeperRoster[];
  draft_id: string | null;
  drafted_player_ids: string[];
  last_synced_at: string;
}

interface SleeperUser { user_id: string; display_name?: string | null; username?: string | null; metadata?: Record<string, unknown>; }
interface SleeperLeague {
  league_id: string;
  name?: string | null;
  season?: string | null;
  total_rosters?: number;
  settings?: { type?: number };
  roster_positions?: string[];
  scoring_settings?: Record<string, number> | null;
}
interface SleeperRoster { owner_id?: string | null; starters?: string[] | null; players?: string[] | null; }
interface SleeperDraft { draft_id: string; created?: number; status?: string; }

const API = "https://api.sleeper.app/v1";

/** Sleeper rolls leagues over in March; Jan/Feb still belong to the prior season. */
function nflSeasonYear(now = new Date()): number {
  const year = now.getUTCFullYear();
  return now.getUTCMonth() >= 2 ? year : year - 1;
}

async function sleeperGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Sleeper request failed (${response.status})`);
  return response.json() as Promise<T>;
}

function scoringFormat(settings?: Record<string, number> | null): SleeperScoringFormat {
  const receptionPoints = Number(settings?.rec ?? 0);
  if (receptionPoints >= 0.9) return "PPR";
  if (receptionPoints >= 0.25) return "Half-PPR";
  return "Standard";
}

async function mapLeague(
  league: SleeperLeague,
  sleeperUser: SleeperUser,
  username: string,
): Promise<SyncedSleeperLeague> {
  const [users, rosters, drafts] = await Promise.all([
    sleeperGet<SleeperUser[]>(`/league/${encodeURIComponent(league.league_id)}/users`),
    sleeperGet<SleeperRoster[]>(`/league/${encodeURIComponent(league.league_id)}/rosters`),
    sleeperGet<SleeperDraft[]>(`/league/${encodeURIComponent(league.league_id)}/drafts`),
  ]);

  const userById = new Map(users.map((user) => [user.user_id, user]));
  const mappedRosters: SyncedSleeperRoster[] = rosters.map((roster) => {
    const owner = roster.owner_id ? userById.get(roster.owner_id) : undefined;
    const meta = (owner?.metadata ?? {}) as Record<string, unknown>;
    const isUser = roster.owner_id === sleeperUser.user_id;
    return {
      owner_id: roster.owner_id ?? null,
      team_name: String(meta.team_name ?? owner?.display_name ?? owner?.username ?? "Team"),
      avatar: meta.avatar ? String(meta.avatar) : null,
      starters: roster.starters ?? [],
      players: roster.players ?? [],
      is_user: isUser,
    };
  });

  const latestDraft = [...drafts].sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
  const picks = latestDraft
    ? await sleeperGet<Array<{ player_id?: string | null }>>(`/draft/${encodeURIComponent(latestDraft.draft_id)}/picks`)
    : [];
  const settings = league.scoring_settings ?? {};
  return {
    platform: "sleeper",
    platform_league_id: league.league_id,
    platform_user_id: sleeperUser.user_id,
    sleeper_username: username,
    league_name: league.name ?? "Sleeper League",
    season: league.season ?? String(nflSeasonYear()),
    scoring_format: scoringFormat(settings),
    te_premium: Number(settings.bonus_rec_te ?? 0) > 0,
    total_teams: Number(league.total_rosters) || mappedRosters.length || 12,
    roster_positions: league.roster_positions ?? [],
    rosters: mappedRosters,
    draft_id: latestDraft?.draft_id ?? null,
    drafted_player_ids: [...new Set(picks.map((pick) => pick.player_id).filter((id): id is string => Boolean(id)))],
    last_synced_at: new Date().toISOString(),
  };
}

/** Resolve a public Sleeper username and import its current-year leagues. */
export async function syncSleeperLeagues(usernameInput: string, onlyLeagueId?: string): Promise<SyncedSleeperLeague[]> {
  const username = usernameInput.trim();
  if (!username || username.length > 64) throw new Error("Enter a valid Sleeper username.");
  const sleeperUser = await sleeperGet<SleeperUser>(`/user/${encodeURIComponent(username)}`);
  if (!sleeperUser?.user_id) throw new Error("Sleeper username was not found.");

  const currentSeason = String(nflSeasonYear());
  const previousSeason = String(nflSeasonYear() - 1);
  const eligibleRedraft = (league: SleeperLeague) => league.settings?.type === 0;

  // Only redraft leagues are eligible, so filter before deciding whether the
  // prior season fallback is needed (a dynasty league must not block it).
  let leagues = (await sleeperGet<SleeperLeague[]>(`/user/${encodeURIComponent(sleeperUser.user_id)}/leagues/nfl/${currentSeason}`))
    .filter(eligibleRedraft);
  if (onlyLeagueId) {
    leagues = leagues.filter((league) => league.league_id === onlyLeagueId);
    if (leagues.length === 0) {
      const priorSeason = await sleeperGet<SleeperLeague[]>(`/user/${encodeURIComponent(sleeperUser.user_id)}/leagues/nfl/${previousSeason}`);
      leagues = priorSeason.filter(eligibleRedraft).filter((league) => league.league_id === onlyLeagueId);
    }
  } else if (leagues.length === 0) {
    const priorSeason = await sleeperGet<SleeperLeague[]>(`/user/${encodeURIComponent(sleeperUser.user_id)}/leagues/nfl/${previousSeason}`);
    leagues = priorSeason.filter(eligibleRedraft);
  }
  if (leagues.length === 0) {
    throw new Error(
      onlyLeagueId
        ? "That redraft league was not found for this Sleeper account in the current or prior season."
        : `No eligible Sleeper redraft leagues found for ${currentSeason} or ${previousSeason}.`
    );
  }

  // Keep concurrent Sleeper traffic bounded for accounts with many leagues.
  const results: SyncedSleeperLeague[] = [];
  for (let index = 0; index < leagues.length; index += 3) {
    const batch = leagues.slice(index, index + 3);
    results.push(...await Promise.all(batch.map((league) => mapLeague(league, sleeperUser, username))));
  }
  return results;
}
