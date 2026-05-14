'use strict';

/*
  LAN Du Swag — API
  ──────────────────
  Variables d'environnement :
    PORT   = port d'écoute       (défaut : 3001)
    SECRET = clé d'auth du POST  (défaut : changeme — à changer en prod !)

  Démarrage serveur Ubuntu :
    cd api && npm install
    SECRET=monSecret PORT=3001 node server.js
    (ou via PM2 : pm2 start server.js --name lan-api)
*/

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const vm      = require('vm');

const PORT   = process.env.PORT   || 3001;
const SECRET = process.env.SECRET || 'changeme';
const DATA   = path.join(__dirname, 'data');
const STATIC = path.join(__dirname, '..', 'data');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── Data helpers ──────────────────────────────────────────────────────
function load(name, def) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8')); }
  catch { return def; }
}

function save(name, data) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(data, null, 2), 'utf8');
}

// Migration one-shot : lit les .js statiques existants et les convertit en JSON
function migrate(jsFile, varName, jsonFile, def) {
  if (fs.existsSync(path.join(DATA, jsonFile))) return;
  try {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(STATIC, jsFile), 'utf8'), ctx);
    save(jsonFile, ctx.window[varName] || def);
    console.log(`📦 Migration : ${jsFile} → data/${jsonFile}`);
  } catch {
    save(jsonFile, def);
  }
}

migrate('progression.js',  'PROGRESSION',   'progression.json',  { raids:[], dungeons:[] });
migrate('raid-stats.js',   'RAID_STATS',    'stats.json',        { players:[], sessions:[] });
migrate('hall-of-shame.js','HALL_OF_SHAME', 'shame.json',        { deaths:[], screenshots:[] });

// ── Auth middleware ───────────────────────────────────────────────────
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (token !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── GET ───────────────────────────────────────────────────────────────
app.get('/api/health',      (_, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/progression', (_, res) => res.json(load('progression.json', {})));
app.get('/api/stats',       (_, res) => res.json(load('stats.json', {})));
app.get('/api/shame',       (_, res) => res.json(load('shame.json', {})));

// ── POST /api/kill ────────────────────────────────────────────────────
app.post('/api/kill', auth, (req, res) => {
  const kill = req.body;
  if (!kill?.boss) return res.status(400).json({ error: 'boss manquant' });

  try {
    updateProgression(kill);
    updateStats(kill);
    updateShame(kill);
    console.log(`✅ Kill : ${kill.boss} (${kill.date} ${kill.hour})`);
    res.json({ ok: true });
  } catch(e) {
    console.error('❌ /api/kill :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/reset (admin) ───────────────────────────────────────────
app.post('/api/reset', auth, (req, res) => {
  const target = req.body?.target || 'all';
  if (target === 'all' || target === 'progression') {
    const prog = load('progression.json', {});
    function resetBosses(entry) {
      const bosses = entry.bosses || (entry.wings||[]).flatMap(w=>w.bosses);
      bosses.forEach(b => { b.killed=false; b.wipes=0; b.firstKill=null; });
    }
    [...(prog.raids||[]),...(prog.dungeons||[])].forEach(resetBosses);
    save('progression.json', prog);
  }
  if (target === 'all' || target === 'stats') {
    const stats = load('stats.json', {});
    stats.sessions = [];
    save('stats.json', stats);
  }
  if (target === 'all' || target === 'shame') {
    save('shame.json', { deaths: [], screenshots: [] });
  }
  console.log(`🔄 Reset : ${target}`);
  res.json({ ok: true, reset: target });
});

// ── Logique progression ───────────────────────────────────────────────
function allBossesFlat(entry) {
  return entry.bosses || (entry.wings||[]).flatMap(w=>w.bosses);
}

function updateProgression(kill) {
  const prog = load('progression.json', { raids:[], dungeons:[] });
  for (const entry of [...(prog.raids||[]),...(prog.dungeons||[])]) {
    const b = allBossesFlat(entry).find(b => b.name === kill.boss);
    if (b && !b.killed) {
      b.killed    = true;
      b.wipes     = kill.wipes || 0;
      b.firstKill = kill.first ? kill.date : (b.firstKill || null);
      break;
    }
  }
  save('progression.json', prog);
}

// ── Logique stats ─────────────────────────────────────────────────────
const RAID_SHORT = {
  'Icecrown Citadel':'ICC','Ruby Sanctum':'RS','Trial of the Crusader':'ToC',
  'Ulduar':'Ulduar',"Onyxia's Lair":'Onyxia','Naxxramas':'Naxx',
  'The Obsidian Sanctum':'OS','The Eye of Eternity':'EoE','Vault of Archavon':'VoA',
};

function updateStats(kill) {
  const stats    = load('stats.json', { players:[], sessions:[] });
  const today    = new Date().toISOString().slice(0, 10);
  const raidCode = RAID_SHORT[kill.raid] || kill.raid;
  const durSec   = kill.durationSec || 0;
  const durStr   = durSec > 0
    ? `${Math.floor(durSec/60)}:${String(durSec%60).padStart(2,'0')}`
    : null;

  let session = stats.sessions.find(s => s.date === today && s.raid === raidCode);
  if (!session) { session = { date:today, raid:raidCode, bosses:[] }; stats.sessions.push(session); }

  const deathCnt = {};
  (kill.deaths||[]).forEach(d => { deathCnt[d.player] = (deathCnt[d.player]||0)+1; });

  const players = kill.players || stats.players || [];
  const perfs   = players.map(p => ({
    player: p,
    dps:    durSec > 0 ? Math.round((kill.damageBy?.[p]       ||0) / durSec) : 0,
    hps:    durSec > 0 ? Math.round((kill.healBy?.[p]          ||0) / durSec) : 0,
    dtps:   durSec > 0 ? Math.round((kill.damageTakenBy?.[p]   ||0) / durSec) : 0,
    deaths: deathCnt[p] || 0,
  }));

  const entry = { name:kill.boss, killed:true, wipes:kill.wipes||0, duration:durStr, performances:perfs };
  const idx   = session.bosses.findIndex(b => b.name === kill.boss);
  if (idx >= 0) session.bosses[idx] = entry; else session.bosses.push(entry);
  save('stats.json', stats);
}

// ── Logique hall of shame ─────────────────────────────────────────────
function updateShame(kill) {
  const hos      = load('shame.json', { deaths:[], screenshots:[] });
  const raidCode = RAID_SHORT[kill.raid] || kill.raid;
  let nextId     = hos.deaths.reduce((m,d) => Math.max(m,d.id||0), 0) + 1;

  (kill.deaths||[]).forEach(d => hos.deaths.push({
    id:nextId++, player:d.player, cause:d.cause||'Unknown', causeId:null,
    instance:raidCode, boss:kill.boss, description:null, date:kill.date, wipe:false,
  }));

  if (kill.screenshotUrl) {
    const nextSsId = hos.screenshots.reduce((m,s) => Math.max(m,s.id||0), 0) + 1;
    hos.screenshots.push({
      id:nextSsId, title:`${kill.first?'First Kill':'Kill'} — ${kill.boss}`,
      player:null, description:kill.wipes>0?`${kill.wipes} wipe(s).`:null,
      date:kill.date, url:kill.screenshotUrl, type:'kill',
    });
  }
  save('shame.json', hos);
}

app.listen(PORT, () => {
  console.log(`🚀 LAN Du Swag API — port ${PORT}`);
  console.log(`   GET  /api/progression`);
  console.log(`   GET  /api/stats`);
  console.log(`   GET  /api/shame`);
  console.log(`   POST /api/kill  (Bearer auth)`);
});
