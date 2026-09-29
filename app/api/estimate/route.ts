import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-3.8-flash',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Meal prompt is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in .env.local' }, { status: 500 });
    }

    let lastError: any = null;

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
        } catch (err: any) {
          lastError = err;
          // If 503 temporary overload, pause briefly before retrying or moving on
          if (err?.status === 'UNAVAILABLE' || err?.message?.includes('503')) {
            await sleep(1000);
            continue;
          }
          break; // For 404 or other errors, immediately switch model
        }
      }
    }

    throw lastError || new Error('All model endpoints unavailable');
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to estimate nutrition' },
      { status: 500 }
    );
  }
}