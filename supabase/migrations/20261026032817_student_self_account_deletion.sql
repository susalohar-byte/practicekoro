-- ============================================================================
-- Student self-service account deletion (Google Play requirement)
--
-- A signed-in student can delete their own account. Deleting the auth user
-- cascades to their profile, attempts, results, bookmarks, mistakes, support
-- tickets and the rest of their practice data.
--
-- Payment and subscription records are kept for tax, refunds and disputes but
-- anonymised: their user_id is set to NULL so they no longer point at a person.
-- (They hold no name, email or phone of their own; payments.raw_response only
-- carries bookkeeping fields.) The Privacy Policy describes this.
-- ============================================================================

-- 1. Let billing rows outlive the account instead of being cascade-deleted
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

-- 2. The deletion itself
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Staff accounts are removed by a super admin, never from the student apps
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'admin')
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND role = 'admin') THEN
    RAISE EXCEPTION 'Staff accounts cannot be deleted from the app. Ask a super admin to remove the account.'
      USING ERRCODE = '42501';
  END IF;

  -- Billing rows may only be written by the trusted backend (guard_service_payment_writes).
  -- This function is that backend for the anonymising update the cascade below performs,
  -- for the rest of this transaction only.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  -- The plan ends with the account (Refund Policy: no refund for the unused period)
  UPDATE public.subscriptions SET status = 'cancelled', updated_at = now()
  WHERE user_id = v_uid AND status = 'active';

  -- Cascades to all practice data; billing rows keep their history with user_id set to NULL
  DELETE FROM auth.users WHERE id = v_uid;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
