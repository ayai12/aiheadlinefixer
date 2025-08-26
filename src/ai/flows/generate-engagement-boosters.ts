'use server';

/**
 * @fileOverview Generates tailored engagement suggestions: CTAs, polls, and comment prompts.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateEngagementBoostersInputSchema = z.object({
  caption: z.string().describe('The post caption, topic, or content summary.'),
  contentType: z
    .enum(['post', 'reel', 'short', 'video', 'carousel', 'story'])
    .optional()
    .describe('Content format.'),
  platform: z.enum(['instagram', 'linkedin', 'twitter', 'youtube', 'tiktok']).optional(),
  audience: z
    .enum(['general', 'marketers', 'developers', 'founders', 'creators', 'designers'])
    .optional(),
  goal: z.enum(['comments', 'saves', 'shares', 'clicks', 'follows']).optional(),
  maxCount: z.number().int().min(3).max(25).optional().describe('How many of each type to generate. Default 8.'),
});
export type GenerateEngagementBoostersInput = z.infer<typeof GenerateEngagementBoostersInputSchema>;

const PollSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
});

const GenerateEngagementBoostersOutputSchema = z.object({
  ctas: z.array(z.string()).describe('List of call-to-action lines.'),
  polls: z.array(PollSchema).describe('List of poll questions with options.'),
  prompts: z.array(z.string()).describe('List of comment prompts/questions.'),
});
export type GenerateEngagementBoostersOutput = z.infer<typeof GenerateEngagementBoostersOutputSchema>;

export async function generateEngagementBoosters(
  input: GenerateEngagementBoostersInput
): Promise<GenerateEngagementBoostersOutput> {
  return generateEngagementBoostersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEngagementBoostersPrompt',
  input: { schema: GenerateEngagementBoostersInputSchema },
  output: { schema: GenerateEngagementBoostersOutputSchema },
  prompt: `You are a social media growth strategist. Based on the input, generate high-performing engagement assets.

Constraints:
- Output ONLY JSON with keys: {"ctas": string[], "polls": {"question": string, "options": string[]}[], "prompts": string[]}.
- Count: produce EXACTLY {{#if maxCount}}{{maxCount}}{{else}}8{{/if}} CTAs, {{#if maxCount}}{{maxCount}}{{else}}8{{/if}} prompts, and {{#if maxCount}}{{maxCount}}{{else}}8{{/if}} polls.
- Tailor to content type {{#if contentType}}{{contentType}}{{else}}post{{/if}}, platform {{#if platform}}{{platform}}{{else}}instagram{{/if}}, audience {{#if audience}}{{audience}}{{else}}general{{/if}}, and goal {{#if goal}}{{goal}}{{else}}comments{{/if}}.
- Style: concise, no emojis or hashtags, <= 16 words per item. Avoid generic phrasing; be specific.
- Polls: each should have a clear question and 2–4 short options.

Caption/Topic: {{{caption}}}

Respond ONLY with valid JSON per the schema.
`,
});

const generateEngagementBoostersFlow = ai.defineFlow(
  {
    name: 'generateEngagementBoostersFlow',
    inputSchema: GenerateEngagementBoostersInputSchema,
    outputSchema: GenerateEngagementBoostersOutputSchema,
  },
  async (input) => {
    const desired = input.maxCount ?? 8;
    const { output } = await prompt({ ...input, maxCount: desired });

    function clean(s: string): string {
      return s.replace(/\s+/g, ' ').trim().replace(/["'“”‘’]/g, (m) => ({ '“': '"', '”': '"', '‘': "'", '’': "'" }[m] || m));
    }

    function dedupe<T>(arr: T[], key?: (t: T) => string): T[] {
      const seen = new Set<string>();
      const out: T[] = [];
      for (const item of arr) {
        const k = (key ? key(item) : String(item)).toLowerCase();
        if (!seen.has(k) && k.length > 0) {
          seen.add(k);
          out.push(item);
        }
      }
      return out;
    }

    const raw = output || { ctas: [], polls: [], prompts: [] };

    const ctas = dedupe((raw.ctas || []).map((t: any) => clean(String(t || '')))).slice(0, desired);

    const polls = dedupe(
      (raw.polls || []).map((p: any) => ({
        question: clean(String(p?.question || '')),
        options: Array.isArray(p?.options)
          ? p.options.map((o: any) => clean(String(o || ''))).filter(Boolean).slice(0, 4)
          : [],
      })),
      (p) => `${p.question}|${(p.options || []).join(',')}`
    )
      .map((p) => ({
        question: p.question || 'Which would you choose?',
        options: p.options && p.options.length >= 2 ? p.options.slice(0, 4) : ['Yes', 'No'],
      }))
      .slice(0, desired);

    const prompts = dedupe((raw.prompts || []).map((t: any) => clean(String(t || '')))).slice(0, desired);

    return { ctas, polls, prompts };
  }
);
