-- ============================================================
-- Profiles: backfill any columns missing from the live table.
--
-- Symptoms this fixes:
--   "Could not find the 'activity_level' column of 'profiles'
--    in the schema cache"
--   "column profiles.user_id does not exist (42703)"
-- i.e. the live profiles table was created with only a subset
-- of the Stage 1 schema (it may even lack user_id).
--
-- This migration ONLY adds missing columns. It does NOT create,
-- alter, truncate, or delete the table, and it does not touch
-- any existing rows.
--
-- Idempotent: safe to run multiple times.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diet_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workout_frequency INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workout_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_steps INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_hours NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wake_time TIME;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_time TIME;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workout_time TIME;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meals_per_day INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_preferences TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS foods_to_avoid TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- The assessment page upserts with onConflict 'user_id', which needs
-- a unique constraint. Add it if absent; if duplicate user_id rows
-- exist, this block only raises a notice and the rest still applies.
DO $$
BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN unique_violation THEN
    RAISE NOTICE 'profiles has duplicate user_id values; unique constraint not added — deduplicate rows, then re-run this block.';
END $$;

-- Ensure RLS is enabled with the standard own-row policies
-- (same as 001_create_profiles_table.sql; safe to re-run).
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Helpful lookup index; no-op if it already exists.
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Keep updated_at maintained on updates.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
