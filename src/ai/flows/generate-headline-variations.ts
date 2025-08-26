'use server';

/**
 * @fileOverview Generates multiple optimized headline variations from a single input headline.
 *
 * - generateHeadlineVariations - A function that accepts a headline and returns an array of optimized headlines.
 * - GenerateHeadlineVariationsInput - The input type for the generateHeadlineVariations function.
 * - GenerateHeadlineVariationsOutput - The return type for the generateHeadlineVariations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHeadlineVariationsInputSchema = z.object({
  headline: z.string().describe('The original headline to be optimized.'),
  tone: z
    .enum(['authoritative', 'playful', 'friendly', 'urgent', 'professional', 'witty', 'bold', 'casual'])
    .optional()
    .describe('Optional tone preset to guide style.'),
  audience: z
    .enum(['general', 'marketers', 'developers', 'product managers', 'executives', 'founders'])
    .optional()
    .describe('Optional primary audience persona to tailor messaging.'),
  includeKeywords: z.array(z.string()).optional().describe('Optional keywords/phrases that should appear across the set when natural.'),
  excludeKeywords: z.array(z.string()).optional().describe('Optional words/phrases to avoid.'),
  maxWords: z.number().int().positive().optional().describe('Override max words per headline (default 12).'),
  maxChars: z.number().int().positive().optional().describe('Soft cap on characters per headline (default 65).'),
});
export type GenerateHeadlineVariationsInput = z.infer<typeof GenerateHeadlineVariationsInputSchema>;

const GenerateHeadlineVariationsOutputSchema = z.object({
  variations: z.array(z.string()).describe('An array of 5 optimized headline variations.'),
});
export type GenerateHeadlineVariationsOutput = z.infer<
  typeof GenerateHeadlineVariationsOutputSchema
>;

export async function generateHeadlineVariations(
  input: GenerateHeadlineVariationsInput
): Promise<GenerateHeadlineVariationsOutput> {
  return generateHeadlineVariationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHeadlineVariationsPrompt',
  input: {schema: GenerateHeadlineVariationsInputSchema},
  output: {schema: GenerateHeadlineVariationsOutputSchema},
  prompt: `You are an expert direct-response copywriter who specializes in crafting highly clickable, engaging, and curiosity-driven headlines for articles, landing pages, and ads.

I will provide you with one original headline. You will generate 5 unique headline variations that are designed to maximize engagement, click-through rate, and reader curiosity.

Strict formatting and style rules:
- Each headline must be concise: maximum {{#if maxWords}}{{maxWords}}{{else}}12{{/if}} words.
- Use proven techniques: numbers, power words, emotional triggers, urgency, and curiosity gaps.
- Vary structures; avoid repeating the same pattern across the 5 headlines.
- Be compelling but not misleading or spammy. Avoid overhype like "You Won't Believe" or ALL CAPS.
- No emojis or excessive punctuation. One punctuation mark max at the end (e.g., ?, !). No trailing periods.
- Use Chicago/APA-style Title Case (capitalize major words; keep small words lowercase unless first/last).
- Do not copy the original headline—reframe it creatively.

{{#if tone}}Adopt this tone consistently across the set: {{tone}}.{{/if}}
{{#if audience}}Tailor the language and value proposition to this audience: {{audience}}.{{/if}}
{{#if includeKeywords}}Where natural and high-quality, incorporate these keywords across the variations: {{includeKeywords}}.{{/if}}
{{#if excludeKeywords}}Avoid these words/phrases: {{excludeKeywords}}.{{/if}}

Original Headline: {{{headline}}}

Respond ONLY in valid JSON.
The JSON must have a single key "variations", whose value is an array of exactly 5 strings (the headline variations).
Do not include any explanations, extra text, or formatting outside of the JSON.

  `,
});

const generateHeadlineVariationsFlow = ai.defineFlow(
  {
    name: 'generateHeadlineVariationsFlow',
    inputSchema: GenerateHeadlineVariationsInputSchema,
    outputSchema: GenerateHeadlineVariationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    // Post-processing to ensure clean, consistent, high-quality headlines
    const MAX_WORDS = input.maxWords ?? 12;
    const MAX_CHARS = input.maxChars ?? 65; // soft cap for readability in many UIs/SEO contexts

    const smallWords = new Set([
      'a','an','and','as','at','but','by','for','from','in','into','nor','of','on','onto','or','out','over','per','so','the','to','up','via','vs','with'
    ]);

    function collapseWhitespace(s: string): string {
      return s.replace(/\s+/g, ' ').trim();
    }

    function stripSurroundingQuotes(s: string): string {
      return s.replace(/^\s*["'“”‘’]+\s*/g, '').replace(/\s*["'“”‘’]+\s*$/g, '');
    }

    function stripTrailingPeriodsAndExcessPunct(s: string): string {
      // Remove trailing periods and excessive punctuation (keep at most one ?, !, or nothing)
      const trimmed = s.replace(/[\.!]+$/g, '');
      // If it ends with multiple ? or !, compress to single
      return trimmed.replace(/[!?]{2,}$/g, match => match[0]);
    }

    function toTitleCase(s: string): string {
      const words = s.split(' ');
      return words
        .map((w, i) => {
          const lower = w.toLowerCase();
          const isFirstOrLast = i === 0 || i === words.length - 1;
          const base = /[A-Za-z0-9]/.test(w) ? w : lower; // preserve numerals/mixed
          if (!isFirstOrLast && smallWords.has(lower)) return lower;
          // Capitalize first letter, keep the rest lower (except keep ALL CAPS acronyms like AI)
          if (/^[A-Z0-9]{2,}$/.test(w)) return w; // likely acronym
          return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
        })
        .join(' ')
        // Handle common terms
        .replace(/\bAi\b/g, 'AI')
        .replace(/\bSeo\b/g, 'SEO');
    }

    function enforceWordLimit(s: string, maxWords: number): string {
      const words = s.split(' ');
      if (words.length <= maxWords) return s;
      return words.slice(0, maxWords).join(' ');
    }

    function enforceCharLimit(s: string, maxChars: number): string {
      if (s.length <= maxChars) return s;
      // Try to cut at last space before limit to avoid mid-word cuts
      const cut = s.slice(0, maxChars);
      const lastSpace = cut.lastIndexOf(' ');
      return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
    }

    function cleanHeadline(s: string): string {
      let out = collapseWhitespace(s);
      out = stripSurroundingQuotes(out);
      out = stripTrailingPeriodsAndExcessPunct(out);
      out = enforceWordLimit(out, MAX_WORDS);
      out = enforceCharLimit(out, MAX_CHARS);
      out = toTitleCase(out);
      return out;
    }

    const raw = output?.variations ?? [];
    const cleaned: string[] = [];
    const seen = new Set<string>();

    const banned = (input.excludeKeywords ?? []).map(k => k.toLowerCase());
    const required = (input.includeKeywords ?? []).map(k => k.toLowerCase());

    function containsBanned(s: string): boolean {
      const l = s.toLowerCase();
      return banned.some(k => l.includes(k));
    }

    function includeScore(s: string): number {
      const l = s.toLowerCase();
      let score = 0;
      for (const k of required) if (l.includes(k)) score++;
      return score;
    }

    // First pass: clean, filter banned, dedupe
    const interim: string[] = [];
    for (const h of raw) {
      const c = cleanHeadline(h);
      if (!c || containsBanned(c)) continue;
      const key = c.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        interim.push(c);
      }
    }

    // Sort by presence of required keywords (descending)
    interim.sort((a, b) => includeScore(b) - includeScore(a));

    for (const c of interim) {
      cleaned.push(c);
      if (cleaned.length === 5) break;
    }

    // If fewer than 10 after dedupe/cleaning, backfill with non-unique but cleaned variants to satisfy schema
    for (const h of raw) {
      if (cleaned.length === 5) break;
      const c = cleanHeadline(h);
      if (c.length > 0 && !containsBanned(c)) cleaned.push(c);
    }

    // Ensure exactly 5 items (truncate if the model returned more)
    const finalVariations = cleaned.slice(0, 5);

    return {variations: finalVariations};
  }
);
