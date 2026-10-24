-- Security advisor hardening (launch readiness).
--
-- Addresses Supabase security advisors:
--   * rls_enabled_no_policy                       (3 tables)
--   * anon_security_definer_function_executable   (35 functions -> 30 fixed, 5 kept on purpose)
--   * authenticated_security_definer_function_executable (13 trigger functions fixed)
--
-- Not a SQL change: Auth "Leaked password protection" must be enabled in the
-- dashboard (Authentication -> Providers/Settings -> Password security).
--
-- Every function below had EXECUTE granted to PUBLIC (the Postgres default) in
-- addition to explicit anon/authenticated grants, so it is revoked from PUBLIC
-- *and* anon; revoking from anon alone would leave access through PUBLIC.
--
-- Deliberately left executable by anon (evaluated inside RLS policies that apply
-- to anon, or genuinely public RPCs). Revoking these would make anonymous reads
-- of exams/subjects/chapters/test_series/tests/subscription_plans/cutoff_records
-- fail with "permission denied for function":
--   has_role(uuid,text), is_management_super_admin(), live_paper_visible(text),
--   get_public_seo_questions(text,text,integer), get_public_seo_question_by_id(text)
--
-- No DROP statements; safe to re-run.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Tables with RLS enabled but no policy.
--    All three are internal ledgers: no anon/authenticated table grants exist and
--    they are only touched by SECURITY DEFINER functions (record_audiobook_listen,
--    get_admin_audiobook_stats, record_payment_alert, check_payment_health,
--    admin_get_payment_health, admin_resolve_payment_alert,
--    dispatch_subscription_expiry_reminders) or the service role. The policies
--    make that intent explicit; client roles still get nothing.
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['audiobook_listens', 'payment_health_alerts', 'subscription_expiry_reminders'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = 'service_role_only'
    ) THEN
      EXECUTE format(
        'CREATE POLICY service_role_only ON public.%I AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true)',
        t
      );
    END IF;
    EXECUTE format(
      'COMMENT ON POLICY service_role_only ON public.%I IS %L',
      t,
      'Internal table: written/read only by SECURITY DEFINER functions and the service role. No client access by design.'
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2a. Trigger functions: never meant to be called over RPC by anyone.
--     EXECUTE is only checked when the trigger is created, not when it fires,
--     so revoking it does not affect the triggers.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION
  public.enforce_profile_role_consistency(),
  public.guard_live_locked_test_questions(),
  public.guard_live_locked_tests(),
  public.guard_live_only_release(),
  public.guard_live_test_events(),
  public.guard_profile_management_fields(),
  public.guard_running_live_questions(),
  public.handle_new_user(),
  public.sync_profile_role_from_user_roles(),
  public.sync_test_question_totals(),
  public.sync_user_roles_from_profile(),
  public.trg_test_questions_sync_live_only(),
  public.trg_tests_sync_live_only()
FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2b. Signed-in only: RPCs used by the student/admin apps (web and mobile both
--     require a session before reaching these screens) and policy helpers whose
--     policies apply only TO authenticated. Nested calls from other SECURITY
--     DEFINER functions (e.g. has_role -> account_is_active) run as the owner and
--     are unaffected.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION
  public.account_is_active(uuid),
  public.can_manage_support(),
  public.can_mutate_admin_record(text, boolean),
  public.get_attempt_solutions(uuid),
  public.get_student_exam_questions(text),
  public.has_active_subscription(uuid),
  public.has_test_access(uuid, text),
  public.increment_banner_click(text),
  public.is_admin(),
  public.is_pk_admin(),
  public.process_scheduled_notifications(),
  public.publish_test(text),
  public.save_test_answers(uuid, jsonb, integer),
  public.start_test_attempt(text),
  public.submit_test_attempt(uuid, jsonb, integer),
  public.sync_admin_profile(),
  public.validate_coupon_code(text, text, numeric, uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.account_is_active(uuid),
  public.can_manage_support(),
  public.can_mutate_admin_record(text, boolean),
  public.get_attempt_solutions(uuid),
  public.get_student_exam_questions(text),
  public.has_active_subscription(uuid),
  public.has_test_access(uuid, text),
  public.increment_banner_click(text),
  public.is_admin(),
  public.is_pk_admin(),
  public.process_scheduled_notifications(),
  public.publish_test(text),
  public.save_test_answers(uuid, jsonb, integer),
  public.start_test_attempt(text),
  public.submit_test_attempt(uuid, jsonb, integer),
  public.sync_admin_profile(),
  public.validate_coupon_code(text, text, numeric, uuid)
TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
