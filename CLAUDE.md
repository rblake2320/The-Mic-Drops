# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The MIC Drops ("Micro Ingestion Channels") — a consumer-controlled micro-content delivery platform demo, exported from Google AI Studio. Single Express server hosts both the React SPA and the Gemini-backed API.

## Commands

```bash
npm run dev      # dev server with Vite middleware (tsx server.ts) → http://localhost:3000
npm run lint     # typecheck only (tsc --noEmit) — there is no eslint
npm run build    # vite build (client) + esbuild bundle of server.ts → dist/
npm start        # production: NODE_ENV=production node dist/server.cjs
```

There is no test suite. Verify changes with `npm run lint` and `npm run build`, then smoke-test `npm run dev` (GET /, GET /api/config, POST /api/drops/generate).

## Architecture

- `server.ts` — single Express server (port 3000, hardcoded). Three endpoints: `GET /api/config`, `POST /api/drops/generate`, `POST /api/drops/tts`. In dev it mounts Vite in middleware mode; in production (`NODE_ENV=production`) it serves static `dist/`.
- `src/App.tsx` — top-level tab shell (showcase / pitch). Owns the drops feed state; passes `onPublishDrop` down to CreatorStudio and the feed to MobileSimulator.
- `src/components/` — three large self-contained panels: CreatorStudio (AI authoring + TTS playback), MobileSimulator (simulated consumer phone UI), InvestorSandbox (financial model with recharts).
- `src/types.ts` — `Creator`, `Drop`, `FinancialInputs`, `FinancialMetric` shared interfaces.
- `src/data.ts` — `DEFAULT_CREATORS` and `DEFAULT_DROPS` seed data (persona-based demo content).
- Styling is Tailwind CSS v4 via the `@tailwindcss/vite` plugin — theme tokens live in `src/index.css` (`@theme` block), no tailwind.config file.

## Key behaviors to preserve

- **Gemini fallback**: `/api/drops/generate` must never 500 on a missing key or API outage — it falls back to `getFallbackDrop()` (local persona-styled generator) and returns `isFallback: true`. The demo is designed to work with no `GEMINI_API_KEY`.
- **Retry wrapper**: all Gemini calls go through `callGeminiWithRetry()` (exponential backoff on 429/503).
- Models used: `gemini-3.5-flash` (generation), `gemini-3.1-flash-tts-preview` (TTS, 24 kHz PCM base64).
- `metadata.json` is the AI Studio app manifest (microphone permission, server-side Gemini capability) — keep it if re-importing to AI Studio.

## Environment

- `GEMINI_API_KEY` (optional) — enables live generation + TTS. Loaded via dotenv from `.env`. Never commit keys; `.gitignore` excludes `.env*` except `.env.example`.

## History note

This repo's initial commit was a scrambled AI Studio export where every file's content was saved under the wrong filename (e.g. the server lived in `vite.config.ts`, the lockfile in `server.ts`). The repair commit reorganized everything into the current layout — be skeptical of any old branches or forks predating it.
