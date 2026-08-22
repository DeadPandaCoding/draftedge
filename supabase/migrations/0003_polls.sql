-- DraftEdge — community polls ("Who wins this trade?", breakout/bust, etc.).
-- Anyone can read; authenticated users create polls and cast one vote each.

create table if not exists public.polls (
  id uuid primary key,
  question text not null,
  options jsonb not null default '[]',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  option int not null,
  primary key (poll_id, user_id)
);

alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;

create policy "Anyone can read polls" on public.polls
  for select using (true);

create policy "Users create polls" on public.polls
  for insert with check (auth.uid() = created_by);

create policy "Users manage their own polls" on public.polls
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "Users delete their own polls" on public.polls
  for delete using (auth.uid() = created_by);

create policy "Anyone can read votes" on public.poll_votes
  for select using (true);

create policy "Users cast their vote" on public.poll_votes
  for insert with check (auth.uid() = user_id);

create policy "Users change their vote" on public.poll_votes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
