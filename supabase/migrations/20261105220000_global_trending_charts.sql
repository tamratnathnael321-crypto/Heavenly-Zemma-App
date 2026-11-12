create index if not exists user_song_plays_song_id_idx
  on public.user_song_plays (song_id);

drop view if exists public.global_song_stream_counts;
drop view if exists public.global_album_stream_counts;

create table if not exists public.global_song_stream_counts (
  song_id text primary key,
  stream_count bigint not null check (stream_count > 0)
);

create table if not exists public.global_album_stream_counts (
  album_id text primary key,
  stream_count bigint not null check (stream_count > 0)
);

insert into public.global_song_stream_counts (song_id, stream_count)
select plays.song_id, count(*)::bigint
from public.user_song_plays as plays
join public.songs as songs on songs.id::text = plays.song_id
group by plays.song_id
on conflict (song_id) do update set stream_count = excluded.stream_count;

insert into public.global_album_stream_counts (album_id, stream_count)
select songs.album_id::text, count(*)::bigint
from public.user_song_plays as plays
join public.songs as songs on songs.id::text = plays.song_id
where songs.album_id is not null
group by songs.album_id
on conflict (album_id) do update set stream_count = excluded.stream_count;

alter table public.global_song_stream_counts enable row level security;
alter table public.global_album_stream_counts enable row level security;

drop policy if exists "Anyone can read global song stream counts" on public.global_song_stream_counts;
create policy "Anyone can read global song stream counts"
  on public.global_song_stream_counts for select to anon, authenticated using (true);

drop policy if exists "Anyone can read global album stream counts" on public.global_album_stream_counts;
create policy "Anyone can read global album stream counts"
  on public.global_album_stream_counts for select to anon, authenticated using (true);

revoke all on public.global_song_stream_counts from anon, authenticated;
revoke all on public.global_album_stream_counts from anon, authenticated;
grant select on public.global_song_stream_counts to anon, authenticated;
grant select on public.global_album_stream_counts to anon, authenticated;

create or replace function public.update_global_stream_counts_for_play()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_album_id text;
begin
  if tg_op = 'INSERT' then
    insert into public.global_song_stream_counts (song_id, stream_count)
    values (new.song_id, 1)
    on conflict (song_id) do update
      set stream_count = public.global_song_stream_counts.stream_count + 1;

    select songs.album_id::text into v_album_id
    from public.songs as songs
    where songs.id::text = new.song_id;

    if v_album_id is not null then
      insert into public.global_album_stream_counts (album_id, stream_count)
      values (v_album_id, 1)
      on conflict (album_id) do update
        set stream_count = public.global_album_stream_counts.stream_count + 1;
    end if;
    return new;
  end if;

  delete from public.global_song_stream_counts
  where song_id = old.song_id and stream_count = 1;
  update public.global_song_stream_counts
  set stream_count = stream_count - 1
  where song_id = old.song_id and stream_count > 1;

  select songs.album_id::text into v_album_id
  from public.songs as songs
  where songs.id::text = old.song_id;

  if v_album_id is not null then
    delete from public.global_album_stream_counts
    where album_id = v_album_id and stream_count = 1;
    update public.global_album_stream_counts
    set stream_count = stream_count - 1
    where album_id = v_album_id and stream_count > 1;
  end if;
  return old;
end;
$$;

revoke all on function public.update_global_stream_counts_for_play() from public, anon, authenticated;

drop trigger if exists user_song_plays_update_global_stream_counts on public.user_song_plays;
create trigger user_song_plays_update_global_stream_counts
  after insert or delete on public.user_song_plays
  for each row execute function public.update_global_stream_counts_for_play();

create or replace function public.sync_global_album_stream_counts()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_song_count bigint;
begin
  if old.album_id is not distinct from new.album_id then
    return new;
  end if;

  select coalesce(counts.stream_count, 0) into v_song_count
  from public.global_song_stream_counts as counts
  where counts.song_id = old.id::text;

  if old.album_id is not null and v_song_count > 0 then
    update public.global_album_stream_counts
    set stream_count = stream_count - v_song_count
    where album_id = old.album_id::text and stream_count > v_song_count;
    delete from public.global_album_stream_counts
    where album_id = old.album_id::text and stream_count <= v_song_count;
  end if;

  if new.album_id is not null and v_song_count > 0 then
    insert into public.global_album_stream_counts (album_id, stream_count)
    values (new.album_id::text, v_song_count)
    on conflict (album_id) do update
      set stream_count = public.global_album_stream_counts.stream_count + excluded.stream_count;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_global_album_stream_counts() from public, anon, authenticated;

drop trigger if exists songs_sync_global_album_stream_counts on public.songs;
create trigger songs_sync_global_album_stream_counts
  after update of album_id on public.songs
  for each row execute function public.sync_global_album_stream_counts();

notify pgrst, 'reload schema';
