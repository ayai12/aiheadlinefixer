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
});
export type GenerateHeadlineVariationsInput = z.infer<typeof GenerateHeadlineVariationsInputSchema>;

const GenerateHeadlineVariationsOutputSchema = z.object({
  variations: z.array(z.string()).describe('An array of 10 optimized headline variations.'),
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
  prompt: `You are an expert copywriter specializing in creating click-worthy headlines.

  I will provide you with a headline. You will generate 10 optimized headline variations designed to boost engagement and drive clicks.

  Original Headline: {{{headline}}}

  Respond in JSON format. The JSON should have a single field called "variations" that contains a JSON array of 10 strings. Each string should be an optimized headline variation. Do not include any other text in the response other than the JSON.
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
    return output!;
  }
);
