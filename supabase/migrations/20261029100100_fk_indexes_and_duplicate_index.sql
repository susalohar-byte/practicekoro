-- ============================================================================
-- Migration: 20261029100100_fk_indexes_and_duplicate_index.sql
-- Supabase performance advisor: unindexed_foreign_keys (32) + duplicate_index.
--
-- 1. A btree index on every foreign-key column the advisor listed, so joins and
--    ON DELETE / ON UPDATE checks on the parent no longer scan the child table.
--    The tables are small, so a plain CREATE INDEX (short lock) is fine here.
-- 2. public.subscriptions had two identical indexes on (user_id, status):
--    idx_subscriptions_user and idx_subscriptions_user_status. Both cover the
--    same columns; idx_subscriptions_user_status is kept (descriptive name).
--
-- Unused-index advisor findings are deliberately ignored: the database is new
-- and its usage statistics are not meaningful yet.
-- Idempotent: IF NOT EXISTS / IF EXISTS everywhere.
-- ============================================================================

begin;

create index if not exists idx_admin_audit_logs_admin_id on public.admin_audit_logs (admin_id);
create index if not exists idx_app_settings_updated_by on public.app_settings (updated_by);
create index if not exists idx_attempt_answers_question_id on public.attempt_answers (question_id);
create index if not exists idx_audiobook_listens_user_id on public.audiobook_listens (user_id);
create index if not exists idx_audiobooks_created_by on public.audiobooks (created_by);
create index if not exists idx_bookmarks_question_id on public.bookmarks (question_id);
create index if not exists idx_coupons_applicable_plan_id on public.coupons (applicable_plan_id);
create index if not exists idx_live_tests_exam_id on public.live_tests (exam_id);
create index if not exists idx_live_tests_test_series_id on public.live_tests (test_series_id);
create index if not exists idx_mistakes_last_attempt_id on public.mistakes (last_attempt_id);
create index if not exists idx_mistakes_question_id on public.mistakes (question_id);
create index if not exists idx_notifications_created_by on public.notifications (created_by);
create index if not exists idx_payment_health_alerts_resolved_by on public.payment_health_alerts (resolved_by);
create index if not exists idx_payments_from_plan_id on public.payments (from_plan_id);
create index if not exists idx_payments_plan_id on public.payments (plan_id);
create index if not exists idx_payments_refunded_by on public.payments (refunded_by);
create index if not exists idx_payments_target_subscription_id on public.payments (target_subscription_id);
create index if not exists idx_student_batch_members_assigned_by on public.student_batch_members (assigned_by);
create index if not exists idx_student_batches_created_by on public.student_batches (created_by);
create index if not exists idx_student_notes_author_id on public.student_notes (author_id);
create index if not exists idx_subscription_changes_from_plan_id on public.subscription_changes (from_plan_id);
create index if not exists idx_subscription_changes_renewal_subscription_id on public.subscription_changes (renewal_subscription_id);
create index if not exists idx_subscription_changes_to_plan_id on public.subscription_changes (to_plan_id);
create index if not exists idx_subscription_changes_user_id on public.subscription_changes (user_id);
create index if not exists idx_subscription_expiry_reminders_notification_id on public.subscription_expiry_reminders (notification_id);
create index if not exists idx_subscriptions_payment_id on public.subscriptions (payment_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions (plan_id);
create index if not exists idx_support_ticket_messages_author_id on public.support_ticket_messages (author_id);
create index if not exists idx_support_tickets_assigned_to on public.support_tickets (assigned_to);
create index if not exists idx_test_results_user_id on public.test_results (user_id);
create index if not exists idx_test_series_exam_id on public.test_series (exam_id);
create index if not exists idx_tests_subject_id on public.tests (subject_id);

-- Keep exactly one of the identical (user_id, status) indexes. Guarded so a
-- re-run (or a database where only one exists) never drops the survivor.
do $$
begin
  if to_regclass('public.idx_subscriptions_user_status') is not null
     and to_regclass('public.idx_subscriptions_user') is not null then
    execute 'drop index public.idx_subscriptions_user';
  end if;
end $$;

commit;
