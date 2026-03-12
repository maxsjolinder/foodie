#!/usr/bin/env bash
# deploy.sh — Build and deploy Foodie on Ubuntu (without Docker)
# Usage:
#   First time:  ./deploy.sh --seed
#   Redeploy:    ./deploy.sh
#
# Prerequisites (run once on a fresh machine):
#   sudo apt install -y nodejs npm postgresql
#   sudo npm install -g pm2
#   sudo -u postgres psql -c "CREATE USER foodie WITH PASSWORD 'yourpassword';"
#   sudo -u postgres psql -c "CREATE DATABASE foodie OWNER foodie;"
#   Copy server/.env with correct DATABASE_URL, PORT, NODE_ENV=production, CLIENT_URL

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="foodie"
SEED=false

for arg in "$@"; do
  case $arg in
    --seed) SEED=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

cd "$SCRIPT_DIR"

echo "==> Installing dependencies..."
npm install

echo "==> Building server..."
npm run build:server

echo "==> Building client..."
npm run build:client

echo "==> Copying client build to server/public/..."
mkdir -p server/public
rm -rf server/public/*
cp -r client/dist/* server/public/

echo "==> Running database migrations..."
cd server
npx prisma migrate deploy
cd "$SCRIPT_DIR"

if [ "$SEED" = true ]; then
  echo "==> Seeding database..."
  npm run db:seed
fi

echo "==> Restarting app with PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  pm2 start server/dist/index.js --name "$APP_NAME"
  pm2 save
fi

echo ""
echo "Done! App is running as PM2 process '$APP_NAME'."
echo "To set up auto-start on reboot (first time only): pm2 startup"
