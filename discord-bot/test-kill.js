'use strict';

/*
  Script de test — simule un boss kill sans lancer WoW.
  Lance le watcher (start.bat) en premier, puis exécute ce script :
    node test-kill.js
*/

const fs   = require('fs');
const path = require('path');

const cfg  = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const WOW  = cfg.wowPath.replace(/\\/g, '/');

const COMBAT_LOG  = path.join(WOW, 'Logs', 'WoWCombatLog.txt');
const SCREENSHOTS = path.join(WOW, 'Screenshots');

// Boss à simuler (doit être dans la liste BOSS_RAID du watcher)
const BOSS = process.argv[2] || 'The Lich King';

// Ligne ENCOUNTER_END au format WoW combat log
const now    = new Date();
const dateStr = `${now.getMonth()+1}/${now.getDate()} ${now.toTimeString().slice(0,8)}.000`;
const line   = `${dateStr}  ENCOUNTER_END,624,"${BOSS}",9,5,1\n`;

// 1. Écrit dans le combat log
fs.mkdirSync(path.dirname(COMBAT_LOG), { recursive: true });
fs.appendFileSync(COMBAT_LOG, line, 'utf8');
console.log(`📜 Combat log : ENCOUNTER_END "${BOSS}" écrit`);

// 2. Copie une image de test dans Screenshots (n'importe quelle image du projet)
const testImg = path.join(__dirname, '..', 'assets', 'img', 'map-northrend.jpg');
const destImg = path.join(SCREENSHOTS, `WoWScrnShot_test_${Date.now()}.jpg`);
fs.mkdirSync(SCREENSHOTS, { recursive: true });
fs.copyFileSync(testImg, destImg);
fs.utimesSync(destImg, now, now);   // force la date à maintenant (comme WoW le ferait)
console.log(`📸 Screenshot : ${path.basename(destImg)} copié`);

console.log('');
console.log('✅ Kill simulé ! Le watcher devrait poster sur Discord dans quelques secondes.');
