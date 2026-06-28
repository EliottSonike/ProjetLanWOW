# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LAN Du Swag** — site fan WoW WotLK pour une LAN party de 5 joueurs (Alban/Warlock, Eliott/Mage, Fabien/Hunter, Maël/Paladin Prot, Tristan/Paladin Holy). Déployé sur `lansduswag.site`.

## Architecture

Three separate processes run in production:

```
nginx (Docker)          — sert les fichiers statiques + proxie /api/ et /wow-assets*/
Express API (PM2)       — api/server.js sur port 3001
Discord Bot (optionnel) — discord-bot/watcher.js, surveille screenshots + combat log WoW
```

**Deploy** : push sur `master` → GitHub Actions (self-hosted runner) → `rsync` vers `/home/eliott/monsite/` → remplace `__CACHE_BUST__` dans `layout.js` par un timestamp Unix → `pm2 restart lan-api` + `nginx -s reload`.

## Running Locally

```bash
# API (nécessite la variable SECRET)
cd api && npm install
SECRET=dev PORT=3001 npm run dev   # node --watch

# Discord bot (nécessite config.json)
cd discord-bot && npm install
cp config.example.json config.json  # puis remplir les champs
node watcher.js

# Outil items DB
node tools/fetch-items.js scan 50000 51000   # scanner une plage Wowhead
node tools/fetch-items.js add 49623          # ajouter un item
node tools/fetch-items.js verify             # vérifier tous les items de la DB
```

Pas de build step — le front-end est du HTML/CSS/JS pur, ouvrir directement dans le navigateur ou via un serveur HTTP simple.

## Layout System

**Toutes les pages** appellent `Layout.header()` et `Layout.footer()` depuis `js/layout.js`. Le header injecte la nav et les fonts via `insertAdjacentHTML` sur le script courant. Le footer écrit le `<footer>` + tous les scripts différés via `document.write()`.

- `const V = '20260517'` dans layout.js est remplacé à deploy par le timestamp (cache buster)
- Ajouter un script global : l'inclure dans le `document.write()` du footer avec `defer`
- Ajouter un lien nav : ajouter la variable `s*` dans `header()` et le `<a>` dans le HTML injecté

## Data Flow

Les données dynamiques ont deux couches :

1. **Statique** — `data/*.js` définissent `window.PROGRESSION`, `window.RAID_STATS`, `window.HALL_OF_SHAME`. Chargés directement par les pages HTML comme fallback.
2. **Live** — `js/live-data.js` (chargé en dernier) fetche `/api/progression`, `/api/stats`, `/api/shame` et réassigne les variables globales, puis rappelle la fonction `init*()` de la page.

L'API migre automatiquement les `.js` statiques en `.json` au premier démarrage (`api/data/*.json`). Ces JSON sont la source de vérité en production.

## Boss Maps (js/boss-maps.js)

Injecte automatiquement des cartes SVG interactives dans chaque `.boss-card` en matchant le texte du `<h3>` via `BOSS_KEYS` (tableau `[keyword, dataKey]`). Pour ajouter un boss :
1. Ajouter une entrée dans `DATA` avec `room`, `phases`, `elements`
2. Ajouter le keyword dans `BOSS_KEYS`

Les notes 5-man sont dans les éléments `{ type: 'note', text: '...' }` de chaque phase.

## 3D Character Viewer

- **Viewer principal** : `viewer-wotlk5.min.js` depuis wotlk5.com (pré-patché avec PAKO_PATCH pour le format mo3 116-byte header). Fonctionne pour toutes les races si `charData.customizationOptions` est présent.
- **Fallback** : Three.js + GLB, uniquement pour gnome (fichier `900914.mo3` local).
- **Armory proxy** : `/api/armory?realm=X&char=Y` contourne le CORS de wotlk5.com, cache 5 min côté serveur.
- L'API patche aussi les bounding boxes NaN dans les fichiers `.mo3` à la volée (`/wow-assets/mo3/:id.mo3`).

## Kill Tracker Flow

`kill-tracker.html` → POST Discord webhook (via `data/secrets.js`, **gitignored**) + POST `/api/kill` (Bearer SECRET) → `api/server.js` met à jour `progression.json`, `stats.json`, `shame.json`.

`discord-bot/watcher.js` surveille le dossier Screenshots WoW + `WoWCombatLog.txt` pour détecter les kills automatiquement et envoyer à la même API.

## Key Files

| Fichier | Rôle |
|---|---|
| `js/layout.js` | Header/footer/nav injectés sur toutes les pages |
| `js/main.js` | Viewer 3D, armory fetch, toggle portrait/3D |
| `js/live-data.js` | Fetch API → réinitialise les modules de page |
| `js/boss-maps.js` | Cartes SVG interactives, données 5-man |
| `js/wow-effects.js` | Cursor trail doré + Scrolling Combat Text |
| `api/server.js` | Express : proxy armory/assets, REST CRUD, mo3 patch |
| `nginx/default.conf` | Routing : static / API proxy / CDN wotlk5 / CDN zamimg |
| `data/*.js` | Données statiques (fallback si API hors ligne) |
| `data/secrets.js` | Webhook Discord — **gitignored, ne jamais commit** |
| `data/wow-items.json` | Base d'items épiques/légendaires |
| `tools/fetch-items.js` | CLI pour gérer wow-items.json |

## Secrets & Config

- `data/secrets.js` — webhook Discord, **gitignored**
- `discord-bot/config.json` — config du bot, **gitignored** (voir `config.example.json`)
- Variable d'environnement `SECRET` — obligatoire pour démarrer l'API, utilisée pour authentifier les POST

## Wowhead Tooltips

Chaque page charge `power.js` depuis `wow.zamimg.com` via le footer. La config globale est :
```javascript
const whTooltips = { colorLinks: true, iconizeLinks: true, iconSize: 'large', hide: { sellprice: true, ddmoreinfo: true } };
```
Ne jamais wrapper les `<a href*="wowhead">` dans des éléments DOM — cela casse l'injection d'icônes par `power.js`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
