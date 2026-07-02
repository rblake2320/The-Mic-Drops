# Security Audit & Hardening Record — July 2026

Full-codebase audit performed against commit at HEAD of `main`. Every finding
below was either fixed in the accompanying patch set or explicitly deferred
with rationale. Verification: `npm run lint`, `npm test` (18 tests), and
`npm run build` all pass; live smoke tests confirmed zero-config boot,
Gemini fallback, validation rejections, and security headers.

## Fixed — Critical

| # | Finding | Fix |
|---|---|---|
| 1 | **DRAFT leak**: public `GET /api/drops` served `status IN (SENT, DRAFT)` — unpublished creator work was publicly readable | Feed is SENT-only (`server/routes/drops.ts`). Seeded demo drops are SENT, so the demo is unaffected |
| 2 | **Analytics identity forgery**: `POST /api/analytics/event` accepted arbitrary `consumerId` from the body, unauthenticated | Identity derived only from bearer token via `optionalConsumerAuth`; body-supplied `consumerId` is stripped by schema |
| 3 | **Unmetered AI cost surface**: `/api/drops/generate` and `/api/drops/tts` had no rate limit or length caps — a free Gemini proxy on the platform key | `aiLimiter` 10 req/min, 4,000-char generate cap, 1,200-char TTS cap, voice enum enforced |
| 4 | **Timing-unsafe admin auth**: `token !== ADMIN_SECRET` string comparison | `crypto.timingSafeEqual` in `server/middleware/auth.ts` |
| 5 | **No secret validation at boot**: server would run in production with missing/placeholder `JWT_SECRET` | `server/env.ts`: production exits at boot on weak secrets; dev generates ephemeral secrets with a warning (zero-config demo preserved) |
| 6 | **VPS deploy bug**: `npm ci --omit=dev` followed by `npm run build` — vite/esbuild/tsc are devDependencies, so the production build would fail on the VPS | Full `npm ci` in the deploy script |
| 7 | **Hardcoded VPS IP** in the public repo workflow | Moved to `secrets.VPS_HOST` |
| 8 | **No input validation** (zod installed but unused) | Every mutating endpoint validates via `server/schemas.ts` + `validateBody`; passwords ≥10 chars, emails normalized, login timing made uniform |
| 9 | **`@types/react` missing** — JSX effectively type-unchecked | Added `@types/react` / `@types/react-dom`; zero new errors surfaced |

## Fixed — High / Medium

- Brute-force limiter on `/api/auth/*` (20 / 15 min); general API ceiling 300/min; analytics 60/min
- `helmet` security headers; `trust proxy` for correct client IPs behind nginx
- JSON body limit 5 MB → 1 MB
- Feed pagination clamped (limit ≤ 50, offset ≥ 0); category list capped
- `scheduledAt` in the past rejected; ingest `windowSeconds` clamped 10–600
- Dockerfile runs as `node`, not root
- CI `verify` job (lint + test + build) now gates both deploy jobs
- Prisma hot-path indexes: `Drop(status, dateSent desc)`, `Drop(creatorId, status)`, `Drop(category, status)`, `AnalyticsEvent(dropId, type)`, `(creatorId, type)`, `(createdAt)`
- Doc drift: CLAUDE.md said Postgres `:5433`; docker-compose maps `:5435`

## Flagged — requires a decision, not (only) code

1. **Persona legal exposure (highest priority).** PITCH-mode creators (MrBeast,
   Gary Vee, Charlemagne, EYL) generate first-person statements with synthetic
   voice in real public figures' styles without consent. This is right-of-publicity
   and false-endorsement (Lanham Act) exposure the moment it faces the public.
   Recommended posture: the consent-first AUTHORIZED path (James / SOHK) is the
   only public path; personas live strictly behind an investor demo wall with
   explicit "concept illustration — not affiliated" labeling on every surface.
2. **`youtube-transcript` fragility.** YouTube blocks datacenter IPs for this
   scraping approach; expect intermittent failures from the VPS. Plan a fallback
   (official captions API for AUTHORIZED creators' own channels, or creator-side
   upload).
3. **Single push endpoint per consumer** = one device per user. Schema evolution
   needed: a `PushDevice` table (consumerId, endpoint, keys, userAgent) replacing
   the three columns on `Consumer`.
4. **30-day JWTs with no revocation.** Add a `tokenVersion` column and bump on
   password change / logout-everywhere.
5. **Consumer feed still renders static `DEFAULT_DROPS`** rather than
   `GET /api/drops` — wire it when the VPS API is live.
6. **`tsconfig` lacks `strict: true`.** Enable incrementally (start with
   `noImplicitAny` on the `server/` tree — it is close to clean already).
7. **Bundle size**: main chunk > 500 kB; code-split recharts (only the investor
   route needs it).
8. **Rate-limit store is in-memory** — correct for one pm2 process; swap in
   `rate-limit-redis` (existing `REDIS_URL`) before scaling horizontally.
