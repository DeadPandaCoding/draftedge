-- Expand the existing private league snapshot table to accept ESPN leagues.
alter table public.user_leagues
  drop constraint if exists user_leagues_platform_check;

alter table public.user_leagues
  add constraint user_leagues_platform_check check (platform in ('sleeper', 'espn'));

alter table public.user_leagues
  alter column sleeper_username drop not null;
