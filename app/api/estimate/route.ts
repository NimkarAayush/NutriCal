import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Current stable models per Google's model docs (Sept 2026).
// 2.0/1.5-family models are shut down and return 404.
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Safely read a message from an unknown thrown value,
// matching the previous `err?.message` behavior without using `any`.
function readErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Meal prompt is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in .env.local' }, { status: 500 });
    }

    // Require an authenticated user before calling Gemini.
    // NOTE: must use the server client here — the browser client cannot
    // read session cookies inside an API route, which caused false 401s.
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let lastError: unknown = null;

    for (const model of CANDIDATE_MODELS) {
      // Retry up to 2 times per model if a 503 spike occurs
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `Estimate realistic nutrition macros for: "${prompt}". Return valid JSON matching the schema.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  meal_name: { type: Type.STRING, description: 'Clean formatted name of the meal' },
                  calories: { type: Type.NUMBER, description: 'Total calories in kcal' },
                  protein: { type: Type.NUMBER, description: 'Protein in grams' },
                  carbs: { type: Type.NUMBER, description: 'Carbohydrates in grams' },
                  fats: { type: Type.NUMBER, description: 'Fats in grams' },
                },
                required: ['meal_name', 'calories', 'protein', 'carbs', 'fats'],
              },
            },
          });

          const text = response.text;
          if (text) {
            const parsedData = JSON.parse(text);
            return NextResponse.json(parsedData);
          }
        } catch (err: unknown) {
          lastError = err;
          // If 503 temporary overload, pause briefly before retrying or moving on
          const errStatus =
            typeof err === 'object' && err !== null && 'status' in err
              ? (err as { status: unknown }).status
              : undefined;
          const errMessage = readErrorMessage(err);
          if (errStatus === 'UNAVAILABLE' || errMessage.includes('503')) {
            await sleep(1000);
            continue;
          }
          break; // For 404 or other errors, immediately switch model
        }
      }
    }

    throw lastError || new Error('All model endpoints unavailable');
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: readErrorMessage(error) || 'Failed to estimate nutrition' },
      { status: 500 }
    );
  }
}