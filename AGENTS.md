# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

The MIC Drops — React 19 + Vite 6 + Tailwind 4 SPA served by a single Express server (`server.ts`) with Gemini-backed API endpoints. TypeScript throughout, ESM (`"type": "module"`).

## Setup & verification

```bash
npm install
npm run lint     # tsc --noEmit — must pass
npm run build    # client + server bundles — must pass
npm run dev      # smoke test on http://localhost:3000
```

No test suite exists. The minimum bar for any change: `npm run lint` and `npm run build` both clean, and the dev server serves `GET /` (200) and `GET /api/config` (JSON).

## Layout

- `server.ts` — Express + Gemini API (port 3000). Dev: Vite middleware; prod: serves `dist/`.
- `src/App.tsx` — tab shell and feed state owner.
- `src/components/{CreatorStudio,MobileSimulator,InvestorSandbox}.tsx` — the three demo panels.
- `src/types.ts`, `src/data.ts` — shared interfaces and seed data.
- `src/index.css` — Tailwind v4 `@theme` tokens (no tailwind.config file).
- `metadata.json` — AI Studio app manifest; do not delete.

## Rules

- Do not break the no-key fallback path: `/api/drops/generate` must keep returning a valid Drop via `getFallbackDrop()` when `GEMINI_API_KEY` is absent or Gemini errors.
- Route all new Gemini calls through `callGeminiWithRetry()`.
- Secrets come from `.env` (dotenv). Never hardcode or commit keys; update `.env.example` when adding new variables.
- lucide-react icons do not accept a `title` prop — wrap in a `<span title="...">` instead.
- Keep components self-contained as they are; shared shapes go in `src/types.ts`.
- Match existing style: Tailwind utility classes, dark theme palette (`#0A0A0A` background, `#C19A6B` accent), function components with hooks.
