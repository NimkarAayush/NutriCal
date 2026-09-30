import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Generous upper bounds that only reject obviously malformed values,
// not legitimate nutrition data.
const MAX_CALORIES = 20000;
const MAX_MACRO_GRAMS = 5000;

function isValidAmount(value: unknown, max: number): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
  );
}

function validateMealMacros(data: {
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fats?: unknown;
}): string | null {
  const fields: Array<[string, unknown, number]> = [
    ['calories', data.calories, MAX_CALORIES],
    ['protein', data.protein, MAX_MACRO_GRAMS],
    ['carbs', data.carbs, MAX_MACRO_GRAMS],
    ['fats', data.fats, MAX_MACRO_GRAMS],
  ];
  for (const [name, value, max] of fields) {
    if (!isValidAmount(value, max)) {
      return `Invalid ${name}: must be a finite, non-negative number`;
    }
  }
  return null;
}

function validateGoalTargets(goals: {
  calorie_target?: unknown;
  protein_target?: unknown;
  carbs_target?: unknown;
  fats_target?: unknown;
}): string | null {
  const fields: Array<[string, unknown, number]> = [
    ['calorie_target', goals.calorie_target, MAX_CALORIES],
    ['protein_target', goals.protein_target, MAX_MACRO_GRAMS],
    ['carbs_target', goals.carbs_target, MAX_MACRO_GRAMS],
    ['fats_target', goals.fats_target, MAX_MACRO_GRAMS],
  ];
  for (const [name, value, max] of fields) {
    if (value === undefined || value === null) {
      return `Missing required goal value: ${name}`;
    }
    if (!isValidAmount(value, max)) {
      return `Invalid ${name}: must be a finite, non-negative number`;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { type, data } = await req.json();

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Action type and data are required' },
        { status: 400 }
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

    switch (type) {
      case 'log_meal': {
        const mealName =
          typeof data.meal_name === 'string' ? data.meal_name.trim() : '';
        if (!mealName) {
          return NextResponse.json(
            { error: 'A non-empty meal name is required' },
            { status: 400 }
          );
        }

        const mealError = validateMealMacros(data);
        if (mealError) {
          return NextResponse.json({ error: mealError }, { status: 400 });
        }

        const { error } = await supabase.from('meal_logs').insert([
          {
            user_id: user.id,
            meal_name: mealName,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fats: data.fats,
            logged_date: new Date().toISOString().split('T')[0],
          },
        ]);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `Logged "${mealName}" successfully`,
        });
      }

      case 'change_goals': {
        // Canonical field names (produced by /api/coach) take precedence;
        // legacy short names are still accepted for backward compatibility.
        const goals = {
          calorie_target: data.calorie_target ?? data.calories,
          protein_target: data.protein_target ?? data.protein,
          carbs_target: data.carbs_target ?? data.carbs,
          fats_target: data.fats_target ?? data.fats,
        };

        const goalsError = validateGoalTargets(goals);
        if (goalsError) {
          return NextResponse.json({ error: goalsError }, { status: 400 });
        }

        const { error } = await supabase
          .from('nutrition_goals')
          .upsert(
            {
              user_id: user.id,
              calorie_target: goals.calorie_target,
              protein_target: goals.protein_target,
              carbs_target: goals.carbs_target,
              fats_target: goals.fats_target,
              goal_type: 'custom',
              source: 'ai_generated',
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: 'Goals updated successfully',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action type' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error('Action API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute action',
      },
      { status: 500 }
    );
  }
}
