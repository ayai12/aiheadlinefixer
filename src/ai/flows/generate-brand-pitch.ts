'use server';

/**
 * @fileOverview Generates custom brand pitch email, media kit summary, and pricing suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBrandPitchInputSchema = z.object({
  niche: z.string().describe('Creator niche or category'),
  audienceSize: z.number().int().min(100).describe('Total audience size across platforms'),
  platforms: z.array(z.string()).min(1).describe('List of platforms the creator is active on'),
  brand: z.string().optional().describe('Target brand to pitch'),
  region: z.string().optional().describe('Region/country focus'),
  pastBrands: z.array(z.string()).optional().describe('Previous collaborations (optional)'),
});
export type GenerateBrandPitchInput = z.infer<typeof GenerateBrandPitchInputSchema>;

const PricingSchema = z.object({
  perPost: z.string(),
  perVideo: z.string(),
  bundle: z.string(),
  notes: z.string(),
});

const MediaKitSchema = z.object({
  bio: z.string(),
  audience: z.string(),
  platforms: z.array(z.object({ name: z.string(), highlights: z.string() })),
  stats: z.array(z.string()),
  pastWork: z.array(z.string()).optional(),
  suggestedDeliverables: z.array(z.string()),
});

const GenerateBrandPitchOutputSchema = z.object({
  email: z.string(),
  mediaKit: MediaKitSchema,
  pricing: PricingSchema,
});
export type GenerateBrandPitchOutput = z.infer<typeof GenerateBrandPitchOutputSchema>;

export async function generateBrandPitch(
  input: GenerateBrandPitchInput
): Promise<GenerateBrandPitchOutput> {
  return generateBrandPitchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBrandPitchPrompt',
  input: { schema: GenerateBrandPitchInputSchema },
  output: { schema: GenerateBrandPitchOutputSchema },
  prompt: `You are a creator partnerships strategist. Generate a custom brand pitch.

Rules:
- Output ONLY JSON with keys: email, mediaKit, pricing.
- Email: concise outreach email (<= 170 words), tailored to {{#if brand}}{{brand}}{{else}}the brand{{/if}}. No emojis.
- MediaKit: bio (1-2 lines), audience summary, platform highlights, key stats, past work, suggested deliverables.
- Pricing: realistic ranges based on audience size ({{audienceSize}}), niche ({{niche}}), and platforms.

Inputs:
- Niche: {{{niche}}}
- Audience size: {{audienceSize}}
- Platforms: {{#each platforms}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Region: {{#if region}}{{region}}{{else}}Global{{/if}}
- Past brands: {{#if pastBrands}}{{#each pastBrands}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Respond ONLY with valid JSON.
`,
});

const generateBrandPitchFlow = ai.defineFlow(
  {
    name: 'generateBrandPitchFlow',
    inputSchema: GenerateBrandPitchInputSchema,
    outputSchema: GenerateBrandPitchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    function clean(s: string): string {
      return s.replace(/\s+/g, ' ').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    }

    // Clean strings
    const email = clean(String(output?.email || ''));
    const mediaKit = {
      bio: clean(String(output?.mediaKit?.bio || '')),
      audience: clean(String(output?.mediaKit?.audience || '')),
      platforms: Array.isArray(output?.mediaKit?.platforms)
        ? output!.mediaKit.platforms.map((p: any) => ({ name: clean(String(p?.name || '')), highlights: clean(String(p?.highlights || '')) }))
        : [],
      stats: Array.isArray(output?.mediaKit?.stats) ? output!.mediaKit.stats.map((s: any) => clean(String(s))) : [],
      pastWork: Array.isArray(output?.mediaKit?.pastWork) ? output!.mediaKit.pastWork.map((s: any) => clean(String(s))) : [],
      suggestedDeliverables: Array.isArray(output?.mediaKit?.suggestedDeliverables)
        ? output!.mediaKit.suggestedDeliverables.map((s: any) => clean(String(s)))
        : ['1x feed post', '1x short-form video', '3x story frames'],
    };

    const pricing = {
      perPost: clean(String(output?.pricing?.perPost || '$200 - $800 per IG post')),
      perVideo: clean(String(output?.pricing?.perVideo || '$400 - $1,500 per short-form video')),
      bundle: clean(String(output?.pricing?.bundle || 'Starter bundle: 1 post + 1 video + 3 stories: $800 - $2,000')),
      notes: clean(String(output?.pricing?.notes || 'Pricing varies by engagement, exclusivity, usage rights, and turnaround.')),
    };

    return { email, mediaKit, pricing };
  }
);
