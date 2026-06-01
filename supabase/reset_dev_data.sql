-- ============================================================
-- Klaro — Reset dev data for ONE user
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- This deletes invoices, expenses, tasks, and documents
-- for the account linked to the email below.
-- Keeps: auth.users, profiles, fiscal_profiles (no re-onboarding).
-- ============================================================

DO $$
DECLARE
  uid UUID;
BEGIN
  -- Find user by email
  SELECT id INTO uid FROM auth.users WHERE email = 'juangomezvara@gmail.com';

  IF uid IS NULL THEN
    RAISE EXCEPTION 'User not found. Check the email address.';
  END IF;

  DELETE FROM public.invoices  WHERE user_id = uid;
  DELETE FROM public.expenses  WHERE user_id = uid;
  DELETE FROM public.tasks     WHERE user_id = uid;
  DELETE FROM public.documents WHERE user_id = uid;

  RAISE NOTICE 'Cleared all invoices, expenses, tasks, and documents for uid: %', uid;
END $$;

-- ── Optional: also reset fiscal_profiles (re-triggers onboarding) ──
-- Uncomment only if you want the onboarding overlay to appear again:
--
-- DELETE FROM public.fiscal_profiles
--   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'juangomezvara@gmail.com');
