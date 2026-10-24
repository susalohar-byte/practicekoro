-- ============================================================================
-- Migration: 20261024145344_security_advisor_hardening.sql
-- Supabase security advisor fixes: internal-table policies, RPC EXECUTE grants.
-- Body below is byte-identical to the SQL recorded for this version in
-- production supabase_migrations.schema_migrations (md5 5ed64438947586d7e6e55256405b2f89).
-- ============================================================================

-- Security advisor hardening (repo: supabase/migrations/20261024090000_security_advisor_hardening.sql)

-- 1. Internal tables with RLS enabled but no policy: service role only.
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

-- 2a. Trigger functions are never called over RPC.
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

-- 2b. Signed-in only RPCs and helpers.
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
