-- ============================================================================
-- Move RLS-only SECURITY DEFINER helpers out of the API (audit 2026-10-29, step 4)
-- ============================================================================
-- Every function in "public" is callable at /rest/v1/rpc/<name>. The helpers
-- below exist for RLS policies, the invoker view user_test_access and other
-- database functions; no client (src/, student-web/, practicekoro_mobile/,
-- supabase/functions/) calls them over RPC, except admin_scope_allowed (see C).
--
-- Supabase docs (Row Level Security -> "Use security definer functions"):
-- security-definer functions should never be created in a schema listed in
-- the API's "Exposed schemas". PostgREST serves only those schemas (public,
-- graphql_public here), so a function in "private" has no /rpc endpoint.
--
-- How RLS keeps working:
--   * Policies, views and triggers store the function OID, not its name.
--     ALTER FUNCTION ... SET SCHEMA keeps the OID, owner, ACL, SECURITY DEFINER
--     and the pinned search_path, so every existing policy (and the policies
--     added by 20261029130000) keeps calling the same function.
--   * A policy expression runs as the querying role, so anon/authenticated
--     keep EXECUTE on the helpers exactly as before (ACLs move with the
--     function). They also get USAGE on "private", which is needed when a
--     SECURITY INVOKER function calls private.<fn> by name (see C).
--   * Function bodies are text resolved at run time. Every body that calls a
--     moved helper as public.<fn>(...) or <fn>(...) is rewritten to
--     private.<fn>(...) (B), so nothing depends on search_path.
--
--   A. create schema private; move 9 helpers into it
--   B. rewrite callers' bodies to private.<fn>(...)
--   C. public.admin_scope_allowed stays as a thin SECURITY INVOKER wrapper:
--      the upload-raster-image edge function calls it with the user's JWT.
--   D. revoke EXECUTE from anon/authenticated on archive_test and
--      get_test_series_leaderboard (no client, policy or function calls them);
--      get_live_test_leaderboard: signed-in only, search_path pinned.
--
-- Behaviour for legitimate callers is unchanged. Idempotent: a second run
-- finds the helpers already in "private" and changes nothing.
-- Migrations after this one must call the helpers as private.<fn>(...).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- A. Private schema. No default EXECUTE for future functions created here.
-- ----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
alter default privileges in schema private revoke execute on functions from public;

do $$
declare
  v_sig text;
  v_fn  regprocedure;
begin
  -- A cron job calling a helper by name would break silently after the move.
  if to_regclass('cron.job') is not null then
    if exists (
      select 1 from cron.job
      where command ~* '\m(public\.)?(has_role|account_is_active|admin_scope_allowed|can_mutate_admin_record|is_management_super_admin|can_manage_support|app_setting_write_allowed|live_paper_visible|has_test_access)\s*\('
    ) then
      raise exception 'A pg_cron job calls an RLS helper by name; update it before moving the helpers';
    end if;
  end if;

  foreach v_sig in array array[
    'has_role(uuid,text)',
    'account_is_active(uuid)',
    'admin_scope_allowed(text)',
    'can_mutate_admin_record(text,boolean)',
    'is_management_super_admin()',
    'can_manage_support()',
    'app_setting_write_allowed(text)',
    'live_paper_visible(text)',
    'has_test_access(uuid,text)'
  ] loop
    v_fn := to_regprocedure('public.' || v_sig);
    if v_fn is null or to_regprocedure('private.' || v_sig) is not null then
      continue;  -- already moved (second run) or not present
    end if;
    -- The wrapper from C is SECURITY INVOKER; never move it on a re-run.
    if not (select prosecdef from pg_proc where oid = v_fn) then
      continue;
    end if;
    execute format('alter function %s set schema private', v_fn);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- B. Rewrite every function body (public and private) that calls a moved
--    helper by name. pg_get_functiondef + CREATE OR REPLACE keeps the OID,
--    owner, ACL, volatility, SECURITY DEFINER/INVOKER and search_path.
-- ----------------------------------------------------------------------------
do $$
declare
  v_re  constant text := '(^|[^A-Za-z0-9_."])(public\.)?(has_role|account_is_active|admin_scope_allowed|can_mutate_admin_record|is_management_super_admin|can_manage_support|app_setting_write_allowed|live_paper_visible|has_test_access)(\s*\()';
  r     record;
  v_new text;
  v_pos int;
begin
  for r in
    select p.oid, pg_get_functiondef(p.oid) as def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
    where n.nspname in ('public', 'private')
      and p.prokind = 'f'
      and l.lanname in ('sql', 'plpgsql')
      and p.prosrc ~ '\m(has_role|account_is_active|admin_scope_allowed|can_mutate_admin_record|is_management_super_admin|can_manage_support|app_setting_write_allowed|live_paper_visible|has_test_access)\s*\('
  loop
    -- Only the body after the header (the header names the function itself).
    v_pos := strpos(r.def, E'\nAS $');
    if v_pos = 0 then
      raise exception 'Unexpected definition layout for %', r.oid::regprocedure;
    end if;
    v_new := substr(r.def, 1, v_pos - 1)
          || regexp_replace(substr(r.def, v_pos), v_re, '\1private.\3\4', 'g');
    if v_new is distinct from r.def then
      execute v_new;
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- C. Edge function upload-raster-image calls rpc('admin_scope_allowed') with
--    the caller's JWT. Keep that endpoint as an INVOKER wrapper: it answers
--    about the caller only (private.admin_scope_allowed reads auth.uid()).
--    RLS policies keep calling private.admin_scope_allowed by OID.
-- ----------------------------------------------------------------------------
create or replace function public.admin_scope_allowed(p_scope text)
 returns boolean
 language sql
 stable security invoker
 set search_path to ''
as $function$
  select private.admin_scope_allowed(p_scope);
$function$;

revoke execute on function public.admin_scope_allowed(text) from public, anon;
grant execute on function public.admin_scope_allowed(text) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- D. API functions nothing calls: remove from the API surface (service_role
--    keeps EXECUTE). get_live_test_leaderboard is used by the admin Live Test
--    page only; it was pinned to search_path "public" without pg_temp.
-- ----------------------------------------------------------------------------
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

  v_fn := to_regprocedure('public.get_live_test_leaderboard(text)');
  if v_fn is not null then
    execute format('alter function %s set search_path = public, pg_temp', v_fn);
    execute format('revoke execute on function %s from public, anon', v_fn);
    execute format('grant execute on function %s to authenticated, service_role', v_fn);
  end if;
end $$;

commit;
