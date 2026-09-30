import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { calculateGoalsFromProfile } from '@/lib/goals';

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

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in .env.local' },
        { status: 500 }
      );
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
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `You are a nutrition assessment assistant for NutriCal. Analyze the conversation and extract structured information.

Conversation history:
${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}

Extract the following information from the conversation:
- primary_goal: One of "Lose Weight", "Maintain Weight", "Gain Weight", "Build Muscle", "Improve General Nutrition"
- age: Number (in years)
- height_cm: Number (in centimeters)
- weight_kg: Number (in kilograms)
- activity_level: One of "Sedentary", "Lightly Active", "Moderately Active", "Very Active"
- diet_type: One of "Vegetarian", "Non-Vegetarian", "Vegan", "Eggetarian", "Other"
- meals_per_day: Number
- foods_to_avoid: String (comma-separated list or empty)

If all required fields (primary_goal, age, height_cm, weight_kg, activity_level) are collected, return type "summary" with a congratulatory message.
Otherwise, return type "question" with the next most important question to ask. Keep questions conversational and brief.

Return JSON matching the schema.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['question', 'summary'] },
                  message: { type: Type.STRING },
                  collected: {
                    type: Type.OBJECT,
                    properties: {
                      primary_goal: { type: Type.STRING },
                      age: { type: Type.NUMBER },
                      height_cm: { type: Type.NUMBER },
                      weight_kg: { type: Type.NUMBER },
                      activity_level: { type: Type.STRING },
                      diet_type: { type: Type.STRING },
                      meals_per_day: { type: Type.NUMBER },
                      foods_to_avoid: { type: Type.STRING },
                    },
                  },
                  goals: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fats: { type: Type.NUMBER },
                    },
                  },
                },
                required: ['type', 'message'],
              },
            },
          });

          const text = response.text;
          if (text) {
            const parsedData = JSON.parse(text);

            // If summary, calculate goals from collected data
            if (parsedData.type === 'summary' && parsedData.collected) {
              const result = calculateGoalsFromProfile(parsedData.collected);
              if (result.canCalculate) {
                parsedData.goals = result.goals;
              }
            }

            return NextResponse.json(parsedData);
          }
        } catch (err: unknown) {
          lastError = err;
          if (err instanceof Error && err.message.includes('503')) {
            await sleep(1000);
            continue;
          }
          break;
        }
      }
    }

    throw lastError || new Error('All model endpoints unavailable');
  } catch (error: unknown) {
    console.error('Assessment API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process assessment' },
      { status: 500 }
    );
  }
}
