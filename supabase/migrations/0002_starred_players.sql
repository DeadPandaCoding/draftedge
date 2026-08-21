-- DraftEdge — starred players (personalized dashboard).
-- One row per user holding their pinned player names as a JSON array.

create table if not exists public.starred_players (
  user_id uuid primary key references auth.users (id) on delete cascade,
  players jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- Row Level Security: users can only touch their own stars.
alter table public.starred_players enable row level security;

create policy "Users manage their own starred players" on public.starred_players
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
