'use server';

/**
 * @fileOverview Generates scroll-stopping hooks and platform-optimized captions for short-form video (Reels/TikTok/Shorts).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHookCaptionsInputSchema = z.object({
  topic: z.string().describe('Topic/idea for the short-form video.'),
  platform: z.enum(['tiktok', 'instagram', 'youtube']).optional(),
  tone: z.enum(['neutral', 'energetic', 'educational', 'witty', 'bold']).optional(),
  count: z.number().int().min(4).max(25).optional().describe('How many pairs to generate. Default 10.'),
});
export type GenerateHookCaptionsInput = z.infer<typeof GenerateHookCaptionsInputSchema>;

const ItemSchema = z.object({
  hook: z.string(),
  caption: z.string(),
});

const GenerateHookCaptionsOutputSchema = z.object({
  items: z.array(ItemSchema).describe('List of hook+caption pairs.'),
});
export type GenerateHookCaptionsOutput = z.infer<typeof GenerateHookCaptionsOutputSchema>;

export async function generateHookCaptions(
  input: GenerateHookCaptionsInput
): Promise<GenerateHookCaptionsOutput> {
  return generateHookCaptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHookCaptionsPrompt',
  input: { schema: GenerateHookCaptionsInputSchema },
  output: { schema: GenerateHookCaptionsOutputSchema },
  prompt: `You are an expert short-form content strategist. Generate hook + caption pairs that win the first 3 seconds.

Rules:
- Output ONLY JSON with key "items": [{"hook": string, "caption": string}].
- Return EXACTLY {{#if count}}{{count}}{{else}}10{{/if}} pairs.
- Hook: 6–12 words, punchy, no emojis/hashtags, no quotes. On-screen safe.
- Caption: 1–2 lines, platform-optimized for {{#if platform}}{{platform}}{{else}}instagram{{/if}}, end with a clear CTA. No emojis/hashtags.
- Tone: {{#if tone}}{{tone}}{{else}}neutral{{/if}}. Keep language concise and specific.
- Avoid clickbait clichés; be concrete. Use everyday language.

Topic: {{{topic}}}

Respond ONLY with valid JSON.
`,
});

const generateHookCaptionsFlow = ai.defineFlow(
  {
    name: 'generateHookCaptionsFlow',
    inputSchema: GenerateHookCaptionsInputSchema,
    outputSchema: GenerateHookCaptionsOutputSchema,
  },
  async (input) => {
    const desired = input.count ?? 10;
    const { output } = await prompt({ ...input, count: desired });

    function clean(s: string): string {
      return s
        .replace(/\s+/g, ' ')
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // strip emojis
        .replace(/["\u201C\u201D]/g, '') // remove quotes
        .trim();
    }

    function limitWords(s: string, max: number): string {
      const words = s.split(' ');
      return words.length <= max ? s : words.slice(0, max).join(' ');
    }

    const rawItems = Array.isArray(output?.items) ? output!.items : [];

    let items = rawItems
      .map((it: any, idx: number) => {
        const hook = limitWords(clean(String(it?.hook || `Hook ${idx + 1}`)), 12);
        // Caption max ~ 32 words to keep 1–2 lines short
        const caption = limitWords(clean(String(it?.caption || 'Watch till the end for the punchline.')), 32)
          .replace(/[#]|@/g, '')
          .trim();
        return { hook, caption };
      })
      .filter((it: { hook: string; caption: string }) => it.hook.length >= 6 && it.caption.length >= 8);

    // Dedupe by hook text
    const seen = new Set<string>();
    items = items.filter((it) => {
      const k = it.hook.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Enforce count
    items = items.slice(0, desired);
    while (items.length < desired) {
      items.push({ hook: `Try this in 60 seconds`, caption: `Save this so you can try it later. Then share your result.` });
    }

    return { items };
  }
);
