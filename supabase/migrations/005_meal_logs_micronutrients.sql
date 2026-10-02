-- ============================================================
-- Meal logs: micronutrient columns (vitamins & minerals)
--
-- Adds six estimated-micronutrient columns to the existing
-- meal_logs table. Purely additive:
--   - no existing columns are touched,
--   - existing rows are untouched (new columns are NULL),
--   - existing RLS policies apply to the whole row unchanged.
--
-- Units are part of each column name to avoid ambiguity:
--   vitamin_a_mcg, vitamin_c_mg, vitamin_d_mcg,
--   iron_mg, calcium_mg, potassium_mg
--
-- Idempotent: safe to run multiple times.
-- ============================================================

ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS vitamin_a_mcg NUMERIC;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS vitamin_c_mg NUMERIC;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS vitamin_d_mcg NUMERIC;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS iron_mg NUMERIC;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS calcium_mg NUMERIC;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS potassium_mg NUMERIC;
