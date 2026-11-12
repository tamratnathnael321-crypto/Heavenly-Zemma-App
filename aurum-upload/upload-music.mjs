#!/usr/bin/env node
// Bulk-upload a whole music library to Supabase (Storage + albums + songs tables).
//
// How names are saved in the database:
//   - Song and album names are saved in AMHARIC:
//       Amharic names are kept as they are; names in English letters ("selam") are converted ("ሰላም")
//   - Artist names are saved in ENGLISH ("ዳንኤል (Daniel)" -> "Daniel")
//   - Files in storage always get plain English-letter names (Supabase needs that)
//
// Folder layout expected:
//   <root>/<Artist>/<Album>/<tracks>.mp3        (album folder may end with " (2004)" for the year)
//   Optional cover: cover.jpg / folder.jpg / front.jpg in the album folder
//   (if absent, the cover embedded in the mp3 tags is used)
//
// Usage:
//   node upload-music.mjs "/path/to/Music" --dry-run     # preview only, no credentials needed
//   node upload-music.mjs "/path/to/Music"               # real upload
//   node upload-music.mjs "/path/to/Music" --artist "Daniel Amdemichael"   # only one artist folder
//
// Env (real upload only):
//   SUPABASE_URL=https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=...   <- Project Settings > API. KEEP SECRET. Never put it in your HTML page.

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { parseFile } from 'music-metadata';
import { toEnglish, toAmharic } from './translit.mjs';   // artist names -> English, song/album names -> Amharic

const SONG_BUCKET = 'Songs';
const COVER_BUCKET = 'Album Arts';
const AUDIO_EXT = {
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};
const COVER_NAMES = ['cover', 'folder', 'front', 'album'];

// ---------- args ----------
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const artistFlag = args.indexOf('--artist');
const onlyArtist = artistFlag >= 0 ? args[artistFlag + 1] : null;
const root = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--artist');

if (!root) {
  console.error('Usage: node upload-music.mjs "/path/to/Music" [--dry-run] [--artist "Name"]');
  process.exit(1);
}

let sb = null;
if (!dry) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first (or use --dry-run).');
    process.exit(1);
  }
  sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

// ---------- helpers ----------
// Storage keys must be plain ASCII, so Amharic names become slugs (titles in the DB stay Amharic).
function slug(s) {
  const base = s.normalize('NFKD').replace(/[^\x00-\x7F]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return base || 'x' + crypto.createHash('md5').update(s).digest('hex').slice(0, 8);
}

const dirs = async (p) =>
  (await fs.readdir(p, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();

const files = async (p) =>
  (await fs.readdir(p, { withFileTypes: true })).filter((d) => d.isFile()).map((d) => d.name);

function fail(what, error) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

async function readTrack(file, index) {
  const ext = path.extname(file).toLowerCase();
  const stat = await fs.stat(file);
  const base = path.basename(file, ext);
  let meta = null;
  try { meta = await parseFile(file); } catch { /* fall back to filename */ }

  const fnNum = base.match(/^(\d{1,3})\s*[-_. ]\s*/);
  const rawTitle = (meta?.common.title || base.replace(/^\d{1,3}\s*[-_. ]\s*/, '')).trim();
  const title = toAmharic(rawTitle);   // Amharic name saved in the database
  const trackNo = meta?.common.track?.no || (fnNum ? Number(fnNum[1]) : index + 1);
  const realDur = meta?.format.duration;
  return {
    file, ext, size: stat.size, title, rawTitle, trackNo,
    duration: Math.max(1, Math.round(realDur || stat.size / 16000)), // real duration; estimate only if unreadable
    durationIsReal: !!realDur,
    year: meta?.common.year || null,
    picture: meta?.common.picture?.[0] || null,
  };
}

async function findCover(albumDir, tracks) {
  const names = await files(albumDir);
  for (const n of names) {
    const e = path.extname(n).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(e) && COVER_NAMES.includes(path.basename(n, e).toLowerCase())) {
      return { data: await fs.readFile(path.join(albumDir, n)), ext: e === '.jpeg' ? '.jpg' : e,
               type: e === '.png' ? 'image/png' : e === '.webp' ? 'image/webp' : 'image/jpeg' };
    }
  }
  const pic = tracks.find((t) => t.picture)?.picture;
  if (pic) {
    const type = pic.format || 'image/jpeg';
    return { data: Buffer.from(pic.data), type, ext: type.includes('png') ? '.png' : '.jpg' };
  }
  return null;
}

async function existingSizes(bucket, prefix) {
  const { data } = await sb.storage.from(bucket).list(prefix, { limit: 1000 });
  return new Map((data || []).map((o) => [o.name, o.metadata?.size]));
}

async function getOrCreateArtist(name) {
  const { data, error } = await sb.from('artists').select('id').eq('name', name).limit(1);
  fail('Looking up artist (does artists.name exist?)', error);
  if (data?.length) return data[0].id;
  const ins = await sb.from('artists').insert({ name }).select('id').single();
  fail(`Creating artist "${name}" (the artists table may need more required columns)`, ins.error);
  return ins.data.id;
}

async function getOrCreateAlbum(artistId, title, coverPath, year) {
  const release_date = year ? `${year}-01-01` : null;
  const { data, error } = await sb.from('albums').select('id, title').eq('artist_id', artistId);
  fail('Looking up album', error);
  const same = (data || []).find((a) => toAmharic(a.title) === title);
  if (same) {
    const patch = { release_type: 'album' };
    if (coverPath) patch.cover_art_url = coverPath;
    if (release_date) patch.release_date = release_date;
    const up = await sb.from('albums').update(patch).eq('id', same.id);
    fail('Updating album', up.error);
    return same.id;
  }
  const ins = await sb.from('albums')
    .insert({ title, artist_id: artistId, cover_art_url: coverPath, release_type: 'album', release_date })
    .select('id').single();
  fail('Creating album', ins.error);
  return ins.data.id;
}

// ---------- main ----------
const totals = { albums: 0, songs: 0, uploaded: 0, skipped: 0, noCover: 0, estimatedDur: 0, errors: 0 };

for (const artist of await dirs(root)) {
  if (onlyArtist && artist.toLowerCase() !== onlyArtist.toLowerCase()) continue;
  const artistDir = path.join(root, artist);
  const artistName = toEnglish(artist);   // English name saved in the database
  const aSlug = slug(artistName);
  console.log(`\n=== ${artistName}${artistName !== artist ? `   (folder: ${artist})` : ''}`);
  const artistId = dry ? null : await getOrCreateArtist(artistName);

  for (const albumFolder of await dirs(artistDir)) {
    try {
      const albumDir = path.join(artistDir, albumFolder);
      const yearMatch = albumFolder.match(/\s*\((\d{4})\)\s*$/);
      const rawAlbumTitle = albumFolder.replace(/\s*\(\d{4}\)\s*$/, '').trim();
      const albumTitle = toAmharic(rawAlbumTitle);   // Amharic name saved in the database
      const alSlug = slug(rawAlbumTitle);             // storage folder name (kept stable so re-runs reuse files)

      const audioFiles = (await files(albumDir))
        .filter((f) => AUDIO_EXT[path.extname(f).toLowerCase()]).sort();
      if (!audioFiles.length) { console.log(`  - ${albumFolder}: no audio files, skipped`); continue; }

      const tracks = [];
      for (const [i, f] of audioFiles.entries()) tracks.push(await readTrack(path.join(albumDir, f), i));
      tracks.sort((a, b) => a.trackNo - b.trackNo || a.file.localeCompare(b.file));

      const year = yearMatch ? Number(yearMatch[1]) : tracks.find((t) => t.year)?.year || null;
      const cover = await findCover(albumDir, tracks);
      if (!cover) totals.noCover++;
      console.log(`  - ${albumTitle}${year ? ` (${year})` : ''}: ${tracks.length} tracks${cover ? '' : ', NO COVER'}`);
      totals.albums++;

      if (dry) {
        for (const [i, t] of tracks.entries()) {
          if (!t.durationIsReal) totals.estimatedDur++;
          console.log(`      ${String(i + 1).padStart(2)}. ${t.title}  [${t.duration}s${t.durationIsReal ? '' : ' est.'}]`);
        }
        totals.songs += tracks.length;
        continue;
      }

      // cover
      let coverPath = null;
      if (cover) {
        coverPath = `${aSlug}/${alSlug}${cover.ext}`;
        const { error } = await sb.storage.from(COVER_BUCKET)
          .upload(coverPath, cover.data, { contentType: cover.type, upsert: true });
        fail('Uploading cover', error);
      }
      const albumId = await getOrCreateAlbum(artistId, albumTitle, coverPath, year);

      // songs (skips files already uploaded with the same size, so re-runs resume quickly)
      const have = await existingSizes(SONG_BUCKET, `${aSlug}/${alSlug}`);
      const rows = [];
      for (const [i, t] of tracks.entries()) {
        const name = `${String(t.trackNo).padStart(2, '0')}-${slug(t.rawTitle)}${t.ext}`;
        const key = `${aSlug}/${alSlug}/${name}`;
        if (have.get(name) === t.size) {
          totals.skipped++;
        } else {
          const { error } = await sb.storage.from(SONG_BUCKET)
            .upload(key, await fs.readFile(t.file), { contentType: AUDIO_EXT[t.ext], upsert: true });
          fail(`Uploading ${t.file}`, error);
          totals.uploaded++;
        }
        if (!t.durationIsReal) totals.estimatedDur++;
        rows.push({
          title: t.title, artist_id: artistId, album_id: albumId,
          track_number: i + 1, file_url: key, duration_seconds: t.duration,
        });
        process.stdout.write(`      ${String(i + 1).padStart(2)}. ${t.title}\n`);
      }
      const known = await sb.from('songs').select('id, file_url').in('file_url', rows.map((r) => r.file_url));
      fail('Checking songs', known.error);
      const idByUrl = new Map((known.data || []).map((x) => [x.file_url, x.id]));
      const fresh = rows.filter((r) => !idByUrl.has(r.file_url));
      if (fresh.length) {
        const ins = await sb.from('songs').insert(fresh);
        fail('Saving songs', ins.error);
      }
      for (const r of rows.filter((x) => idByUrl.has(x.file_url))) {
        const { title: _keep, ...rest } = r;   // titles you already have are never overwritten
        const up = await sb.from('songs').update(rest).eq('id', idByUrl.get(r.file_url));
        fail('Updating song', up.error);
      }
      totals.songs += rows.length;
    } catch (e) {
      totals.errors++;
      console.error(`  ! ${albumFolder} FAILED: ${e.message}`);
    }
  }
}

console.log(`\nDone${dry ? ' (dry run, nothing uploaded)' : ''}: ${totals.albums} albums, ${totals.songs} songs`
  + (dry ? '' : `, ${totals.uploaded} files uploaded, ${totals.skipped} already there`)
  + `, ${totals.noCover} without cover, ${totals.estimatedDur} with estimated duration, ${totals.errors} failed albums.`);
