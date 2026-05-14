'use strict';

/*  Suite de tests — LAN Du Swag
    node run-tests.js
*/

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0, warned = 0;

function ok(label)   { console.log(`  ✅  ${label}`); passed++; }
function fail(label) { console.log(`  ❌  ${label}`); failed++; }
function warn(label) { console.log(`  ⚠️   ${label}`); warned++; }
function section(t)  { console.log(`\n── ${t} ${'─'.repeat(50 - t.length)}`); }

// ── Helpers ───────────────────────────────────────────────────────────
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function read(rel)   { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

function checkJs(rel) {
  try {
    execSync(`node --check "${path.join(ROOT, rel)}"`, { stdio:'pipe' });
    ok(`Syntaxe JS valide : ${rel}`);
  } catch(e) {
    fail(`Erreur syntaxe : ${rel}\n     ${e.stderr?.toString().trim()}`);
  }
}

// ── 1. Fichiers critiques ─────────────────────────────────────────────
section('Fichiers critiques');
const criticalFiles = [
  'index.html','swaggeurs.html','carte.html','progression.html',
  'hall-of-shame.html','stats.html','kill-tracker.html','rng.html',
  'strategies/index.html',
  'personnages/perso1.html','personnages/perso2.html',
  'personnages/perso3.html','personnages/perso4.html','personnages/perso5.html',
  'css/style.css',
  'js/layout.js','js/main.js','js/boss-maps.js','js/particles.js',
  'js/kill-tracker.js','js/rng-simulator.js','js/discord-widget.js',
  'js/rotation-visual.js','js/raid-stats.js','js/warcraftlogs.js',
  'data/raid-stats.js','data/warcraftlogs-config.js',
  'discord-bot/watcher.js','discord-bot/package.json',
  'wow-addon/LanKillTracker/LanKillTracker.lua',
  'wow-addon/LanKillTracker/LanKillTracker.toc',
];
criticalFiles.forEach(f => exists(f) ? ok(f) : fail(`MANQUANT : ${f}`));

// ── 2. Images ─────────────────────────────────────────────────────────
section('Images assets');
const requiredImgs = [
  'assets/img/map-azeroth.jpg','assets/img/map-northrend.jpg',
  'assets/img/LanDuSwag.png','assets/img/icons8-world-of-warcraft-48.png',
  'assets/img/classes-warlock-affliction.webp','assets/img/classes-mage-fire.webp',
  'assets/img/classes-paladin-holy.webp','assets/img/classes-paladin-protection.webp',
  'assets/img/goblin-rogue.png','assets/img/goblin-warrior.png','assets/img/gnome.png',
];
requiredImgs.forEach(f => exists(f) ? ok(f) : fail(`IMAGE MANQUANTE : ${f}`));

const optionalImgs = [
  'assets/img/talent-alban.png','assets/img/talent-eliott.png',
  'assets/img/talent-mael.png','assets/img/talent-tristan.png','assets/img/talent-fabien.png',
];
optionalImgs.forEach(f => exists(f) ? ok(f) : warn(`Talent non encore fourni : ${f}`));

// ── 3. Syntaxe JavaScript ─────────────────────────────────────────────
section('Syntaxe JavaScript');
[
  'js/layout.js','js/main.js','js/boss-maps.js','js/particles.js',
  'js/kill-tracker.js','js/rng-simulator.js','js/discord-widget.js',
  'js/rotation-visual.js','js/raid-stats.js','js/warcraftlogs.js',
  'discord-bot/watcher.js','discord-bot/test-kill.js',
].forEach(checkJs);

// ── 4. HTML — structure de base ───────────────────────────────────────
section('Structure HTML');
const htmlFiles = [
  'index.html','swaggeurs.html','carte.html','progression.html',
  'hall-of-shame.html','stats.html','kill-tracker.html','rng.html',
  'personnages/perso1.html','personnages/perso2.html',
  'personnages/perso3.html','personnages/perso4.html','personnages/perso5.html',
];
htmlFiles.forEach(f => {
  if (!exists(f)) return;
  const html = read(f);
  const label = f;
  if (!html.includes('<meta charset="UTF-8">'))         fail(`${label} : charset UTF-8 manquant`);
  else if (!html.includes('Layout.header('))             fail(`${label} : Layout.header() manquant`);
  else if (!html.includes('Layout.footer('))             fail(`${label} : Layout.footer() manquant`);
  else if (html.match(/[ÃÂ][^\s]/))                     fail(`${label} : caractères mojibake détectés`);
  else                                                    ok(`${label}`);
});

// ── 5. Liens internes HTML ────────────────────────────────────────────
section('Liens internes');
const linkRegex = /href="([^"#http][^"]+\.html)"/g;
htmlFiles.forEach(f => {
  if (!exists(f)) return;
  const html = read(f);
  const dir  = path.dirname(f);
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1];
    const full = path.join(dir, href);
    if (!exists(full)) warn(`${f} → lien mort : ${href}`);
  }
});
ok('Vérification liens terminée');

// ── 6. Config bot ─────────────────────────────────────────────────────
section('Configuration bot Discord');
try {
  const cfg = JSON.parse(read('discord-bot/config.json'));
  cfg.wowPath    ? ok(`wowPath : ${cfg.wowPath}`) : fail('wowPath vide dans config.json');
  cfg.webhookUrl && cfg.webhookUrl.includes('discord.com')
    ? ok(`webhookUrl configuré`) : fail('webhookUrl invalide');
  cfg.players && cfg.players.length === 5
    ? ok(`players : ${cfg.players.join(', ')}`) : warn('players non définis dans config.json');

  const wowExists = fs.existsSync(cfg.wowPath);
  wowExists ? ok(`Dossier WoW trouvé`) : fail(`Dossier WoW introuvable : ${cfg.wowPath}`);

  if (wowExists) {
    const addonPath = path.join(cfg.wowPath, 'Interface', 'AddOns', 'LanKillTracker');
    fs.existsSync(addonPath) ? ok('Addon installé dans WoW') : fail('Addon non installé dans WoW/Interface/AddOns/');

    const screenPath = path.join(cfg.wowPath, 'Screenshots');
    fs.existsSync(screenPath) ? ok('Dossier Screenshots existe') : warn('Dossier Screenshots absent (créé au premier screenshot)');
  }
} catch(e) {
  fail('config.json illisible : ' + e.message);
}

// ── 7. Node modules bot ───────────────────────────────────────────────
section('Dépendances bot (node_modules)');
['chokidar','node-fetch','form-data'].forEach(pkg => {
  exists(`discord-bot/node_modules/${pkg}`)
    ? ok(`${pkg} installé`) : fail(`${pkg} manquant — relance npm install dans discord-bot/`);
});

// ── 8. .gitignore ─────────────────────────────────────────────────────
section('Sécurité .gitignore');
const gitignore = read('.gitignore');
['data/secrets.js','discord-bot/config.json','discord-bot/node_modules/'].forEach(entry => {
  gitignore.includes(entry)
    ? ok(`.gitignore contient ${entry}`) : fail(`.gitignore MANQUE : ${entry}`);
});
exists('data/secrets.js')
  ? ok('data/secrets.js présent localement')
  : warn('data/secrets.js absent — le Kill Tracker web ne pourra pas poster');

// ── 9. Simulation kill bot ────────────────────────────────────────────
section('Simulation kill bot (test rapide)');
try {
  const cfg      = JSON.parse(read('discord-bot/config.json'));
  const logPath  = path.join(cfg.wowPath, 'Logs', 'WoWCombatLog.txt');
  const ssDir    = path.join(cfg.wowPath, 'Screenshots');
  const now      = new Date();
  const dateStr  = `${now.getMonth()+1}/${now.getDate()} ${now.toTimeString().slice(0,8)}.000`;
  const logLine  = `${dateStr}  ENCOUNTER_END,624,"Test Boss",9,5,1\n`;
  fs.mkdirSync(path.dirname(logPath), { recursive:true });
  fs.appendFileSync(logPath, logLine);
  ok('Ligne ENCOUNTER_END écrite dans WoWCombatLog.txt');

  const ssPath = path.join(ssDir, `test_suite_${Date.now()}.jpg`);
  const srcImg = path.join(ROOT, 'assets', 'img', 'map-azeroth.jpg');
  fs.mkdirSync(ssDir, { recursive:true });
  fs.copyFileSync(srcImg, ssPath);
  fs.utimesSync(ssPath, now, now);
  ok('Screenshot de test créé dans Screenshots/');
} catch(e) {
  fail('Simulation kill : ' + e.message);
}

// ── Résumé ────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(54));
console.log(`  RÉSULTAT : ${passed} ✅  ${failed} ❌  ${warned} ⚠️`);
console.log('═'.repeat(54));
if (failed === 0 && warned === 0) console.log('  Tout est parfait !');
else if (failed === 0)            console.log('  Aucune erreur critique. Quelques avertissements à traiter.');
else                              console.log('  Des erreurs critiques nécessitent attention.');
