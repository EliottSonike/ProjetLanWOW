#!/bin/bash
# Script de déploiement — exécuté par adnanh/webhook sur le serveur Ubuntu
# Ce fichier est dans le repo et versionné.
# Sur le serveur : chmod +x scripts/deploy.sh

set -e

SITE_DIR="/var/www/lansduswag.site"
API_DIR="$SITE_DIR/api"
BRANCH="master"

echo "=== Déploiement LAN Du Swag ==="

# Met à jour le code source
cd "$SITE_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Installe les dépendances de l'API
echo "--- Installation dépendances API ---"
cd "$API_DIR"
npm install --production

# Crée le dossier data si nécessaire
mkdir -p "$API_DIR/data"

# Lance/redémarre l'API avec PM2
if pm2 list | grep -q "lan-api"; then
  pm2 restart lan-api
else
  SECRET="${LAN_API_SECRET:-changeme}" PORT=3001 pm2 start "$API_DIR/server.js" --name lan-api
  pm2 save
fi

echo "=== Déploiement terminé ==="
