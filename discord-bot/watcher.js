'use strict';

/*
  LAN Kill Watcher — tracking complet automatique
  ─────────────────────────────────────────────────
  Lit WoWCombatLog.txt en temps réel et met à jour :
  • Discord      — screenshot + embed
  • progression  — data/progression.js
  • raid-stats   — data/raid-stats.js  (DPS, HPS, morts, durée)
  • hall-of-shame— data/hall-of-shame.js (morts + screenshots)
  Puis commit + push git automatiquement.
*/

const fs             = require('fs');
const path           = require('path');
const { execSync }   = require('child_process');
const vm             = require('vm');
const chokidar       = require('chokidar');
const fetch          = require('node-fetch');
const FormData       = require('form-data');

// ── Config ────────────────────────────────────────────────────────────
let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
} catch {
  console.error('❌  config.json introuvable');
  process.exit(1);
}

const WOW      = cfg.wowPath.replace(/\\/g, '/');
const WEBHOOK  = cfg.webhookUrl;
const PLAYERS  = cfg.players || ['Alban','Eliott','Fabien','Maël','Tristan'];
const CHAR_MAP = cfg.characterMap || {};   // { "Krapule": "Eliott" }

const SCREENSHOTS  = path.join(WOW, 'Screenshots');
const COMBAT_LOG   = path.join(WOW, 'Logs', 'WoWCombatLog.txt');
const POSTED_FILE  = path.join(__dirname, 'posted.json');
const PENDING_FILE = path.join(__dirname, 'pending.json');
const ROOT         = path.resolve(__dirname, '..');
const PROG_FILE    = path.join(ROOT, 'data', 'progression.js');
const STATS_FILE   = path.join(ROOT, 'data', 'raid-stats.js');
const HOS_FILE     = path.join(ROOT, 'data', 'hall-of-shame.js');
const SS_DIR       = path.join(ROOT, 'assets', 'screenshots');

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
  'Archavon':'Vault of Archavon','Emalon':'Vault of Archavon',
  'Koralon':'Vault of Archavon','Toravon':'Vault of Archavon',
};

const RAID_COLORS = {
  'Icecrown Citadel':0x3f6eaa,'Ruby Sanctum':0xb22222,'Trial of the Crusader':0xa0522d,
  'Ulduar':0xd4a017,"Onyxia's Lair":0x228b22,'Naxxramas':0x6a0dad,
  'The Obsidian Sanctum':0xff4500,'The Eye of Eternity':0x00bfff,'Vault of Archavon':0x808080,
};

const RAID_SHORT = {
  'Icecrown Citadel':'ICC','Ruby Sanctum':'RS','Trial of the Crusader':'ToC',
  'Ulduar':'Ulduar',"Onyxia's Lair":'Onyxia','Naxxramas':'Naxx',
  'The Obsidian Sanctum':'OS','The Eye of Eternity':'EoE','Vault of Archavon':'VoA',
};

// ── Helpers joueurs ───────────────────────────────────────────────────
function charToDisplay(rawName) {
  const name = (rawName || '').split('-')[0];
  if (CHAR_MAP[name])      return CHAR_MAP[name];
  if (PLAYERS.includes(name)) return name;
  return null;
}

// ── État ──────────────────────────────────────────────────────────────
let posted  = loadJSON(POSTED_FILE, []);
let pending = loadJSON(PENDING_FILE, []);
let wipeCounts = {};

// Etat de l'encounter en cours
let enc = null;
// enc = { id, boss, raid, startMs, deaths:[], damageBy:{}, healBy:{}, lastHitOn:{} }

function loadJSON(f, d) { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return d; } }
function saveJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d,null,2),'utf8'); }

// ── Lecture data files ────────────────────────────────────────────────
function loadData(filePath) {
  const ctx = { window:{} };
  vm.runInNewContext(fs.readFileSync(filePath,'utf8'), ctx);
  return ctx.window;
}

function saveData(filePath, varName, data) {
  fs.writeFileSync(filePath, `window.${varName} = ${JSON.stringify(data,null,2)};\n`, 'utf8');
}

// ── Git auto-push ─────────────────────────────────────────────────────
function gitPush() {
  try {
    execSync(`git -C "${ROOT}" add data/progression.js data/raid-stats.js data/hall-of-shame.js assets/screenshots/`, { stdio:'pipe' });
    execSync(`git -C "${ROOT}" commit -m "auto: boss kill data update"`, { stdio:'pipe' });
    execSync(`git -C "${ROOT}" push origin dev`, { stdio:'pipe' });
    console.log('🚀 Git push OK');
  } catch(e) {
    const msg = e.stderr?.toString() || '';
    if (!msg.includes('nothing to commit')) console.error('⚠️  Git push :', msg.slice(0,120));
  }
}

// ── Parser combat log ─────────────────────────────────────────────────
function splitCsv(str) {
  const parts = []; let cur = '', q = false;
  for (const c of str) {
    if (c === '"') q = !q;
    else if (c === ',' && !q) { parts.push(cur); cur = ''; }
    else cur += c;
  }
  if (cur) parts.push(cur);
  return parts;
}

function parseLine(line) {
  const m = line.match(/^[\d/]+ [\d:.]+\s{2}(\w+),(.*)/s);
  if (!m) return null;
  return { event: m[1], args: splitCsv(m[2]) };
}

// ── Traitement des lignes ─────────────────────────────────────────────
function processLogLines(lines) {
  for (const line of lines) {
    const p = parseLine(line);
    if (!p) continue;
    const { event, args } = p;

    if (event === 'ENCOUNTER_START') {
      enc = { id:+args[0], boss:args[1], raid:BOSS_RAID[args[1]]||'Unknown',
              startMs:Date.now(), deaths:[], damageBy:{}, healBy:{}, lastHitOn:{} };

    } else if (event === 'ENCOUNTER_END') {
      const boss = args[1], success = +args[4];

      if (success === 0) {
        wipeCounts[boss] = (wipeCounts[boss]||0) + 1;
        // Morts sur ce wipe → Hall of Shame
        if (enc?.deaths.length) saveHosDeaths(enc.deaths, boss, true);
        console.log(`💀 Wipe ${wipeCounts[boss]} — ${boss}`);
        enc = null;
        continue;
      }

      // Kill !
      const wipes   = wipeCounts[boss] || 0;
      wipeCounts[boss] = 0;
      const isFirst = !posted.some(id => id.endsWith('_' + boss));
      const now     = new Date();

      const kill = {
        boss, raid: BOSS_RAID[boss]||'Unknown', wipes, first: isFirst,
        timestamp: Math.round(now.getTime()/1000),
        date:  now.toLocaleDateString('fr-FR'),
        hour:  now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
        players: PLAYERS,
        durationSec: enc ? Math.round((Date.now()-enc.startMs)/1000) : 0,
        deaths:   enc?.deaths  || [],
        damageBy: enc?.damageBy || {},
        healBy:   enc?.healBy  || {},
      };

      console.log(`🎯 Kill : ${boss} (${wipes}w, ${kill.durationSec}s, first:${isFirst})`);
      handleKill(kill);
      enc = null;

    } else if (event === 'UNIT_DIED') {
      if (!enc) continue;
      // Prefix: srcGUID[0] srcName[1] ... dstGUID[4] dstName[5]
      const dst = charToDisplay(args[5]);
      if (!dst) continue;
      const last = enc.lastHitOn[dst];
      enc.deaths.push({ player:dst, cause:last?.spell||'Unknown', source:last?.src||'Unknown' });
      console.log(`⚰️  ${dst} mort(e) par ${last?.spell||'?'}`);

    } else if (event === 'SPELL_DAMAGE' || event === 'RANGE_DAMAGE') {
      if (!enc) continue;
      const src = charToDisplay(args[1]);
      const dst = charToDisplay(args[5]);
      const amt = +args[11]||0;
      if (src) enc.damageBy[src] = (enc.damageBy[src]||0) + amt;
      if (dst) enc.lastHitOn[dst] = { spell:args[9], src:args[1].split('-')[0] };

    } else if (event === 'SWING_DAMAGE') {
      if (!enc) continue;
      const src = charToDisplay(args[1]);
      const dst = charToDisplay(args[5]);
      const amt = +args[8]||0;
      if (src) enc.damageBy[src] = (enc.damageBy[src]||0) + amt;
      if (dst) enc.lastHitOn[dst] = { spell:'Melee', src:args[1].split('-')[0] };

    } else if (event === 'SPELL_HEAL' || event === 'SPELL_PERIODIC_HEAL') {
      if (!enc) continue;
      const src = charToDisplay(args[1]);
      const amt = +args[11]||0;
      if (src) enc.healBy[src] = (enc.healBy[src]||0) + amt;
    }
  }
}

// ── Mise à jour progression ───────────────────────────────────────────
function allBossesFlat(e) {
  return e.bosses || (e.wings||[]).flatMap(w=>w.bosses);
}

function updateProgression(kill) {
  if (!fs.existsSync(PROG_FILE)) return;
  try {
    const { PROGRESSION:prog } = loadData(PROG_FILE);
    let updated = false;
    for (const entry of [...prog.raids,...(prog.dungeons||[])]) {
      const b = allBossesFlat(entry).find(b=>b.name===kill.boss);
      if (b && !b.killed) {
        b.killed = true; b.wipes = kill.wipes||0;
        b.firstKill = kill.first ? kill.date : (b.firstKill||null);
        updated = true;
        console.log(`📊 Progression : ${kill.boss} ✅ (${entry.name})`);
        break;
      }
    }
    if (updated) saveData(PROG_FILE, 'PROGRESSION', prog);
  } catch(e) { console.error('⚠️  Progression :', e.message); }
}

// ── Mise à jour raid stats ────────────────────────────────────────────
function updateRaidStats(kill) {
  if (!fs.existsSync(STATS_FILE)) return;
  try {
    const { RAID_STATS:stats } = loadData(STATS_FILE);
    const today    = new Date().toISOString().slice(0,10);
    const raidCode = RAID_SHORT[kill.raid] || kill.raid;
    const durSec   = kill.durationSec || 0;
    const durStr   = durSec>0 ? `${Math.floor(durSec/60)}:${String(durSec%60).padStart(2,'0')}` : null;

    let session = stats.sessions.find(s=>s.date===today && s.raid===raidCode);
    if (!session) { session = {date:today, raid:raidCode, bosses:[]}; stats.sessions.push(session); }

    const deathCnt = {};
    (kill.deaths||[]).forEach(d=>{ deathCnt[d.player]=(deathCnt[d.player]||0)+1; });

    const perfs = PLAYERS.map(p => ({
      player: p,
      dps:    durSec>0 ? Math.round((kill.damageBy[p]||0)/durSec) : 0,
      hps:    durSec>0 ? Math.round((kill.healBy[p]||0)/durSec)   : 0,
      deaths: deathCnt[p]||0,
    }));

    const entry = { name:kill.boss, killed:true, wipes:kill.wipes||0, duration:durStr, performances:perfs };
    const idx   = session.bosses.findIndex(b=>b.name===kill.boss);
    if (idx>=0) session.bosses[idx]=entry; else session.bosses.push(entry);

    saveData(STATS_FILE, 'RAID_STATS', stats);
    console.log(`📈 Stats : ${kill.boss} (${durStr||'?'}, ${perfs.map(p=>`${p.player} ${p.dps}dps`).join(', ')})`);
  } catch(e) { console.error('⚠️  Raid stats :', e.message); }
}

// ── Mise à jour Hall of Shame ─────────────────────────────────────────
function saveHosDeaths(deaths, boss, wipe) {
  if (!fs.existsSync(HOS_FILE) || !deaths.length) return;
  try {
    const { HALL_OF_SHAME:hos } = loadData(HOS_FILE);
    const raidCode = RAID_SHORT[BOSS_RAID[boss]||''] || '';
    let nextId = hos.deaths.reduce((m,d)=>Math.max(m,d.id||0),0) + 1;
    deaths.forEach(d => hos.deaths.push({
      id:nextId++, player:d.player, cause:d.cause||'Unknown', causeId:null,
      instance:raidCode, boss, description:null, date:new Date().toLocaleDateString('fr-FR'), wipe,
    }));
    saveData(HOS_FILE, 'HALL_OF_SHAME', hos);
  } catch(e) { console.error('⚠️  HOS deaths :', e.message); }
}

function updateHallOfShame(kill, screenshotPath) {
  if (!fs.existsSync(HOS_FILE)) return;
  try {
    const { HALL_OF_SHAME:hos } = loadData(HOS_FILE);
    const raidCode = RAID_SHORT[kill.raid]||kill.raid;
    let changed = false;

    // Morts du kill (wipe:false)
    if (kill.deaths?.length) {
      let nextId = hos.deaths.reduce((m,d)=>Math.max(m,d.id||0),0) + 1;
      kill.deaths.forEach(d => {
        hos.deaths.push({ id:nextId++, player:d.player, cause:d.cause||'Unknown',
          causeId:null, instance:raidCode, boss:kill.boss, description:null,
          date:kill.date, wipe:false });
      });
      changed = true;
      console.log(`⚰️  Hall of Shame : ${kill.deaths.length} mort(s)`);
    }

    // Screenshot du kill
    if (screenshotPath && fs.existsSync(screenshotPath)) {
      fs.mkdirSync(SS_DIR, { recursive:true });
      const ext   = path.extname(screenshotPath);
      const fname = `kill_${kill.boss.replace(/[^a-z0-9]/gi,'_')}_${Date.now()}${ext}`;
      fs.copyFileSync(screenshotPath, path.join(SS_DIR, fname));
      const nextSsId = hos.screenshots.reduce((m,s)=>Math.max(m,s.id||0),0) + 1;
      hos.screenshots.push({ id:nextSsId,
        title: `${kill.first?'First Kill':'Kill'} — ${kill.boss}`,
        player:null, description:kill.wipes>0?`${kill.wipes} wipe(s).`:null,
        date:kill.date, url:`assets/screenshots/${fname}`, type:'kill' });
      changed = true;
      console.log(`📷 Screenshot → assets/screenshots/${fname}`);
    }

    if (changed) saveData(HOS_FILE, 'HALL_OF_SHAME', hos);
  } catch(e) { console.error('⚠️  Hall of Shame :', e.message); }
}

// ── Screenshot matching ───────────────────────────────────────────────
const MATCH_WINDOW = 90 * 1000;

function findScreenshot(ts) {
  try {
    return fs.readdirSync(SCREENSHOTS)
      .filter(f=>/\.(png|jpg|jpeg)$/i.test(f))
      .map(f=>{ const p=path.join(SCREENSHOTS,f); return {path:p,mtime:fs.statSync(p).mtimeMs}; })
      .filter(f=>Math.abs(f.mtime-ts*1000)<=MATCH_WINDOW)
      .sort((a,b)=>Math.abs(a.mtime-ts*1000)-Math.abs(b.mtime-ts*1000))
      [0]?.path||null;
  } catch { return null; }
}

// ── Discord ───────────────────────────────────────────────────────────
function buildEmbed(kill, withImg) {
  const color  = RAID_COLORS[kill.raid]||0x9b59b6;
  const fields = [
    {name:'Raid',    value:kill.raid,                       inline:true},
    {name:'Date',    value:`${kill.date} · ${kill.hour}`,  inline:true},
    {name:'Joueurs', value:kill.players.join(' · '),        inline:false},
  ];
  if (kill.wipes>0)     fields.push({name:'Wipes',  value:String(kill.wipes),  inline:true});
  if (kill.durationSec) fields.push({name:'Durée',  value:
    `${Math.floor(kill.durationSec/60)}:${String(kill.durationSec%60).padStart(2,'0')}`, inline:true});
  const embed = {
    title: (kill.first?'🎉 FIRST KILL — ':'💀 Boss Kill — ')+kill.boss,
    color, fields,
    footer: {text:'LAN Du Swag • WotLK5man – Season1'},
    timestamp: new Date(kill.timestamp*1000).toISOString(),
  };
  if (withImg) embed.image = {url:'attachment://screenshot.png'};
  return embed;
}

async function discordPost(ss, embed) {
  const form = new FormData();
  if (ss && fs.existsSync(ss)) form.append('file', fs.createReadStream(ss), 'screenshot.png');
  form.append('payload_json', JSON.stringify({embeds:[embed]}));
  const res  = await fetch(WH_BASE+'?wait=true', {method:'POST',body:form});
  const data = await res.json();
  return data.id||null;
}

// ── Logique principale ────────────────────────────────────────────────
const GRACE = 5*60*1000;

async function handleKill(kill) {
  const id = `${kill.timestamp}_${kill.boss}`;
  if (posted.includes(id)) return;

  const ss  = findScreenshot(kill.timestamp);
  const age = Date.now()-kill.timestamp*1000;

  if (!ss && age<GRACE) {
    setTimeout(()=>handleKill(kill), 5000);
    return;
  }

  try {
    await discordPost(ss, buildEmbed(kill, !!ss));
    console.log(`✅ ${ss?'📸':'📝'} Discord : ${kill.boss}${kill.first?' [FIRST]':''}`);

    updateProgression(kill);
    updateRaidStats(kill);
    updateHallOfShame(kill, ss);
    gitPush();

    posted.push(id);
    saveJSON(POSTED_FILE, posted);
  } catch(e) { console.error('❌ handleKill :', e.message); }
}

// ── Combat log tail ───────────────────────────────────────────────────
let logPos = 0;

function initLogPos() {
  try { logPos = fs.statSync(COMBAT_LOG).size; }
  catch { logPos = 0; }
}

function readNewLines() {
  try {
    const size = fs.statSync(COMBAT_LOG).size;
    if (size<=logPos) return [];
    const fd = fs.openSync(COMBAT_LOG,'r');
    const buf = Buffer.alloc(size-logPos);
    fs.readSync(fd, buf, 0, buf.length, logPos);
    fs.closeSync(fd);
    logPos = size;
    return buf.toString('utf8').split('\n').filter(l=>l.trim());
  } catch { return []; }
}

// ── Watchers ──────────────────────────────────────────────────────────
console.log('🎮 LAN Kill Watcher — tracking complet');
console.log('   Combat log :', COMBAT_LOG);
console.log('   Screenshots:', SCREENSHOTS);
console.log('   Webhook    :', WEBHOOK.replace(/\/[^/]+$/,'/***'));
console.log('   Players    :', PLAYERS.join(', '));
console.log('');

initLogPos();

chokidar.watch(COMBAT_LOG, {ignoreInitial:true, awaitWriteFinish:{stabilityThreshold:200}})
  .on('add',    ()=>{ initLogPos(); })
  .on('change', ()=>{ processLogLines(readNewLines()); });

chokidar.watch(SCREENSHOTS, {ignoreInitial:true, awaitWriteFinish:{stabilityThreshold:1500}})
  .on('add', f=>{ if(/\.(png|jpg|jpeg)$/i.test(f)) console.log('📸 Screenshot:', path.basename(f)); });

setInterval(()=>processLogLines(readNewLines()), 30*1000);
