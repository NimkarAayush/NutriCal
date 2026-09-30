// --- TYPES ---
export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface ProfileForGoals {
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  primary_goal: string | null;
}

export interface CalculatedGoalsResult {
  goals: NutritionGoals;
  canCalculate: boolean;
  missingFields: string[];
}

// --- CONSTANTS ---
export const DEFAULT_GOALS: NutritionGoals = {
  calories: 2200,
  protein: 140,
  carbs: 250,
  fats: 65,
};

// Activity multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Sedentary: 1.2,
  'Lightly Active': 1.375,
  'Moderately Active': 1.55,
  'Very Active': 1.725,
};

// Calorie adjustments based on primary goal
const GOAL_CALORIE_ADJUSTMENTS: Record<string, number> = {
  'Lose Weight': -500,
  'Maintain Weight': 0,
  'Gain Weight': 300,
  'Build Muscle': 200,
  'Improve General Nutrition': 0,
};

// Protein per kg body weight based on goal
const PROTEIN_PER_KG: Record<string, number> = {
  'Lose Weight': 1.8,
  'Maintain Weight': 1.4,
  'Gain Weight': 1.8,
  'Build Muscle': 2.0,
  'Improve General Nutrition': 1.4,
};

// --- CALCULATION ---
/**
 * Calculate personalized nutrition goals based on user profile.
 * Uses the Mifflin-St Jeor equation for BMR, then applies
 * activity multiplier and goal-specific adjustments.
 *
 * Returns the calculated goals and a list of missing fields
 * if there isn't enough information to calculate.
 */
export function calculateGoalsFromProfile(
  profile: ProfileForGoals
): CalculatedGoalsResult {
  const missingFields: string[] = [];

  // Check required fields
  if (!profile.age) missingFields.push('age');
  if (!profile.gender) missingFields.push('gender');
  if (!profile.height_cm) missingFields.push('height');
  if (!profile.weight_kg) missingFields.push('weight');
  if (!profile.activity_level) missingFields.push('activity level');

  // If any required field is missing, we can't calculate
  if (missingFields.length > 0) {
    return {
      goals: DEFAULT_GOALS,
      canCalculate: false,
      missingFields,
    };
  }

  // Mifflin-St Jeor Equation for BMR
  let bmr: number;
  if (profile.gender === 'Male') {
    bmr = 10 * profile.weight_kg! + 6.25 * profile.height_cm! - 5 * profile.age! + 5;
  } else {
    bmr =
      10 * profile.weight_kg! + 6.25 * profile.height_cm! - 5 * profile.age! - 161;
  }

  // Apply activity multiplier
  const activityMultiplier =
    ACTIVITY_MULTIPLIERS[profile.activity_level!] || 1.2;
  let tdee = bmr * activityMultiplier;

  // Apply goal-specific calorie adjustment
  const goalAdjustment =
    GOAL_CALORIE_ADJUSTMENTS[profile.primary_goal || ''] || 0;
  tdee += goalAdjustment;

  // Ensure minimum safe intake
  tdee = Math.max(tdee, 1200);

  // Calculate protein based on body weight and goal
  const proteinPerKg = PROTEIN_PER_KG[profile.primary_goal || ''] || 1.4;
  const protein = Math.round(profile.weight_kg! * proteinPerKg);

  // Fats: 28% of total calories (9 kcal per gram)
  const fats = Math.round((tdee * 0.28) / 9);

  // Carbs: remaining calories (4 kcal per gram)
  const proteinCals = protein * 4;
  const fatCals = fats * 9;
  const carbs = Math.round(Math.max(tdee - proteinCals - fatCals, 0) / 4);

  return {
    goals: {
      calories: Math.round(tdee),
      protein,
      carbs,
      fats,
    },
    canCalculate: true,
    missingFields: [],
  };
}
