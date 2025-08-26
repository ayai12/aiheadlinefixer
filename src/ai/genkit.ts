import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure the Google AI Studio API key is configured at runtime.
if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error(
    'Missing GOOGLE_GENAI_API_KEY. Add it to your environment (e.g., .env.local) before running the app.'
  );
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
