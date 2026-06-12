# Deployment Guide — The MIC Drops

## Architecture

```
GitHub main branch
    │
    ├─ Cloudflare Pages ── React SPA ── LIVE: https://the-mic-drops.pages.dev
    │   └─ VITE_API_URL=https://srv1740069.hstgr.cloud (baked in at build)
    │
    └─ Hostinger VPS (SHARED) ── 2.25.184.107 (srv1740069.hstgr.cloud)
        Ubuntu 22.04 / 2 vCPU / 8GB
        │
        ├─ selfconnect.ai → SelfConnect project (separate — do not touch)
        └─ srv1740069.hstgr.cloud → PM2: mic-drops (port 3000)
               └─ Nginx vhost → :3000, SSL via Let's Encrypt on the srv hostname
               └─ Postgres: micdrop DB (local)
               └─ Redis: shared instance
```

**No domain purchase needed to launch:**
- Frontend: `the-mic-drops.pages.dev` (free with Cloudflare Pages)
- API: `srv1740069.hstgr.cloud` (Hostinger's VPS hostname — certbot can issue a cert for it
  since it resolves to the VPS). Web Push requires HTTPS end-to-end, so run certbot before testing push.
- Later: register a custom domain (e.g. `micdrop.app` ~$14/yr), add it to Cloudflare,
  point an `api.` subdomain at 2.25.184.107, rebuild frontend with the new VITE_API_URL.

## VPS First-Time Setup

```bash
# SSH into the VPS as root
ssh root@2.25.184.107

# Run setup script (installs Node 20, Postgres 16, Redis, Nginx, PM2, UFW)
bash <(curl -s https://raw.githubusercontent.com/rblake2320/The-Mic-Drops/main/scripts/vps-setup.sh)
```

Or manually:
```bash
# Clone
mkdir -p /var/www/mic-drops && cd /var/www/mic-drops
git clone https://github.com/rblake2320/The-Mic-Drops.git .

# Environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, ADMIN_SECRET, VAPID_*, CORS_ORIGIN, API_ONLY=true

# VAPID keys (run once, paste into .env)
npm ci && node -e "const wp=require('web-push');console.log(wp.generateVAPIDKeys())"

# Database
npx prisma generate
npx prisma migrate deploy
npm run db:seed     # seeds 8 creators (all PITCH) + 18 drops

# Build + start
npm run build
pm2 start dist/server.cjs --name mic-drops --env production
pm2 save
pm2 startup         # copy/run the printed systemd command
```

## Nginx

```bash
cp nginx/mic-drops.conf /etc/nginx/sites-available/mic-drops
# Edit: replace api.your-domain.com with your actual domain
ln -s /etc/nginx/sites-available/mic-drops /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.your-domain.com
```

## GitHub Secrets (for auto-deploy on push to main)

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `2.25.184.107` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | your private key (paste full contents) |
| `VITE_API_URL` | `https://api.your-domain.com` |
| `CLOUDFLARE_API_TOKEN` | from CF dashboard → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | from CF dashboard → right sidebar |

## Environment Variables (.env on VPS)

```env
NODE_ENV=production
PORT=3000
API_ONLY=true

DATABASE_URL=postgresql://micdrop:YOUR_PG_PASS@localhost:5432/micdrop
REDIS_URL=redis://localhost:6379

JWT_SECRET=<64+ random chars>
ADMIN_SECRET=<strong secret for admin API calls>

VAPID_PUBLIC_KEY=<from npm run vapid:generate>
VAPID_PRIVATE_KEY=<from npm run vapid:generate>
VAPID_EMAIL=mailto:your@email.com

CORS_ORIGIN=https://the-mic-drops.pages.dev
GEMINI_API_KEY=<optional — demo works without it>
```

## Authorizing Phase 1 Creator: James Dumoulin (SOHK)

Once VPS is live:

```bash
# 1. Get his YouTube channel ID from words-of-wisdom.manus.space or YouTube
# 2. Promote from PITCH → AUTHORIZED
curl -X PATCH https://api.your-domain.com/api/creators/sohk/status \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "AUTHORIZED",
    "youtubeChannelId": "UCxxxxxxxxxx",
    "consentRecord": {
      "method": "email",
      "date": "2026-06-12",
      "note": "Verbal agreement via email thread"
    }
  }'

# 3. Ingest a real episode (creator JWT required)
# First: creator logs in → POST /api/auth/creator/login → get JWT
# Then: POST /api/ingest/youtube with Authorization: Bearer <creator-jwt>
curl -X POST https://api.your-domain.com/api/ingest/youtube \
  -H "Authorization: Bearer CREATOR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://youtu.be/EPISODE_ID",
    "timeCode": "00:12:30",
    "windowSeconds": 120
  }'
```

## PM2 Commands

```bash
pm2 status                  # show all processes
pm2 logs mic-drops          # tail logs
pm2 restart mic-drops       # restart after .env changes
pm2 reload mic-drops        # zero-downtime reload
```

## Database Maintenance

```bash
# Connect to Postgres
sudo -u postgres psql micdrop

# View creator statuses
SELECT id, name, status, "consentSignedAt" FROM "Creator";

# Reset a creator to PITCH (if needed)
UPDATE "Creator" SET status='PITCH' WHERE id='sohk';
```
