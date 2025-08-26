'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePodcastHooksInputSchema = z.object({
  topic: z.string().min(5).describe('Podcast episode topic or description'),
  platform: z.enum(['spotify', 'apple', 'youtube', 'any']).optional(),
  tone: z.enum(['educational', 'insightful', 'controversial', 'story', 'humorous']).optional(),
  maxCount: z.number().int().min(5).max(25).default(12),
});
export type GeneratePodcastHooksInput = z.infer<typeof GeneratePodcastHooksInputSchema>;

const GeneratePodcastHooksOutputSchema = z.object({
  hooks: z.array(z.string()).describe('Short, punchy podcast hooks'),
});
export type GeneratePodcastHooksOutput = z.infer<typeof GeneratePodcastHooksOutputSchema>;

export async function generatePodcastHooks(
  input: GeneratePodcastHooksInput
): Promise<GeneratePodcastHooksOutput> {
  return generatePodcastHooksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePodcastHooksPrompt',
  input: { schema: GeneratePodcastHooksInputSchema },
  output: { schema: GeneratePodcastHooksOutputSchema },
  prompt: `You are a top-tier podcast marketer. Create irresistible hooks for a podcast episode.

Rules:
- Return ONLY JSON with key "hooks": [string, ...].
- Generate {{#if maxCount}}{{maxCount}}{{else}}12{{/if}} hooks, each 6–14 words.
- No emojis, no hashtags, no quotes, no numbering.
- Hooks must stand alone and trigger curiosity.
- Tone: {{#if tone}}{{tone}}{{else}}insightful{{/if}}.
- Platform context (if relevant): {{#if platform}}{{platform}}{{else}}any{{/if}}.

Topic: {{{topic}}}

Respond ONLY in valid JSON.
`,
});

const generatePodcastHooksFlow = ai.defineFlow(
  {
    name: 'generatePodcastHooksFlow',
    inputSchema: GeneratePodcastHooksInputSchema,
    outputSchema: GeneratePodcastHooksOutputSchema,
  },
  async (input) => {
    const desired = input.maxCount ?? 12;
    const { output } = await prompt({ ...input, maxCount: desired });

    function cleanHook(s: string): string {
      return String(s || '')
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // remove emojis
        .replace(/^[\-\d\.)\s]+/, '') // strip leading numbering/punctuation
        .replace(/[“”"']+/g, '') // strip quotes
        .replace(/\s+/g, ' ') // collapse spaces
        .trim();
    }

    let hooks = Array.isArray(output?.hooks) ? output!.hooks.map(cleanHook) : [];
    hooks = hooks.filter((h) => h.length >= 6 && h.length <= 120);

    // Deduplicate case-insensitively
    const seen = new Set<string>();
    hooks = hooks.filter((h) => {
      const k = h.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    hooks = hooks.slice(0, desired);
    while (hooks.length < desired) hooks.push('');

    return { hooks };
  }
);
