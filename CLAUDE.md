# CLAUDE.md — The MIC Drops

Micro Ingestion Channels: consumer-controlled micro-content delivery platform.
React 19 SPA (Cloudflare Pages) + Express API (Hostinger VPS) + Prisma/Postgres + BullMQ + Web Push.

## Commands

```bash
npm run docker:up          # start local Postgres (:5435) + Redis (:6381)
npm run db:push            # apply schema to local DB (dev)
npm run db:migrate         # prisma migrate deploy (production)
npm run db:seed            # seed 8 creators + 18 drops (all PITCH status)
npm run db:studio          # Prisma Studio UI
npm run vapid:generate     # print VAPID keys for .env
npm run dev                # Vite + Express dev server → http://localhost:3000
npm run lint               # tsc --noEmit (no eslint)
npm test                   # vitest unit suite (provenance chain, schemas, ingest parsing)
npm run build              # vite build + esbuild server bundle → dist/
npm start                  # production: node dist/server.cjs
npm run docker:down        # stop local DB + Redis
```

## Architecture

```
Cloudflare Pages ──VITE_API_URL──▶  Hostinger VPS :3000
  dist/ (React SPA)                   Express API
  public/sw.js (service worker)         Prisma → Postgres
  src/api.ts (API_BASE)                 BullMQ → Redis
                                        VAPID push
```

### Key files

- `server.ts` — single Express entrypoint. Preserves all Gemini routes; mounts all production routes; calls `initVapid / initQueue / startDropWorker` at startup. `API_ONLY=true` skips static serving on VPS.
- `server/db.ts` — Prisma singleton (global cache avoids connection exhaustion in dev)
- `server/middleware/auth.ts` — `requireCreatorAuth` / `requireConsumerAuth` / `requireAdminAuth`
- `server/env.ts` — fail-fast zod env validation; dotenv loads here (import { env } everywhere, never process.env directly)
- `server/schemas.ts` + `server/middleware/validate.ts` — zod request validation on every mutating endpoint
- `server/middleware/rateLimit.ts` — tiered limits: auth (20/15min), AI (10/min), analytics (60/min), general (300/min)
- `server/provenance/chain.ts` — pure hash-chain functions (stdlib crypto); `ledger.ts` — DB glue; public verify at `/api/provenance/verify`, per-drop receipts at `/api/provenance/drops/:id`
- `server/routes/` — auth, creators, drops, consumer, analytics, provenance
- `server/push/index.ts` — VAPID + web push dispatch
- `server/queues/dispatcher.ts` — BullMQ (uses its own ioredis — do NOT install standalone ioredis)
- `server/workers/dropWorker.ts` — BullMQ worker, marks SENT, calls push
- `server/ingest/youtube.ts` — YouTube transcript → DRAFT drop (AUTHORIZED creators only)
- `prisma/schema.prisma` — full schema: Creator, Drop, Consumer, CreatorUser, Subscription, AnalyticsEvent
- `prisma/seed.ts` — imports from src/data.ts, upserts all creators as PITCH
- `src/api.ts` — `API_BASE = VITE_API_URL ?? ""` (empty = same-origin in dev)
- `public/sw.js` — service worker for Web Push notifications

### Creator status lifecycle

```
PITCH → demo content via Gemini fallback
AUTHORIZED → real content, YouTube ingest enabled, consent recorded
REMOVED → PII anonymized, analytics preserved
```

Admin endpoints use `Authorization: Bearer <ADMIN_SECRET>` header.
Promote James Dumoulin (seed id: `sohk`):
```
PATCH /api/creators/sohk/status
{ "status": "AUTHORIZED", "youtubeChannelId": "UCxxx", "consentRecord": {...} }
```

## Environment variables

See `.env.example` for full list. Key vars:
- `DATABASE_URL` — Postgres connection string
- `REDIS_URL` — Redis connection string (default `redis://localhost:6381` in dev)
- `JWT_SECRET` — random 64+ char string
- `ADMIN_SECRET` — admin bearer token
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` — from `npm run vapid:generate`
- `GEMINI_API_KEY` — optional; demo works without it via getFallbackDrop()
- `CORS_ORIGIN` — set to Cloudflare Pages URL in production
- `API_ONLY=true` — set on VPS so server skips static file serving
- `VITE_API_URL` — set in Cloudflare Pages dashboard (the VPS API URL)

## Deploy targets

- **Frontend**: Cloudflare Pages — auto-deploys on push to `main` via `.github/workflows/deploy.yml`
- **Backend**: Hostinger VPS — SSH deploy in same workflow: git pull → npm ci → prisma migrate → pm2 restart
- **Nginx**: `nginx/mic-drops.conf` — proxies `/api/*` to `localhost:3000`, SSL via Let's Encrypt

## Key behaviors to preserve

- **Gemini fallback**: `/api/drops/generate` never 500s — falls back to `getFallbackDrop()` when API key missing or quota hit. `isFallback: true` in response.
- **BullMQ graceful**: queue and worker fail silently when Redis unavailable — existing demo continues.
- **No standalone ioredis**: BullMQ bundles its own. Adding ioredis separately causes a TypeScript `AbstractConnector.connecting` protected class conflict.
- **Local dev ports**: Postgres=5435, Redis=6381 (avoid conflicts with user's existing PG on 5432/5434, Redis on 6379/6380).
- `prisma generate` must run before `tsc --noEmit`.
- **Public drops feed serves SENT only** — DRAFT is unpublished creator work; never re-add it to the public query.
- **Analytics identity comes from the bearer token** (optionalConsumerAuth) — never trust a client-supplied consumerId.
- **ProvenanceEntry is append-only** — never UPDATE or DELETE rows; the hash chain makes tampering evident and that is the product's trust claim.

## Phase 1 creator: James Dumoulin (SOHK)

Site: words-of-wisdom.manus.space — already live, first real creator target.
Vertical slice: James publishes one real Drop from one real SOHK episode → subscriber's phone.
Steps after VPS deploy:
1. `PATCH /api/creators/sohk/status` with `AUTHORIZED`
2. `POST /api/ingest/youtube` with his YouTube episode URL
3. Consumer subscribes via push + watches `sohk` creator
4. Drop lands on phone

## History note

Initial commit was a scrambled AI Studio export (files saved under wrong filenames — server lived in `vite.config.ts`, lockfile in `server.ts`). Repaired in second commit. Production backend added in subsequent session — see git log for full change set.
