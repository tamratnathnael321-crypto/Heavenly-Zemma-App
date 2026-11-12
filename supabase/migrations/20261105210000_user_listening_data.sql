create table if not exists public.user_song_plays (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  song_id text not null,
  played_at timestamptz not null default now()
);

create index if not exists user_song_plays_user_played_at_idx
  on public.user_song_plays (user_id, played_at desc);

create table if not exists public.user_song_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  song_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

alter table public.user_song_plays enable row level security;
alter table public.user_song_favorites enable row level security;

drop policy if exists "Users can read their own song plays" on public.user_song_plays;
create policy "Users can read their own song plays"
  on public.user_song_plays for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own song plays" on public.user_song_plays;
create policy "Users can add their own song plays"
  on public.user_song_plays for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own song favorites" on public.user_song_favorites;
create policy "Users can read their own song favorites"
  on public.user_song_favorites for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own song favorites" on public.user_song_favorites;
create policy "Users can add their own song favorites"
  on public.user_song_favorites for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own song favorites" on public.user_song_favorites;
create policy "Users can remove their own song favorites"
  on public.user_song_favorites for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert on public.user_song_plays to authenticated;
grant select, insert, delete on public.user_song_favorites to authenticated;
grant usage, select on sequence public.user_song_plays_id_seq to authenticated;
