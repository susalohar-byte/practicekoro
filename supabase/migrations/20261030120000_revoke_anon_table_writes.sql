-- ============================================================================
-- Migration: 20261030120000_revoke_anon_table_writes.sql
-- anon (signed-out visitors) never writes to a public table: every write path
-- needs a signed-in user or goes through SECURITY DEFINER functions and edge
-- functions (service_role). The 2026-10-29 restore left INSERT / UPDATE /
-- DELETE granted to anon on 17 tables. RLS already denied those writes (every
-- write policy needs auth.uid() or an admin role), so revoking the grants
-- changes no behaviour; it removes the single layer they relied on.
-- Idempotent.
-- ============================================================================
begin;

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke insert, update, delete on public.%I from anon', t.tablename);
  end loop;
end $$;

-- Tables created later start without anon write grants too.
alter default privileges in schema public
  revoke insert, update, delete on tables from anon;

commit;
