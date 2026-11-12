// Decides where a downloaded song goes:   <library>\<Artist>\<Album> (Year)\NN - Title.ext
//   artist folder -> English name        album folder -> Amharic name + (year)
// The song's own tags (artist, album, year, track, title, cover) are used first;
// Telegram's audio info and the post caption are the fallback.
import fs from 'node:fs';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import { toEnglish, toAmharic } from './translit.mjs';

export const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.flac', '.ogg', '.wav', '.opus', '.wma']);

// remove characters Windows does not allow in file and folder names
export const clean = (s) =>
  String(s || '').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ').replace(/[. ]+$/, '').trim();

// loose key so "ዳንኤል ፡ አምደሚካኤል", "ዳንኤል አምደሚካኤል" and "daniel amdemichael" compare sensibly
const key = (s) => String(s || '').toLowerCase().replace(/[\s፡:'"’`.,\-_()]/g, '');
const stripYear = (s) => s.replace(/\s*\(\d{4}\)\s*$/, '').trim();

export function loadAliases(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.lastIndexOf('=');
    const from = t.slice(0, i).trim(), to = t.slice(i + 1).trim();
    if (from && to) map.set(key(from), to);
  }
  return map;
}

export async function readTags(file) {
  try {
    const m = await parseFile(file);
    const c = m.common;
    return {
      title: c.title, artist: c.albumartist || c.artist, album: c.album, year: c.year,
      track: c.track?.no || null, picture: c.picture?.[0] || null, duration: m.format.duration,
    };
  } catch {
    return {};
  }
}

const findDir = (parent, wanted, same) => {
  if (!fs.existsSync(parent)) return null;
  return fs.readdirSync(parent, { withFileTypes: true })
    .find((d) => d.isDirectory() && same(d.name, wanted))?.name || null;
};

/**
 * tmpFile : the file just downloaded
 * info    : { name, ext, performer, title, caption, id }   (from Telegram)
 * lib     : library root folder        aliases : Map from loadAliases()
 * returns : { finalPath, status: 'placed' | 'duplicate' | 'unsorted' }
 */
export async function placeFile(tmpFile, info, lib, aliases) {
  const tags = await readTags(tmpFile);
  const ext = (path.extname(info.name || '') || info.ext || path.extname(tmpFile) || '.mp3').toLowerCase();

  const artistRaw = (tags.artist || info.performer || '').trim();
  const albumRaw = (tags.album || '').trim();
  const title = clean(tags.title || info.title || path.basename(info.name || '', path.extname(info.name || '')) || `message-${info.id}`).slice(0, 120);
  const year = tags.year || (info.caption || '').match(/\b(19[5-9]\d|20[0-4]\d)\b/)?.[1] || '';
  const trackPart = tags.track ? String(tags.track).padStart(2, '0') + ' - ' : '';
  const fileName = `${trackPart}${title}${ext}`;

  let dir, status = 'placed';
  if (!artistRaw || !albumRaw) {
    dir = path.join(lib, '_Unsorted');                       // tags missing: you sort these by hand
    status = 'unsorted';
  } else {
    const artistName = clean(aliases.get(key(artistRaw)) || toEnglish(artistRaw));
    const artistDirName = findDir(lib, artistName, (a, b) => key(a) === key(b)) || artistName;
    const artistDir = path.join(lib, artistDirName);
    const albumName = clean(toAmharic(albumRaw));
    // reuse an album folder you already have (with or without a year), otherwise make "Album (Year)"
    const albumDirName = findDir(artistDir, albumName, (a, b) => stripYear(a) === b) ||
      albumName + (year ? ` (${year})` : '');
    dir = path.join(artistDir, albumDirName);
  }
  fs.mkdirSync(dir, { recursive: true });

  // keep the album cover once, if the song has one embedded
  if (status === 'placed' && tags.picture && !fs.readdirSync(dir).some((f) => /^cover\./i.test(f))) {
    const e = /png/i.test(tags.picture.format) ? '.png' : '.jpg';
    fs.writeFileSync(path.join(dir, 'cover' + e), tags.picture.data);
  }

  let finalPath = path.join(dir, fileName);
  if (fs.existsSync(finalPath)) {
    if (fs.statSync(finalPath).size === fs.statSync(tmpFile).size) {
      fs.rmSync(tmpFile, { force: true });
      return { finalPath, status: 'duplicate' };
    }
    finalPath = path.join(dir, `${path.basename(fileName, ext)} (${info.id})${ext}`);
  }
  fs.renameSync(tmpFile, finalPath);
  return { finalPath, status };
}
