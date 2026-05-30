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

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const fs         = require('fs');
const path       = require('path');
const vm         = require('vm');
const zlib       = require('zlib');

// ── Config ────────────────────────────────────────────────────────────
const PORT   = process.env.PORT   || 3001;
const SECRET = process.env.SECRET;
if (!SECRET) { console.error('❌  Variable SECRET non définie — arrêt du serveur.'); process.exit(1); }
const DATA   = path.join(__dirname, 'data');
const STATIC = path.join(__dirname, '..', 'data');

const VIEWER_LIVE_URL = 'https://wow.zamimg.com/modelviewer/live/viewer/viewer.min.js';

const PAKO_PATCH = `function patchPako(obj,depth){
    if(depth>4||!obj||typeof obj!=='object'||obj.__pakoPatched)return;
    if(obj.inflate&&obj.inflateRaw&&obj.Inflate){
      obj.__pakoPatched=true;
      var orig=obj.inflate.bind(obj);
      obj.inflate=function(d,o){
        try{return orig(d,o);}
        catch(e){try{return obj.inflateRaw(d,o||{});}catch(e2){return d instanceof Uint8Array?d:new Uint8Array(0);}}
      };
      console.log('[PATCH] pako inflate patched');
    }
    Object.keys(obj).forEach(function(k){try{patchPako(obj[k],depth+1);}catch(e){}});
  }
  setTimeout(function(){patchPako(window,0);},50);`;

// ── App setup ─────────────────────────────────────────────────────────
const app = express();

app.use(helmet());

const ALLOWED_ORIGINS = [
  'https://lansduswag.site',
  'https://www.lansduswag.site',
  /^http:\/\/localhost(:\d+)?$/,
];
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // same-origin / curl
    const ok = ALLOWED_ORIGINS.some(o => o instanceof RegExp ? o.test(origin) : o === origin);
    cb(ok ? null : Object.assign(new Error('CORS'), { status: 403 }), ok);
  },
}));

app.use(express.json({ limit: '2mb' }));

// ── Rate limits ───────────────────────────────────────────────────────
const readLimit  = rateLimit({ windowMs: 60_000, max: 60,  standardHeaders: true, legacyHeaders: false });
const proxyLimit = rateLimit({ windowMs: 60_000, max: 30,  standardHeaders: true, legacyHeaders: false });
const writeLimit = rateLimit({ windowMs: 60_000, max: 20,  standardHeaders: true, legacyHeaders: false });

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

// ── viewer wotlk5.com — servi depuis le filesystem (pas de fetch réseau) ──
const VIEWER_WOTLK5_FILE = path.join(__dirname, '..', 'wow-assets', 'viewer', 'viewer-wotlk5-raw.min.js');
let viewerWotlk5Cache = null;
app.get('/wow-assets/viewer/viewer-wotlk5.min.js', (req, res) => {
  try {
    if (!viewerWotlk5Cache) {
      const raw = fs.readFileSync(VIEWER_WOTLK5_FILE, 'utf8');
      viewerWotlk5Cache = PAKO_PATCH + '\n' + raw;
      console.log('✅ viewer-wotlk5.min.js chargé depuis filesystem (' + Math.round(raw.length/1024) + ' KB)');
    }
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(viewerWotlk5Cache);
  } catch(e) {
    console.error('❌ viewer-wotlk5:', e.message);
    res.status(500).send('// Error: ' + e.message);
  }
});

// ── viewer LIVE (character type, textures composées, format retail) ──
let viewerLiveCache = null;
let viewerLiveCacheTime = 0;
app.get('/wow-assets/viewer/viewer-live.min.js', async (req, res) => {
  try {
    const now = Date.now();
    if (!viewerLiveCache || now - viewerLiveCacheTime > 3600000) {
      const r = await fetch(VIEWER_LIVE_URL);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      let code = await r.text();

      // inflate+P fix + BBox fix (même logique que classic, sans décimation de vertices)
      const inflateTarget = 'try{G=Mh(z)}catch(t){return void console.log("Decompression error: "+t)}';
      const inflatePatchLive = `try{G=Mh(z)}catch(_e1){var _found=false;var _buf=new Uint8Array(z.buffer);var _off=z.byteOffset||0;for(var _j=Math.max(0,_off-200);_j<=_off;_j++){if(_buf[_j]===0x78&&(_buf[_j+1]===0x9c||_buf[_j+1]===0xda||_buf[_j+1]===0x01||_buf[_j+1]===0x5e)){try{G=Mh(new Uint8Array(z.buffer,_j));_found=true;P=new DataView(z.buffer).getUint32(_j-4,true);console.log("inflate+P fixed at -"+(_off-_j)+", P="+P);break;}catch(_e2){}}}if(!_found){return void console.log("Decompression error: "+_e1);}}if(G){var _fDv=new DataView(z.buffer),_gDv=new DataView(G.buffer);var _mOff=_fDv.getUint32(76,true);if(_mOff>0&&_mOff+56<=G.length){var _f0=_gDv.getFloat32(_mOff,true);if(isNaN(_f0)||Math.abs(_f0)<1e-10){var _bb=[-0.5,0,-0.5,0.5,2.0,0.5,1.3,-0.5,0,-0.5,0.5,2.0,0.5,1.3];for(var _bi=0;_bi<14;_bi++)_gDv.setFloat32(_mOff+_bi*4,_bb[_bi],true);console.log("[PATCH] BBox fixed at d"+_mOff);}}}var _iOff=_fDv.getUint32(12,true),_sOff=_fDv.getUint32(16,true);var _origV=_gDv.getInt32(_iOff,true);var _MAX_V=15000;if(_origV>_MAX_V){var _origI=_gDv.getInt32(_sOff,true),_filtI=[];var _sBase=_sOff+4;for(var _ti=0;_ti<_origI;_ti+=3){var _a=_gDv.getUint16(_sBase+_ti*2,true),_b=_gDv.getUint16(_sBase+(_ti+1)*2,true),_c=_gDv.getUint16(_sBase+(_ti+2)*2,true);if(_a<_MAX_V&&_b<_MAX_V&&_c<_MAX_V){_filtI.push(_a,_b,_c);}}var _nBuf=new Uint8Array(G.length);_nBuf.set(G);var _nDv=new DataView(_nBuf.buffer);_nDv.setInt32(_iOff,_MAX_V,true);_nDv.setInt32(_sOff,_filtI.length,true);for(var _fi=0;_fi<_filtI.length;_fi++)_nDv.setUint16(_sBase+_fi*2,_filtI[_fi],true);G=_nBuf;console.log("[PATCH-LIVE] Decimated "+_origV+"->"+_MAX_V);}`;
      const patchedInflate = code.replace(inflateTarget, inflatePatchLive);
      if (patchedInflate !== code) {
        code = patchedInflate;
        console.log('✅ viewer-live: inflate+P+BBox patché');
      } else {
        console.log('⚠️ viewer-live: inflate target non trouvé');
      }

      // Patches rn bounds-safe (wotlk5 mo3 = 25 sections vs 35 attendues)
      const rnPatches = [
        ['getUint32(){var t=this.buffer.getUint32(this.position,!0);return this.position+=4,t}',
         'getUint32(){if(this.position+4>this.buffer.byteLength)return this.position+=4,0;var t=this.buffer.getUint32(this.position,!0);return this.position+=4,t}'],
        ['getInt32(){var t=this.buffer.getInt32(this.position,!0);return this.position+=4,t}',
         'getInt32(){if(this.position+4>this.buffer.byteLength)return this.position+=4,0;var t=this.buffer.getInt32(this.position,!0);return this.position+=4,t}'],
        ['getFloat(){var t=this.buffer.getFloat32(this.position,!0);return this.position+=4,t}',
         'getFloat(){if(this.position+4>this.buffer.byteLength)return this.position+=4,0;var t=this.buffer.getFloat32(this.position,!0);return this.position+=4,t}'],
        ['getUint16(){var t=this.buffer.getUint16(this.position,!0);return this.position+=2,t}',
         'getUint16(){if(this.position+2>this.buffer.byteLength)return this.position+=2,0;var t=this.buffer.getUint16(this.position,!0);return this.position+=2,t}'],
        ['getUint8(){var t=this.buffer.getUint8(this.position);return this.position+=1,t}',
         'getUint8(){if(this.position+1>this.buffer.byteLength)return this.position+=1,0;var t=this.buffer.getUint8(this.position);return this.position+=1,t}'],
      ];
      let rnOk = 0;
      for (const [target, replacement] of rnPatches) {
        const prev = code;
        code = code.replace(target, replacement);
        if (code !== prev) rnOk++;
      }
      console.log(`✅ viewer-live patches rn (${rnOk}/5 méthodes)`);
      viewerLiveCache = PAKO_PATCH + '\n' + code;
      viewerLiveCacheTime = now;
      console.log('✅ viewer-live.min.js cached (' + Math.round(code.length/1024) + ' KB)');
    }
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(viewerLiveCache);
  } catch(e) {
    res.status(502).send('// Error: ' + e.message);
  }
});

// ── Mo3 files avec bounding box patchée ──────────────────────────────
// Le format wotlk5 (116-byte header) a la section 'm' (bounding box)
// pointant sur de la data incorrecte → floats NaN → frustum dégénéré → tout transparent.
// On décompresse, patch les 14 floats, recompresse et cache.
const MO3_DIR   = path.join(__dirname, '..', 'wow-assets', 'mo3');
const MO3_MAX   = 200; // entrées max en mémoire
const mo3Cache  = new Map();
const GNOME_BBOX = [-0.5, 0, -0.5, 0.5, 2.0, 0.5, 1.3,
                    -0.5, 0, -0.5, 0.5, 2.0, 0.5, 1.3]; // 14 floats

async function getMo3Raw(id) {
  const filepath = path.join(MO3_DIR, id + '.mo3');
  if (fs.existsSync(filepath)) return fs.readFileSync(filepath);
  // Téléchargement depuis wotlk5.com si fichier absent
  console.log(`[mo3] Téléchargement ${id}.mo3 depuis wotlk5.com...`);
  const r = await fetch(`https://wotlk5.com/armory/data/mo3/${id}.mo3`);
  if (!r.ok) throw new Error('wotlk5 ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  console.log(`[mo3] ${id}.mo3 téléchargé (${Math.round(buf.length/1024)}KB)`);
  return buf;
}

app.get('/wow-assets/mo3/:id([0-9]+).mo3', proxyLimit, async (req, res) => {
  const id = req.params.id;
  const headers = {
    'Content-Type':  'application/octet-stream',
    'Cache-Control': 'public, max-age=86400',
  };
  if (mo3Cache.has(id)) { res.set(headers); return res.send(mo3Cache.get(id)); }

  let raw;
  try { raw = await getMo3Raw(id); }
  catch(e) { console.error('[mo3] Erreur:', e.message); return res.status(404).end(); }

  // Find zlib header (always at 116 for wotlk5 format)
  let zlibOff = -1;
  for (let i = 0; i < 300 && i < raw.length - 1; i++) {
    if (raw[i] === 0x78 && (raw[i+1]===0x9c||raw[i+1]===0xda||raw[i+1]===0x01||raw[i+1]===0x5e)) {
      zlibOff = i; break;
    }
  }
  if (zlibOff === -1) { mo3CacheSet(id, raw); res.set(headers); return res.send(raw); }

  const mDataOff = raw.readUInt32LE(76); // section m offset in decompressed data

  let decompressed;
  try { decompressed = zlib.inflateSync(raw.slice(zlibOff)); }
  catch { mo3CacheSet(id, raw); res.set(headers); return res.send(raw); }

  // Patch bounding box if floats are NaN or ~0
  const f0 = decompressed.readFloatLE(mDataOff);
  if (isNaN(f0) || Math.abs(f0) < 1e-10) {
    let off = mDataOff;
    for (const v of GNOME_BBOX) { decompressed.writeFloatLE(v, off); off += 4; }
    console.log(`✅ BBox patched: mo3/${id} at d${mDataOff}`);
  }

  // Recompress + assemble: original 116-byte header + new zlib
  const newZlib = zlib.deflateSync(decompressed);
  const newBuf  = Buffer.alloc(zlibOff + newZlib.length);
  raw.copy(newBuf, 0, 0, zlibOff);
  newZlib.copy(newBuf, zlibOff);

  mo3CacheSet(id, newBuf);
  res.set(headers);
  res.send(newBuf);
});

function mo3CacheSet(id, buf) {
  if (mo3Cache.size >= MO3_MAX) mo3Cache.delete(mo3Cache.keys().next().value); // evict oldest
  mo3Cache.set(id, buf);
}

// ── GET ───────────────────────────────────────────────────────────────
app.get('/api/health',      readLimit, (_, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/progression', readLimit, (_, res) => res.json(load('progression.json', {})));
app.get('/api/stats',       readLimit, (_, res) => res.json(load('stats.json', {})));
app.get('/api/shame',       readLimit, (_, res) => res.json(load('shame.json', {})));

// ── Proxy assets 3D viewer wotlk5.com (mo3, meta…) ──────────────────
app.get('/api/wow-asset/*', proxyLimit, async (req, res) => {
  const assetPath = req.params[0];
  try {
    const url = `https://wotlk5.com/armory/data/${assetPath}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer':    'https://wotlk5.com/',
        'Origin':     'https://wotlk5.com',
      }
    });
    if (!r.ok) return res.status(r.status).end();
    const buf = await r.arrayBuffer();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buf));
  } catch(e) {
    res.status(502).json({ error: e.message });
  }
});

// ── Proxy armory wotlk5.com (contourne CORS) — cache 5 min ──────────
const armoryCache = new Map();
const ARMORY_CACHE_TTL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of armoryCache) {
    if (now - val.ts >= ARMORY_CACHE_TTL) armoryCache.delete(key);
  }
}, ARMORY_CACHE_TTL).unref();

app.get('/api/armory', proxyLimit, async (req, res) => {
  const { realm, char } = req.query;
  if (!realm || !char) return res.status(400).json({ error: 'realm et char requis' });
  const key = `${realm}|${char}`;
  const cached = armoryCache.get(key);
  if (cached && Date.now() - cached.ts < ARMORY_CACHE_TTL) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.html);
  }
  try {
    const url = `https://wotlk5.com/armory/character/${encodeURIComponent(realm)}/${encodeURIComponent(char)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await r.text();
    armoryCache.set(key, { html, ts: Date.now() });
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Cache', 'MISS');
    res.send(html);
  } catch(e) {
    res.status(502).json({ error: e.message });
  }
});

// ── POST /api/kill ────────────────────────────────────────────────────
app.post('/api/kill', writeLimit, auth, (req, res) => {
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
app.post('/api/reset', writeLimit, auth, (req, res) => {
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

// ── Global error handler ──────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err.status === 403 || err.message === 'CORS') return res.status(403).json({ error: 'CORS policy' });
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
});

// ── Start + graceful shutdown ─────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🚀 LAN Du Swag API — port ${PORT}`);
  console.log(`   GET  /api/progression`);
  console.log(`   GET  /api/stats`);
  console.log(`   GET  /api/shame`);
  console.log(`   POST /api/kill  (Bearer auth)`);
});

function shutdown(signal) {
  console.log(`\n${signal} reçu — arrêt propre...`);
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
