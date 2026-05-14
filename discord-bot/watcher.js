'use strict';

/*
  LAN Kill Watcher — setup :
  1. Copie config.example.json → config.json et remplis wowPath + webhookUrl
     (accountName est optionnel, détecté automatiquement)
  2. npm install
  3. Double-clique start.bat

  Flow automatique :
  Boss kill → addon appelle Screenshot() → nouveau fichier PNG détecté
            → POST Discord immédiat avec le screenshot (pas besoin de commande)
            → /reload → SavedVariables mis à jour
            → PATCH du message Discord avec les détails (boss, joueurs, wipes)
*/

const fs       = require('fs');
const path     = require('path');
const chokidar = require('chokidar');
const fetch    = require('node-fetch');
const FormData = require('form-data');

// ── Config ────────────────────────────────────────────────────────────
let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
} catch {
  console.error('❌  config.json introuvable.');
  console.error('    Copie config.example.json → config.json et remplis wowPath et webhookUrl.');
  process.exit(1);
}

const WOW_PATH    = cfg.wowPath.replace(/\\/g, '/');
const WEBHOOK     = cfg.webhookUrl;
const SCREENSHOTS = path.join(WOW_PATH, 'Screenshots');

// Extrait webhook ID + token pour pouvoir éditer les messages
const webhookMatch = WEBHOOK.match(/\/webhooks\/(\d+)\/([^/?]+)/);
if (!webhookMatch) { console.error('❌  webhookUrl invalide dans config.json'); process.exit(1); }
const [, WEBHOOK_ID, WEBHOOK_TOKEN] = webhookMatch;
const WEBHOOK_BASE = `https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}`;

// ── Fichiers d'état ───────────────────────────────────────────────────
const POSTED_FILE  = path.join(__dirname, 'posted.json');
const PENDING_FILE = path.join(__dirname, 'pending.json');   // screenshots postés, en attente de détails

let posted  = loadJSON(POSTED_FILE,  []);
let pending = loadJSON(PENDING_FILE, []);   // [{ screenshotPath, messageId, timestamp }]

function loadJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
}
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

// ── Auto-détection SavedVariables ────────────────────────────────────
function findSavedVars() {
  const accountsDir = path.join(WOW_PATH, 'WTF', 'Account');
  const target      = 'LanKillTracker.lua';
  if (cfg.accountName)
    return path.join(accountsDir, cfg.accountName, 'SavedVariables', target);
  try {
    const accounts = fs.readdirSync(accountsDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
    for (const acc of accounts) {
      const p = path.join(accountsDir, acc, 'SavedVariables', target);
      if (fs.existsSync(p)) { console.log(`✔  Compte WoW : ${acc}`); return p; }
    }
    if (accounts.length) return path.join(accountsDir, accounts[0], 'SavedVariables', target);
  } catch { /* */ }
  console.error('❌  Dossier WTF/Account introuvable. Vérifie wowPath dans config.json.');
  process.exit(1);
}
const SAVEDVARS = findSavedVars();

// ── Parseur Lua SavedVariables ────────────────────────────────────────
function parseLua(str) {
  let i = 0;
  function skip() { while (i < str.length && /\s/.test(str[i])) i++; }
  function val() {
    skip();
    if (str[i] === '{') return tbl();
    if (str[i] === '"') {
      i++; let s = '';
      while (i < str.length && str[i] !== '"') { if (str[i] === '\\') i++; s += str[i++]; }
      i++; return s;
    }
    if (str.startsWith('true',  i)) { i += 4; return true; }
    if (str.startsWith('false', i)) { i += 5; return false; }
    if (str.startsWith('nil',   i)) { i += 3; return null; }
    if (/[-\d]/.test(str[i])) {
      let s = ''; if (str[i] === '-') s += str[i++];
      while (i < str.length && /[\d.]/.test(str[i])) s += str[i++];
      return Number(s);
    }
    throw new Error('char inattendu "' + str[i] + '" pos ' + i);
  }
  function tbl() {
    i++; const obj = {}; let idx = 1;
    while (true) {
      skip();
      if (i >= str.length || str[i] === '}') { i++; break; }
      if (str[i] === ',') { i++; continue; }
      if (str[i] === '[') {
        i++; const k = val(); skip(); i++; skip(); i++;
        obj[k] = val();
      } else { obj[idx++] = val(); }
    }
    const keys = Object.keys(obj);
    if (keys.length && keys.every((k, n) => Number(k) === n + 1)) return keys.map(k => obj[k]);
    return obj;
  }
  return val();
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
    if (e.code !== 'ENOENT') console.error('⚠️  SavedVariables :', e.message);
    return [];
  }
}

// ── Couleurs par raid ─────────────────────────────────────────────────
const RAID_COLORS = {
  'Icecrown Citadel':      0x3f6eaa,
  'Ruby Sanctum':          0xb22222,
  'Trial of the Crusader': 0xa0522d,
  'Ulduar':                0xd4a017,
  "Onyxia's Lair":         0x228b22,
  'Naxxramas':             0x6a0dad,
  'The Obsidian Sanctum':  0xff4500,
  'The Eye of Eternity':   0x00bfff,
  'Vault of Archavon':     0x808080,
};

// ── Embed Discord ─────────────────────────────────────────────────────
function buildEmbed(kill) {
  const color   = RAID_COLORS[kill.raid] || 0x9b59b6;
  const isFirst = kill.first === true;
  const wipes   = kill.wipes || 0;
  const fields  = [
    { name: 'Raid',    value: kill.raid || '—',                 inline: true  },
    { name: 'Date',    value: `${kill.date} · ${kill.hour}`,    inline: true  },
    { name: 'Joueurs', value: (kill.players || []).join(' · '), inline: false },
  ];
  if (wipes > 0) fields.push({ name: 'Wipes', value: String(wipes), inline: true });
  return {
    title:     (isFirst ? '🎉 FIRST KILL — ' : '💀 Boss Kill — ') + kill.boss,
    color,
    fields,
    footer:    { text: 'LAN Du Swag • WotLK5man – Season1' },
    timestamp: new Date(kill.timestamp * 1000).toISOString(),
  };
}

// ── ÉTAPE 1 : POST immédiat du screenshot ────────────────────────────
async function postScreenshot(screenshotPath) {
  const stat = fs.statSync(screenshotPath);
  const ts   = Math.round(stat.mtimeMs / 1000);

  // Evite les doublons
  if (pending.some(p => p.screenshotPath === screenshotPath)) return;

  const placeholder = {
    title:       '📸 Boss kill en cours d\'identification…',
    description: '*Les détails seront ajoutés automatiquement au prochain /reload*',
    color:       0x444444,
    footer:      { text: 'LAN Du Swag • WotLK5man – Season1' },
    timestamp:   new Date(ts * 1000).toISOString(),
    image:       { url: 'attachment://screenshot.png' },
  };

  const form = new FormData();
  form.append('file', fs.createReadStream(screenshotPath), 'screenshot.png');
  form.append('payload_json', JSON.stringify({ embeds: [placeholder] }));

  try {
    // ?wait=true → Discord renvoie le message créé avec son ID
    const res  = await fetch(WEBHOOK_BASE + '?wait=true', { method: 'POST', body: form });
    const data = await res.json();
    if (data.id) {
      pending.push({ screenshotPath, messageId: data.id, timestamp: ts });
      saveJSON(PENDING_FILE, pending);
      console.log(`📸 Screenshot posté (message ${data.id})`);
    } else {
      console.error('❌ POST screenshot :', JSON.stringify(data));
    }
  } catch (e) {
    console.error('❌ Erreur réseau (screenshot) :', e.message);
  }
}

// ── ÉTAPE 2 : PATCH avec les détails du kill ─────────────────────────
async function patchWithKillData(kill, messageId) {
  const embed = buildEmbed(kill);
  embed.image = { url: 'attachment://screenshot.png' };

  try {
    const res = await fetch(
      `${WEBHOOK_BASE}/messages/${messageId}`,
      {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ embeds: [embed] }),
      }
    );
    if (res.ok) {
      const isFirst = kill.first ? ' [FIRST KILL]' : '';
      console.log(`✅ Message mis à jour : ${kill.boss}${isFirst}`);
    } else {
      console.error(`❌ PATCH ${res.status} :`, await res.text());
    }
  } catch (e) {
    console.error('❌ Erreur réseau (patch) :', e.message);
  }
}

// ── ÉTAPE 2b : POST sans screenshot si pas de pending ────────────────
async function postKillOnly(kill) {
  const embed = buildEmbed(kill);
  const form  = new FormData();
  form.append('payload_json', JSON.stringify({ embeds: [embed] }));
  try {
    const res = await fetch(WEBHOOK_BASE, { method: 'POST', body: form });
    if (res.ok || res.status === 204)
      console.log(`✅ Posté sans screenshot : ${kill.boss}`);
    else
      console.error(`❌ POST ${res.status} :`, await res.text());
  } catch (e) {
    console.error('❌ Erreur réseau :', e.message);
  }
}

// ── Matching kill ↔ screenshot ────────────────────────────────────────
const MATCH_WINDOW    = 90 * 1000;   // 90s autour du timestamp
const GRACE_NO_MATCH  = 5 * 60 * 1000; // attend 5min avant post sans screenshot

async function matchKills() {
  const kills = readKills();
  const now   = Date.now();

  for (const kill of kills) {
    const id = `${kill.timestamp}_${kill.boss}`;
    if (posted.includes(id)) continue;

    const killMs = kill.timestamp * 1000;

    // Cherche un message Discord déjà posté avec le screenshot correspondant
    const pIdx = pending.findIndex(p => Math.abs(p.timestamp * 1000 - killMs) <= MATCH_WINDOW);

    if (pIdx !== -1) {
      // Message screenshot trouvé → on le met à jour avec les détails
      const p = pending[pIdx];
      await patchWithKillData(kill, p.messageId);
      pending.splice(pIdx, 1);
      saveJSON(PENDING_FILE, pending);
    } else if (now - killMs >= GRACE_NO_MATCH) {
      // Pas de screenshot après 5min → post embed seul
      console.log(`⚠️  "${kill.boss}" — pas de screenshot, post sans image`);
      await postKillOnly(kill);
    } else {
      console.log(`⏳ "${kill.boss}" — en attente du screenshot (${Math.round((now - killMs) / 1000)}s)...`);
      continue;
    }

    posted.push(id);
    saveJSON(POSTED_FILE, posted);
  }
}

// ── Watchers ──────────────────────────────────────────────────────────
console.log('🎮 LAN Kill Watcher démarré');
console.log('   Screenshots :', SCREENSHOTS);
console.log('   SavedVars   :', SAVEDVARS);
console.log('   Webhook     :', WEBHOOK.replace(/\/[^/]+$/, '/***'));
console.log('');

// Nouveau screenshot → post immédiat
chokidar
  .watch(SCREENSHOTS, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 1500 } })
  .on('add', f => {
    if (/\.(png|jpg|jpeg)$/i.test(f)) {
      console.log('📸 Nouveau screenshot :', path.basename(f));
      setTimeout(() => postScreenshot(f), 1500);
    }
  });

// SavedVariables mis à jour → patch les messages avec détails
chokidar
  .watch(SAVEDVARS, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 500 } })
  .on('add',    () => { console.log('💾 SavedVariables créé');    matchKills(); })
  .on('change', () => { console.log('💾 SavedVariables mis à jour'); matchKills(); });

// Polling toutes les 30s
setInterval(matchKills, 30 * 1000);

// Check initial
matchKills();
