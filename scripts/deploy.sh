#!/bin/bash
# Script de déploiement — /home/eliott/deploy.sh sur le serveur Ubuntu
# Appelé par adnanh/webhook via deploy.lansduswag.site

set -e

SITE_DIR="/home/eliott/ProjetLanWOW"
SITE_WEB="/home/eliott/monsite"
API_DIR="$SITE_DIR/api"

echo "=== Déploiement LAN Du Swag ==="

# Met à jour le code source
cd "$SITE_DIR"
git pull origin master

# Copie vers le dossier servi par nginx (sans .git ni node_modules)
rsync -a \
  --exclude='.git' \
  --exclude='discord-bot/node_modules' \
  --exclude='api/node_modules' \
  --exclude='api/data' \
  "$SITE_DIR/" "$SITE_WEB/"

# Installe les dépendances API
cd "$API_DIR"
npm install --production --quiet

# Crée le dossier data si nécessaire
mkdir -p "$API_DIR/data"

# Redémarre l'API
pm2 restart lan-api 2>/dev/null || \
  SECRET=lan_swag_secret_2026 PORT=3001 pm2 start "$API_DIR/server.js" --name lan-api

# Assure que le proxy Wowhead tourne
if ! docker ps | grep -q "wow-proxy"; then
  docker run -d \
    --name wow-proxy \
    -e SERVER_NAME=https://wow.zamimg.com \
    -v /home/eliott/wow-assets:/usr/src/app/storage \
    -p 2999:3000 \
    miorey/bypass-cors-policies:v1
  echo "--- wow-proxy démarré ---"
fi

# Recharge nginx
docker exec monsite nginx -s reload

echo "=== Deploy OK ==="
