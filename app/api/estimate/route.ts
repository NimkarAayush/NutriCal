import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Fast models first. The heavier `-flash` models can stall for 25s+
// under free-tier load, so the lighter lite models lead and act as
// the primary path. Every attempt is capped by MODEL_TIMEOUT_MS, so a
// stalled request falls through to the next candidate instead of
// leaving the user on "Estimating...".
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
];

const MODEL_TIMEOUT_MS = 10000;

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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Estimate realistic nutrition macros for: "${prompt}". Also estimate key micronutrients (vitamin A in mcg, vitamin C in mg, vitamin D in mcg, iron in mg, calcium in mg, potassium in mg); use 0 when negligible. Return valid JSON matching the schema.`,
          config: {
            responseMimeType: 'application/json',
            abortSignal: controller.signal,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                meal_name: { type: Type.STRING, description: 'Clean formatted name of the meal' },
                calories: { type: Type.NUMBER, description: 'Total calories in kcal' },
                protein: { type: Type.NUMBER, description: 'Protein in grams' },
                carbs: { type: Type.NUMBER, description: 'Carbohydrates in grams' },
                fats: { type: Type.NUMBER, description: 'Fats in grams' },
                vitamin_a_mcg: { type: Type.NUMBER, description: 'Estimated vitamin A in micrograms (mcg RAE)' },
                vitamin_c_mg: { type: Type.NUMBER, description: 'Estimated vitamin C in milligrams' },
                vitamin_d_mcg: { type: Type.NUMBER, description: 'Estimated vitamin D in micrograms' },
                iron_mg: { type: Type.NUMBER, description: 'Estimated iron in milligrams' },
                calcium_mg: { type: Type.NUMBER, description: 'Estimated calcium in milligrams' },
                potassium_mg: { type: Type.NUMBER, description: 'Estimated potassium in milligrams' },
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
        // An abort means this model stalled past the deadline, so move
        // straight on to the next candidate instead of retrying it.
        lastError =
          err instanceof Error && err.name === 'AbortError'
            ? new Error('The AI took too long to respond. Please try again.')
            : err;
      } finally {
        clearTimeout(timeout);
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