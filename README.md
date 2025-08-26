# Creator Suite

All‑in‑one AI toolkit for creators. Generate better headlines, hashtags, carousels, podcast hooks, engagement ideas, trend insights, hooks & captions, brand pitches, analytics optimizations, and content calendars.

## Features
- **AI Headline Fixer**
- **Hashtag Finder**
- **Carousel Maker**
- **Podcast Hooks**
- **Engagement Booster**
- **Trend Radar**
- **Caption & Hook Generator**
- **Brand Deal Pitch Builder**
- **Analytics & Post Optimizer**
- **Content Calendar & Planner**

## App Routes
- `/headline-fixer`
- `/hashtag-finder`
- `/carousel-maker`
- `/podcast-hooks`
- `/engagement-booster`
- `/trend-radar`
- `/caption-hook-generator`
- `/brand-pitch-builder`
- `/analytics-optimizer`
- `/content-calendar`
- `/pro`

## Getting Started
Requirements: Node 18+ and npm.

1) Install dependencies
```bash
npm install
```

2) Run Next.js dev server (port 9002)
```bash
npm run dev
```

3) (Optional) Run Genkit dev for AI flows
```bash
# Make sure GOOGLE_GENAI_API_KEY is set in .env.local
npm run genkit:dev
```

## Environment
Create `.env.local` and set your key:
```
GOOGLE_GENAI_API_KEY=your_key_here
```

## Scripts
- `npm run dev` — Next.js dev server
- `npm run build` — Build the app
- `npm run start` — Start production server
- `npm run typecheck` — TypeScript check
- `npm run lint` — Lint
- `npm run genkit:dev` — Start Genkit with `src/ai/dev.ts`
- `npm run genkit:watch` — Genkit watch mode

## Tech
- Next.js 15, React 18, TypeScript, Tailwind
- Genkit + Google AI for flows
- Shadcn UI + Radix primitives

## Notes
- Daily usage limits are enforced client‑side for convenience.
- Export (TXT/CSV) and copy helpers are available in several tools.

---
Questions or ideas? Open an issue or start a discussion.
