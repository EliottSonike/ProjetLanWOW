'use strict';

/*
  LAN Kill Watcher — version API
  ────────────────────────────────
  Le watcher fait uniquement deux choses :
  1. Poste le screenshot sur Discord via webhook
  2. Envoie les données du kill à l'API du serveur

  config.json requis :
  {
    "wowPath":      "C:/...",
    "webhookUrl":   "https://discord.com/api/webhooks/...",
    "apiUrl":       "https://lansduswag.site/api",   ← URL de l'API
    "apiSecret":    "ton_secret",
    "players":      ["Alban","Eliott","Fabien","Maël","Tristan"],
    "characterMap": { "Krapule":"Eliott", "Filou":"Tristan" }
  }
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
  console.error('❌  config.json introuvable'); process.exit(1);
}

const WOW      = cfg.wowPath.replace(/\\/g, '/');
const WEBHOOK  = cfg.webhookUrl;
const API_URL  = (cfg.apiUrl  || 'http://localhost:3001/api').replace(/\/$/, '');
const API_KEY  = cfg.apiSecret || 'changeme';
const PLAYERS  = cfg.players  || ['Alban','Eliott','Fabien','Maël','Tristan'];
const CHAR_MAP = cfg.characterMap || {};

const SCREENSHOTS = path.join(WOW, 'Screenshots');
const COMBAT_LOG  = path.join(WOW, 'Logs', 'WoWCombatLog.txt');
const POSTED_FILE = path.join(__dirname, 'posted.json');

const [, WH_ID, WH_TOKEN] = WEBHOOK.match(/\/webhooks\/(\d+)\/([^/?]+)/) || [];
if (!WH_ID) { console.error('❌  webhookUrl invalide'); process.exit(1); }
const WH_BASE = `https://discord.com/api/webhooks/${WH_ID}/${WH_TOKEN}`;

// ── Mappings ──────────────────────────────────────────────────────────
const BOSS_RAID = {
  'Lord Marrowgar':'Icecrown Citadel','Lady Deathwhisper':'Icecrown Citadel',
  'Gunship Battle':'Icecrown Citadel','Deathbringer Saurfang':'Icecrown Citadel',
  'Festergut':'Icecrown Citadel','Rotface':'Icecrown Citadel',
  'Professor Putricide':'Icecrown Citadel','Blood Prince Council':'Icecrown Citadel',
  "Blood-Queen Lana'thel":'Icecrown Citadel','Valithria Dreamwalker':'Icecrown Citadel',
  'Sindragosa':'Icecrown Citadel','The Lich King':'Icecrown Citadel',
  'Halion':'Ruby Sanctum',
  'Northrend Beasts':'Trial of the Crusader','Lord Jaraxxus':'Trial of the Crusader',
  'Faction Champions':'Trial of the Crusader',"Twin Val'kyr":'Trial of the Crusader',
  "Anub'arak":'Trial of the Crusader',
  'Flame Leviathan':'Ulduar','Ignis':'Ulduar','Razorscale':'Ulduar','XT-002':'Ulduar',
  'Iron Council':'Ulduar','Kologarn':'Ulduar','Auriaya':'Ulduar','Hodir':'Ulduar',
  'Thorim':'Ulduar','Freya':'Ulduar','Mimiron':'Ulduar','General Vezax':'Ulduar',
  'Yogg-Saron':'Ulduar','Algalon':'Ulduar',
  "Onyxia":"Onyxia's Lair",
  "Anub'Rekhan":'Naxxramas','Grand Widow Faerlina':'Naxxramas','Maexxna':'Naxxramas',
  'Noth the Plaguebringer':'Naxxramas','Heigan the Unclean':'Naxxramas','Loatheb':'Naxxramas',
  'Instructor Razuvious':'Naxxramas','Gothik the Harvester':'Naxxramas',
  'Four Horsemen':'Naxxramas','Patchwerk':'Naxxramas','Grobbulus':'Naxxramas',
  'Gluth':'Naxxramas','Thaddius':'Naxxramas','Sapphiron':'Naxxramas',"Kel'Thuzad":'Naxxramas',
  'Vesperon':'The Obsidian Sanctum','Shadron':'The Obsidian Sanctum',
  'Tenebron':'The Obsidian Sanctum','Sartharion':'The Obsidian Sanctum',
  'Malygos':'The Eye of Eternity',
  'Archavon':'Vault of Archavon','Archavon the Stone Watcher':'Vault of Archavon',
  'Emalon':'Vault of Archavon','Emalon the Storm Watcher':'Vault of Archavon',
  'Koralon':'Vault of Archavon','Koralon the Flame Watcher':'Vault of Archavon',
  'Toravon':'Vault of Archavon','Toravon the Ice Watcher':'Vault of Archavon',
};

const RAID_COLORS = {
  'Icecrown Citadel':0x3f6eaa,'Ruby Sanctum':0xb22222,'Trial of the Crusader':0xa0522d,
  'Ulduar':0xd4a017,"Onyxia's Lair":0x228b22,'Naxxramas':0x6a0dad,
  'The Obsidian Sanctum':0xff4500,'The Eye of Eternity':0x00bfff,'Vault of Archavon':0x808080,
};

// ── Helpers ───────────────────────────────────────────────────────────
function charToDisplay(raw) {
  const n = (raw||'').split('-')[0];
  return CHAR_MAP[n] || (PLAYERS.includes(n) ? n : null);
}

let posted = (() => { try { return JSON.parse(fs.readFileSync(POSTED_FILE,'utf8')); } catch { return []; } })();
function savePosted() { fs.writeFileSync(POSTED_FILE, JSON.stringify(posted,null,2), 'utf8'); }

// ── Combat log ────────────────────────────────────────────────────────
let logPos = 0, wipeCounts = {}, enc = null;

function initLogPos() { try { logPos = fs.statSync(COMBAT_LOG).size; } catch { logPos = 0; } }

function readNewLines() {
  try {
    const size = fs.statSync(COMBAT_LOG).size;
    if (size <= logPos) return [];
    const fd = fs.openSync(COMBAT_LOG,'r'), buf = Buffer.alloc(size-logPos);
    fs.readSync(fd, buf, 0, buf.length, logPos); fs.closeSync(fd);
    logPos = size;
    return buf.toString('utf8').split('\n').filter(l=>l.trim());
  } catch { return []; }
}

function splitCsv(s) {
  const p=[]; let c='',q=false;
  for (const ch of s) {
    if (ch==='"') q=!q;
    else if (ch===',' && !q) { p.push(c); c=''; }
    else c+=ch;
  }
  if (c) p.push(c);
  return p;
}

function parseLine(line) {
  const m = line.match(/^([\d/]+) ([\d:.]+)\s{2}(\w+),(.*)/s);
  if (!m) return null;
  // Extrait le timestamp du log (M/D HH:MM:SS.mmm) → ms epoch
  const [mo, dy]     = m[1].split('/').map(Number);
  const [hh, mi, ss] = m[2].split(':');
  const [sec, ms]    = ss.split('.');
  const d = new Date();
  d.setMonth(mo-1, dy);
  d.setHours(+hh, +mi, +sec, +(ms||0));
  return { event:m[3], args:splitCsv(m[4]), ts:d.getTime() };
}

function processLines(lines) {
  for (const line of lines) {
    const p = parseLine(line); if (!p) continue;
    const { event, args } = p;

    if (event === 'ENCOUNTER_START') {
      enc = { boss:args[1], raid:BOSS_RAID[args[1]]||'Unknown', startMs:p.ts,
              deaths:[], damageBy:{}, healBy:{}, lastHitOn:{} };

    } else if (event === 'ENCOUNTER_END') {
      const boss=args[1], ok=+args[4];
      if (ok===0) {
        wipeCounts[boss]=(wipeCounts[boss]||0)+1;
        console.log(`💀 Wipe ${wipeCounts[boss]} — ${boss}`);
        enc=null; continue;
      }
      const wipes=wipeCounts[boss]||0; wipeCounts[boss]=0;
      const isFirst=!posted.some(id=>id.endsWith('_'+boss));
      const killDate = new Date(p.ts);
      handleKill({
        boss, raid:BOSS_RAID[boss]||'Unknown', wipes, first:isFirst,
        timestamp:  Math.round(p.ts/1000),
        date:       killDate.toLocaleDateString('fr-FR'),
        hour:       killDate.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
        players:    PLAYERS,
        durationSec: enc ? Math.round((p.ts - enc.startMs)/1000) : 0,
        deaths:   enc?.deaths   || [],
        damageBy: enc?.damageBy || {},
        healBy:   enc?.healBy   || {},
      });
      enc=null;

    } else if (event==='UNIT_DIED' && enc) {
      const dst=charToDisplay(args[5]); if (!dst) continue;
      enc.deaths.push({ player:dst, cause:enc.lastHitOn[dst]?.spell||'Unknown',
                        source:enc.lastHitOn[dst]?.src||'Unknown' });
      console.log(`⚰️  ${dst} mort(e) (${enc.lastHitOn[dst]?.spell||'?'})`);

    } else if ((event==='SPELL_DAMAGE'||event==='RANGE_DAMAGE') && enc) {
      const src=charToDisplay(args[1]), dst=charToDisplay(args[5]);
      if (src) enc.damageBy[src]=(enc.damageBy[src]||0)+(+args[11]||0);
      if (dst) enc.lastHitOn[dst]={ spell:args[9], src:args[1].split('-')[0] };

    } else if (event==='SWING_DAMAGE' && enc) {
      const src=charToDisplay(args[1]), dst=charToDisplay(args[5]);
      if (src) enc.damageBy[src]=(enc.damageBy[src]||0)+(+args[8]||0);
      if (dst) enc.lastHitOn[dst]={ spell:'Melee', src:args[1].split('-')[0] };

    } else if ((event==='SPELL_HEAL'||event==='SPELL_PERIODIC_HEAL') && enc) {
      const src=charToDisplay(args[1]);
      if (src) enc.healBy[src]=(enc.healBy[src]||0)+(+args[11]||0);
    }
  }
}

// ── Screenshot matching ───────────────────────────────────────────────
const MATCH_WIN = 90*1000;

function findScreenshot(ts) {
  try {
    return fs.readdirSync(SCREENSHOTS)
      .filter(f=>/\.(png|jpg|jpeg)$/i.test(f))
      .map(f=>{ const p=path.join(SCREENSHOTS,f); return {path:p, mtime:fs.statSync(p).mtimeMs}; })
      .filter(f=>Math.abs(f.mtime-ts*1000)<=MATCH_WIN)
      .sort((a,b)=>Math.abs(a.mtime-ts*1000)-Math.abs(b.mtime-ts*1000))
      [0]?.path||null;
  } catch { return null; }
}

// ── Rôles joueurs pour les icônes Discord ────────────────────────────
const PLAYER_ROLES = cfg.playerRoles || {
  Alban:'dps', Eliott:'dps', Fabien:'dps', Maël:'tank', Tristan:'heal'
};
const ROLE_ICON = { dps:'⚔️', tank:'🛡️', heal:'💚' };

function fmtNum(n) { return n>=1000 ? (n/1000).toFixed(1)+'k' : String(n||0); }

// ── Discord ───────────────────────────────────────────────────────────
function buildEmbed(kill, withImg) {
  const color = RAID_COLORS[kill.raid]||0x9b59b6;
  const dur   = kill.durationSec>0
    ? `${Math.floor(kill.durationSec/60)}:${String(kill.durationSec%60).padStart(2,'0')}` : null;
  const fields = [
    {name:'Raid',   value:kill.raid,                     inline:true},
    {name:'Date',   value:`${kill.date} · ${kill.hour}`, inline:true},
    {name:'Joueurs',value:kill.players.join(' · '),      inline:false},
  ];
  if (kill.wipes>0) fields.push({name:'Wipes', value:String(kill.wipes), inline:true});
  if (dur)          fields.push({name:'Durée', value:dur,                 inline:true});

  // ── Performances DPS/HPS ──────────────────────────────────────────
  if (kill.durationSec > 0) {
    const perfs = kill.players
      .map(p => {
        const dps = kill.damageBy?.[p] ? Math.round(kill.damageBy[p] / kill.durationSec) : 0;
        const hps = kill.healBy?.[p]   ? Math.round(kill.healBy[p]   / kill.durationSec) : 0;
        return { player:p, dps, hps };
      })
      .filter(p => p.dps > 0 || p.hps > 0)
      .sort((a, b) => (b.dps||b.hps) - (a.dps||a.hps));

    if (perfs.length > 0) {
      const lines = perfs.map(p => {
        const role = PLAYER_ROLES[p.player] || 'dps';
        const icon = ROLE_ICON[role] || '⚔️';
        const stat = role === 'heal'
          ? `${fmtNum(p.hps)} HPS`
          : `${fmtNum(p.dps)} DPS`;
        return `${icon} **${p.player}** — ${stat}`;
      });
      fields.push({ name:'📊 Performances', value:lines.join('\n'), inline:false });
    }
  }

  // ── Morts du fight ────────────────────────────────────────────────
  if (kill.deaths?.length > 0) {
    const deathLines = kill.deaths.map(d => `💀 **${d.player}** — ${d.cause}`);
    fields.push({ name:'☠️ Morts', value:deathLines.join('\n'), inline:false });
  }

  const embed = {
    title:(kill.first?'🎉 FIRST KILL — ':'💀 Boss Kill — ')+kill.boss,
    color, fields,
    footer:{text:'LAN Du Swag • WotLK5man – Season1'},
    timestamp:new Date(kill.timestamp*1000).toISOString(),
  };
  if (withImg) embed.image={url:'attachment://screenshot.png'};
  return embed;
}

async function discordPost(ss, kill) {
  const form = new FormData();
  if (ss && fs.existsSync(ss)) form.append('file', fs.createReadStream(ss),'screenshot.png');
  form.append('payload_json', JSON.stringify({embeds:[buildEmbed(kill,!!ss)]}));
  const res = await fetch(WH_BASE, {method:'POST', body:form});
  if (!res.ok && res.status!==204) console.error('❌ Discord :', res.status, await res.text());
}

// ── API POST ──────────────────────────────────────────────────────────
async function postToApi(kill, screenshotPath) {
  const payload = { ...kill, screenshotUrl: null };
  try {
    const res = await fetch(`${API_URL}/kill`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${API_KEY}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) console.log(`📡 API OK : ${kill.boss}`);
    else        console.error('❌ API :', res.status, await res.text());
  } catch(e) {
    console.error('❌ API injoignable :', e.message, '(le site affichera les anciennes données)');
  }
}

// ── Logique principale ────────────────────────────────────────────────
const GRACE = 5*60*1000;

async function handleKill(kill) {
  const id = `${kill.timestamp}_${kill.boss}`;
  if (posted.includes(id)) return;

  const ss  = findScreenshot(kill.timestamp);
  const age = Date.now()-kill.timestamp*1000;

  if (!ss && age<GRACE) { setTimeout(()=>handleKill(kill), 5000); return; }

  console.log(`🎯 Kill : ${kill.boss}${kill.first?' [FIRST]':''} (${kill.wipes}w, ${kill.durationSec}s)`);

  await Promise.all([
    discordPost(ss, kill),
    postToApi(kill, ss),
  ]);

  posted.push(id);
  savePosted();
  console.log(`✅ ${kill.boss} — Discord + API OK`);
}

// ── Watchers ──────────────────────────────────────────────────────────
console.log('🎮 LAN Kill Watcher');
console.log('   API        :', API_URL);
console.log('   Combat log :', COMBAT_LOG);
console.log('   Players    :', PLAYERS.join(', '));
console.log('');

initLogPos();

chokidar.watch(COMBAT_LOG, {ignoreInitial:true, awaitWriteFinish:{stabilityThreshold:200}})
  .on('add',    ()=>initLogPos())
  .on('change', ()=>processLines(readNewLines()));

chokidar.watch(SCREENSHOTS, {ignoreInitial:true, awaitWriteFinish:{stabilityThreshold:1500}})
  .on('add', f=>{ if(/\.(png|jpg|jpeg)$/i.test(f)) console.log('📸 Screenshot:',path.basename(f)); });

setInterval(()=>processLines(readNewLines()), 30*1000);
