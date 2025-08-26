'use server';

/**
 * @fileOverview Builds an AI content calendar with post ideas, reminders, and cross-platform scheduling.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateContentCalendarInputSchema = z.object({
  niche: z.string().describe('Creator niche or theme'),
  platforms: z.array(z.string()).min(1).describe('Platforms to schedule for'),
  postsPerWeek: z.number().int().min(1).max(21).optional().describe('Target posts per week across platforms (default 7)'),
  weeks: z.number().int().min(1).max(12).optional().describe('Number of weeks to plan (default 4)'),
  startDate: z.string().optional().describe('ISO date to start from (optional)'),
  region: z.string().optional().describe('Region/timezone context'),
});
export type GenerateContentCalendarInput = z.infer<typeof GenerateContentCalendarInputSchema>;

const CalendarItemSchema = z.object({
  date: z.string(),
  platform: z.string(),
  idea: z.string(),
  format: z.string(),
  captionPrompt: z.string(),
  reminder: z.string(),
});

const GenerateContentCalendarOutputSchema = z.object({
  summary: z.string(),
  items: z.array(CalendarItemSchema),
});
export type GenerateContentCalendarOutput = z.infer<typeof GenerateContentCalendarOutputSchema>;

export async function generateContentCalendar(
  input: GenerateContentCalendarInput
): Promise<GenerateContentCalendarOutput> {
  return generateContentCalendarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentCalendarPrompt',
  input: { schema: GenerateContentCalendarInputSchema },
  output: { schema: GenerateContentCalendarOutputSchema },
  prompt: `You are a content operations planner. Build a concise, actionable content calendar.

Rules:
- Output ONLY JSON with keys: summary, items.
- items: EXACTLY totalSlots = ({{#if weeks}}{{weeks}}{{else}}4{{/if}} weeks) * ({{#if postsPerWeek}}{{postsPerWeek}}{{else}}7{{/if}} posts/week) entries.
- Each item: { date (YYYY-MM-DD), platform, idea (<= 14 words), format, captionPrompt (<= 20 words), reminder (e.g., asset checklist or call-to-action) }.
- Distribute posts across platforms {{#each platforms}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} and vary formats.
- Start at {{#if startDate}}{{startDate}}{{else}}next Monday{{/if}}, consider region {{#if region}}{{region}}{{else}}Global{{/if}}.
- No emojis/hashtags.

Inputs:
- Niche: {{{niche}}}

Respond ONLY with valid JSON.
`,
});

const generateContentCalendarFlow = ai.defineFlow(
  {
    name: 'generateContentCalendarFlow',
    inputSchema: GenerateContentCalendarInputSchema,
    outputSchema: GenerateContentCalendarOutputSchema,
  },
  async (input) => {
    const postsPerWeek = input.postsPerWeek ?? 7;
    const weeks = input.weeks ?? 4;
    const total = postsPerWeek * weeks;

    const { output } = await prompt({ ...input, postsPerWeek, weeks });

    function clean(s: string): string {
      return s.replace(/\s+/g, ' ').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    }

    function limitWords(s: string, max: number): string {
      const words = s.split(' ');
      return words.length <= max ? s : words.slice(0, max).join(' ');
    }

    const summary = clean(String(output?.summary || 'Weekly content plan focused on consistency and variety.'));

    let items = Array.isArray(output?.items) ? output!.items : [];
    items = items.map((it: any, i: number) => ({
      date: String(it?.date || '').slice(0, 10) || `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
      platform: clean(String(it?.platform || input.platforms[i % input.platforms.length] || 'instagram')),
      idea: limitWords(clean(String(it?.idea || `Idea ${i + 1}`)), 14),
      format: clean(String(it?.format || 'post')),
      captionPrompt: limitWords(clean(String(it?.captionPrompt || 'Write a concise caption with a CTA.')), 20),
      reminder: limitWords(clean(String(it?.reminder || 'Prep assets; set publish time; repurpose after 48h.')), 18),
    }));

    // Normalize length to expected total
    items = items.slice(0, total);
    while (items.length < total) {
      const i = items.length;
      items.push({
        date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
        platform: input.platforms[i % input.platforms.length] || 'instagram',
        idea: `Quick value tip ${i + 1}`,
        format: 'post',
        captionPrompt: 'Start with the result; end with a CTA to save/share.',
        reminder: 'Batch record; add subtitles; schedule at best time.',
      });
    }

    return { summary, items };
  }
);
