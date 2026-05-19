'use strict';

/*
  Génère un combat log WotLK réaliste pour tester le pipeline complet.
  Simule : 1 wipe + 1 kill sur Archavon (VoA — 1er raid Phase 1)

  Usage : node test-combat-log.js
  (watcher doit être démarré dans un autre terminal : start.bat)
*/

const fs   = require('fs');
const path = require('path');

const cfg    = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const WOW    = cfg.wowPath.replace(/\\/g, '/');
const LOG    = path.join(WOW, 'Logs', 'WoWCombatLog.txt');
const SS_DIR = path.join(WOW, 'Screenshots');
const SS_SRC = path.join(__dirname, '..', 'assets', 'img', 'map-northrend.jpg');

// ── Données du fight ──────────────────────────────────────────────────
const ENC_ID   = 954;
const BOSS     = 'Archavon the Stone Watcher';
const RAID     = 'Vault of Archavon';
const DIFF     = 14;   // custom 5-man

// Personnages → sort principal, dégâts moyens, intervalle (sec), type
const SPECS = {
  Krapule: { spell:'Fireball',               dmg:19500, interval:2.8, type:'dmg'  },
  Fripon:   { spell:'Shadow Bolt',            dmg:16000, interval:3.0, type:'dmg'  },
  Fabien:  { spell:'Aimed Shot',             dmg:13500, interval:2.5, type:'dmg'  },
  Mael:    { spell:'Shield of Righteousness',dmg:7800,  interval:3.5, type:'tank' },
  Filou:   { spell:'Holy Light',             hps:27000, interval:2.3, type:'heal' },
};

// ── Helpers ───────────────────────────────────────────────────────────
function ts(ms) {
  const d = new Date(ms);
  const m = d.getMonth()+1, day = d.getDate();
  const h = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  const s  = String(d.getSeconds()).padStart(2,'0');
  const ms3 = String(d.getMilliseconds()).padStart(3,'0');
  return `${m}/${day} ${h}:${mi}:${s}.${ms3}`;
}

function jitter(base, range=300) { return base + Math.round(Math.random()*range - range/2); }
function rng(min, max) { return Math.round(min + Math.random()*(max-min)); }

// ── Générateur d'events ───────────────────────────────────────────────
function generateFight(startMs, durationMs, success) {
  const events = [];
  const endMs  = startMs + durationMs;

  events.push({ t:startMs, line:`${ts(startMs)}  ENCOUNTER_START,${ENC_ID},"${BOSS}",${DIFF},5` });

  // Génère les événements de combat pour chaque joueur
  for (const [char, spec] of Object.entries(SPECS)) {
    let t = startMs + rng(500, 1500);
    while (t < endMs - 2000) {
      if (spec.type === 'heal') {
        // Soin sur Mael (tank)
        const amt = rng(spec.hps * spec.interval * 0.8, spec.hps * spec.interval * 1.2);
        events.push({ t, line:
          `${ts(t)}  SPELL_HEAL,0x1,${char},0x512,0x0,0x3,Mael,0x512,0x0,` +
          `1020,"${spec.spell}",2,${amt},0,0,nil`
        });
      } else {
        // Dégâts sur le boss
        const amt = rng(spec.dmg * 0.75, spec.dmg * 1.35);
        events.push({ t, line:
          `${ts(t)}  SPELL_DAMAGE,0x1,${char},0x512,0x0,0x2,"${BOSS}",0x40A,0x0,` +
          `133,"${spec.spell}",4,${amt},0,4,0,0,0,nil,nil,nil`
        });
      }
      t += jitter(spec.interval * 1000, 400);
    }
  }

  // Mort d'Fripon (sur le kill uniquement) — Stonegrip 3s avant la fin
  if (success === 1) {
    const deathT = endMs - 3000;
    events.push({ t: deathT, line:
      `${ts(deathT)}  SPELL_DAMAGE,0x2,"${BOSS}",0x40A,0x0,0x5,Fripon,0x512,0x0,` +
      `58965,"Stonegrip",1,480000,350000,1,0,0,0,nil,nil,nil`
    });
    events.push({ t: deathT + 300, line:
      `${ts(deathT+300)}  UNIT_DIED,0x2,"${BOSS}",0x40A,0x0,0x5,Fripon,0x512,0x0,42,nil`
    });
  }

  // ENCOUNTER_END
  events.push({ t:endMs, line:`${ts(endMs)}  ENCOUNTER_END,${ENC_ID},"${BOSS}",${DIFF},5,${success}` });

  // Trie par timestamp et retourne le texte
  return events.sort((a,b)=>a.t-b.t).map(e=>e.line).join('\n') + '\n';
}

// ── Construction du log complet ───────────────────────────────────────
const now = Date.now();

console.log(`\n🎮 Simulation — ${RAID} (${BOSS})`);
console.log('   Wipe  : 2 min de combat');
console.log('   Kill  : 4 min de combat, 1 mort (Fripon — Stonegrip)');
console.log('   Boss  : 1st kill\n');

// Wipe — 2 min
const wipeStart = now + 500;
const wipeLog   = generateFight(wipeStart, 120_000, 0);

// Kill — 4 min (commence 30s après le wipe)
const killStart = wipeStart + 120_000 + 30_000;
const killLog   = generateFight(killStart, 240_000, 1);

// Écrit tout dans le combat log
fs.mkdirSync(path.dirname(LOG), { recursive: true });
fs.appendFileSync(LOG, wipeLog + '\n' + killLog, 'utf8');

const wipeEvts = wipeLog.split('\n').filter(Boolean).length;
const killEvts = killLog.split('\n').filter(Boolean).length;
console.log(`📜 Combat log : ${wipeEvts} lignes (wipe) + ${killEvts} lignes (kill)`);

// Screenshot horodaté à l'heure du kill dans le log simulé
const ssPath   = path.join(SS_DIR, `WoWScrnShot_voa_archavon_${Date.now()}.jpg`);
const killDate = new Date(killStart + 240_000);
fs.mkdirSync(SS_DIR, { recursive: true });
fs.copyFileSync(SS_SRC, ssPath);
fs.utimesSync(ssPath, killDate, killDate);
console.log(`📸 Screenshot créé (horodaté au kill)`);

// Stats attendues
const killDurSec = 240;
const stats = {};
for (const [char, spec] of Object.entries(SPECS)) {
  const events = Math.floor(killDurSec / spec.interval);
  if (spec.type === 'heal') {
    stats[char] = { hps: Math.round(spec.hps * 0.975), type: 'heal' };
  } else {
    const avgDmg = spec.dmg * 1.05;
    stats[char] = { dps: Math.round(avgDmg * events / killDurSec), type: spec.type };
  }
}

console.log('\n📊 Stats attendues (approximatives) :');
for (const [c, s] of Object.entries(stats)) {
  if (s.type === 'heal') console.log(`   Filou (Tristan) : ~${s.hps} HPS`);
  else console.log(`   ${c.padEnd(8)} : ~${s.dps} DPS`);
}
console.log('\n✅ Données envoyées ! Vérifie la console du watcher.');
