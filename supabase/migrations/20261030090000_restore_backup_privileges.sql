-- ============================================================================
-- Migration: 20261030090000_restore_backup_privileges.sql
-- Restore function/table privileges to the pre-migration backup (29 Oct 06:07 UTC).
-- Applied to production on 2026-10-30 (SQL run before this file was committed).
-- The restore created every object with Supabase default grants (anon/authenticated ALL),
-- and the dump only replays changes relative to plain Postgres defaults, so revocations were lost.
-- ============================================================================
begin;
create temp table acl_skipped(obj text) on commit drop;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.account_is_active(p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.account_is_active(p_user_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.account_is_active(p_user_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.account_is_active(p_user_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.account_is_active(p_user_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.activate_verified_razorpay_payment(p_user_id uuid, p_order_id text, p_payment_id text, p_signature text, p_plan_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.activate_verified_razorpay_payment(p_user_id uuid, p_order_id text, p_payment_id text, p_signature text, p_plan_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.activate_verified_razorpay_payment(p_user_id uuid, p_order_id text, p_payment_id text, p_signature text, p_plan_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.activate_verified_razorpay_payment(p_user_id uuid, p_order_id text, p_payment_id text, p_signature text, p_plan_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_analytics_overview(p_start timestamp with time zone, p_end timestamp with time zone, p_month_start timestamp with time zone, p_month_end timestamp with time zone, p_buckets jsonb) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_analytics_overview(p_start timestamp with time zone, p_end timestamp with time zone, p_month_start timestamp with time zone, p_month_end timestamp with time zone, p_buckets jsonb) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_analytics_overview(p_start timestamp with time zone, p_end timestamp with time zone, p_month_start timestamp with time zone, p_month_end timestamp with time zone, p_buckets jsonb) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_analytics_overview(p_start timestamp with time zone, p_end timestamp with time zone, p_month_start timestamp with time zone, p_month_end timestamp with time zone, p_buckets jsonb) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_analytics_overview(p_start timestamp with time zone, p_end timestamp with time zone, p_month_start timestamp with time zone, p_month_end timestamp with time zone, p_buckets jsonb)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_assign_series_tests(p_ids text[], p_series_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_assign_series_tests(p_ids text[], p_series_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_assign_series_tests(p_ids text[], p_series_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_assign_series_tests(p_ids text[], p_series_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_dashboard_overview_stats(p_today_start timestamp with time zone, p_month_start timestamp with time zone, p_year_start timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_dashboard_overview_stats(p_today_start timestamp with time zone, p_month_start timestamp with time zone, p_year_start timestamp with time zone) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_dashboard_overview_stats(p_today_start timestamp with time zone, p_month_start timestamp with time zone, p_year_start timestamp with time zone) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_dashboard_overview_stats(p_today_start timestamp with time zone, p_month_start timestamp with time zone, p_year_start timestamp with time zone) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_dashboard_overview_stats(p_today_start timestamp with time zone, p_month_start timestamp with time zone, p_year_start timestamp with time zone)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_dashboard_range_stats(p_ranges jsonb) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_dashboard_range_stats(p_ranges jsonb) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_dashboard_range_stats(p_ranges jsonb) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_dashboard_range_stats(p_ranges jsonb) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_dashboard_range_stats(p_ranges jsonb)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_delete_record(p_table text, p_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_delete_record(p_table text, p_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_delete_record(p_table text, p_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_delete_record(p_table text, p_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_delete_record(p_table text, p_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_get_payment_gateway(p_gateway text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_get_payment_gateway(p_gateway text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_get_payment_gateway(p_gateway text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_get_payment_gateway(p_gateway text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_get_payment_gateway(p_gateway text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_get_payment_health() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_get_payment_health() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_get_payment_health() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_get_payment_health() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_get_payment_health()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_item_analysis(p_start timestamp with time zone, p_end timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_item_analysis(p_start timestamp with time zone, p_end timestamp with time zone) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_item_analysis(p_start timestamp with time zone, p_end timestamp with time zone) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_item_analysis(p_start timestamp with time zone, p_end timestamp with time zone) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_item_analysis(p_start timestamp with time zone, p_end timestamp with time zone)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_modify_subscription(p_id text, p_action text, p_days integer, p_plan_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_modify_subscription(p_id text, p_action text, p_days integer, p_plan_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_modify_subscription(p_id text, p_action text, p_days integer, p_plan_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_modify_subscription(p_id text, p_action text, p_days integer, p_plan_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_modify_subscription(p_id text, p_action text, p_days integer, p_plan_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_mutate_collection(p_collection text, p_action text, p_id text, p_item jsonb) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_mutate_collection(p_collection text, p_action text, p_id text, p_item jsonb) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_mutate_collection(p_collection text, p_action text, p_id text, p_item jsonb) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_mutate_collection(p_collection text, p_action text, p_id text, p_item jsonb) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_mutate_collection(p_collection text, p_action text, p_id text, p_item jsonb)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_net_payment_paise(p_status text, p_amount numeric, p_refund_amount numeric, p_raw_response jsonb) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_net_payment_paise(p_status text, p_amount numeric, p_refund_amount numeric, p_raw_response jsonb) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_net_payment_paise(p_status text, p_amount numeric, p_refund_amount numeric, p_raw_response jsonb) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_net_payment_paise(p_status text, p_amount numeric, p_refund_amount numeric, p_raw_response jsonb)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_rankings_aggregate(p_since timestamp with time zone, p_test_types text[], p_scope_types text[], p_exam text, p_subject text, p_excluded_emails text[]) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_rankings_aggregate(p_since timestamp with time zone, p_test_types text[], p_scope_types text[], p_exam text, p_subject text, p_excluded_emails text[]) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_rankings_aggregate(p_since timestamp with time zone, p_test_types text[], p_scope_types text[], p_exam text, p_subject text, p_excluded_emails text[]) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_rankings_aggregate(p_since timestamp with time zone, p_test_types text[], p_scope_types text[], p_exam text, p_subject text, p_excluded_emails text[]) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_rankings_aggregate(p_since timestamp with time zone, p_test_types text[], p_scope_types text[], p_exam text, p_subject text, p_excluded_emails text[])');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_reporting_earliest(p_start timestamp with time zone, p_end timestamp with time zone, p_all_payment_statuses boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_reporting_earliest(p_start timestamp with time zone, p_end timestamp with time zone, p_all_payment_statuses boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_reporting_earliest(p_start timestamp with time zone, p_end timestamp with time zone, p_all_payment_statuses boolean) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_reporting_earliest(p_start timestamp with time zone, p_end timestamp with time zone, p_all_payment_statuses boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_reporting_earliest(p_start timestamp with time zone, p_end timestamp with time zone, p_all_payment_statuses boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_resolve_payment_alert(p_alert_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_resolve_payment_alert(p_alert_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_resolve_payment_alert(p_alert_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_resolve_payment_alert(p_alert_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_resolve_payment_alert(p_alert_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_revenue_range_stats(p_start timestamp with time zone, p_end timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_revenue_range_stats(p_start timestamp with time zone, p_end timestamp with time zone) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_revenue_range_stats(p_start timestamp with time zone, p_end timestamp with time zone) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_revenue_range_stats(p_start timestamp with time zone, p_end timestamp with time zone) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_revenue_range_stats(p_start timestamp with time zone, p_end timestamp with time zone)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_save_exam_subject_topics(p_exam_id text, p_subject_ids text[], p_topic_ids text[]) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_save_exam_subject_topics(p_exam_id text, p_subject_ids text[], p_topic_ids text[]) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_save_exam_subject_topics(p_exam_id text, p_subject_ids text[], p_topic_ids text[]) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_save_exam_subject_topics(p_exam_id text, p_subject_ids text[], p_topic_ids text[]) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_save_exam_subject_topics(p_exam_id text, p_subject_ids text[], p_topic_ids text[])');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_save_exam_topics(p_exam_id text, p_topic_ids text[]) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_save_exam_topics(p_exam_id text, p_topic_ids text[]) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_save_exam_topics(p_exam_id text, p_topic_ids text[]) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_save_exam_topics(p_exam_id text, p_topic_ids text[]) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_save_exam_topics(p_exam_id text, p_topic_ids text[])');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_save_test_exams(p_test_id text, p_exam_ids text[]) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_save_test_exams(p_test_id text, p_exam_ids text[]) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_save_test_exams(p_test_id text, p_exam_ids text[]) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_save_test_exams(p_test_id text, p_exam_ids text[]) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_save_test_exams(p_test_id text, p_exam_ids text[])');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_scope_allowed(p_scope text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_scope_allowed(p_scope text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_scope_allowed(p_scope text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_scope_allowed(p_scope text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_scope_allowed(p_scope text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_update_app_settings(p_settings jsonb) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_update_app_settings(p_settings jsonb) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_update_app_settings(p_settings jsonb) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_update_app_settings(p_settings jsonb) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_update_app_settings(p_settings jsonb)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_update_payment_gateway(p_gateway text, p_key_id text, p_key_secret text, p_webhook_secret text, p_is_active boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.admin_update_payment_gateway(p_gateway text, p_key_id text, p_key_secret text, p_webhook_secret text, p_is_active boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_update_payment_gateway(p_gateway text, p_key_id text, p_key_secret text, p_webhook_secret text, p_is_active boolean) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.admin_update_payment_gateway(p_gateway text, p_key_id text, p_key_secret text, p_webhook_secret text, p_is_active boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_update_payment_gateway(p_gateway text, p_key_id text, p_key_secret text, p_webhook_secret text, p_is_active boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.app_setting_write_allowed(p_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.app_setting_write_allowed(p_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.app_setting_write_allowed(p_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.app_setting_write_allowed(p_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.app_setting_write_allowed(p_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.apply_captured_subscription_payment(p_payment_row_id uuid, p_gateway_payment_id text, p_signature text, p_source text, p_event_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.apply_captured_subscription_payment(p_payment_row_id uuid, p_gateway_payment_id text, p_signature text, p_source text, p_event_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.apply_captured_subscription_payment(p_payment_row_id uuid, p_gateway_payment_id text, p_signature text, p_source text, p_event_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.apply_captured_subscription_payment(p_payment_row_id uuid, p_gateway_payment_id text, p_signature text, p_source text, p_event_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.archive_test(p_test_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.archive_test(p_test_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.archive_test(p_test_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.archive_test(p_test_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.archive_test(p_test_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.assign_admin_staff_by_email(p_email text, p_admin_role text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.assign_admin_staff_by_email(p_email text, p_admin_role text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.assign_admin_staff_by_email(p_email text, p_admin_role text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.assign_admin_staff_by_email(p_email text, p_admin_role text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.assign_admin_staff_by_email(p_email text, p_admin_role text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.audiobook_taxonomy_touch() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.audiobook_taxonomy_touch() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.audiobook_taxonomy_touch() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audiobook_taxonomy_touch()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.audiobooks_before_write() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.audiobooks_before_write() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.audiobooks_before_write() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audiobooks_before_write()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.audit_privileged_mutation() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.audit_privileged_mutation() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.audit_privileged_mutation() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audit_privileged_mutation()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.bulk_assign_students_to_batch(p_batch_id uuid, p_user_ids uuid[]) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.bulk_assign_students_to_batch(p_batch_id uuid, p_user_ids uuid[]) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.bulk_assign_students_to_batch(p_batch_id uuid, p_user_ids uuid[]) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.bulk_assign_students_to_batch(p_batch_id uuid, p_user_ids uuid[]) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.bulk_assign_students_to_batch(p_batch_id uuid, p_user_ids uuid[])');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.bulk_grant_student_subscription(p_user_ids uuid[], p_plan_id text, p_duration_days integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.bulk_grant_student_subscription(p_user_ids uuid[], p_plan_id text, p_duration_days integer) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.bulk_grant_student_subscription(p_user_ids uuid[], p_plan_id text, p_duration_days integer) TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.bulk_grant_student_subscription(p_user_ids uuid[], p_plan_id text, p_duration_days integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.can_manage_support() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.can_manage_support() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.can_manage_support() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.can_manage_support() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.can_manage_support()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.can_mutate_admin_record(p_table text, p_delete boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.can_mutate_admin_record(p_table text, p_delete boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.can_mutate_admin_record(p_table text, p_delete boolean) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.can_mutate_admin_record(p_table text, p_delete boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.can_mutate_admin_record(p_table text, p_delete boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.check_payment_health() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.check_payment_health() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.check_payment_health() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.check_payment_health()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.create_razorpay_order(p_plan_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.create_razorpay_order(p_plan_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.create_razorpay_order(p_plan_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.create_razorpay_order(p_plan_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.create_support_ticket(p_student_name text, p_student_email text, p_subject text, p_issue text, p_category text, p_priority text, p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.create_support_ticket(p_student_name text, p_student_email text, p_subject text, p_issue text, p_category text, p_priority text, p_user_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.create_support_ticket(p_student_name text, p_student_email text, p_subject text, p_issue text, p_category text, p_priority text, p_user_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.create_support_ticket(p_student_name text, p_student_email text, p_subject text, p_issue text, p_category text, p_priority text, p_user_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.create_support_ticket(p_student_name text, p_student_email text, p_subject text, p_issue text, p_category text, p_priority text, p_user_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.create_targeted_notification(p_title text, p_message text, p_channel text, p_user_ids uuid[]) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.create_targeted_notification(p_title text, p_message text, p_channel text, p_user_ids uuid[]) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.create_targeted_notification(p_title text, p_message text, p_channel text, p_user_ids uuid[]) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.create_targeted_notification(p_title text, p_message text, p_channel text, p_user_ids uuid[]) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.create_targeted_notification(p_title text, p_message text, p_channel text, p_user_ids uuid[])');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.delete_own_account() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.delete_own_account() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.delete_own_account()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.dispatch_subscription_expiry_reminders() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.dispatch_subscription_expiry_reminders() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.dispatch_subscription_expiry_reminders() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.dispatch_subscription_expiry_reminders()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.enforce_live_test_full_mock() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.enforce_live_test_full_mock() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.enforce_live_test_full_mock() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.enforce_live_test_full_mock()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.enforce_profile_role_consistency() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.enforce_profile_role_consistency() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.enforce_profile_role_consistency() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.enforce_profile_role_consistency()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.enforce_student_role_security() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.enforce_student_role_security() TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.enforce_student_role_security() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.enforce_student_role_security() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.enforce_student_role_security()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.expire_lapsed_subscriptions(p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.expire_lapsed_subscriptions(p_user_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.expire_lapsed_subscriptions(p_user_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.expire_lapsed_subscriptions(p_user_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_audiobook_stats() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_audiobook_stats() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_audiobook_stats() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_audiobook_stats() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_admin_audiobook_stats()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_dashboard_counts() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_dashboard_counts() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_dashboard_counts() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_dashboard_counts() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_admin_dashboard_counts()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_dashboard_v2_stats() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_dashboard_v2_stats() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_dashboard_v2_stats() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_admin_dashboard_v2_stats()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_district_rankings(p_exam_id text, p_from timestamp with time zone, p_to timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_district_rankings(p_exam_id text, p_from timestamp with time zone, p_to timestamp with time zone) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_district_rankings(p_exam_id text, p_from timestamp with time zone, p_to timestamp with time zone) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_district_rankings(p_exam_id text, p_from timestamp with time zone, p_to timestamp with time zone) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_admin_district_rankings(p_exam_id text, p_from timestamp with time zone, p_to timestamp with time zone)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_payments(p_status text, p_search text, p_limit integer, p_offset integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_payments(p_status text, p_search text, p_limit integer, p_offset integer) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_payments(p_status text, p_search text, p_limit integer, p_offset integer) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_payments(p_status text, p_search text, p_limit integer, p_offset integer) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_admin_payments(p_status text, p_search text, p_limit integer, p_offset integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_students(p_search text, p_plan text, p_status text, p_limit integer, p_offset integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_students(p_search text, p_plan text, p_status text, p_limit integer, p_offset integer) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_students(p_search text, p_plan text, p_status text, p_limit integer, p_offset integer) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_students(p_search text, p_plan text, p_status text, p_limit integer, p_offset integer) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_admin_students(p_search text, p_plan text, p_status text, p_limit integer, p_offset integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_subscriptions(p_status text, p_search text, p_limit integer, p_offset integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_admin_subscriptions(p_status text, p_search text, p_limit integer, p_offset integer) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_subscriptions(p_status text, p_search text, p_limit integer, p_offset integer) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_admin_subscriptions(p_status text, p_search text, p_limit integer, p_offset integer) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_admin_subscriptions(p_status text, p_search text, p_limit integer, p_offset integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_app_leaderboard(p_scope text, p_district text, p_exam_name text, p_from timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_app_leaderboard(p_scope text, p_district text, p_exam_name text, p_from timestamp with time zone) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_app_leaderboard(p_scope text, p_district text, p_exam_name text, p_from timestamp with time zone) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_app_leaderboard(p_scope text, p_district text, p_exam_name text, p_from timestamp with time zone) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_app_leaderboard(p_scope text, p_district text, p_exam_name text, p_from timestamp with time zone)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_attempt_rankings(p_attempt_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_attempt_rankings(p_attempt_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_attempt_rankings(p_attempt_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_attempt_rankings(p_attempt_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_attempt_rankings(p_attempt_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_attempt_solutions(p_attempt_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_attempt_solutions(p_attempt_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_attempt_solutions(p_attempt_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_attempt_solutions(p_attempt_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_attempt_solutions(p_attempt_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_my_subscription_purchase_options() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_my_subscription_purchase_options() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_my_subscription_purchase_options() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_my_subscription_purchase_options() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_my_subscription_purchase_options()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_public_seo_question_by_id(p_question_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_public_seo_question_by_id(p_question_id text) TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_public_seo_question_by_id(p_question_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_public_seo_question_by_id(p_question_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_public_seo_question_by_id(p_question_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_public_seo_questions(p_subject_id text, p_search text, p_limit integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_public_seo_questions(p_subject_id text, p_search text, p_limit integer) TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_public_seo_questions(p_subject_id text, p_search text, p_limit integer) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_public_seo_questions(p_subject_id text, p_search text, p_limit integer) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_public_seo_questions(p_subject_id text, p_search text, p_limit integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_student_exam_questions(p_test_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_student_exam_questions(p_test_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_student_exam_questions(p_test_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_student_exam_questions(p_test_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_student_exam_questions(p_test_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_student_subscription_details() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_student_subscription_details() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_student_subscription_details() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_student_subscription_details() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_student_subscription_details()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_test_leaderboard(p_test_id text, p_scope text, p_district text, p_block text, p_limit integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_test_leaderboard(p_test_id text, p_scope text, p_district text, p_block text, p_limit integer) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_test_leaderboard(p_test_id text, p_scope text, p_district text, p_block text, p_limit integer) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_test_leaderboard(p_test_id text, p_scope text, p_district text, p_block text, p_limit integer) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_test_leaderboard(p_test_id text, p_scope text, p_district text, p_block text, p_limit integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_test_series_analytics(p_series_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_test_series_analytics(p_series_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_test_series_analytics(p_series_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_test_series_analytics(p_series_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_test_series_analytics(p_series_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_test_series_leaderboard(p_series_id text, p_district text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.get_test_series_leaderboard(p_series_id text, p_district text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_test_series_leaderboard(p_series_id text, p_district text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.get_test_series_leaderboard(p_series_id text, p_district text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.get_test_series_leaderboard(p_series_id text, p_district text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_locked_test_questions() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_locked_test_questions() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_live_locked_test_questions() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_live_locked_test_questions()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_locked_tests() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_locked_tests() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_live_locked_tests() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_live_locked_tests()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_only_release() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_only_release() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_live_only_release() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_live_only_release()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_test_events() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_live_test_events() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_live_test_events() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_live_test_events()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_profile_identity_email() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_profile_identity_email() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_profile_identity_email() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_profile_identity_email()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_profile_management_fields() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_profile_management_fields() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_profile_management_fields() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_profile_management_fields()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_running_live_questions() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_running_live_questions() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_running_live_questions() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_running_live_questions()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_service_payment_writes() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.guard_service_payment_writes() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.guard_service_payment_writes() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.guard_service_payment_writes()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.handle_new_user() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.handle_new_user()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.handle_updated_at() TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.handle_updated_at()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.has_active_subscription(p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.has_active_subscription(p_user_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.has_active_subscription(p_user_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.has_active_subscription(p_user_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.has_active_subscription(p_user_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.has_role(p_user_id uuid, p_role text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.has_role(p_user_id uuid, p_role text) TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.has_role(p_user_id uuid, p_role text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.has_role(p_user_id uuid, p_role text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.has_role(p_user_id uuid, p_role text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.has_test_access(p_user_id uuid, p_test_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.has_test_access(p_user_id uuid, p_test_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.has_test_access(p_user_id uuid, p_test_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.has_test_access(p_user_id uuid, p_test_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.has_test_access(p_user_id uuid, p_test_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.increment_banner_click(p_banner_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.increment_banner_click(p_banner_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.increment_banner_click(p_banner_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.increment_banner_click(p_banner_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.increment_banner_click(p_banner_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_admin() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.is_admin()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.live_tests FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.live_tests TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.live_tests TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.live_tests TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.live_tests');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_live_test_active(lt public.live_tests, p_running_only boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_live_test_active(lt public.live_tests, p_running_only boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_live_test_active(lt public.live_tests, p_running_only boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.is_live_test_active(lt public.live_tests, p_running_only boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_management_super_admin() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_management_super_admin() TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_management_super_admin() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_management_super_admin() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.is_management_super_admin()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_pk_admin() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_pk_admin() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_pk_admin() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.is_pk_admin()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_question_live_hidden(p_question_id uuid, p_is_live_only boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_question_live_hidden(p_question_id uuid, p_is_live_only boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_question_live_hidden(p_question_id uuid, p_is_live_only boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.is_question_live_hidden(p_question_id uuid, p_is_live_only boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_test_live_locked(p_test_id text, p_running_only boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.is_test_live_locked(p_test_id text, p_running_only boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.is_test_live_locked(p_test_id text, p_running_only boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.is_test_live_locked(p_test_id text, p_running_only boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.live_lock_applies() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.live_lock_applies() TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.live_lock_applies() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.live_lock_applies() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.live_lock_applies()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.live_paper_access_error(p_user_id uuid, p_test_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.live_paper_access_error(p_user_id uuid, p_test_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.live_paper_access_error(p_user_id uuid, p_test_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.live_paper_access_error(p_user_id uuid, p_test_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.live_paper_visible(p_test_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.live_paper_visible(p_test_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.live_paper_visible(p_test_id text) TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.live_paper_visible(p_test_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.live_paper_visible(p_test_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.live_paper_visible(p_test_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.mark_payment_refunded(p_payment_id uuid, p_refund_amount numeric, p_refund_id text, p_refund_reason text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.mark_payment_refunded(p_payment_id uuid, p_refund_amount numeric, p_refund_id text, p_refund_reason text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.mark_payment_refunded(p_payment_id uuid, p_refund_amount numeric, p_refund_id text, p_refund_reason text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.mark_payment_refunded(p_payment_id uuid, p_refund_amount numeric, p_refund_id text, p_refund_reason text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.process_scheduled_notifications() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.process_scheduled_notifications() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.process_scheduled_notifications() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.process_scheduled_notifications() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.process_scheduled_notifications()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.public_blog_post(p_slug text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.public_blog_post(p_slug text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.public_blog_post(p_slug text) TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.public_blog_post(p_slug text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.public_blog_post(p_slug text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.public_blog_post(p_slug text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.public_blog_summaries(p_limit integer, p_featured_first boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.public_blog_summaries(p_limit integer, p_featured_first boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.public_blog_summaries(p_limit integer, p_featured_first boolean) TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.public_blog_summaries(p_limit integer, p_featured_first boolean) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.public_blog_summaries(p_limit integer, p_featured_first boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.public_blog_summaries(p_limit integer, p_featured_first boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.publish_test(p_test_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.publish_test(p_test_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.publish_test(p_test_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.publish_test(p_test_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.quote_subscription_purchase(p_user_id uuid, p_plan_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.quote_subscription_purchase(p_user_id uuid, p_plan_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.quote_subscription_purchase(p_user_id uuid, p_plan_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.quote_subscription_purchase(p_user_id uuid, p_plan_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.reconcile_razorpay_refund(p_payment_id text, p_refund_id text, p_refund_amount numeric, p_refund_reason text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.reconcile_razorpay_refund(p_payment_id text, p_refund_id text, p_refund_amount numeric, p_refund_reason text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.reconcile_razorpay_refund(p_payment_id text, p_refund_id text, p_refund_amount numeric, p_refund_reason text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.reconcile_razorpay_refund(p_payment_id text, p_refund_id text, p_refund_amount numeric, p_refund_reason text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.reconcile_razorpay_webhook(p_order_id text, p_payment_id text, p_amount numeric, p_currency text, p_event_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.reconcile_razorpay_webhook(p_order_id text, p_payment_id text, p_amount numeric, p_currency text, p_event_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.reconcile_razorpay_webhook(p_order_id text, p_payment_id text, p_amount numeric, p_currency text, p_event_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.reconcile_razorpay_webhook(p_order_id text, p_payment_id text, p_amount numeric, p_currency text, p_event_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.record_audiobook_listen(p_audiobook_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.record_audiobook_listen(p_audiobook_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.record_audiobook_listen(p_audiobook_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.record_audiobook_listen(p_audiobook_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.record_audiobook_listen(p_audiobook_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.record_payment_alert(p_kind text, p_ref text, p_source text, p_message text, p_detail jsonb) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.record_payment_alert(p_kind text, p_ref text, p_source text, p_message text, p_detail jsonb) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.record_payment_alert(p_kind text, p_ref text, p_source text, p_message text, p_detail jsonb) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.record_payment_alert(p_kind text, p_ref text, p_source text, p_message text, p_detail jsonb)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.reject_inline_images() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.reject_inline_images() TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.reject_inline_images() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.reject_inline_images() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.reject_inline_images()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.remove_admin_staff_member(p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.remove_admin_staff_member(p_user_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.remove_admin_staff_member(p_user_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.remove_admin_staff_member(p_user_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.remove_admin_staff_member(p_user_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.revoke_access_for_refunded_payment(p_payment_row_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.revoke_access_for_refunded_payment(p_payment_row_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.revoke_access_for_refunded_payment(p_payment_row_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.revoke_access_for_refunded_payment(p_payment_row_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.save_test_answers(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.save_test_answers(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.save_test_answers(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.save_test_answers(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.save_test_answers(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.save_test_questions(p_test_id text, p_questions jsonb) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.save_test_questions(p_test_id text, p_questions jsonb) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.save_test_questions(p_test_id text, p_questions jsonb) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.save_test_questions(p_test_id text, p_questions jsonb) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.save_test_questions(p_test_id text, p_questions jsonb)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.send_support_ticket_message(p_ticket_id uuid, p_body text, p_internal boolean) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.send_support_ticket_message(p_ticket_id uuid, p_body text, p_internal boolean) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.send_support_ticket_message(p_ticket_id uuid, p_body text, p_internal boolean) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.send_support_ticket_message(p_ticket_id uuid, p_body text, p_internal boolean) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.send_support_ticket_message(p_ticket_id uuid, p_body text, p_internal boolean)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.start_notification_gateway_request(p_actor uuid, p_request_id uuid, p_action text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.start_notification_gateway_request(p_actor uuid, p_request_id uuid, p_action text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.start_notification_gateway_request(p_actor uuid, p_request_id uuid, p_action text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.start_notification_gateway_request(p_actor uuid, p_request_id uuid, p_action text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.start_test_attempt(p_test_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.start_test_attempt(p_test_id text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.start_test_attempt(p_test_id text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.start_test_attempt(p_test_id text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.start_test_attempt(p_test_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.student_reply_support_ticket(p_ticket_id uuid, p_body text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.student_reply_support_ticket(p_ticket_id uuid, p_body text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.student_reply_support_ticket(p_ticket_id uuid, p_body text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.student_reply_support_ticket(p_ticket_id uuid, p_body text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.student_reply_support_ticket(p_ticket_id uuid, p_body text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.submit_test_attempt(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.submit_test_attempt(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.submit_test_attempt(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.submit_test_attempt(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.submit_test_attempt(p_attempt_id uuid, p_answers jsonb, p_time_spent_seconds integer)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_admin_profile() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_admin_profile() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_admin_profile() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.sync_admin_profile()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_profile_email_from_auth() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.sync_profile_email_from_auth()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_profile_role_from_user_roles() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_profile_role_from_user_roles() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_profile_role_from_user_roles() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.sync_profile_role_from_user_roles()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_question_live_only(p_question_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_question_live_only(p_question_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_question_live_only(p_question_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.sync_question_live_only(p_question_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_question_topic_chapter() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_question_topic_chapter() TO anon';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_question_topic_chapter() TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_question_topic_chapter() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.sync_question_topic_chapter()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_test_question_totals() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_test_question_totals() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_test_question_totals() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.sync_test_question_totals()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_user_roles_from_profile() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.sync_user_roles_from_profile() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.sync_user_roles_from_profile() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.sync_user_roles_from_profile()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.take_image_upload_slot(p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.take_image_upload_slot(p_user_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.take_image_upload_slot(p_user_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.take_image_upload_slot(p_user_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.trg_test_questions_sync_live_only() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.trg_test_questions_sync_live_only() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.trg_test_questions_sync_live_only() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.trg_test_questions_sync_live_only()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.trg_tests_sync_live_only() FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.trg_tests_sync_live_only() FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.trg_tests_sync_live_only() TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.trg_tests_sync_live_only()');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.update_admin_staff_role(p_user_id uuid, p_admin_role text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.update_admin_staff_role(p_user_id uuid, p_admin_role text) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.update_admin_staff_role(p_user_id uuid, p_admin_role text) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.update_admin_staff_role(p_user_id uuid, p_admin_role text) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.update_admin_staff_role(p_user_id uuid, p_admin_role text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.validate_coupon_code(p_code text, p_plan_id text, p_amount numeric, p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.validate_coupon_code(p_code text, p_plan_id text, p_amount numeric, p_user_id uuid) FROM PUBLIC';
  EXECUTE 'GRANT ALL ON FUNCTION public.validate_coupon_code(p_code text, p_plan_id text, p_amount numeric, p_user_id uuid) TO authenticated';
  EXECUTE 'GRANT ALL ON FUNCTION public.validate_coupon_code(p_code text, p_plan_id text, p_amount numeric, p_user_id uuid) TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.validate_coupon_code(p_code text, p_plan_id text, p_amount numeric, p_user_id uuid)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION public.verify_razorpay_payment(p_order_id text, p_payment_id text, p_signature text, p_plan_id text) FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION public.verify_razorpay_payment(p_order_id text, p_payment_id text, p_signature text, p_plan_id text) FROM PUBLIC';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.verify_razorpay_payment(p_order_id text, p_payment_id text, p_signature text, p_plan_id text)');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.admin_audit_logs FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT SELECT,MAINTAIN ON TABLE public.admin_audit_logs TO anon';
  EXECUTE 'GRANT SELECT,MAINTAIN ON TABLE public.admin_audit_logs TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.admin_audit_logs TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.admin_audit_logs');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.app_settings FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.app_settings TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.app_settings TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.app_settings TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.app_settings');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.attempt_answers FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.attempt_answers TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.attempt_answers TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.attempt_answers TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.attempt_answers');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.audiobook_categories FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.audiobook_categories TO service_role';
  EXECUTE 'GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audiobook_categories TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audiobook_categories');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.audiobook_listens FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.audiobook_listens TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audiobook_listens');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.audiobook_subjects FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.audiobook_subjects TO service_role';
  EXECUTE 'GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audiobook_subjects TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audiobook_subjects');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.audiobook_topics FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.audiobook_topics TO service_role';
  EXECUTE 'GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audiobook_topics TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audiobook_topics');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.audiobooks FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.audiobooks TO service_role';
  EXECUTE 'GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audiobooks TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.audiobooks');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.bookmarks FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.bookmarks TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.bookmarks TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.bookmarks TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.bookmarks');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.chapters FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.chapters TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.chapters TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.chapters TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.chapters');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.coupon_usages FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.coupon_usages TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.coupon_usages TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.coupon_usages TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.coupon_usages');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.coupons FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.coupons TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.coupons TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.coupons TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.coupons');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.cutoff_records FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.cutoff_records TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.cutoff_records TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.cutoff_records TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.cutoff_records');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.exam_categories FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.exam_categories TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.exam_categories TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.exam_categories TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.exam_categories');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.exam_cutoff_configs FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.exam_cutoff_configs TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.exam_cutoff_configs TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.exam_cutoff_configs TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.exam_cutoff_configs');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.exam_subjects FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.exam_subjects TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.exam_subjects TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.exam_subjects TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.exam_subjects');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.exam_topics FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.exam_topics TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.exam_topics TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.exam_topics TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.exam_topics');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.exams FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.exams TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.exams TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.exams TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.exams');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.image_upload_limits FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.image_upload_limits TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.image_upload_limits');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.live_test_participants FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.live_test_participants TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.live_test_participants TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.live_test_participants TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.live_test_participants');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.mistakes FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.mistakes TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.mistakes TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.mistakes TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.mistakes');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.notification_gateway_requests FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.notification_gateway_requests TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.notification_gateway_requests');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.notifications TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.notifications TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.notifications TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.notifications');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.payment_gateways FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.payment_gateways TO service_role';
  EXECUTE 'GRANT ALL ON TABLE public.payment_gateways TO authenticated';
  EXECUTE 'GRANT SELECT(gateway) ON TABLE public.payment_gateways TO authenticated';
  EXECUTE 'GRANT SELECT(key_id) ON TABLE public.payment_gateways TO authenticated';
  EXECUTE 'GRANT SELECT(is_active) ON TABLE public.payment_gateways TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.payment_gateways');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.payment_health_alerts FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.payment_health_alerts TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.payment_health_alerts');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.payments FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.payments TO service_role';
  EXECUTE 'GRANT SELECT ON TABLE public.payments TO anon';
  EXECUTE 'GRANT SELECT ON TABLE public.payments TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.payments');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.profiles TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.profiles TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.profiles TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.profiles');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.questions FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.questions TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.questions TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.questions TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.questions');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.student_batch_members FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.student_batch_members TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.student_batch_members TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.student_batch_members TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.student_batch_members');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.student_batches FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.student_batches TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.student_batches TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.student_batches TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.student_batches');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.student_notes FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.student_notes TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.student_notes TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.student_notes TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.student_notes');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.subjects FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.subjects TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.subjects TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.subjects TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.subjects');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.subscription_changes FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.subscription_changes TO service_role';
  EXECUTE 'GRANT SELECT ON TABLE public.subscription_changes TO authenticated';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.subscription_changes');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.subscription_expiry_reminders FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.subscription_expiry_reminders TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.subscription_expiry_reminders');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.subscription_plans FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.subscription_plans TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.subscription_plans TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.subscription_plans TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.subscription_plans');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.subscriptions FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.subscriptions TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.subscriptions TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.subscriptions TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.subscriptions');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.support_ticket_messages FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.support_ticket_messages TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.support_ticket_messages TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.support_ticket_messages TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.support_ticket_messages');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.support_tickets FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.support_tickets TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.support_tickets TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.support_tickets TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.support_tickets');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.test_attempts FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.test_attempts TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.test_attempts TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.test_attempts TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.test_attempts');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.test_exams FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.test_exams TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.test_exams TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.test_exams TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.test_exams');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.test_questions FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.test_questions TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.test_questions TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.test_questions TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.test_questions');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.test_results FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.test_results TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.test_results TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.test_results TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.test_results');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.test_series FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.test_series TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.test_series TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.test_series TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.test_series');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.tests FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.tests TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.tests TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.tests TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.tests');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.user_roles TO anon';
  EXECUTE 'GRANT ALL ON TABLE public.user_roles TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.user_roles TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.user_roles');
END $acl$;
DO $acl$ BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.user_test_access FROM PUBLIC, anon, authenticated, service_role';
  EXECUTE 'GRANT ALL ON TABLE public.user_test_access TO authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.user_test_access TO service_role';
EXCEPTION WHEN undefined_function OR undefined_table OR undefined_object OR invalid_schema_name THEN INSERT INTO acl_skipped VALUES ('public.user_test_access');
END $acl$;
-- re-apply grants from 20261029130000_app_settings_lists_to_tables
revoke all on function public.admin_mutate_collection(text, text, text, jsonb) from public, anon;
grant execute on function public.admin_mutate_collection(text, text, text, jsonb) to authenticated, service_role;
revoke all on function public.admin_save_popular_exam_cards(jsonb) from public, anon;
grant execute on function public.admin_save_popular_exam_cards(jsonb) to authenticated, service_role;
revoke all on function public.public_blog_summaries(integer, boolean) from public;
revoke all on function public.public_blog_post(text) from public;
grant execute on function public.public_blog_summaries(integer, boolean) to anon, authenticated, service_role;
grant execute on function public.public_blog_post(text) to anon, authenticated, service_role;
revoke all on function public.pk_json_text(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_truthy(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_ts(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_int(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_text_array(jsonb) from public, anon, authenticated;
revoke all on function public.hero_banner_normalize(jsonb, integer) from public, anon, authenticated;
revoke all on function public.hero_banner_to_json(public.hero_banners) from public, anon, authenticated;
revoke all on function public.blog_post_normalize(jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.popular_exam_card_normalize(jsonb, integer) from public, anon, authenticated;
revoke all on function public.popular_exam_card_to_json(public.popular_exam_cards) from public, anon, authenticated;
revoke all on function public.popular_test_series_card_normalize(jsonb, integer) from public, anon, authenticated;
revoke all on function public.refresh_banners_hero_snapshot() from public, anon, authenticated;
revoke all on function public.rebuild_banners_hero_snapshot() from public, anon, authenticated;
revoke all on function public.pk_iso(timestamptz) from public;
revoke all on function public.blog_post_to_json(public.blog_posts) from public;
grant execute on function public.pk_iso(timestamptz) to anon, authenticated, service_role;
grant execute on function public.blog_post_to_json(public.blog_posts) to anon, authenticated, service_role;
-- re-apply grants from 20261029140000_private_schema_rls_helpers
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
revoke execute on function public.admin_scope_allowed(text) from public, anon;
grant execute on function public.admin_scope_allowed(text) to authenticated, service_role;
revoke insert, update, delete, truncate, references, trigger on public.hero_banners, public.blog_posts, public.popular_exam_cards, public.popular_test_series_cards from anon;
-- Defense in depth: anon keeps a write privilege only where some RLS policy lets anon (or public) do that command.
-- Without such a policy RLS already rejects the write, so behaviour does not change. TRUNCATE ignores RLS, so it goes too.
DO $anon$
DECLARE r record; v_cmd text;
BEGIN
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon', r.relname);
    FOREACH v_cmd IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=r.relname
                     AND p.permissive='PERMISSIVE' AND p.cmd IN (v_cmd,'ALL') AND (p.roles && ARRAY['anon','public']::name[])) THEN
        EXECUTE format('REVOKE %s ON public.%I FROM anon', v_cmd, r.relname);
      END IF;
    END LOOP;
  END LOOP;
END $anon$;

notify pgrst, 'reload schema';
commit;
