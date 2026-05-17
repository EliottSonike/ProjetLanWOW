#!/usr/bin/env node
/**
 * LAN Du Swag — WoW Items Database Builder
 * ==========================================
 * Usage:
 *   node tools/fetch-items.js add <id>           → ajouter un item par ID
 *   node tools/fetch-items.js verify             → vérifier tous les items de la DB
 *   node tools/fetch-items.js check-bis          → vérifier les IDs dans les HTML perso
 *   node tools/fetch-items.js scan <from> <to>   → scanner une plage d'IDs (épiques/légendaires)
 */

'use strict';
const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const DB_PATH  = path.join(__dirname, '..', 'data', 'wow-items.json');
const HTML_DIR = path.join(__dirname, '..', 'personnages');

// Slot map: WoW slot ID → slug lisible
const SLOT_MAP = {
  0: 'non-équipable', 1: 'head', 2: 'neck', 3: 'shoulders', 4: 'shirt',
  5: 'chest', 6: 'waist', 7: 'legs', 8: 'feet', 9: 'wrists', 10: 'hands',
  11: 'finger', 12: 'finger', 13: 'trinket', 14: 'trinket', 15: 'back',
  16: 'mainhand', 17: 'offhand', 18: 'ranged', 19: 'tabard', 20: 'chest',
  21: 'mainhand', 22: 'offhand', 23: 'offhand', 24: 'ammo', 25: 'thrown',
  26: 'ranged', 28: 'relique'
};

const QUALITY = { 4: 'Épique', 5: 'Légendaire' };

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function fetchItem(id) {
  return new Promise((resolve, reject) => {
    const url = `https://www.wowhead.com/wotlk/item=${id}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        const name    = (body.match(/"name":"([^"]+)"/) || [])[1];
        const quality = parseInt((body.match(/"quality":(\d+)/) || [])[1] || '0');
        const ilvl    = parseInt((body.match(/"level":(\d+)/) || [])[1] || '0');
        const slot    = parseInt((body.match(/"slot":(\d+)/) || [])[1] || '0');
        const source  = (body.match(/"sourceText":"([^"]+)"/) || [])[1] || '';
        if (!name) { reject(new Error(`Item ${id} not found`)); return; }
        resolve({ id: String(id), name, quality, ilvl, slot: SLOT_MAP[slot] || `slot_${slot}`, source });
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Commandes ───────────────────────────────────────────────────────────────

async function cmdAdd(id) {
  console.log(`Fetching item ${id}...`);
  const item = await fetchItem(id);
  console.log(`  ${item.name} | ${QUALITY[item.quality] || `quality_${item.quality}`} | slot: ${item.slot} | ilvl: ${item.ilvl}`);
  if (item.quality < 4) { console.log('  ⚠️  Pas épique/légendaire, ignoré.'); return; }
  const db = loadDB();
  const section = item.quality === 5 ? 'legendaries' : 'epics.wotlk_icc25hm';
  if (item.quality === 5) {
    db.legendaries[id] = { name: item.name, slot: item.slot, quality: item.quality, ilvl: item.ilvl, expansion: '?', source: item.source, note: '' };
  } else {
    db.epics.wotlk_icc25hm[id] = { name: item.name, slot: item.slot, ilvl: item.ilvl, source: item.source, note: '' };
  }
  saveDB(db);
  console.log(`  ✅ Ajouté dans la DB (${section})`);
}

async function cmdVerify() {
  const db    = loadDB();
  const items = { ...db.legendaries, ...db.epics.wotlk_icc25hm };
  const ids   = Object.keys(items);
  console.log(`\nVérification de ${ids.length} items...\n`);
  let ok = 0, wrong = 0, errors = 0;

  for (const id of ids) {
    await sleep(300);
    try {
      const fetched = await fetchItem(id);
      const stored  = items[id];
      const nameMatch = fetched.name === stored.name;
      const slotMatch = fetched.slot === stored.slot;
      if (nameMatch && slotMatch) {
        console.log(`  ✅  ${id}: ${stored.name}`);
        ok++;
      } else {
        console.log(`  ❌  ${id}: stored="${stored.name}/${stored.slot}" | wowhead="${fetched.name}/${fetched.slot}"`);
        wrong++;
      }
    } catch(e) {
      console.log(`  ⚠️  ${id}: ERREUR — ${e.message}`);
      errors++;
    }
  }
  console.log(`\n✅ ${ok} correct | ❌ ${wrong} erreurs | ⚠️  ${errors} inaccessibles`);
}

async function cmdCheckBis() {
  const db    = loadDB();
  const allDb = { ...db.legendaries };
  Object.values(db.epics).forEach(section => Object.assign(allDb, typeof section === 'object' && !section._info ? {} : section));
  Object.values(db.epics).forEach(section => { if (typeof section === 'object') Object.assign(allDb, section); });

  const htmlFiles = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.html'));
  let totalOk = 0, totalWrong = 0;

  for (const file of htmlFiles) {
    const html   = fs.readFileSync(path.join(HTML_DIR, file), 'utf8');
    const matches = [...html.matchAll(/item=(\d+)[^>]*>([^<]+)<\/a>[^<]*<\/div>\s*<span class="equip-slot-label">([^<]+)<\/span>/g)];
    if (!matches.length) continue;
    console.log(`\n── ${file} ──`);

    for (const m of matches) {
      const [, id, name, slotLabel] = m;
      const dbItem = allDb[id];
      if (!dbItem) {
        console.log(`  ⚠️  ${id} "${name}" (${slotLabel}) — pas dans la DB`);
        continue;
      }
      if (dbItem.name !== name && !dbItem.name.startsWith(name.replace(/\s*\(T10\)/, ''))) {
        console.log(`  ❌  ${id} "${name}" STOCKÉ="${dbItem.name}" (${slotLabel})`);
        totalWrong++;
      } else {
        totalOk++;
      }
    }
  }
  console.log(`\n✅ ${totalOk} items OK | ⚠️ ${totalWrong} potentiellement incorrects`);
}

async function cmdScan(from, to) {
  console.log(`\nScan items ${from}→${to} (épiques/légendaires uniquement)...\n`);
  const db = loadDB();
  let found = 0;

  for (let id = parseInt(from); id <= parseInt(to); id++) {
    await sleep(250);
    try {
      const item = await fetchItem(id);
      if (item.quality >= 4) {
        console.log(`  FOUND ${id}: ${QUALITY[item.quality] || 'epic'} — "${item.name}" | slot=${item.slot} | ilvl=${item.ilvl}`);
        found++;
        // Auto-save
        if (item.quality === 5) {
          db.legendaries[id] = { name: item.name, slot: item.slot, quality: 5, ilvl: item.ilvl, expansion: 'auto', source: item.source };
        } else {
          if (!db.epics.scan_results) db.epics.scan_results = { _info: 'Résultats de scan automatique' };
          db.epics.scan_results[id] = { name: item.name, slot: item.slot, ilvl: item.ilvl, source: item.source };
        }
        if (found % 10 === 0) saveDB(db);
      }
    } catch {}
  }
  saveDB(db);
  console.log(`\nScan terminé: ${found} items épiques/légendaires trouvés dans ${to - from + 1} IDs`);
}

// ── Main ───────────────────────────────────────────────────────────────────
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'add':       cmdAdd(args[0]).catch(console.error); break;
  case 'verify':    cmdVerify().catch(console.error);     break;
  case 'check-bis': cmdCheckBis().catch(console.error);   break;
  case 'scan':      cmdScan(args[0], args[1]).catch(console.error); break;
  default:
    console.log(`
WoW Items DB — Commandes:
  node tools/fetch-items.js add <id>           Ajouter un item
  node tools/fetch-items.js verify             Vérifier tous les items de la DB
  node tools/fetch-items.js check-bis          Vérifier les IDs dans les HTML
  node tools/fetch-items.js scan <from> <to>   Scanner une plage (ex: scan 50300 50800)
    `);
}
