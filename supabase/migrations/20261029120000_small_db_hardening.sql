-- ============================================================================
-- Migration: 20261029120000_small_db_hardening.sql
-- Small advisor-driven fixes. Idempotent: safe to run more than once.
--
-- 1. public.test_questions had two identical btree indexes on (test_id):
--    idx_test_questions_test and idx_test_questions_test_id. No constraint
--    uses either one. idx_test_questions_test_id is kept (same naming as the
--    foreign-key indexes from 20261029100100).
--
-- 2. public.cutoff_records: the advisor reported multiple permissive SELECT
--    policies for authenticated ("Admin manage all cutoff records" FOR ALL and
--    cutoff_crud_read FOR SELECT TO public). Merging the admin branch into the
--    public read policy would also hand it to anon, so instead:
--      * anon keeps its read policy with exactly the same expression;
--      * authenticated gets one SELECT policy = old read OR old admin check;
--      * the admin FOR ALL policy is split into INSERT / UPDATE / DELETE with
--        the unchanged admin expression.
--    Effective access per role and command is identical to before (the
--    restrictive admin_crud_*_guard policies are not touched).
--
-- 3. public.payment_gateways: the permissive policy granted access when
--    auth.jwt()->>'email' matched a hard-coded admin address. It is replaced
--    by the role helper used by admin_update_payment_gateway(),
--    is_management_super_admin() (= admin_scope_allowed('super')), for
--    authenticated only. The restrictive staff_management_scope policy already
--    required admin_scope_allowed('super'), so nobody gains or loses access.
--    The secret columns key_secret / webhook_secret lose SELECT for anon and
--    authenticated at the column-privilege level (table-level SELECT is
--    replaced by SELECT on the non-secret columns). service_role is untouched:
--    the edge functions read only key_id / is_active with the service key and
--    take the Razorpay secrets from function env vars.
--    Later option: move any stored secret to Supabase Vault; not done here
--    because it would need edge-function changes and redeploys.
-- ============================================================================

begin;

set local lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1. Duplicate index on test_questions(test_id)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.idx_test_questions_test_id') is not null
     and to_regclass('public.idx_test_questions_test') is not null
     and not exists (select 1 from pg_constraint
                     where conindid = to_regclass('public.idx_test_questions_test')) then
    execute 'drop index public.idx_test_questions_test';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. cutoff_records: one permissive policy per role and command
-- ---------------------------------------------------------------------------
drop policy if exists "Admin manage all cutoff records" on public.cutoff_records;
drop policy if exists cutoff_crud_read on public.cutoff_records;
drop policy if exists cutoff_read_anon on public.cutoff_records;
drop policy if exists cutoff_read_authenticated on public.cutoff_records;
drop policy if exists cutoff_admin_insert on public.cutoff_records;
drop policy if exists cutoff_admin_update on public.cutoff_records;
drop policy if exists cutoff_admin_delete on public.cutoff_records;

-- anon: unchanged expression (the super-admin branch is always false for anon).
create policy cutoff_read_anon on public.cutoff_records
  for select to anon
  using (status = 'active' or (select public.is_management_super_admin()));

-- authenticated: old public read OR old admin FOR ALL check.
create policy cutoff_read_authenticated on public.cutoff_records
  for select to authenticated
  using (
    status = 'active'
    or (select public.is_management_super_admin())
    or exists (select 1 from public.user_roles
               where user_roles.user_id = (select auth.uid()) and user_roles.role = 'admin')
    or exists (select 1 from public.profiles
               where profiles.id = (select auth.uid()) and profiles.role = 'admin')
  );

create policy cutoff_admin_insert on public.cutoff_records
  for insert to authenticated
  with check (
    exists (select 1 from public.user_roles
            where user_roles.user_id = (select auth.uid()) and user_roles.role = 'admin')
    or exists (select 1 from public.profiles
               where profiles.id = (select auth.uid()) and profiles.role = 'admin')
    or (select public.is_management_super_admin())
  );

create policy cutoff_admin_update on public.cutoff_records
  for update to authenticated
  using (
    exists (select 1 from public.user_roles
            where user_roles.user_id = (select auth.uid()) and user_roles.role = 'admin')
    or exists (select 1 from public.profiles
               where profiles.id = (select auth.uid()) and profiles.role = 'admin')
    or (select public.is_management_super_admin())
  )
  with check (
    exists (select 1 from public.user_roles
            where user_roles.user_id = (select auth.uid()) and user_roles.role = 'admin')
    or exists (select 1 from public.profiles
               where profiles.id = (select auth.uid()) and profiles.role = 'admin')
    or (select public.is_management_super_admin())
  );

create policy cutoff_admin_delete on public.cutoff_records
  for delete to authenticated
  using (
    exists (select 1 from public.user_roles
            where user_roles.user_id = (select auth.uid()) and user_roles.role = 'admin')
    or exists (select 1 from public.profiles
               where profiles.id = (select auth.uid()) and profiles.role = 'admin')
    or (select public.is_management_super_admin())
  );

-- ---------------------------------------------------------------------------
-- 3. payment_gateways: role helper instead of a hard-coded email
-- ---------------------------------------------------------------------------
drop policy if exists "Admin manage gateway config" on public.payment_gateways;
drop policy if exists payment_gateways_super_admin_manage on public.payment_gateways;

create policy payment_gateways_super_admin_manage on public.payment_gateways
  for all to authenticated
  using ((select public.is_management_super_admin()))
  with check ((select public.is_management_super_admin()));

-- Secret columns: no client role may read them. Column privileges cannot
-- narrow a table-level grant, so table SELECT is swapped for column SELECT.
revoke select on public.payment_gateways from anon, authenticated;
revoke select (key_secret, webhook_secret) on public.payment_gateways from anon, authenticated;
grant select (gateway, key_id, is_active, created_at, updated_at)
  on public.payment_gateways to authenticated;
-- Writes go through admin_update_payment_gateway (SECURITY DEFINER) and the
-- edge functions (service_role); no client role writes the table directly.
revoke insert, update, delete on public.payment_gateways from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Table privileges clients never need
-- ---------------------------------------------------------------------------
-- TRUNCATE skips RLS entirely, and REFERENCES / TRIGGER are never used by the
-- API roles. PostgREST cannot issue them, but nothing should rely on that.
do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format(
      'revoke truncate, references, trigger on public.%I from anon, authenticated',
      t.tablename);
  end loop;
end $$;

-- Tables created later by the migration role start without them too.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

commit;
