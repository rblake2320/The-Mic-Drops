# The MIC Drops — Micro Ingestion Channels

A consumer-controlled micro-content delivery platform demo. Creators publish atomic "Drops" — short statements and stories anchored to original source clips (YouTube, podcasts, broadcasts) — with optional AI voice synthesis. Consumers declare their interests and receive deterministic, algorithm-free delivery.

Originally exported from [Google AI Studio](https://ai.studio/apps/ff6c5ba7-b33c-4f59-82b3-00f8e0201903).

## What's in the demo

The app is a single-page showcase with three panels (`src/App.tsx`):

| Panel | File | Purpose |
|---|---|---|
| **Creator Studio** | `src/components/CreatorStudio.tsx` | Draft a raw idea, pick a creator persona, and let Gemini refine it into a polished Drop with TTS voice preview |
| **Mobile Simulator** | `src/components/MobileSimulator.tsx` | Simulated phone showing the consumer feed, interest declarations, and the drop player |
| **Investor Sandbox** | `src/components/InvestorSandbox.tsx` | Interactive financial model — MAU, conversion, CPM, and take-rate inputs with P&L charts |

## Architecture

- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4 (via `@tailwindcss/vite`), lucide-react icons, recharts
- **Backend**: Express server (`server.ts`) that embeds Vite in middleware mode for dev and serves `dist/` in production
- **AI**: `@google/genai` — `gemini-3.5-flash` for drop generation, `gemini-3.1-flash-tts-preview` for speech synthesis
- **Fallback**: if `GEMINI_API_KEY` is missing or the API is down, the server falls back to a local persona-styled generator, so the demo always works

### API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/config` | GET | Reports whether a Gemini key is configured |
| `/api/drops/generate` | POST | `{ rawInput, creatorName, contextType }` → refined Drop JSON (falls back locally without a key) |
| `/api/drops/tts` | POST | `{ text, voiceName }` → base64 PCM audio at 24 kHz (requires a key) |

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env        # optional — add your GEMINI_API_KEY for live AI + TTS
npm run dev                 # http://localhost:3000
```

The app runs without an API key — drop generation uses the built-in fallback and TTS is disabled.

## Build & production

```bash
npm run lint     # typecheck (tsc --noEmit)
npm run build    # vite build + esbuild server bundle → dist/
npm start        # NODE_ENV=production node dist/server.cjs
```

## Project layout

```
server.ts                 Express + Gemini API server (dev: Vite middleware)
vite.config.ts            React + Tailwind v4 plugins
index.html                SPA shell
src/
  main.tsx                React entry
  App.tsx                 Tab shell: showcase / pitch deck
  types.ts                Creator, Drop, FinancialInputs interfaces
  data.ts                 Seed creators + default drops
  index.css               Tailwind theme + custom fonts
  components/
    CreatorStudio.tsx     AI drop authoring panel
    MobileSimulator.tsx   Consumer phone simulator
    InvestorSandbox.tsx   Financial model sandbox
```
