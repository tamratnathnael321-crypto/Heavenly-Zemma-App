#!/usr/bin/env node
// Goes through a Telegram channel you admin, downloads every song and sorts it into
//   <library>\<Artist>\<Album> (Year)\NN - Title.mp3     (ready for upload-music)
//
//   node tg-download.mjs --preview      list the songs found, download nothing
//   node tg-download.mjs --limit 5      download only the first 5 songs (a safe test)
//   node tg-download.mjs                download everything (safe to stop and run again: it resumes)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import telegram from 'telegram';
import sessions from 'telegram/sessions/index.js';
import { AUDIO_EXT, loadAliases, placeFile } from './organize.mjs';

const { TelegramClient } = telegram;
const { StringSession } = sessions;

const args = process.argv.slice(2);
const preview = args.includes('--preview');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

const here = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = path.join(here, 'tg-config.json');
const SESSION = path.join(here, 'telegram.session');
// A power cut can leave a half-written file, so read safely and write in one step.
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const writeJson = (file, obj) => { fs.writeFileSync(file + '.tmp', JSON.stringify(obj, null, 2)); fs.renameSync(file + '.tmp', file); };
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, def = '') => ((await rl.question(def ? `${q} [${def}]: ` : `${q}: `)).trim() || def);

// ---------- first-time setup ----------
let cfg = readJson(CONFIG, {});
if (!cfg.apiId || Number.isNaN(Number(cfg.apiId)) || !cfg.apiHash) {
  console.log('\nFirst time setup. Get api_id and api_hash at https://my.telegram.org  (API development tools).');
  cfg.apiId = Number(await ask('api_id'));
  cfg.apiHash = await ask('api_hash');
}
cfg.channel ||= await ask('Channel username', 'mezmurarchive');
cfg.library ||= await ask('Library folder', path.join(os.homedir(), 'Music', 'My Library'));
writeJson(CONFIG, cfg);

// ---------- connect ----------
const savedSession = fs.existsSync(SESSION) ? fs.readFileSync(SESSION, 'utf8').trim() : '';
const login = {
  phoneNumber: () => ask('Your Telegram phone number (with country code, e.g. +251...)'),
  phoneCode: () => ask('The code Telegram just sent you'),
  password: () => ask('Two-step verification password (press Enter if none)'),
  onError: (e) => console.log('Login problem:', e.message),
};
let client;
try {
  client = new TelegramClient(new StringSession(savedSession), cfg.apiId, cfg.apiHash, { connectionRetries: 5 });
  await client.start(login);
} catch (e) {
  if (!savedSession) throw e;
  console.log('The saved login was damaged, starting a fresh login...\n');
  fs.rmSync(SESSION, { force: true });
  client = new TelegramClient(new StringSession(''), cfg.apiId, cfg.apiHash, { connectionRetries: 5 });
  await client.start(login);
}
fs.writeFileSync(SESSION, client.session.save());
const channel = await client.getEntity(cfg.channel);
console.log(`\nConnected. Reading "${channel.title || cfg.channel}" ...\n`);

// ---------- progress memory (so a stopped run can continue) ----------
const stateDir = path.join(cfg.library, '_telegram');
const stateFile = path.join(stateDir, 'state.json');
const incoming = path.join(stateDir, 'incoming');
fs.mkdirSync(incoming, { recursive: true });
for (const f of fs.readdirSync(incoming)) fs.rmSync(path.join(incoming, f), { force: true });   // leftovers from a stopped run
const state = readJson(stateFile, {});
const save = () => writeJson(stateFile, state);
const aliases = loadAliases(path.join(here, 'artist-names.txt'));

function audioInfo(msg) {
  const doc = msg.document;
  if (!doc) return null;
  const attrs = doc.attributes || [];
  const aud = attrs.find((a) => a.className === 'DocumentAttributeAudio');
  const name = attrs.find((a) => a.className === 'DocumentAttributeFilename')?.fileName || '';
  const ext = path.extname(name).toLowerCase();
  const isAudio = (aud && !aud.voice) || (doc.mimeType || '').startsWith('audio/') || AUDIO_EXT.has(ext);
  if (!isAudio) return null;
  return {
    id: msg.id, name, ext: ext || (doc.mimeType === 'audio/mpeg' ? '.mp3' : ''),
    size: Number(String(doc.size)), performer: aud?.performer, title: aud?.title, caption: msg.message || '',
  };
}

// ---------- go through the channel, oldest post first ----------
const t = { found: 0, placed: 0, duplicate: 0, unsorted: 0, skipped: 0, failed: 0 };
let handled = 0;
for await (const msg of client.iterMessages(channel, { reverse: true, waitTime: 1 })) {
  const info = audioInfo(msg);
  if (!info) continue;
  t.found++;
  if (preview) {
    const mb = (info.size / 1048576).toFixed(1);
    console.log(`  #${info.id}  ${info.performer || '?'} - ${info.title || info.name || '?'}  (${mb} MB)`);
    continue;
  }
  if (state[info.id]) { t.skipped++; continue; }          // already done in an earlier run
  if (handled >= limit) break;
  handled++;
  const tmp = path.join(incoming, `${info.id}${info.ext || '.mp3'}`);
  try {
    process.stdout.write(`  #${info.id} downloading ${info.title || info.name || ''} ...`);
    await client.downloadMedia(msg, { outputFile: tmp });
    const r = await placeFile(tmp, info, cfg.library, aliases);
    state[info.id] = path.relative(cfg.library, r.finalPath);
    save();
    t[r.status === 'placed' ? 'placed' : r.status]++;
    console.log(`  ${r.status}: ${state[info.id]}`);
  } catch (e) {
    t.failed++;
    console.log(`  FAILED (${e.message})`);
    fs.rmSync(tmp, { force: true });
  }
}

console.log(`\n${preview ? 'Preview' : 'Done'}: ${t.found} songs found` +
  (preview ? '.' : `, ${t.placed} saved, ${t.duplicate} duplicates, ${t.unsorted} need sorting (in _Unsorted), ${t.skipped} done before, ${t.failed} failed.`));
if (!preview) console.log(`Library: ${cfg.library}`);
rl.close();
await client.disconnect();
process.exit(0);
