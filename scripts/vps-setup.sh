#!/bin/bash
# VPS setup for The MIC Drops API — SHARED VPS (2.25.184.107)
# This VPS also hosts selfconnect.ai — this script only adds mic-drops.
# Safe to run if Node/Nginx/Redis/Postgres are already installed (idempotent).
# Usage: bash vps-setup.sh

set -euo pipefail

APP_DIR="/var/www/mic-drops"
APP_USER="micdrop"
NODE_VERSION="20"
PG_VERSION="16"

echo "=== [1/8] System update ==="
apt-get update -qq && apt-get upgrade -y -qq

echo "=== [2/8] Install dependencies ==="
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw build-essential

echo "=== [3/8] Install Node.js $NODE_VERSION (skip if already installed) ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y -qq nodejs
else
  echo "  Node $(node -v) already installed — skipping"
fi

echo "=== [4/8] Install PM2 (skip if already installed) ==="
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
else
  echo "  PM2 $(pm2 -v) already installed — skipping"
fi

echo "=== [5/8] Install PostgreSQL $PG_VERSION (skip if already installed) ==="
if ! command -v psql &>/dev/null; then
  apt-get install -y -qq postgresql-$PG_VERSION postgresql-contrib-$PG_VERSION
  systemctl enable postgresql
  systemctl start postgresql
else
  echo "  Postgres already installed — skipping install, creating DB only"
fi

# Create DB + user
sudo -u postgres psql -c "CREATE USER micdrop WITH PASSWORD 'CHANGE_THIS_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE micdrop OWNER micdrop;" 2>/dev/null || true
echo "  Postgres: user=micdrop db=micdrop created (change password in .env)"

echo "=== [6/8] Install Redis ==="
apt-get install -y -qq redis-server
# Bind to localhost only
sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
systemctl enable redis-server
systemctl restart redis-server

echo "=== [7/8] Create app user and directory ==="
id -u $APP_USER &>/dev/null || useradd -m -s /bin/bash $APP_USER
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

echo "=== [8/8] Firewall (UFW) ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "=== Setup complete. Next steps: ==="
echo ""
echo "1. Clone the repo:"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/rblake2320/The-Mic-Drops.git ."
echo ""
echo "2. Create .env (copy .env.example and fill in values):"
echo "   cp .env.example .env && nano .env"
echo "   Key vars: DATABASE_URL, REDIS_URL, JWT_SECRET, ADMIN_SECRET, VAPID_*, CORS_ORIGIN, API_ONLY=true"
echo ""
echo "3. Install, generate, migrate, seed:"
echo "   npm ci"
echo "   npx prisma generate"
echo "   npx prisma migrate deploy"
echo "   npm run db:seed"
echo "   npm run build"
echo ""
echo "4. Start with PM2:"
echo "   pm2 start dist/server.cjs --name mic-drops --env production"
echo "   pm2 save"
echo "   pm2 startup   # copy/run the systemd command it prints"
echo ""
echo "5. Nginx + SSL:"
echo "   cp nginx/mic-drops.conf /etc/nginx/sites-available/mic-drops"
echo "   nano /etc/nginx/sites-available/mic-drops  # fill in your domain"
echo "   ln -s /etc/nginx/sites-available/mic-drops /etc/nginx/sites-enabled/"
echo "   nginx -t && systemctl reload nginx"
echo "   certbot --nginx -d api.YOUR_DOMAIN.com"
echo ""
echo "6. Set GitHub secrets (for auto-deploy):"
echo "   VPS_HOST=2.25.184.107"
echo "   VPS_USER=root  (or micdrop once SSH key is set)"
echo "   VPS_SSH_KEY=<your private key contents>"
echo "   VITE_API_URL=https://api.YOUR_DOMAIN.com"
echo "   CLOUDFLARE_API_TOKEN=<from CF dashboard>"
echo "   CLOUDFLARE_ACCOUNT_ID=<from CF dashboard>"
