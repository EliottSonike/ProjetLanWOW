'use strict';

/*
  LAN Kill Watcher
  ─────────────────
  1. Copie ton config.example.json → config.json et remplis les champs
  2. npm install
  3. Lance avec : node watcher.js  (ou double-clique start.bat)

  Le watcher surveille :
  - WoW/Screenshots/ → détecte les nouveaux screenshots
  - WTF/Account/TON_COMPTE/SavedVariables/LanKillTracker.lua → détecte les nouveaux kills
  Quand un kill + screenshot correspondent, il poste automatiquement sur Discord.
*/

const fs       = require('fs');
const path     = require('path');
const chokidar = require('chokidar');
const fetch    = require('node-fetch');
const FormData = require('form-data');

// ── Config ───────────────────────────────────────────────────────────
let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
} catch {
  console.error('❌  Fichier config.json introuvable.');
  console.error('    Copie config.example.json → config.json et remplis wowPath, accountName, webhookUrl.');
  process.exit(1);
}

const WOW_PATH       = cfg.wowPath.replace(/\\/g, '/');
const SCREENSHOTS    = path.join(WOW_PATH, 'Screenshots');
const SAVEDVARS      = path.join(WOW_PATH, 'WTF', 'Account', cfg.accountName, 'SavedVariables', 'LanKillTracker.lua');
const POSTED_FILE    = path.join(__dirname, 'posted.json');
const WEBHOOK        = cfg.webhookUrl;
const MATCH_WINDOW   = 60 * 1000; // 60 secondes d'écart max entre kill et screenshot

// ── État ─────────────────────────────────────────────────────────────
let posted = loadPosted();

function loadPosted() {
  try { return new Set(JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8'))); }
  catch { return new Set(); }
}
function savePosted() {
  fs.writeFileSync(POSTED_FILE, JSON.stringify([...posted]), 'utf8');
}

// ── Parseur Lua SavedVariables ────────────────────────────────────────
function parseLua(str) {
  let i = 0;

  function skip() { while (i < str.length && /\s/.test(str[i])) i++; }

  function parseValue() {
    skip();
    if (str[i] === '{')  return parseTable();
    if (str[i] === '"')  return parseString();
    if (str.startsWith('true', i))  { i += 4; return true; }
    if (str.startsWith('false', i)) { i += 5; return false; }
    if (str.startsWith('nil', i))   { i += 3; return null; }
    if (/[-\d]/.test(str[i]))       return parseNumber();
    throw new Error('parseLua: unexpected char "' + str[i] + '" at pos ' + i);
  }

  function parseString() {
    i++; // skip "
    let s = '';
    while (i < str.length && str[i] !== '"') {
      if (str[i] === '\\') i++;
      s += str[i++];
    }
    i++; // skip closing "
    return s;
  }

  function parseNumber() {
    let s = '';
    if (str[i] === '-') s += str[i++];
    while (i < str.length && /[\d.]/.test(str[i])) s += str[i++];
    return Number(s);
  }

  function parseTable() {
    i++; // skip {
    const obj = {};
    let idx = 1;

    while (true) {
      skip();
      if (i >= str.length) break;
      if (str[i] === '}') { i++; break; }
      if (str[i] === ',') { i++; continue; }

      if (str[i] === '[') {
        i++; // skip [
        const key = parseValue();
        skip(); i++; // skip ]
        skip(); i++; // skip =
        obj[key] = parseValue();
      } else {
        obj[idx++] = parseValue();
      }
    }

    // Convert sequential integer keys → array
    const keys = Object.keys(obj);
    if (keys.length && keys.every((k, n) => Number(k) === n + 1)) {
      return keys.map(k => obj[k]);
    }
    return obj;
  }

  return parseValue();
}

function readKills() {
  try {
    const content = fs.readFileSync(SAVEDVARS, 'utf8');
    const marker  = 'LanKillTrackerDB = ';
    const start   = content.indexOf(marker);
    if (start === -1) return [];
    const db = parseLua(content.substring(start + marker.length));
    return Array.isArray(db.kills) ? db.kills : [];
  } catch (e) {
    console.error('⚠️  Impossible de lire SavedVariables:', e.message);
    return [];
  }
}

// ── Recherche de screenshot ───────────────────────────────────────────
function findScreenshot(killTimestampSec) {
  const killMs = killTimestampSec * 1000;
  try {
    const files = fs.readdirSync(SCREENSHOTS)
      .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      .map(f => {
        const full = path.join(SCREENSHOTS, f);
        return { path: full, mtime: fs.statSync(full).mtimeMs };
      })
      .filter(f => Math.abs(f.mtime - killMs) <= MATCH_WINDOW)
      .sort((a, b) => Math.abs(a.mtime - killMs) - Math.abs(b.mtime - killMs));
    return files[0]?.path || null;
  } catch { return null; }
}

// ── Post Discord ──────────────────────────────────────────────────────
const RAID_COLORS = {
  'Icecrown Citadel': 0x3f6eaa, 'Ruby Sanctum': 0xb22222,
  'Trial of the Crusader': 0xa0522d, 'Ulduar': 0xd4a017,
  "Onyxia's Lair": 0x228b22, 'Naxxramas': 0x6a0dad,
  'The Obsidian Sanctum': 0xff4500, 'The Eye of Eternity': 0x00bfff,
  'Vault of Archavon': 0x808080,
};

async function postToDiscord(kill, screenshotPath) {
  const color = RAID_COLORS[kill.raid] || 0x9b59b6;
  const embed = {
    title: `💀 Boss Kill — ${kill.boss}`,
    color,
    fields: [
      { name: 'Date',    value: `${kill.date} · ${kill.hour}`, inline: true },
      { name: 'Joueurs', value: (kill.players || []).join(' · '), inline: false },
    ],
    footer:    { text: 'LAN Du Swag • WotLK5man – Season1' },
    timestamp: new Date(kill.timestamp * 1000).toISOString(),
  };

  if (screenshotPath) embed.image = { url: 'attachment://screenshot.png' };

  const form = new FormData();
  if (screenshotPath && fs.existsSync(screenshotPath)) {
    form.append('file', fs.createReadStream(screenshotPath), 'screenshot.png');
  }
  form.append('payload_json', JSON.stringify({ embeds: [embed] }));

  const res = await fetch(WEBHOOK, { method: 'POST', body: form });
  if (res.ok || res.status === 204) {
    console.log(`✅ Posté : ${kill.boss} (${kill.date})`);
  } else {
    const err = await res.text();
    console.error(`❌ Discord ${res.status} :`, err);
  }
}

// ── Vérification et post ──────────────────────────────────────────────
async function checkAndPost() {
  const kills = readKills();
  for (const kill of kills) {
    const id = `${kill.timestamp}_${kill.boss}`;
    if (posted.has(id)) continue;

    const screenshot = findScreenshot(kill.timestamp);
    if (!screenshot) {
      console.log(`⏳ Kill "${kill.boss}" en attente d'un screenshot (±60s)...`);
      continue;
    }

    try {
      await postToDiscord(kill, screenshot);
      posted.add(id);
      savePosted();
    } catch (e) {
      console.error('❌ Erreur réseau :', e.message);
    }
  }
}

// ── Watchers ──────────────────────────────────────────────────────────
console.log('🎮 LAN Kill Watcher démarré');
console.log('   Screenshots :', SCREENSHOTS);
console.log('   SavedVars   :', SAVEDVARS);
console.log('   Webhook     :', WEBHOOK.replace(/\/[^/]+$/, '/***'));

// Surveille les nouveaux screenshots
chokidar
  .watch(SCREENSHOTS, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 1000 } })
  .on('add', filePath => {
    if (/\.(png|jpg|jpeg)$/i.test(filePath)) {
      console.log('📸 Nouveau screenshot :', path.basename(filePath));
      setTimeout(checkAndPost, 2000); // laisse WoW finir d'écrire
    }
  });

// Surveille les SavedVariables (mis à jour au /reload ou déconnexion)
chokidar
  .watch(SAVEDVARS, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 500 } })
  .on('change', () => {
    console.log('💾 SavedVariables mis à jour');
    checkAndPost();
  });

// Polling de sécurité toutes les 30s
setInterval(checkAndPost, 30 * 1000);
