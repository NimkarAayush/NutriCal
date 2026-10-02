import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DEFAULT_GOALS } from '@/lib/goals';

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
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    // Get authenticated user via the server client so request
    // cookies are visible (the browser client cannot see them here).
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load user context
    const [profileRes, goalsRes, mealsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
      supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false }),
    ]);

    // Build context
    const profile = profileRes.data;
    const goals = goalsRes.data;
    const meals = mealsRes.data || [];

    const todayTotals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (Number(m.calories) || 0),
        protein: acc.protein + (Number(m.protein) || 0),
        carbs: acc.carbs + (Number(m.carbs) || 0),
        fats: acc.fats + (Number(m.fats) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const context = buildContext(profile, goals, todayTotals, meals);

    let lastError: unknown = null;

    for (const model of CANDIDATE_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `${context}

Conversation history:
${(history || [])
  .map(
    (m: { role: string; content: string }) => `${m.role}: ${m.content}`
  )
  .join('\n')}

User question: ${message}

Respond as a nutrition education and wellness assistant. Be concise, practical, and encouraging. Use the user's context to personalize your response. Do not diagnose or prescribe.

If the user wants to log a meal, return type "log_meal" with the meal data, including estimated micronutrients (vitamin A in mcg, vitamin C in mg, vitamin D in mcg, iron in mg, calcium in mg, potassium in mg; use 0 when negligible).
If the user wants to change their nutrition goals, return type "change_goals" with the new goals.
Otherwise, return type "response" with a text response.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ['response', 'log_meal', 'change_goals'],
                  },
                  response: { type: Type.STRING },
                  action: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      data: {
                        type: Type.OBJECT,
                        properties: {
                          meal_name: { type: Type.STRING },
                          calories: { type: Type.NUMBER },
                          protein: { type: Type.NUMBER },
                          carbs: { type: Type.NUMBER },
                          fats: { type: Type.NUMBER },
                          vitamin_a_mcg: { type: Type.NUMBER },
                          vitamin_c_mg: { type: Type.NUMBER },
                          vitamin_d_mcg: { type: Type.NUMBER },
                          iron_mg: { type: Type.NUMBER },
                          calcium_mg: { type: Type.NUMBER },
                          potassium_mg: { type: Type.NUMBER },
                          calorie_target: { type: Type.NUMBER },
                          protein_target: { type: Type.NUMBER },
                          carbs_target: { type: Type.NUMBER },
                          fats_target: { type: Type.NUMBER },
                        },
                      },
                      message: { type: Type.STRING },
                    },
                  },
                },
                required: ['type'],
              },
            },
          });

          const text = response.text;
          if (text) {
            const parsed = JSON.parse(text);
            return NextResponse.json(parsed);
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
    console.error('Coach API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process message' },
      { status: 500 }
    );
  }
}

interface ProfileData {
  full_name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  primary_goal?: string;
  diet_type?: string;
  workout_frequency?: number;
  sleep_hours?: number;
}

interface GoalsData {
  calorie_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fats_target?: number;
}

interface MealData {
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

function buildContext(
  profile: ProfileData | null,
  goals: GoalsData | null,
  todayTotals: { calories: number; protein: number; carbs: number; fats: number },
  meals: MealData[]
): string {
  const lines: string[] = [];

  lines.push('USER PROFILE:');
  if (profile) {
    if (profile.full_name) lines.push(`Name: ${profile.full_name}`);
    if (profile.age) lines.push(`Age: ${profile.age}`);
    if (profile.gender) lines.push(`Gender: ${profile.gender}`);
    if (profile.height_cm) lines.push(`Height: ${profile.height_cm} cm`);
    if (profile.weight_kg) lines.push(`Weight: ${profile.weight_kg} kg`);
    if (profile.activity_level) lines.push(`Activity: ${profile.activity_level}`);
    if (profile.primary_goal) lines.push(`Goal: ${profile.primary_goal}`);
    if (profile.diet_type) lines.push(`Diet: ${profile.diet_type}`);
    if (profile.workout_frequency)
      lines.push(`Workout: ${profile.workout_frequency}x/week`);
    if (profile.sleep_hours) lines.push(`Sleep: ${profile.sleep_hours} hours`);
  } else {
    lines.push('No profile information available.');
  }

  lines.push('');
  lines.push('NUTRITION TARGETS:');
  if (goals) {
    lines.push(`Calories: ${goals.calorie_target} kcal`);
    lines.push(`Protein: ${goals.protein_target}g`);
    lines.push(`Carbs: ${goals.carbs_target}g`);
    lines.push(`Fats: ${goals.fats_target}g`);
  } else {
    lines.push(`Calories: ${DEFAULT_GOALS.calories} kcal`);
    lines.push(`Protein: ${DEFAULT_GOALS.protein}g`);
    lines.push(`Carbs: ${DEFAULT_GOALS.carbs}g`);
    lines.push(`Fats: ${DEFAULT_GOALS.fats}g`);
  }

  lines.push('');
  lines.push("TODAY'S NUTRITION:");
  lines.push(`Calories consumed: ${todayTotals.calories} kcal`);
  lines.push(`Protein consumed: ${todayTotals.protein}g`);
  lines.push(`Carbs consumed: ${todayTotals.carbs}g`);
  lines.push(`Fats consumed: ${todayTotals.fats}g`);

  lines.push('');
  lines.push("TODAY'S MEALS:");
  if (meals.length > 0) {
    meals.forEach((m) => {
      lines.push(`- ${m.meal_name} (${m.calories} kcal, P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fats}g)`);
    });
  } else {
    lines.push('No meals logged yet today.');
  }

  return lines.join('\n');
}
