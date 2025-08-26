'use server';

/**
 * @fileOverview Surfaces trending topics in a niche and generates angles for posts, videos, or carousels.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTrendRadarInputSchema = z.object({
  niche: z.string().describe('Niche/industry or keywords to explore.'),
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin']).optional(),
  format: z.enum(['post', 'video', 'reel', 'short', 'carousel', 'thread']).optional(),
  audience: z
    .enum(['general', 'marketers', 'developers', 'founders', 'creators', 'designers'])
    .optional(),
  region: z.string().optional().describe('Region/country focus, e.g., US, UK, Global.'),
  timeframe: z.enum(['today', 'week', 'month']).optional(),
  maxTopics: z.number().int().min(3).max(20).optional().describe('Number of topics to surface. Default 10.'),
  ideasPerTopic: z.number().int().min(1).max(6).optional().describe('Angles per topic. Default 3.'),
});
export type GenerateTrendRadarInput = z.infer<typeof GenerateTrendRadarInputSchema>;

const IdeaSchema = z.object({
  angle: z.string(),
  format: z.string(),
});

const TopicSchema = z.object({
  topic: z.string(),
  reason: z.string(),
  ideas: z.array(IdeaSchema),
});

const GenerateTrendRadarOutputSchema = z.object({
  topics: z.array(TopicSchema).describe('Trending topics with tailored ideas/angles.'),
});
export type GenerateTrendRadarOutput = z.infer<typeof GenerateTrendRadarOutputSchema>;

export async function generateTrendRadar(
  input: GenerateTrendRadarInput
): Promise<GenerateTrendRadarOutput> {
  return generateTrendRadarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTrendRadarPrompt',
  input: { schema: GenerateTrendRadarInputSchema },
  output: { schema: GenerateTrendRadarOutputSchema },
  prompt: `You are a trend analyst and content strategist. Surface trending topics for the given niche and produce execution angles.

Rules:
- Output ONLY JSON with key "topics": [{"topic": string, "reason": string, "ideas": [{"angle": string, "format": string}]}].
- Count: return EXACTLY {{#if maxTopics}}{{maxTopics}}{{else}}10{{/if}} topics.
- For each topic, include EXACTLY {{#if ideasPerTopic}}{{ideasPerTopic}}{{else}}3{{/if}} ideas.
- Tailor to platform {{#if platform}}{{platform}}{{else}}instagram{{/if}}, preferred format {{#if format}}{{format}}{{else}}post{{/if}}, audience {{#if audience}}{{audience}}{{else}}general{{/if}}.
- Timeframe: {{#if timeframe}}{{timeframe}}{{else}}week{{/if}}; Region: {{#if region}}{{region}}{{else}}Global{{/if}}.
- Keep all strings concise (<= 16 words), no emojis/hashtags. Make reasons specific (why now / data point / cultural moment).

Niche: {{{niche}}}

Respond ONLY with valid JSON.
`,
});

const generateTrendRadarFlow = ai.defineFlow(
  {
    name: 'generateTrendRadarFlow',
    inputSchema: GenerateTrendRadarInputSchema,
    outputSchema: GenerateTrendRadarOutputSchema,
  },
  async (input) => {
    const maxTopics = input.maxTopics ?? 10;
    const ideasPerTopic = input.ideasPerTopic ?? 3;
    const { output } = await prompt({ ...input, maxTopics, ideasPerTopic });

    function clean(s: string): string {
      return s.replace(/\s+/g, ' ').trim().replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
    }

    function limitWords(s: string, max: number): string {
      const words = s.split(' ');
      return words.length <= max ? s : words.slice(0, max).join(' ');
    }

    const topics = (output?.topics ?? []).slice(0, maxTopics).map((t: any, i: number) => {
      const topic = limitWords(clean(String(t?.topic || `Topic ${i + 1}`)), 12);
      const reason = limitWords(clean(String(t?.reason || 'Relevant now')), 20);
      const ideasArr = Array.isArray(t?.ideas) ? t.ideas : [];
      const ideas = ideasArr
        .slice(0, ideasPerTopic)
        .map((id: any) => ({
          angle: limitWords(clean(String(id?.angle || 'Angle')), 16),
          format: limitWords(clean(String(id?.format || (input.format || 'post'))), 8),
        }));
      while (ideas.length < ideasPerTopic) {
        ideas.push({ angle: `Quick tip: ${i + 1}`, format: input.format || 'post' });
      }
      return { topic, reason, ideas };
    });

    while (topics.length < maxTopics) {
      topics.push({ topic: `Topic ${topics.length + 1}`, reason: 'Emerging theme', ideas: [{ angle: 'Angle', format: input.format || 'post' }] });
    }

    return { topics };
  }
);
