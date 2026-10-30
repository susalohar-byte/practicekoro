-- One-time backfill of supabase_migrations.schema_migrations (2026-10-29).
--
-- Run once in the Supabase SQL Editor BEFORE the first run of
-- .github/workflows/db-migrations.yml on main. Safe to re-run: it skips
-- versions that are already recorded.
--
-- These 8 migrations were run by hand in the SQL Editor, so their changes are
-- live in production but schema_migrations has no row for them. Without a row,
-- `supabase db push` would either refuse to run (20261024124339 and
-- 20261024150000 are older than the last recorded version) or run them again.
--
-- It only INSERTs one row per version into supabase_migrations.schema_migrations
-- (columns: version, name, created_by; statements, idempotency_key and rollback
-- stay NULL, like the 2026-10-24 history repair). No migration SQL is executed.
--
-- Before inserting, it checks that the objects each migration creates exist in
-- this database and aborts (inserting nothing) if any check fails. The checks
-- passed against production (read-only) on 2026-10-29.
--
-- Equivalent CLI command (also records the file's statements):
--   supabase migration repair --status applied 20261024124339 20261024150000 \
--     20261029090000 20261029100000 20261029100100 20261029100200 20261029100300 \
--     20261029110000 --db-url "$SUPABASE_DB_URL"

begin;

do $$
declare
  failed text[] := '{}';
begin
  -- 20261024124339_exam_centric_test_architecture_part2
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exam_subjects'
                 and policyname = 'staff_content_delete' and permissive = 'RESTRICTIVE')
     or not exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                    where c.oid = 'public.exam_subjects'::regclass and t.tgname = 'audit_privileged_mutation')
     or to_regprocedure('public.admin_save_exam_subject_topics(text,text[],text[])') is null then
    failed := array_append(failed, '20261024124339');
  end if;

  -- 20261024150000_drop_admin_test_series_metrics
  if to_regprocedure('public.admin_get_test_series_metrics()') is not null then
    failed := array_append(failed, '20261024150000');
  end if;

  -- 20261029090000_block_inline_images: function + trigger on 9 tables (10 if audiobooks table still exists)
  if to_regprocedure('public.reject_inline_images()') is null
     or (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and t.tgname = 'reject_inline_images'
           and c.relname in ('app_settings', 'exams', 'test_series', 'tests', 'subjects', 'chapters',
                             'live_tests', 'questions', 'profiles', 'audiobooks')) not in (9, 10) then
    failed := array_append(failed, '20261029090000');
  end if;

  -- 20261029100000_rls_initplan_and_policy_merge: old ALL policies gone, split
  -- policies present, no public policy left with a bare auth.uid()
  if exists (select 1 from pg_policies where schemaname = 'public'
             and (tablename, policyname) in (('chapters', 'Admin manage chapters'),
                                             ('exams', 'Admin manage exams'),
                                             ('tests', 'Admin manage tests'),
                                             ('user_roles', 'Only admins can manage roles')))
     or (select count(*) from pg_policies where schemaname = 'public'
         and (tablename, policyname) in (('chapters', 'Admin manage chapters (insert)'),
                                         ('exams', 'Admin manage exams (update)'),
                                         ('tests', 'Admin manage tests (delete)'),
                                         ('user_roles', 'Only admins can manage roles (insert)'))) <> 4
     or exists (select 1 from pg_policies where schemaname = 'public'
                and coalesce(qual, '') || coalesce(with_check, '') ~ 'auth\.uid\(\)'
                and coalesce(qual, '') || coalesce(with_check, '') !~ 'SELECT auth\.uid') then
    failed := array_append(failed, '20261029100000');
  end if;

  -- 20261029100100_fk_indexes_and_duplicate_index: 30 FK indexes (32 if audiobooks still exists), duplicate dropped
  if (select count(*) from pg_indexes where schemaname = 'public' and indexname in (
        'idx_admin_audit_logs_admin_id', 'idx_app_settings_updated_by', 'idx_attempt_answers_question_id',
        'idx_audiobook_listens_user_id', 'idx_audiobooks_created_by', 'idx_bookmarks_question_id',
        'idx_coupons_applicable_plan_id', 'idx_live_tests_exam_id', 'idx_live_tests_test_series_id',
        'idx_mistakes_last_attempt_id', 'idx_mistakes_question_id', 'idx_notifications_created_by',
        'idx_payment_health_alerts_resolved_by', 'idx_payments_from_plan_id', 'idx_payments_plan_id',
        'idx_payments_refunded_by', 'idx_payments_target_subscription_id',
        'idx_student_batch_members_assigned_by', 'idx_student_batches_created_by',
        'idx_student_notes_author_id', 'idx_subscription_changes_from_plan_id',
        'idx_subscription_changes_renewal_subscription_id', 'idx_subscription_changes_to_plan_id',
        'idx_subscription_changes_user_id', 'idx_subscription_expiry_reminders_notification_id',
        'idx_subscriptions_payment_id', 'idx_subscriptions_plan_id', 'idx_support_ticket_messages_author_id',
        'idx_support_tickets_assigned_to', 'idx_test_results_user_id', 'idx_test_series_exam_id',
        'idx_tests_subject_id')) not in (30, 32)
     or to_regclass('public.idx_subscriptions_user') is not null then
    failed := array_append(failed, '20261029100100');
  end if;

  -- 20261029100200_admin_item_analysis_rpc
  if to_regprocedure('public.admin_item_analysis(timestamptz,timestamptz)') is null
     or has_function_privilege('anon', 'public.admin_item_analysis(timestamptz,timestamptz)', 'execute') then
    failed := array_append(failed, '20261029100200');
  end if;

  -- 20261029100300_public_blog_rpcs
  if to_regprocedure('public.public_blog_summaries(integer,boolean)') is null
     or to_regprocedure('public.public_blog_post(text)') is null then
    failed := array_append(failed, '20261029100300');
  end if;

  -- 20261029110000_definer_function_hardening
  if pg_get_functiondef('public.has_role(uuid,text)'::regprocedure) not like '%auth.jwt() ->> ''role''%'
     or pg_get_functiondef('public.account_is_active(uuid)'::regprocedure) not like '%auth.jwt() ->> ''role''%'
     or pg_get_functiondef('public.process_scheduled_notifications()'::regprocedure)
          not like '%Notification-management privileges required%'
     or has_function_privilege('anon', 'public.is_admin()', 'execute')
     or has_function_privilege('authenticated', 'public.sync_admin_profile()', 'execute')
     or has_function_privilege('authenticated', 'public.publish_test(text)', 'execute') then
    failed := array_append(failed, '20261029110000');
  end if;

  if cardinality(failed) > 0 then
    raise exception 'Backfill aborted, nothing recorded: objects missing for %', failed;
  end if;
end $$;

insert into supabase_migrations.schema_migrations (version, name, created_by)
select v, n, 'sql-editor-backfill-2026-10-29'
from (values
  ('20261024124339', 'exam_centric_test_architecture_part2'),
  ('20261024150000', 'drop_admin_test_series_metrics'),
  ('20261029090000', 'block_inline_images'),
  ('20261029100000', 'rls_initplan_and_policy_merge'),
  ('20261029100100', 'fk_indexes_and_duplicate_index'),
  ('20261029100200', 'admin_item_analysis_rpc'),
  ('20261029100300', 'public_blog_rpcs'),
  ('20261029110000', 'definer_function_hardening')
) x(v, n)
where not exists (select 1 from supabase_migrations.schema_migrations s where s.version = x.v)
returning version, name;

commit;
