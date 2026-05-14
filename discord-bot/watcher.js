'use strict';

/*
  LAN Kill Watcher — 100% automatique
  ─────────────────────────────────────
  1. Copie config.example.json → config.json et remplis wowPath + webhookUrl
  2. npm install  /  double-clique start.bat

  Flow automatique (aucune commande /reload) :
  Boss meurt → addon Screenshot() + WoWCombatLog.txt mis à jour en temps réel
             → watcher détecte ENCOUNTER_END dans le log
             → screenshot posté sur Discord (POST)  +  détails patchés (PATCH)
             → terminé, aucune action manuelle
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
  console.error('❌  config.json introuvable — copie config.example.json → config.json');
  process.exit(1);
}

const WOW      = cfg.wowPath.replace(/\\/g, '/');
const WEBHOOK  = cfg.webhookUrl;
const PLAYERS  = cfg.players || ['Alban', 'Eliott', 'Fabien', 'Maël', 'Tristan'];

const SCREENSHOTS = path.join(WOW, 'Screenshots');
const COMBAT_LOG  = path.join(WOW, 'Logs', 'WoWCombatLog.txt');
const POSTED_FILE = path.join(__dirname, 'posted.json');
const PENDING_FILE= path.join(__dirname, 'pending.json');

const [, WEBHOOK_ID, WEBHOOK_TOKEN] = WEBHOOK.match(/\/webhooks\/(\d+)\/([^/?]+)/) || [];
if (!WEBHOOK_ID) { console.error('❌  webhookUrl invalide dans config.json'); process.exit(1); }
const WEBHOOK_BASE = `https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}`;

// ── Mapping boss → raid ───────────────────────────────────────────────
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
  'Archavon':'Vault of Archavon','Emalon':'Vault of Archavon',
  'Koralon':'Vault of Archavon','Toravon':'Vault of Archavon',
};

const RAID_COLORS = {
  'Icecrown Citadel':0x3f6eaa,'Ruby Sanctum':0xb22222,'Trial of the Crusader':0xa0522d,
  'Ulduar':0xd4a017,"Onyxia's Lair":0x228b22,'Naxxramas':0x6a0dad,
  'The Obsidian Sanctum':0xff4500,'The Eye of Eternity':0x00bfff,'Vault of Archavon':0x808080,
};

// ── État ──────────────────────────────────────────────────────────────
let posted  = loadJSON(POSTED_FILE, []);
let pending = loadJSON(PENDING_FILE, []);
let wipeCounts = {};   // { bossName: count } — suivi en mémoire depuis le combat log

function loadJSON(f, def) { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return def; } }
function saveJSON(f, d)   { fs.writeFileSync(f, JSON.stringify(d,null,2), 'utf8'); }

// ── Lecture du combat log (tail) ──────────────────────────────────────
let logPos = 0;

function initLogPos() {
  try { logPos = fs.statSync(COMBAT_LOG).size; }
  catch { logPos = 0; }
}

function readNewLogLines() {
  try {
    const size = fs.statSync(COMBAT_LOG).size;
    if (size <= logPos) return [];
    const fd  = fs.openSync(COMBAT_LOG, 'r');
    const buf = Buffer.alloc(size - logPos);
    fs.readSync(fd, buf, 0, buf.length, logPos);
    fs.closeSync(fd);
    logPos = size;
    return buf.toString('utf8').split('\n').filter(l => l.trim());
  } catch { return []; }
}

// ── Parser ENCOUNTER_END du combat log ───────────────────────────────
// Format WotLK : "MM/DD HH:MM:SS.mmm  ENCOUNTER_END,id,"Name",diff,size,success"
function parseEncounterLine(line) {
  const m = line.match(/ENCOUNTER_END,(\d+),"([^"]+)",(\d+),(\d+),(\d+)/);
  if (!m) return null;
  return {
    encounterID: +m[1],
    boss:        m[2],
    difficulty:  +m[3],
    groupSize:   +m[4],
    success:     +m[5],
  };
}

function processLogLines(lines) {
  for (const line of lines) {
    const enc = parseEncounterLine(line);
    if (!enc) continue;

    if (enc.success === 0) {
      wipeCounts[enc.boss] = (wipeCounts[enc.boss] || 0) + 1;
      console.log(`💀 Wipe ${wipeCounts[enc.boss]} — ${enc.boss}`);
      continue;
    }

    // Kill détecté !
    const wipes   = wipeCounts[enc.boss] || 0;
    wipeCounts[enc.boss] = 0;
    const isFirst = !posted.some(id => id.endsWith('_' + enc.boss));
    const now     = new Date();

    const kill = {
      boss:      enc.boss,
      raid:      BOSS_RAID[enc.boss] || 'Unknown',
      wipes,
      first:     isFirst,
      timestamp: Math.round(now.getTime() / 1000),
      date:      now.toLocaleDateString('fr-FR'),
      hour:      now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }),
      players:   PLAYERS,
    };

    console.log(`🎯 Kill : ${enc.boss} (${wipes} wipes, first: ${isFirst})`);
    handleKill(kill);
  }
}

// ── Mise à jour progression ───────────────────────────────────────────
const vm          = require('vm');
const PROG_FILE   = path.resolve(__dirname, '..', 'data', 'progression.js');

function allBossesFlat(entry) {
  if (entry.bosses) return entry.bosses;
  return (entry.wings || []).flatMap(w => w.bosses);
}

function updateProgression(kill) {
  if (!fs.existsSync(PROG_FILE)) return;
  try {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(PROG_FILE, 'utf8'), ctx);
    const prog = ctx.window.PROGRESSION;

    let updated = false;
    for (const entry of [...prog.raids, ...(prog.dungeons || [])]) {
      const boss = allBossesFlat(entry).find(b => b.name === kill.boss);
      if (boss && !boss.killed) {
        boss.killed    = true;
        boss.wipes     = kill.wipes || 0;
        boss.firstKill = kill.first ? kill.date : (boss.firstKill || null);
        updated        = true;
        console.log(`📊 Progression : ${kill.boss} → killed ✅ (${entry.name})`);
        break;
      }
    }

    if (updated) {
      fs.writeFileSync(
        PROG_FILE,
        'window.PROGRESSION = ' + JSON.stringify(prog, null, 2) + ';\n',
        'utf8'
      );
    }
  } catch (e) {
    console.error('⚠️  Progression update :', e.message);
  }
}

// ── Screenshot matching ───────────────────────────────────────────────
const MATCH_WINDOW = 90 * 1000;

function findScreenshot(killTimestampSec) {
  try {
    return fs.readdirSync(SCREENSHOTS)
      .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      .map(f => { const p = path.join(SCREENSHOTS,f); return { path:p, mtime:fs.statSync(p).mtimeMs }; })
      .filter(f => Math.abs(f.mtime - killTimestampSec * 1000) <= MATCH_WINDOW)
      .sort((a,b) => Math.abs(a.mtime - killTimestampSec*1000) - Math.abs(b.mtime - killTimestampSec*1000))
      [0]?.path || null;
  } catch { return null; }
}

// ── Embeds Discord ────────────────────────────────────────────────────
function buildEmbed(kill, withImage) {
  const color  = RAID_COLORS[kill.raid] || 0x9b59b6;
  const fields = [
    { name:'Raid',    value: kill.raid,                         inline:true  },
    { name:'Date',    value: `${kill.date} · ${kill.hour}`,    inline:true  },
    { name:'Joueurs', value: kill.players.join(' · '),         inline:false },
  ];
  if (kill.wipes > 0) fields.push({ name:'Wipes', value: String(kill.wipes), inline:true });
  const embed = {
    title:     (kill.first ? '🎉 FIRST KILL — ' : '💀 Boss Kill — ') + kill.boss,
    color, fields,
    footer:    { text:'LAN Du Swag • WotLK5man – Season1' },
    timestamp: new Date(kill.timestamp * 1000).toISOString(),
  };
  if (withImage) embed.image = { url:'attachment://screenshot.png' };
  return embed;
}

// ── Discord API ───────────────────────────────────────────────────────
async function discordPost(screenshotPath, embed) {
  const form = new FormData();
  if (screenshotPath && fs.existsSync(screenshotPath))
    form.append('file', fs.createReadStream(screenshotPath), 'screenshot.png');
  form.append('payload_json', JSON.stringify({ embeds:[embed] }));
  const res  = await fetch(WEBHOOK_BASE + '?wait=true', { method:'POST', body:form });
  const data = await res.json();
  return data.id || null;
}

async function discordPatch(messageId, embed) {
  const res = await fetch(`${WEBHOOK_BASE}/messages/${messageId}`, {
    method:'PATCH',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ embeds:[embed] }),
  });
  return res.ok;
}

// ── Logique principale ────────────────────────────────────────────────
const SCREENSHOT_GRACE = 5 * 60 * 1000;

async function handleKill(kill) {
  const id = `${kill.timestamp}_${kill.boss}`;
  if (posted.includes(id)) return;

  const screenshot = findScreenshot(kill.timestamp);
  const killAge    = Date.now() - kill.timestamp * 1000;

  // Pas encore de screenshot et kill trop récent → attendre
  if (!screenshot && killAge < SCREENSHOT_GRACE) {
    console.log(`⏳ "${kill.boss}" — screenshot pas encore là, retry dans 5s...`);
    setTimeout(() => handleKill(kill), 5000);
    return;
  }

  try {
    const embed    = buildEmbed(kill, !!screenshot);
    const msgId    = await discordPost(screenshot, embed);
    const tag      = screenshot ? '📸' : '📝';
    const firstTag = kill.first ? ' [FIRST KILL]' : '';
    console.log(`✅ ${tag} Posté : ${kill.boss}${firstTag}`);

    updateProgression(kill);

    if (msgId) {
      pending.push({ msgId, killId: id });
      saveJSON(PENDING_FILE, pending);
    }

    posted.push(id);
    saveJSON(POSTED_FILE, posted);
  } catch (e) {
    console.error('❌ Erreur Discord :', e.message);
  }
}

// ── Watchers ──────────────────────────────────────────────────────────
console.log('🎮 LAN Kill Watcher — 100% automatique');
console.log('   Combat log :', COMBAT_LOG);
console.log('   Screenshots:', SCREENSHOTS);
console.log('   Webhook    :', WEBHOOK.replace(/\/[^/]+$/, '/***'));
console.log('');

initLogPos();

// Surveille le combat log (principal — temps réel)
chokidar
  .watch(COMBAT_LOG, { ignoreInitial:true, awaitWriteFinish:{ stabilityThreshold:200 } })
  .on('add',    () => { initLogPos(); })
  .on('change', () => { processLogLines(readNewLogLines()); });

// Surveille les screenshots
chokidar
  .watch(SCREENSHOTS, { ignoreInitial:true, awaitWriteFinish:{ stabilityThreshold:1500 } })
  .on('add', f => {
    if (/\.(png|jpg|jpeg)$/i.test(f))
      console.log('📸 Nouveau screenshot :', path.basename(f));
  });

// Polling de sécurité toutes les 30s
setInterval(() => processLogLines(readNewLogLines()), 30 * 1000);
