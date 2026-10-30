-- ============================================================================
-- Migration: 20261030100000_reapply_removed_rpc_revokes.sql
-- 20261030090000 reset privileges to the 29 Oct backup, which predates
-- 20261029140000 step D, so archive_test and get_test_series_leaderboard became
-- callable by `authenticated` again. Nothing in the clients calls them; take
-- them off the API again (service_role only). Idempotent.
-- Caught by supabase/tests/function_security.sql (unused_rpcs_not_api).
-- ============================================================================
do $$
declare
  v_fn regprocedure;
begin
  foreach v_fn in array array[
    to_regprocedure('public.archive_test(text)'),
    to_regprocedure('public.get_test_series_leaderboard(text,text)')
  ] loop
    continue when v_fn is null;
    execute format('revoke execute on function %s from public, anon, authenticated', v_fn);
    execute format('grant execute on function %s to service_role', v_fn);
  end loop;
end $$;
