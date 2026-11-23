-- Store read-only Sleeper league snapshots per authenticated DraftEdge user.
create table if not exists public.user_leagues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'sleeper' check (platform = 'sleeper'),
  platform_league_id text not null,
  platform_user_id text not null,
  sleeper_username text not null,
  league_name text not null,
  season text not null default '2026',
  scoring_format text not null check (scoring_format in ('PPR', 'Half-PPR', 'Standard')),
  te_premium boolean not null default false,
  total_teams integer not null default 12,
  roster_positions jsonb not null default '[]'::jsonb,
  rosters jsonb not null default '[]'::jsonb,
  draft_id text,
  drafted_player_ids jsonb not null default '[]'::jsonb,
  last_synced_at timestamptz not null default now(),
  unique (user_id, platform, platform_league_id)
);

alter table public.user_leagues enable row level security;
grant select, insert, update, delete on table public.user_leagues to authenticated;

drop policy if exists "Users manage their own synced leagues" on public.user_leagues;
create policy "Users manage their own synced leagues"
  on public.user_leagues for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists user_leagues_user_synced_idx
  on public.user_leagues (user_id, last_synced_at desc);
