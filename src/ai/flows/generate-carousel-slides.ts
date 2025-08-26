'use server';

/**
 * @fileOverview Generates a structured Instagram/LinkedIn-style carousel from a caption/topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCarouselSlidesInputSchema = z.object({
  caption: z.string().describe('Topic or caption to turn into a carousel.'),
  slides: z.number().int().min(3).max(10).optional().describe('Number of slides (default 7).'),
  style: z
    .enum(['educational', 'tips', 'story', 'case-study'])
    .optional()
    .describe('Narrative style for the carousel.'),
  platform: z.enum(['instagram', 'linkedin', 'twitter']).optional(),
  audience: z
    .enum(['general', 'marketers', 'developers', 'founders', 'creators'])
    .optional(),
});
export type GenerateCarouselSlidesInput = z.infer<typeof GenerateCarouselSlidesInputSchema>;

const SlideSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()),
});

const GenerateCarouselSlidesOutputSchema = z.object({
  slides: z.array(SlideSchema).describe('Ordered slides for the carousel.'),
});
export type GenerateCarouselSlidesOutput = z.infer<typeof GenerateCarouselSlidesOutputSchema>;

export async function generateCarouselSlides(
  input: GenerateCarouselSlidesInput
): Promise<GenerateCarouselSlidesOutput> {
  return generateCarouselSlidesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCarouselSlidesPrompt',
  input: { schema: GenerateCarouselSlidesInputSchema },
  output: { schema: GenerateCarouselSlidesOutputSchema },
  prompt: `You are an expert content strategist. Create a concise social media carousel from the provided caption/topic.

Rules:
- Return EXACTLY {{#if slides}}{{slides}}{{else}}7{{/if}} slides.
- Output ONLY JSON with key "slides": [{"title": string, "bullets": string[]}].
- Slide 1 should be a hook with a bold promise. The last slide should be a clear CTA.
- Each slide:
  - title: <= 8 words, punchy, no ending period
  - bullets: 2–4 bullets, each <= 16 words, no emojis, no hashtags
- Maintain consistent voice. Style: {{#if style}}{{style}}{{else}}educational{{/if}}.
- Platform: {{#if platform}}{{platform}}{{else}}instagram{{/if}}.
- Audience focus: {{#if audience}}{{audience}}{{else}}general{{/if}}.

Caption: {{{caption}}}

Respond ONLY in valid JSON.
`,
});

const generateCarouselSlidesFlow = ai.defineFlow(
  {
    name: 'generateCarouselSlidesFlow',
    inputSchema: GenerateCarouselSlidesInputSchema,
    outputSchema: GenerateCarouselSlidesOutputSchema,
  },
  async (input) => {
    const desired = input.slides ?? 7;
    const { output } = await prompt({ ...input, slides: desired });

    function cleanText(s: string): string {
      return s.replace(/\s+/g, ' ').trim().replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
    }

    function trimWords(s: string, max: number): string {
      const words = s.split(' ');
      return words.length <= max ? s : words.slice(0, max).join(' ');
    }

    const slides = (output?.slides ?? []).map((sl: any, i: number) => {
      const title = trimWords(cleanText(String(sl?.title ?? '')), 10);
      const bulletsArr = Array.isArray(sl?.bullets) ? sl.bullets : [];
      const bullets = bulletsArr
        .map((b: any) => trimWords(cleanText(String(b ?? '')), 22))
        .filter((b: string) => b.length > 0)
        .slice(0, 5);
      return { title: title || (i === 0 ? 'Big Idea' : `Slide ${i + 1}`), bullets: bullets.length ? bullets : [''] };
    });

    // Ensure exact count
    const finalSlides = slides.slice(0, desired);
    while (finalSlides.length < desired) {
      finalSlides.push({ title: `Slide ${finalSlides.length + 1}`, bullets: [''] });
    }

    // Ensure last slide CTA if missing
    const last = finalSlides[finalSlides.length - 1];
    if (!/cta|call to action|follow|save|learn more/i.test(last.title)) {
      finalSlides[finalSlides.length - 1] = {
        title: 'Your Turn — Try This',
        bullets: ['Follow for more', 'Save this post', 'Share with a friend'],
      };
    }

    return { slides: finalSlides };
  }
);
