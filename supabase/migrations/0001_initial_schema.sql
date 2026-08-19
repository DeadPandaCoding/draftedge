-- DraftEdge — initial schema.
-- Run this in the Supabase SQL editor (or `supabase db push` with the CLI).

-- League configs: one row per user (the app uses client-generated text ids).
create table if not exists public.leagues (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  scoring text not null default 'ppr',          -- ppr | half_ppr | standard
  team_count integer not null default 12,
  draft_position integer not null default 1,
  rounds integer not null default 14,
  roster jsonb not null default '{"qb":1,"rb":2,"wr":2,"te":1,"flex":1,"k":1,"def":1,"bench":5}',
  status text not null default 'pre_draft',     -- pre_draft | live | completed
  pick_timer_seconds integer not null default 90,
  live_since bigint,                            -- epoch ms, pick-clock anchor
  created_at timestamptz not null default now()
);

-- Draft state: picks, notes, and pick counter per league.
create table if not exists public.draft_states (
  league_id text primary key references public.leagues (id) on delete cascade,
  picks jsonb not null default '[]',
  notes jsonb not null default '{}',
  current_pick integer not null default 1,
  updated_at timestamptz not null default now()
);

-- Row Level Security: users can only touch their own rows.
alter table public.leagues enable row level security;
alter table public.draft_states enable row level security;

create policy "Users manage their own leagues" on public.leagues
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage draft states for their leagues" on public.draft_states
  for all
  using (
    exists (
      select 1 from public.leagues lg
      where lg.id = draft_states.league_id and lg.user_id = auth.uid()
    )
  );

-- Optional: broadcast draft-state changes so multiple open tabs stay in sync.
-- alter publication supabase_realtime add table public.draft_states;
