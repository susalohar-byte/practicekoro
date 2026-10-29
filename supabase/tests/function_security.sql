-- ============================================================================
-- PRACTICEKORO FUNCTION-EXPOSURE ASSERTIONS (plain SQL, catalog reads only)
-- ============================================================================
-- Every function in "public" is an API endpoint (/rest/v1/rpc/<name>), and a
-- SECURITY DEFINER function bypasses RLS. These checks run per function:
--   1. every SECURITY DEFINER function (public + private) pins search_path
--   2. anon can execute a public DEFINER function only if it is allow-listed
--   3. every public DEFINER function anon/authenticated can execute is
--      classified below, and its body has the caller check its class needs:
--        admin  -> staff check (admin_scope_allowed / can_mutate_admin_record /
--                  is_management_super_admin / can_manage_support /
--                  has_role(..,'admin') / profiles admin row of auth.uid())
--                  AND raises SQLSTATE 42501
--        user   -> reads auth.uid() (answers about / acts as the caller)
--        public -> anon read RPC, filters to active, non-live-hidden rows
--        exception -> explicit reason, no body rule
--   4. RLS helpers live in "private" (not an exposed schema), stay executable
--      for the roles whose policies call them, and no body calls them via
--      public.<fn>().
-- Usage: ./scripts/supabase-sql.sh -f supabase/tests/function_security.sql -t -A
-- Output: JSON rows of named booleans; CI fails on any value that is not true.
-- Behavioural counterpart (run on a scratch DB): function_security_behaviour.sql
-- ============================================================================

begin;

create temp table fs_class (proname text primary key, class text not null, reason text) on commit drop;
insert into fs_class (proname, class, reason) values
  -- admin-only RPCs: staff check + 42501
  ('admin_analytics_overview', 'admin', null),
  ('admin_dashboard_overview_stats', 'admin', null),
  ('admin_dashboard_range_stats', 'admin', null),
  ('admin_delete_record', 'admin', null),
  ('admin_get_payment_gateway', 'admin', null),
  ('admin_get_payment_health', 'admin', null),
  ('admin_item_analysis', 'admin', null),
  ('admin_modify_subscription', 'admin', null),
  ('admin_mutate_collection', 'admin', null),
  ('admin_rankings_aggregate', 'admin', null),
  ('admin_reporting_earliest', 'admin', null),
  ('admin_resolve_payment_alert', 'admin', null),
  ('admin_revenue_range_stats', 'admin', null),
  ('admin_save_exam_subject_topics', 'admin', null),
  ('admin_save_exam_topics', 'admin', null),
  ('admin_save_test_exams', 'admin', null),
  ('admin_update_app_settings', 'admin', null),
  ('admin_update_payment_gateway', 'admin', null),
  ('assign_admin_staff_by_email', 'admin', null),
  ('bulk_assign_students_to_batch', 'admin', null),
  ('bulk_grant_student_subscription', 'admin', null),
  ('create_targeted_notification', 'admin', null),
  ('get_admin_audiobook_stats', 'admin', null),
  ('get_admin_dashboard_counts', 'admin', null),
  ('get_admin_district_rankings', 'admin', null),
  ('get_admin_payments', 'admin', null),
  ('get_admin_students', 'admin', null),
  ('get_admin_subscriptions', 'admin', null),
  ('process_scheduled_notifications', 'admin', null),
  ('remove_admin_staff_member', 'admin', null),
  ('save_test_questions', 'admin', null),
  ('send_support_ticket_message', 'admin', null),
  ('update_admin_staff_role', 'admin', null),
  -- signed-in RPCs scoped to the caller: must read auth.uid()
  ('create_support_ticket', 'user', null),
  ('delete_own_account', 'user', null),
  ('get_app_leaderboard', 'user', null),
  ('get_attempt_rankings', 'user', null),
  ('get_attempt_solutions', 'user', null),
  ('get_my_subscription_purchase_options', 'user', null),
  ('get_student_exam_questions', 'user', null),
  ('get_student_subscription_details', 'user', null),
  ('get_test_leaderboard', 'user', null),
  ('get_test_series_analytics', 'user', null),
  ('has_active_subscription', 'user', null),
  ('record_audiobook_listen', 'user', null),
  ('save_test_answers', 'user', null),
  ('start_test_attempt', 'user', null),
  ('student_reply_support_ticket', 'user', null),
  ('submit_test_attempt', 'user', null),
  ('validate_coupon_code', 'user', null),
  -- anon read RPCs (landing page / SEO)
  ('get_public_seo_question_by_id', 'public', null),
  ('get_public_seo_questions', 'public', null),
  -- reviewed exceptions
  ('increment_banner_click', 'exception',
   'signed-in only; increments click_count of an active banner, returns nothing'),
  ('get_live_test_leaderboard', 'exception',
   'signed-in only; completed participants of one live test, same exposure as get_test_leaderboard');

create temp view fs_exposed as
select p.oid, p.proname, pg_get_functiondef(p.oid) as def,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_x,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_x
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f' and p.prosecdef
  and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or has_function_privilege('authenticated', p.oid, 'EXECUTE'));

-- ------------------------------------------------------------------
-- 1. search_path pinned on every SECURITY DEFINER function
-- ------------------------------------------------------------------
select coalesce(jsonb_object_agg('search_path_pinned:' || n.nspname || '.' || p.proname,
         coalesce(array_to_string(p.proconfig, ',') ~ '(^|,)search_path=', false)), '{}'::jsonb)
       || jsonb_build_object('definer_functions_found',
            exists (select 1 from pg_proc p2 join pg_namespace n2 on n2.oid = p2.pronamespace
                    where n2.nspname = 'public' and p2.prosecdef)) as definer_search_path
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private') and p.prokind = 'f' and p.prosecdef;

-- ------------------------------------------------------------------
-- 2. anon may execute only allow-listed public DEFINER functions
-- ------------------------------------------------------------------
select coalesce(jsonb_object_agg('anon_allowlisted:' || e.proname,
         e.proname in ('get_public_seo_question_by_id', 'get_public_seo_questions')), '{}'::jsonb)
       || jsonb_build_object('anon_definer_rpcs_only_allowlist', not exists (
            select 1 from fs_exposed e2
            where e2.anon_x and e2.proname not in ('get_public_seo_question_by_id', 'get_public_seo_questions')
          )) as anon_definer_allowlist
from fs_exposed e
where e.anon_x;

-- ------------------------------------------------------------------
-- 3. every exposed DEFINER RPC is classified and has its caller check
-- ------------------------------------------------------------------
select coalesce(jsonb_object_agg(e.proname || ':' || coalesce(c.class, 'unclassified'),
         case c.class
           when 'admin' then
             (e.def ~* '(admin_scope_allowed|can_mutate_admin_record|is_management_super_admin|can_manage_support)\s*\('
               or e.def ~* 'has_role\s*\([^;]*?''admin''\s*\)'
               or e.def ~* 'from\s+public\.profiles\s+where\s+id\s*=\s*auth\.uid\(\)\s+and\s+role\s*=\s*''admin''')
             and e.def ~* 'raise\s+exception[^;]*42501'
           when 'user' then e.def ~* 'auth\.uid\(\)'
           when 'public' then e.def ~* 'is_active\s*=\s*true' and e.def ~* 'is_question_live_hidden'
           when 'exception' then c.reason is not null
           else false
         end), '{}'::jsonb)
       || jsonb_build_object(
            'every_exposed_definer_classified', not exists (
              select 1 from fs_exposed e2 left join fs_class c2 using (proname) where c2.proname is null),
            'public_class_only_anon_rpcs', not exists (
              select 1 from fs_exposed e2 join fs_class c2 using (proname)
              where c2.class <> 'public' and e2.anon_x)
          ) as caller_checks
from fs_exposed e left join fs_class c using (proname);

-- ------------------------------------------------------------------
-- 4. RLS helpers: in "private", executable by the roles policies need,
--    and nothing calls them through "public".
-- ------------------------------------------------------------------
select jsonb_build_object(
  'private_schema_exists', to_regnamespace('private') is not null,
  'private_schema_usage_api_roles', case when to_regnamespace('private') is null then false else
      has_schema_privilege('anon', to_regnamespace('private'), 'USAGE')
      and has_schema_privilege('authenticated', to_regnamespace('private'), 'USAGE') end,
  'private_schema_no_create_api_roles', case when to_regnamespace('private') is null then false else
      not has_schema_privilege('anon', to_regnamespace('private'), 'CREATE')
      and not has_schema_privilege('authenticated', to_regnamespace('private'), 'CREATE') end,
  'helpers_in_private', (
    select bool_and(to_regprocedure('private.' || s) is not null)
    from unnest(array['has_role(uuid,text)', 'account_is_active(uuid)', 'admin_scope_allowed(text)',
                      'can_mutate_admin_record(text,boolean)', 'is_management_super_admin()',
                      'can_manage_support()', 'app_setting_write_allowed(text)',
                      'live_paper_visible(text)', 'has_test_access(uuid,text)']) s),
  'helpers_not_definer_in_public', not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and p.proname in ('has_role', 'account_is_active', 'admin_scope_allowed', 'can_mutate_admin_record',
                        'is_management_super_admin', 'can_manage_support', 'app_setting_write_allowed',
                        'live_paper_visible', 'has_test_access')),
  -- anon policies call these three; every policy helper is callable by authenticated
  'helpers_executable_anon', coalesce((
    select bool_and(has_function_privilege('anon', to_regprocedure('private.' || s), 'EXECUTE'))
    from unnest(array['has_role(uuid,text)', 'is_management_super_admin()', 'live_paper_visible(text)']) s), false),
  'helpers_executable_authenticated', coalesce((
    select bool_and(has_function_privilege('authenticated', to_regprocedure('private.' || s), 'EXECUTE'))
    from unnest(array['has_role(uuid,text)', 'account_is_active(uuid)', 'admin_scope_allowed(text)',
                      'can_mutate_admin_record(text,boolean)', 'is_management_super_admin()',
                      'can_manage_support()', 'app_setting_write_allowed(text)',
                      'live_paper_visible(text)', 'has_test_access(uuid,text)']) s), false),
  -- edge function upload-raster-image calls rpc('admin_scope_allowed'): invoker wrapper, signed-in only
  'admin_scope_allowed_wrapper_invoker', coalesce((
    select not p.prosecdef and pg_get_functiondef(p.oid) like '%private.admin_scope_allowed(p_scope)%'
    from pg_proc p where p.oid = to_regprocedure('public.admin_scope_allowed(text)')), false),
  'admin_scope_allowed_wrapper_not_anon', coalesce(
    not has_function_privilege('anon', to_regprocedure('public.admin_scope_allowed(text)'), 'EXECUTE')
    and has_function_privilege('authenticated', to_regprocedure('public.admin_scope_allowed(text)'), 'EXECUTE'), false),
  'no_body_calls_helpers_via_public', not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.prokind = 'f'
      and p.prosrc ~* '(^|[^a-z0-9_."])(public\.)?(has_role|account_is_active|admin_scope_allowed|can_mutate_admin_record|is_management_super_admin|can_manage_support|app_setting_write_allowed|live_paper_visible|has_test_access)\s*\('),
  -- policies keep using the helpers (by OID) after the move
  'policies_use_private_helpers', exists (
    select 1 from pg_policies where coalesce(qual, '') || coalesce(with_check, '') like '%private.%'),
  'policies_no_public_helpers', not exists (
    select 1 from pg_policies
    where coalesce(qual, '') || coalesce(with_check, '')
          ~ '(^|[^a-z0-9_."])(public\.)?(has_role|account_is_active|admin_scope_allowed|can_mutate_admin_record|is_management_super_admin|can_manage_support|app_setting_write_allowed|live_paper_visible|has_test_access)\(')
) as private_helpers;

-- ------------------------------------------------------------------
-- 5. Removed from the API (20261029140000): service_role only
-- ------------------------------------------------------------------
select jsonb_build_object(
  'unused_rpcs_not_api', coalesce((
    select bool_and(not has_function_privilege('anon', p, 'EXECUTE')
                and not has_function_privilege('authenticated', p, 'EXECUTE'))
    from unnest(array[to_regprocedure('public.archive_test(text)'),
                      to_regprocedure('public.get_test_series_leaderboard(text,text)')]) p
    where p is not null), true)
) as removed_rpcs;

rollback;
