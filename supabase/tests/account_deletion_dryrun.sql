-- ============================================================================
-- Dry run of 20261026032817_student_self_account_deletion.sql against a live DB.
--
-- Applies the migration, deletes ONE real student through delete_own_account()
-- exactly as the app would, collects the results, then raises an error so the
-- whole transaction rolls back. Nothing is kept, whatever happens.
--
-- Run it in the Supabase SQL editor. The "error" at the end is expected: its
-- message starts with DRYRUN_RESULT and carries the results as JSON.
--
-- Expected: auth_user_left 0, profile_left 0, attempts_left 0,
-- payments_linked_left 0, total_payments_after = total_payments_before,
-- anonymous_payments = payments_before, anonymous_subs includes "cancelled".
-- ============================================================================

BEGIN;

ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.subscription_changes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.payments DROP CONSTRAINT payments_user_id_fkey,
  ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_user_id_fkey,
  ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.subscription_changes DROP CONSTRAINT subscription_changes_user_id_fkey,
  ADD CONSTRAINT subscription_changes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.coupon_usages DROP CONSTRAINT coupon_usages_user_id_fkey,
  ADD CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp
AS $fn$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'admin')
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND role = 'admin') THEN
    RAISE EXCEPTION 'Staff accounts cannot be deleted from the app. Ask a super admin to remove the account.' USING ERRCODE = '42501';
  END IF;
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.subscriptions SET status = 'cancelled', updated_at = now() WHERE user_id = v_uid AND status = 'active';
  DELETE FROM auth.users WHERE id = v_uid;
  RETURN true;
END;
$fn$;
REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- A non-admin student who has payments, a subscription and test attempts
CREATE TEMP TABLE _subject ON COMMIT DROP AS
SELECT p.user_id AS uid FROM public.payments p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
GROUP BY p.user_id ORDER BY count(*) ASC LIMIT 1;

CREATE TEMP TABLE _r(step text, val text) ON COMMIT DROP;
INSERT INTO _r SELECT 'payments_before', count(*)::text FROM public.payments, _subject WHERE user_id = uid;
INSERT INTO _r SELECT 'total_payments_before', count(*)::text FROM public.payments;
INSERT INTO _r SELECT 'active_subs_before', count(*)::text FROM public.subscriptions, _subject WHERE user_id = uid AND status = 'active';

-- Act as that student, the way PostgREST does for the app
SELECT set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true),
       set_config('request.jwt.claim.sub', uid::text, true),
       set_config('request.jwt.claim.role', 'authenticated', true)
FROM _subject;
SET LOCAL ROLE authenticated;
SELECT public.delete_own_account();
RESET ROLE;

INSERT INTO _r SELECT 'auth_user_left', count(*)::text FROM auth.users, _subject WHERE id = uid;
INSERT INTO _r SELECT 'profile_left', count(*)::text FROM public.profiles, _subject WHERE id = uid;
INSERT INTO _r SELECT 'attempts_left', count(*)::text FROM public.test_attempts, _subject WHERE user_id = uid;
INSERT INTO _r SELECT 'payments_linked_left', count(*)::text FROM public.payments, _subject WHERE user_id = uid;
INSERT INTO _r SELECT 'total_payments_after', count(*)::text FROM public.payments;
INSERT INTO _r SELECT 'anonymous_payments', count(*)::text FROM public.payments WHERE user_id IS NULL;
INSERT INTO _r SELECT 'anonymous_subs', string_agg(status, ',') FROM public.subscriptions WHERE user_id IS NULL;

-- Always undo everything
DO $$ BEGIN RAISE EXCEPTION 'DRYRUN_RESULT %', (SELECT json_agg(_r) FROM _r); END $$;
