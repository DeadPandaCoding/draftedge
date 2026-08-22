-- DraftEdge — periodic projections snapshots.
-- Each cron run inserts a row per scoring format, giving a historical time
-- series of player projections/consensus. The data column stores the full
-- player array (JSON) for that run. The cron also warms the /api/players
-- ISR cache so users never hit cold caches.

create table if not exists public.projections_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scoring text not null,          -- "ppr" | "half_ppr" | "standard"
  player_count int not null default 0,
  data jsonb not null default '[]'
);

-- Index for querying recent snapshots by scoring format.
create index if not exists idx_snapshots_scoring_created
  on public.projections_snapshots (scoring, created_at desc);

-- RLS: only the service-role cron job can write (it bypasses RLS).
-- No public read policy — snapshots are backend-only for now.
alter table public.projections_snapshots enable row level security;
