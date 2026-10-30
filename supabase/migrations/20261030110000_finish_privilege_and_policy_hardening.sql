-- ============================================================================
-- Migration: 20261030110000_finish_privilege_and_policy_hardening.sql
-- Makes production pass supabase/tests/rls_security.sql and function_security.sql.
--
-- 1. 20261029120000 sections 3-4 were added to that file after production had
--    already recorded it, so they never ran: API roles still had TRUNCATE /
--    REFERENCES / TRIGGER, `authenticated` could write public.payment_gateways
--    and read its key_secret / webhook_secret columns. Run them now.
-- 2. The content-table policies from 20261029130000 call the public
--    admin_scope_allowed() invoker wrapper; point them at the private helper
--    (one function call fewer per row, and the shape 20261029140000 expects).
-- Idempotent.
-- ============================================================================
begin;

-- 1a. Secret columns: table SELECT swapped for column SELECT without the secrets.
revoke select on public.payment_gateways from anon, authenticated;
revoke select (key_secret, webhook_secret) on public.payment_gateways from anon, authenticated;
grant select (gateway, key_id, is_active, created_at, updated_at)
  on public.payment_gateways to authenticated;
-- Writes go through admin_update_payment_gateway (SECURITY DEFINER) and the
-- edge functions (service_role).
revoke insert, update, delete on public.payment_gateways from anon, authenticated;

-- 1b. TRUNCATE skips RLS; REFERENCES / TRIGGER are never used by the API roles.
do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;

alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

-- 2. Content-table policies: call private.admin_scope_allowed directly.
do $$
declare
  r record;
  v_using text;
  v_check text;
begin
  for r in
    select c.relname as tablename, pol.polname as policyname,
           pg_get_expr(pol.polqual, pol.polrelid) as qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('hero_banners', 'blog_posts', 'popular_exam_cards', 'popular_test_series_cards')
  loop
    v_using := regexp_replace(r.qual, '(^|[^a-z0-9_."])(public\.)?admin_scope_allowed\(', '\1private.admin_scope_allowed(', 'g');
    v_check := regexp_replace(r.with_check, '(^|[^a-z0-9_."])(public\.)?admin_scope_allowed\(', '\1private.admin_scope_allowed(', 'g');
    if v_using is distinct from r.qual then
      execute format('alter policy %I on public.%I using (%s)', r.policyname, r.tablename, v_using);
    end if;
    if v_check is distinct from r.with_check then
      execute format('alter policy %I on public.%I with check (%s)', r.policyname, r.tablename, v_check);
    end if;
  end loop;
end $$;

commit;
