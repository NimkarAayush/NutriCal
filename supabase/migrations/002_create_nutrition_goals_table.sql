-- ============================================================
-- Stage 2: Personalized Nutrition Goals
-- Creates the nutrition_goals table with Row Level Security
-- ============================================================

-- Create nutrition_goals table
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calorie_target NUMERIC NOT NULL,
  protein_target NUMERIC NOT NULL,
  carbs_target NUMERIC NOT NULL,
  fats_target NUMERIC NOT NULL,
  goal_type TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'calculated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own nutrition goals
CREATE POLICY "Users can view own nutrition goals"
  ON nutrition_goals FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own nutrition goals
CREATE POLICY "Users can insert own nutrition goals"
  ON nutrition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own nutrition goals
CREATE POLICY "Users can update own nutrition goals"
  ON nutrition_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster user_id lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user_id ON nutrition_goals(user_id);

-- Trigger to auto-update updated_at on nutrition_goals updates
CREATE TRIGGER update_nutrition_goals_updated_at
  BEFORE UPDATE ON nutrition_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
