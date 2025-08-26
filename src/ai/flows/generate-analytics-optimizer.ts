'use server';

/**
 * @fileOverview Analyzes past content context and suggests best posting times, formats, keywords, and post ideas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAnalyticsOptimizerInputSchema = z.object({
  niche: z.string().describe('Creator niche or theme'),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin']).optional(),
  region: z.string().optional().describe('Region/timezone context (e.g., US/Eastern, UK, Global)'),
  goal: z.enum(['reach', 'engagement', 'growth', 'conversions']).optional(),
  pastText: z
    .string()
    .optional()
    .describe('Optional pasted notes about past posts and performance. Free text.'),
  countKeywords: z.number().int().min(5).max(25).optional().describe('Keyword count, default 12'),
  countIdeas: z.number().int().min(3).max(15).optional().describe('Post ideas count, default 6'),
});
export type GenerateAnalyticsOptimizerInput = z.infer<typeof GenerateAnalyticsOptimizerInputSchema>;

const IdeaSchema = z.object({ idea: z.string(), format: z.string(), why: z.string() });

const GenerateAnalyticsOptimizerOutputSchema = z.object({
  analysisSummary: z.string(),
  bestTimes: z.array(z.string()),
  bestFormats: z.array(z.string()),
  keywordSuggestions: z.array(z.string()),
  postIdeas: z.array(IdeaSchema),
});
export type GenerateAnalyticsOptimizerOutput = z.infer<typeof GenerateAnalyticsOptimizerOutputSchema>;

export async function generateAnalyticsOptimizer(
  input: GenerateAnalyticsOptimizerInput
): Promise<GenerateAnalyticsOptimizerOutput> {
  return generateAnalyticsOptimizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnalyticsOptimizerPrompt',
  input: { schema: GenerateAnalyticsOptimizerInputSchema },
  output: { schema: GenerateAnalyticsOptimizerOutputSchema },
  prompt: `You are a social media performance analyst. Given creator context, provide optimization suggestions.

Rules:
- Output ONLY JSON with keys: analysisSummary, bestTimes, bestFormats, keywordSuggestions, postIdeas.
- bestTimes: 5–8 concise windows like "Mon 11:00–13:00 local" tailored to {{#if region}}{{region}}{{else}}Global{{/if}}.
- bestFormats: 4–8 items tailored to {{#if platform}}{{platform}}{{else}}instagram{{/if}} and goal {{#if goal}}{{goal}}{{else}}reach{{/if}}.
- keywordSuggestions: EXACTLY {{#if countKeywords}}{{countKeywords}}{{else}}12{{/if}} relevant keywords/phrases, no hashtags/emojis.
- postIdeas: EXACTLY {{#if countIdeas}}{{countIdeas}}{{else}}6{{/if}} items: { idea, format, why }. Keep text concise; no emojis/hashtags.

Inputs:
- Niche: {{{niche}}}
- Platform: {{#if platform}}{{platform}}{{else}}instagram{{/if}}
- Region: {{#if region}}{{region}}{{else}}Global{{/if}}
- Goal: {{#if goal}}{{goal}}{{else}}reach{{/if}}
- Past context: {{#if pastText}}{{{pastText}}}{{else}}None provided{{/if}}

Respond ONLY with valid JSON.
`,
});

const generateAnalyticsOptimizerFlow = ai.defineFlow(
  {
    name: 'generateAnalyticsOptimizerFlow',
    inputSchema: GenerateAnalyticsOptimizerInputSchema,
    outputSchema: GenerateAnalyticsOptimizerOutputSchema,
  },
  async (input) => {
    const countKeywords = input.countKeywords ?? 12;
    const countIdeas = input.countIdeas ?? 6;
    const { output } = await prompt({ ...input, countKeywords, countIdeas });

    function clean(s: string): string {
      return s.replace(/\s+/g, ' ').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    }

    const analysisSummary = clean(String(output?.analysisSummary || ''));
    const bestTimes = Array.isArray(output?.bestTimes)
      ? output!.bestTimes.map((t: any) => clean(String(t))).slice(0, 12)
      : [];
    const bestFormats = Array.isArray(output?.bestFormats)
      ? output!.bestFormats.map((t: any) => clean(String(t))).slice(0, 12)
      : [];
    const keywordSuggestions = Array.isArray(output?.keywordSuggestions)
      ? output!.keywordSuggestions.map((t: any) => clean(String(t))).slice(0, countKeywords)
      : [];

    let postIdeas = Array.isArray(output?.postIdeas) ? output!.postIdeas : [];
    postIdeas = postIdeas.map((pi: any, i: number) => ({
      idea: clean(String(pi?.idea || `Idea ${i + 1}`)),
      format: clean(String(pi?.format || (input.platform || 'post'))),
      why: clean(String(pi?.why || 'Likely to perform given audience interests and timing.')),
    }));
    postIdeas = postIdeas.slice(0, countIdeas);
    while (postIdeas.length < countIdeas) {
      postIdeas.push({ idea: `Quick tip ${postIdeas.length + 1}`, format: input.platform || 'post', why: 'Short, value-dense content performs reliably.' });
    }

    return { analysisSummary, bestTimes, bestFormats, keywordSuggestions, postIdeas };
  }
);
