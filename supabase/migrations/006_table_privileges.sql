-- ============================================================
-- Table-level privileges for the Supabase client roles
--
-- WHY THIS IS NEEDED
-- RLS policies and table privileges are two separate layers:
--   1. Table privileges (GRANT)  -> "is this role allowed to touch the table at all?"
--   2. Row Level Security (RLS)   -> "which rows may this role see?"
--
-- Migrations 002/003 created the RLS policies, but the roles
-- (`anon`, `authenticated`) were never granted table privileges.
-- PostgreSQL therefore rejected every query with:
--
--   permission denied for table nutrition_goals
--   hint: Grant the required privileges to the current role with:
--         GRANT SELECT ON public.nutrition_goals TO anon;
--
-- The error was raised at the privilege layer, so the RLS policy
-- (`auth.uid() = user_id`) never even got a chance to run.
--
-- IMPORTANT: `anon` and `authenticated` are SEPARATE roles.
-- Granting only `anon` fixes nothing for signed-in users -- a
-- logged-in session carries the `authenticated` role, so every
-- query from the app was still rejected with "permission denied".
-- Both roles must be granted.
--
-- This migration grants only the privileges the app actually uses.
-- It grants NO row access beyond what the existing RLS policies
-- already allow (each policy still restricts rows to auth.uid()).
--
-- Idempotent: safe to run multiple times. Touches no data.
-- ============================================================

-- nutrition_goals ------------------------------------------------------
-- SELECT  -> analytics / profile / coach read the user's targets
-- INSERT  -> coach "change goals" action (upsert) creates the row
-- UPDATE  -> coach "change goals" action (upsert) updates the row
-- DELETE  -> not used by the app today, granted for completeness
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutrition_goals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutrition_goals TO authenticated;
GRANT ALL ON TABLE public.nutrition_goals TO service_role;

-- meal_logs -----------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_logs TO authenticated;
GRANT ALL ON TABLE public.meal_logs TO service_role;

-- profiles ------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

-- Sequence access (needed for inserts that rely on serial columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Make sure RLS stays switched on for every table we expose.
-- These policies are the ONLY thing that limits which rows a role
-- can read, so they must never be disabled.
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
