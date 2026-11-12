// Amharic (Ge'ez script) -> readable English letters.
// Used by the uploader so album/song/artist names are saved in English.
//   * If the name already has English in brackets, e.g. "ቅዱስ (Kidus)", that English is used.
//   * If it is already English, it is returned unchanged.
//   * Otherwise it is transliterated syllable by syllable ("ሰላም" -> "Selam").
// Spelling is phonetic: Amharic has no spelling standard in English letters, so
// a few names may need a manual touch-up.

// Consonant for each row of 8 characters starting at U+1200. A trailing * marks
// a labialised row (like ቈ), where only the w-vowel forms are used.
const ROWS = ['h','l','h','m','s','r','s','sh','q','q*','q','q*','b','v','t','ch','h','h*','n','ny','',
              'k','k*','kh','kh*','w','','z','zh','y','d','d','j','g','g*','ng','t','ch','p','ts','ts','f','p'];
const NORMAL = ['e','u','i','a','e','~','o','wa'];   // ~ = 6th order (vowel is dropped or 'i')
const VOWEL_ROW = ['a','u','i','a','e','e','o','e'];  // አ and ዐ rows
const LAB = ['we','','wi','wa','we','w','',''];
const PUNCT = { 0x1361: ' ', 0x1362: '.', 0x1363: ',', 0x1364: ';', 0x1365: ',', 0x1366: ':', 0x1367: '?', 0x1368: '' };

const isLetter = (cp) => cp >= 0x1200 && cp <= 0x1357 && ((cp - 0x1200) >> 3) <= 42;
const hasEthiopic = (s) => /[\u1200-\u137F]/.test(s);
// does this letter carry a full vowel (anything except the 6th order)?
const isFull = (cp) => ((cp - 0x1200) & 7) !== 5 || ((cp - 0x1200) >> 3) === 20 || ((cp - 0x1200) >> 3) === 26;
const H_ROWS = [0, 2, 16];

export function toEnglish(text) {
  if (text == null) return text;
  const t = String(text);
  if (!hasEthiopic(t)) return t.trim();

  // English already given in brackets at the end? use it.
  const b = t.match(/\(([^()]*)\)\s*$/);
  if (b && /^[\x20-\x7E]+$/.test(b[1])) return b[1].replace(/\s+/g, ' ').trim();

  const cps = Array.from(t).map((c) => c.codePointAt(0));
  let out = '';
  let prevFull = null; // null = not inside an Ethiopic word, true/false = previous syllable had a full vowel
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (!isLetter(cp)) {
      out += cp in PUNCT ? PUNCT[cp] : String.fromCodePoint(cp);
      prevFull = null;
      continue;
    }
    const r = (cp - 0x1200) >> 3, c = (cp - 0x1200) & 7;
    const cons = ROWS[r];
    const nextIsLetter = i + 1 < cps.length && isLetter(cps[i + 1]);
    let syl, full;
    if (r === 20 || r === 26) {                     // vowel-only rows
      syl = VOWEL_ROW[c]; full = true;
    } else if (cons.endsWith('*')) {                 // labialised rows
      const base = cons.slice(0, -1);
      const v = LAB[c];
      syl = base + (v === '' ? 'a' : v); full = c !== 5;
    } else if (NORMAL[c] === '~') {                  // 6th order: 'i' or silent
      let drop = !nextIsLetter;
      if (!drop && prevFull === true) {
        const n = cps[i + 1];
        const nextIsFinalH = H_ROWS.includes((n - 0x1200) >> 3) && ((n - 0x1200) & 7) === 5 &&
                             !(i + 2 < cps.length && isLetter(cps[i + 2]));
        drop = isFull(n) || nextIsFinalH || r === 25;   // r === 25: ው after a vowel is just 'w'
      }
      syl = cons + (drop ? '' : 'i'); full = false;
    } else {
      syl = cons + (c === 0 && H_ROWS.includes(r) ? 'a' : NORMAL[c]); full = true;   // ሀ = ha
    }
    if (prevFull === null && syl) syl = syl[0].toUpperCase() + syl.slice(1);
    out += syl;
    prevFull = full;
  }
  return out.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// English letters -> Amharic (Ge'ez script).  Used for song and album names.
//   * names already in Amharic are kept exactly (English text in brackets is dropped)
//   * names in English letters (e.g. "selam", "Fikir New") are converted by sound
// English spelling can't tell ጠ from ተ or ቅ from ክ, so a few words may need a manual
// fix. Common words are listed in WORDS below and are always spelled correctly.
// ---------------------------------------------------------------------------
const WORDS = {
  new: 'ነው', neh: 'ነህ', nesh: 'ነሽ', bizu: 'ብዙ', amlak: 'አምላክ', amlake: 'አምላኬ', egziabher: 'እግዚአብሔር',
  kibir: 'ክብር', kibrihin: 'ክብርህን', fikir: 'ፍቅር', fikrih: 'ፍቅርህ', fikrihin: 'ፍቅርህን', fikru: 'ፍቅሩ',
  selam: 'ሰላም', iyesus: 'ኢየሱስ', yesus: 'ኢየሱስ', jesus: 'ኢየሱስ', hallelujah: 'ሃሌሉያ', haleluya: 'ሃሌሉያ',
  halleluya: 'ሃሌሉያ', geta: 'ጌታ', desta: 'ደስታ', destaye: 'ደስታዬ', ante: 'አንተ', anten: 'አንተን',
  kante: 'ካንተ', yante: 'የአንተ', hulu: 'ሁሉ', hulun: 'ሁሉን', kidus: 'ቅዱስ', qidus: 'ቅዱስ', cher: 'ቸር',
  hoy: 'ሆይ', oh: 'ኦ', and: 'አንድ', zelalem: 'ዘላለም', kelal: 'ቀላል', yihonal: 'ይሆናል', mihret: 'ምህረት',
  mihretu: 'ምህረቱ', mihretih: 'ምህረትህ', erste: 'እርስቴ', ende: 'እንደ', yelebie: 'የልቤ', yelibe: 'የልቤ',
  ersu: 'እርሱ', ene: 'እኔ', ine: 'እኔ', ke: 'ከ', ye: 'የ', be: 'በ', le: 'ለ', lela: 'ሌላ', abat: 'አባት',
  setota: 'ስጦታ', belay: 'በላይ', yahwe: 'ያህዌ', yehowa: 'ያህዌ', ameseginalehu: 'አመሰግናለሁ',
  ameseginihalehu: 'አመሰግንሃለሁ', amlakachin: 'አምላካችን', mariam: 'ማርያም', ejig: 'እጅግ', des: 'ደስ',
};
const LAT_ROW = { h: 0, l: 1, m: 3, r: 5, s: 6, sh: 7, q: 8, b: 12, v: 13, t: 14, ch: 15, n: 18, ny: 19,
  k: 21, c: 21, kh: 23, w: 25, z: 27, zh: 28, y: 29, d: 30, j: 32, g: 33, ts: 39, f: 41, p: 42 };
const geez = (row, col) => String.fromCodePoint(0x1200 + row * 8 + col);
const isLatV = (ch) => 'aeiou'.includes(ch);

function latinWordToGeez(raw) {
  const w = raw.toLowerCase();
  if (WORDS[w]) return WORDS[w];
  let out = '', i = 0;
  const n = w.length;
  while (i < n) {
    const ch = w[i];
    if (isLatV(ch)) {                                   // vowel on its own: አ-row
      const two = w.slice(i, i + 2);
      let col;
      if (two === 'ie' || two === 'ee') { col = 4; i += 2; }
      else if (two === 'aa') { col = 3; i += 2; }
      else { col = { a: 0, e: 5, i: 2, o: 6, u: 1 }[ch]; i++; }
      out += geez(20, col);
      continue;
    }
    const d2 = w.slice(i, i + 2);
    let c;
    if (['sh', 'ch', 'ts', 'zh', 'ny', 'kh', 'gn', 'th', 'ph'].includes(d2)) {
      c = { gn: 'ny', th: 't', ph: 'f' }[d2] || d2; i += 2;
    } else {
      c = ch; i++;
      while (i < n && w[i] === ch) i++;                  // doubled letters count once (ll, mm...)
    }
    const row = LAT_ROW[c];
    if (row === undefined) { out += c; continue; }       // digits, apostrophes, etc.
    const rest = w.slice(i);
    let col;
    if (rest.startsWith('ie') || rest.startsWith('ee')) { col = 4; i += 2; }
    else if (rest.startsWith('ii')) { col = 2; i += 2; }
    else if (rest.startsWith('aa')) { col = 3; i += 2; }
    else if (rest[0] === 'a') { col = 3; i++; }
    else if (rest[0] === 'e') { col = (i + 1 === n && c === 'y') ? 4 : 0; i++; }
    else if (rest[0] === 'i') { col = 5; i++; }
    else if (rest[0] === 'o') { col = 6; i++; }
    else if (rest[0] === 'u') { col = 1; i++; }
    else col = 5;                                        // consonant on its own: 6th order
    out += geez(row, col);
  }
  return out;
}

export function toAmharic(text) {
  if (text == null) return text;
  const t = String(text).trim();
  if (hasEthiopic(t)) {
    // already Amharic: keep it, drop English text in brackets at the end
    return t.replace(/\s*\([\x20-\x7E]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
  }
  return t.replace(/[A-Za-z']+/g, (word) => latinWordToGeez(word.replace(/'/g, ''))).replace(/\s+/g, ' ').trim();
}
