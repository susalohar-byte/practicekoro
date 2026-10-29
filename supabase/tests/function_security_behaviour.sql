-- ============================================================================
-- PRACTICEKORO FUNCTION SECURITY — BEHAVIOURAL CHECKS (run on a scratch DB)
-- ============================================================================
-- Calls every admin-only RPC as an ordinary signed-in user (stubbed JWT, a
-- random uuid with no staff row) with dummy arguments and expects SQLSTATE
-- 42501. Also: anon cannot call the signed-in RPCs, and the RLS helpers are
-- no longer reachable through "public".
--
-- Everything runs inside BEGIN ... ROLLBACK, but an RPC without a working
-- caller check could still take row locks or do work before the rollback, so
-- run it against a local/branch database, not production:
--   psql "$SCRATCH_DB_URL" -v ON_ERROR_STOP=1 -t -A -f supabase/tests/function_security_behaviour.sql
-- Needs: roles anon/authenticated, auth.uid()/auth.jwt() reading
-- request.jwt.claims (as on Supabase). Output: JSON rows of named booleans.
-- ============================================================================

begin;

create temp table fsb_out (k text primary key, ok boolean not null, detail text);
grant all on fsb_out to anon, authenticated;

create function pg_temp.fsb_dummy_args(p_fn regprocedure) returns text
language sql stable as $$
  select coalesce(string_agg(
    case format_type(t, null)
      when 'text' then '''x''::text'
      when 'uuid' then 'gen_random_uuid()'
      when 'integer' then '1'
      when 'bigint' then '1::bigint'
      when 'numeric' then '1::numeric'
      when 'boolean' then 'false'
      when 'jsonb' then '''{}''::jsonb'
      when 'json' then '''{}''::json'
      when 'text[]' then 'array[''x'']::text[]'
      when 'uuid[]' then 'array[gen_random_uuid()]'
      when 'timestamp with time zone' then 'now()'
      when 'date' then 'current_date'
      else 'null::' || format_type(t, null)
    end, ', ' order by o), '')
  from unnest((select proargtypes::oid[] from pg_proc where oid = p_fn)) with ordinality a(t, o)
$$;

-- Runs one call as the given role/JWT; records whether it failed with p_expect.
create function pg_temp.fsb_expect(p_key text, p_call text, p_role text, p_claims jsonb, p_expect text[])
returns void language plpgsql as $$
begin
  begin
    perform set_config('request.jwt.claims', p_claims::text, true);
    execute format('set local role %I', p_role);
    execute 'select ' || p_call;
    reset role;
    raise exception using errcode = 'FSB00', message = 'call succeeded';
  exception
    when sqlstate 'FSB00' then
      reset role;
      insert into fsb_out values (p_key, false, 'succeeded: ' || p_call);
    when others then
      reset role;
      insert into fsb_out values (p_key, sqlstate = any (p_expect), sqlstate || ' ' || sqlerrm);
  end;
end $$;

-- 1. admin-only RPCs as an ordinary signed-in user -> 42501
do $$
declare
  v_fn regprocedure;
  v_claims constant jsonb := jsonb_build_object('role', 'authenticated', 'sub', gen_random_uuid());
begin
  for v_fn in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
      and p.proname in (
        'admin_analytics_overview', 'admin_dashboard_overview_stats', 'admin_dashboard_range_stats',
        'admin_delete_record', 'admin_get_payment_gateway', 'admin_get_payment_health',
        'admin_item_analysis', 'admin_modify_subscription', 'admin_mutate_collection',
        'admin_rankings_aggregate', 'admin_reporting_earliest', 'admin_resolve_payment_alert',
        'admin_revenue_range_stats', 'admin_save_exam_subject_topics', 'admin_save_exam_topics',
        'admin_save_test_exams', 'admin_update_app_settings', 'admin_update_payment_gateway',
        'assign_admin_staff_by_email', 'bulk_assign_students_to_batch',
        'bulk_grant_student_subscription', 'create_targeted_notification',
        'get_admin_dashboard_counts', 'get_admin_district_rankings',
        'get_admin_payments', 'get_admin_students', 'get_admin_subscriptions',
        'process_scheduled_notifications', 'remove_admin_staff_member', 'save_test_questions',
        'send_support_ticket_message', 'update_admin_staff_role')
      -- any future admin_* / get_admin_* RPC is covered automatically
      or (n.nspname = 'public' and p.prosecdef and p.proname ~ '^(get_)?admin_'
          and has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    order by 1
  loop
    perform pg_temp.fsb_expect(
      'student_denied:' || v_fn::text,
      format('%s(%s)', v_fn::oid::regproc, pg_temp.fsb_dummy_args(v_fn)),
      'authenticated', v_claims, array['42501']);
  end loop;
end $$;

-- 2. signed-in RPCs are not callable by anon (no EXECUTE, or auth required)
do $$
declare
  v_fn regprocedure;
begin
  for v_fn in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
      and p.proname not in ('get_public_seo_question_by_id', 'get_public_seo_questions')
    order by 1
  loop
    perform pg_temp.fsb_expect(
      'anon_denied:' || v_fn::text,
      format('%s(%s)', v_fn::oid::regproc, pg_temp.fsb_dummy_args(v_fn)),
      'anon', '{"role": "anon"}'::jsonb, array['42501']);
  end loop;
end $$;

-- 3. RLS helpers are not reachable through "public" (no /rpc endpoint)
select pg_temp.fsb_expect('helper_not_in_public:' || s, 'public.' || s,
         'authenticated', jsonb_build_object('role', 'authenticated', 'sub', gen_random_uuid()),
         array['42883'])
from unnest(array[
  'has_role(gen_random_uuid(), ''admin'')', 'account_is_active(gen_random_uuid())',
  'can_mutate_admin_record(''tests'', false)', 'is_management_super_admin()',
  'can_manage_support()', 'app_setting_write_allowed(''x'')', 'live_paper_visible(''x'')',
  'has_test_access(gen_random_uuid(), ''x'')']) s;

-- 4. The admin_scope_allowed RPC kept for the edge function answers false
--    for a non-staff caller and is not callable by anon.
select pg_temp.fsb_expect('admin_scope_allowed_anon_denied', 'public.admin_scope_allowed(''content'')',
         'anon', '{"role": "anon"}'::jsonb, array['42501']);
do $$
declare v boolean;
begin
  perform set_config('request.jwt.claims',
    jsonb_build_object('role', 'authenticated', 'sub', gen_random_uuid())::text, true);
  set local role authenticated;
  v := public.admin_scope_allowed('content');
  reset role;
  insert into fsb_out values ('admin_scope_allowed_false_for_student', v is false, coalesce(v::text, 'null'));
end $$;

select jsonb_object_agg(k, ok) as behaviour from fsb_out;
-- Failures with detail (empty when everything passed):
select jsonb_object_agg(k, detail) as behaviour_failures_detail from fsb_out where not ok;

rollback;
