import { config } from 'dotenv';
// Prefer .env.local for local development, then fallback to .env
config({ path: '.env.local' });
config();

import '@/ai/flows/generate-headline-variations.ts';
import '@/ai/flows/generate-hashtags.ts';
import '@/ai/flows/generate-carousel-slides.ts';
import '@/ai/flows/generate-podcast-hooks.ts';
import '@/ai/flows/generate-engagement-boosters.ts';
import '@/ai/flows/generate-trend-radar.ts';
import '@/ai/flows/generate-hook-captions.ts';
import '@/ai/flows/generate-brand-pitch.ts';
import '@/ai/flows/generate-analytics-optimizer.ts';
import '@/ai/flows/generate-content-calendar.ts';