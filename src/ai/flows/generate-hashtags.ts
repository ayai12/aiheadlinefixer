'use server';

/**
 * @fileOverview Generates a set of optimized hashtags from a caption/topic and options.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHashtagsInputSchema = z.object({
  caption: z.string().describe('Caption or topic to base hashtags on.'),
  platform: z
    .enum(['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin'])
    .optional()
    .describe('Optional primary platform.'),
  includeKeywords: z.array(z.string()).optional().describe('Optional keywords to include across the set where natural.'),
  excludeKeywords: z.array(z.string()).optional().describe('Optional words to avoid in hashtags.'),
  maxCount: z.number().int().positive().max(50).optional().describe('Number of hashtags to return (default 20).'),
});
export type GenerateHashtagsInput = z.infer<typeof GenerateHashtagsInputSchema>;

const GenerateHashtagsOutputSchema = z.object({
  hashtags: z.array(z.string()).describe('Array of hashtags (e.g., #growth).'),
});
export type GenerateHashtagsOutput = z.infer<typeof GenerateHashtagsOutputSchema>;

export async function generateHashtags(
  input: GenerateHashtagsInput
): Promise<GenerateHashtagsOutput> {
  return generateHashtagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHashtagsPrompt',
  input: { schema: GenerateHashtagsInputSchema },
  output: { schema: GenerateHashtagsOutputSchema },
  prompt: `You are an expert social media strategist. Given a caption/topic and optional platform, produce a set of high-quality hashtags.

Strict rules:
- Return exactly {{#if maxCount}}{{maxCount}}{{else}}20{{/if}} hashtags.
- Output only JSON with a single key "hashtags" mapping to an array of strings.
- Each hashtag must:
  - begin with '#'
  - contain no spaces
  - use lowercase letters/numbers only (no emojis)
  - be relevant to the caption/topic and {{#if platform}}platform: {{platform}}{{else}}the target platform{{/if}}.
- Mix tiers: ~25% popular, ~50% medium-competition, ~25% niche/long-tail.
- Avoid banned/excluded words: {{excludeKeywords}}
- Prefer including these concepts when natural: {{includeKeywords}}

Caption: {{{caption}}}

Respond ONLY in valid JSON.
`,
});

const generateHashtagsFlow = ai.defineFlow(
  {
    name: 'generateHashtagsFlow',
    inputSchema: GenerateHashtagsInputSchema,
    outputSchema: GenerateHashtagsOutputSchema,
  },
  async (input) => {
    const desired = input.maxCount ?? 20;
    const { output } = await prompt({ ...input, maxCount: desired });

    const banned = (input.excludeKeywords ?? []).map((k) => k.toLowerCase());

    function normalizeTag(s: string): string {
      let t = s.trim();
      // remove surrounding quotes
      t = t.replace(/^\s*["'“”‘’]+\s*/g, '').replace(/\s*["'“”‘’]+\s*$/g, '');
      // ensure starts with '#'
      if (!t.startsWith('#')) t = '#' + t;
      // strip invalid characters, keep letters/numbers/_
      t = '#' + t.slice(1).toLowerCase().replace(/[^a-z0-9_]/g, '');
      // collapse multiple underscores
      t = '#' + t.slice(1).replace(/_+/g, '_');
      // trim very short/empty
      if (t === '#' || t.length < 3) return '';
      return t;
    }

    function containsBanned(t: string): boolean {
      const l = t.toLowerCase();
      return banned.some((k) => l.includes(k));
    }

    const seen = new Set<string>();
    const cleaned: string[] = [];

    const raw = output?.hashtags ?? [];
    for (const h of raw) {
      const tag = normalizeTag(h);
      if (!tag || containsBanned(tag)) continue;
      const key = tag.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        cleaned.push(tag);
      }
      if (cleaned.length >= desired) break;
    }

    // If not enough, attempt to derive simple variants from existing (e.g., singular/plural)
    if (cleaned.length < desired) {
      const extras: string[] = [];
      for (const base of cleaned) {
        const core = base.slice(1);
        if (core.endsWith('s')) extras.push('#' + core.slice(0, -1));
        else extras.push('#' + core + 's');
        if (extras.length + cleaned.length >= desired) break;
      }
      for (const e of extras) {
        const k = e.toLowerCase();
        if (!seen.has(k) && !containsBanned(e) && e.length >= 3) {
          seen.add(k);
          cleaned.push(e);
          if (cleaned.length >= desired) break;
        }
      }
    }

    return { hashtags: cleaned.slice(0, desired) };
  }
);
