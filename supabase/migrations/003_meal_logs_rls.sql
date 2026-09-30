-- ============================================================
-- Meal logs Row Level Security
--
-- IMPORTANT: The meal_logs table already exists in the database.
-- This migration does NOT create, alter, truncate, or delete it,
-- and it does not touch any existing rows.
--
-- It only enables Row Level Security and (re)creates per-user
-- policies so that authenticated users can access solely their
-- own meal logs (meal_logs.user_id = auth.uid()).
--
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Ensure RLS is enabled (no-op if already enabled; touches no data).
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- Remove same-named policies first so re-runs do not fail.
DROP POLICY IF EXISTS "Users can view own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can insert own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can update own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can delete own meal logs" ON meal_logs;

-- SELECT: users can read only their own meal logs.
CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can insert only rows they own.
CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update only their own rows, and the
-- WITH CHECK clause prevents transferring ownership to another user.
CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can delete only their own rows.
CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Helpful lookup index; no-op if it already exists; touches no data.
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
