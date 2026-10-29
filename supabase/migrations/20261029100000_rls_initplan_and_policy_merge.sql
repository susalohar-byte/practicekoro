-- ============================================================================
-- Migration: 20261029100000_rls_initplan_and_policy_merge.sql
-- Supabase performance advisor: auth_rls_initplan (72) + multiple_permissive_policies (112).
--
-- Generated from production pg_policies on 2026-10-29. Every policy keeps its
-- exact meaning; only the shape changes:
--
-- 1. Initplan form. auth.uid() / auth.jwt() are wrapped as (select auth.uid()),
--    and row-independent STABLE helpers (has_role(auth.uid(), ...),
--    admin_scope_allowed, can_mutate_admin_record, is_management_super_admin,
--    can_manage_support, account_is_active(auth.uid())) as (select public.fn(...)),
--    so Postgres evaluates them once per statement instead of once per row.
--    Row-dependent helpers (app_setting_write_allowed(id), live_paper_visible(id))
--    are left as they are.
--
-- 2. Merged permissive policies. Permissive policies for the same role and
--    command are OR-ed by Postgres, so where a table had an "admin manage" ALL
--    policy next to a SELECT reader, the ALL policy is split into
--    INSERT / UPDATE / DELETE (an ALL policy without WITH CHECK uses its USING
--    for the check, which is spelled out here) and the admin branch is OR-ed into
--    the SELECT policy. Where the reader already contained the same admin check
--    (or was `true`), the reader is unchanged.
--    Restrictive policies are untouched apart from the initplan form.
--
-- Not merged (left as is; not provably equivalent):
--   public.cutoff_records, role authenticated, SELECT: the public reader
--   (cutoff_crud_read) and the authenticated admin ALL policy. Folding the
--   admin branch into the public reader would also apply it to anon.
--
-- Idempotent: every policy is dropped (if it exists) and recreated, inside one
-- transaction.
-- ============================================================================

begin;

-- ===========================================================================
-- Part 1. Merged permissive policies (each block also applies the initplan form)
-- ===========================================================================

-- public.chapters: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage chapters" on public.chapters;
drop policy if exists "Public read active chapters" on public.chapters;
drop policy if exists "Admin manage chapters (insert)" on public.chapters;
drop policy if exists "Admin manage chapters (update)" on public.chapters;
drop policy if exists "Admin manage chapters (delete)" on public.chapters;
create policy "Public read active chapters" on public.chapters
  as permissive for select to public
  using (((is_active = true) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage chapters (insert)" on public.chapters
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage chapters (update)" on public.chapters
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage chapters (delete)" on public.chapters
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.exams: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage exams" on public.exams;
drop policy if exists "Public read active exams" on public.exams;
drop policy if exists "Admin manage exams (insert)" on public.exams;
drop policy if exists "Admin manage exams (update)" on public.exams;
drop policy if exists "Admin manage exams (delete)" on public.exams;
create policy "Public read active exams" on public.exams
  as permissive for select to public
  using (((is_active = true) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage exams (insert)" on public.exams
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage exams (update)" on public.exams
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage exams (delete)" on public.exams
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.subjects: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage subjects" on public.subjects;
drop policy if exists "Public read active subjects" on public.subjects;
drop policy if exists "Admin manage subjects (insert)" on public.subjects;
drop policy if exists "Admin manage subjects (update)" on public.subjects;
drop policy if exists "Admin manage subjects (delete)" on public.subjects;
create policy "Public read active subjects" on public.subjects
  as permissive for select to public
  using (((is_active = true) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage subjects (insert)" on public.subjects
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage subjects (update)" on public.subjects
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage subjects (delete)" on public.subjects
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.test_series: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage test series" on public.test_series;
drop policy if exists "Public read active test series" on public.test_series;
drop policy if exists "Admin manage test series (insert)" on public.test_series;
drop policy if exists "Admin manage test series (update)" on public.test_series;
drop policy if exists "Admin manage test series (delete)" on public.test_series;
create policy "Public read active test series" on public.test_series
  as permissive for select to public
  using (((is_active = true) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage test series (insert)" on public.test_series
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage test series (update)" on public.test_series
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage test series (delete)" on public.test_series
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.subscription_plans: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage subscription plans" on public.subscription_plans;
drop policy if exists "Public read active plans" on public.subscription_plans;
drop policy if exists "Admin manage subscription plans (insert)" on public.subscription_plans;
drop policy if exists "Admin manage subscription plans (update)" on public.subscription_plans;
drop policy if exists "Admin manage subscription plans (delete)" on public.subscription_plans;
create policy "Public read active plans" on public.subscription_plans
  as permissive for select to public
  using (((is_active = true) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage subscription plans (insert)" on public.subscription_plans
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage subscription plans (update)" on public.subscription_plans
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage subscription plans (delete)" on public.subscription_plans
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.tests: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage tests" on public.tests;
drop policy if exists "Public read published tests" on public.tests;
drop policy if exists "Admin manage tests (insert)" on public.tests;
drop policy if exists "Admin manage tests (update)" on public.tests;
drop policy if exists "Admin manage tests (delete)" on public.tests;
create policy "Public read published tests" on public.tests
  as permissive for select to public
  using ((((is_active = true) AND (status = 'published'::text) AND ((is_live_only = false) OR live_paper_visible(id))) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage tests (insert)" on public.tests
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage tests (update)" on public.tests
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage tests (delete)" on public.tests
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.subscriptions: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage subscriptions" on public.subscriptions;
drop policy if exists "Users read own subscriptions" on public.subscriptions;
drop policy if exists "Admin manage subscriptions (insert)" on public.subscriptions;
drop policy if exists "Admin manage subscriptions (update)" on public.subscriptions;
drop policy if exists "Admin manage subscriptions (delete)" on public.subscriptions;
create policy "Users read own subscriptions" on public.subscriptions
  as permissive for select to public
  using ((((select auth.uid()) = user_id) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage subscriptions (insert)" on public.subscriptions
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage subscriptions (update)" on public.subscriptions
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage subscriptions (delete)" on public.subscriptions
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.test_attempts: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage test attempts" on public.test_attempts;
drop policy if exists "Users read own test attempts" on public.test_attempts;
drop policy if exists "Admin manage test attempts (insert)" on public.test_attempts;
drop policy if exists "Admin manage test attempts (update)" on public.test_attempts;
drop policy if exists "Admin manage test attempts (delete)" on public.test_attempts;
create policy "Users read own test attempts" on public.test_attempts
  as permissive for select to public
  using ((((select auth.uid()) = user_id) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage test attempts (insert)" on public.test_attempts
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage test attempts (update)" on public.test_attempts
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage test attempts (delete)" on public.test_attempts
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.test_results: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage test results" on public.test_results;
drop policy if exists "Users read own test results" on public.test_results;
drop policy if exists "Admin manage test results (insert)" on public.test_results;
drop policy if exists "Admin manage test results (update)" on public.test_results;
drop policy if exists "Admin manage test results (delete)" on public.test_results;
create policy "Users read own test results" on public.test_results
  as permissive for select to public
  using ((((select auth.uid()) = user_id) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admin manage test results (insert)" on public.test_results
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage test results (update)" on public.test_results
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage test results (delete)" on public.test_results
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.user_roles: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Only admins can manage roles" on public.user_roles;
drop policy if exists "Users can read own roles" on public.user_roles;
drop policy if exists "Only admins can manage roles (insert)" on public.user_roles;
drop policy if exists "Only admins can manage roles (update)" on public.user_roles;
drop policy if exists "Only admins can manage roles (delete)" on public.user_roles;
create policy "Users can read own roles" on public.user_roles
  as permissive for select to public
  using ((((select auth.uid()) = user_id) OR (select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Only admins can manage roles (insert)" on public.user_roles
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Only admins can manage roles (update)" on public.user_roles
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Only admins can manage roles (delete)" on public.user_roles
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.live_tests: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin can manage live tests" on public.live_tests;
drop policy if exists "Students read published live tests" on public.live_tests;
drop policy if exists "Admin can manage live tests (insert)" on public.live_tests;
drop policy if exists "Admin can manage live tests (update)" on public.live_tests;
drop policy if exists "Admin can manage live tests (delete)" on public.live_tests;
create policy "Students read published live tests" on public.live_tests
  as permissive for select to authenticated
  using ((((is_published = true) AND (status = ANY (ARRAY['upcoming'::text, 'live'::text]))) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text)))))));
create policy "Admin can manage live tests (insert)" on public.live_tests
  as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text))))));
create policy "Admin can manage live tests (update)" on public.live_tests
  as permissive for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text))))))
  with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text))))));
create policy "Admin can manage live tests (delete)" on public.live_tests
  as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text))))));

-- public.app_settings: Split ALL into INSERT/UPDATE/DELETE; SELECT is already `true` for these roles, so the admin branch added nothing.
drop policy if exists "Admins can manage all settings" on public.app_settings;
drop policy if exists "Anyone can read public app settings" on public.app_settings;
drop policy if exists "Admins can manage all settings (insert)" on public.app_settings;
drop policy if exists "Admins can manage all settings (update)" on public.app_settings;
drop policy if exists "Admins can manage all settings (delete)" on public.app_settings;
create policy "Anyone can read public app settings" on public.app_settings
  as permissive for select to public
  using (true);
create policy "Admins can manage all settings (insert)" on public.app_settings
  as permissive for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage all settings (update)" on public.app_settings
  as permissive for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage all settings (delete)" on public.app_settings
  as permissive for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.exam_categories: Split ALL into INSERT/UPDATE/DELETE; SELECT is already `true` for these roles, so the admin branch added nothing.
drop policy if exists "Admins can manage exam categories" on public.exam_categories;
drop policy if exists "Anyone can read exam categories" on public.exam_categories;
drop policy if exists "Admins can manage exam categories (insert)" on public.exam_categories;
drop policy if exists "Admins can manage exam categories (update)" on public.exam_categories;
drop policy if exists "Admins can manage exam categories (delete)" on public.exam_categories;
create policy "Anyone can read exam categories" on public.exam_categories
  as permissive for select to public
  using (true);
create policy "Admins can manage exam categories (insert)" on public.exam_categories
  as permissive for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.role = 'admin'::text)))) OR (((select auth.jwt()) ->> 'email'::text) = 'admin@practicekoro.online'::text)));
create policy "Admins can manage exam categories (update)" on public.exam_categories
  as permissive for update to authenticated
  using (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.role = 'admin'::text)))) OR (((select auth.jwt()) ->> 'email'::text) = 'admin@practicekoro.online'::text)))
  with check (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.role = 'admin'::text)))) OR (((select auth.jwt()) ->> 'email'::text) = 'admin@practicekoro.online'::text)));
create policy "Admins can manage exam categories (delete)" on public.exam_categories
  as permissive for delete to authenticated
  using (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.role = 'admin'::text)))) OR (((select auth.jwt()) ->> 'email'::text) = 'admin@practicekoro.online'::text)));

-- public.exam_subjects: Split ALL into INSERT/UPDATE/DELETE; SELECT is already `true` for these roles, so the admin branch added nothing.
drop policy if exists "Admins can manage exam_subjects" on public.exam_subjects;
drop policy if exists "Anyone can view exam_subjects" on public.exam_subjects;
drop policy if exists "Admins can manage exam_subjects (insert)" on public.exam_subjects;
drop policy if exists "Admins can manage exam_subjects (update)" on public.exam_subjects;
drop policy if exists "Admins can manage exam_subjects (delete)" on public.exam_subjects;
create policy "Anyone can view exam_subjects" on public.exam_subjects
  as permissive for select to anon, authenticated
  using (true);
create policy "Admins can manage exam_subjects (insert)" on public.exam_subjects
  as permissive for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage exam_subjects (update)" on public.exam_subjects
  as permissive for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage exam_subjects (delete)" on public.exam_subjects
  as permissive for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.exam_topics: Split ALL into INSERT/UPDATE/DELETE; SELECT is already `true` for these roles, so the admin branch added nothing.
drop policy if exists "Admins can manage exam_topics" on public.exam_topics;
drop policy if exists "Anyone can view exam_topics" on public.exam_topics;
drop policy if exists "Admins can manage exam_topics (insert)" on public.exam_topics;
drop policy if exists "Admins can manage exam_topics (update)" on public.exam_topics;
drop policy if exists "Admins can manage exam_topics (delete)" on public.exam_topics;
create policy "Anyone can view exam_topics" on public.exam_topics
  as permissive for select to anon, authenticated
  using (true);
create policy "Admins can manage exam_topics (insert)" on public.exam_topics
  as permissive for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage exam_topics (update)" on public.exam_topics
  as permissive for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage exam_topics (delete)" on public.exam_topics
  as permissive for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.test_exams: Split ALL into INSERT/UPDATE/DELETE; SELECT is already `true` for these roles, so the admin branch added nothing.
drop policy if exists "Admins can manage test_exams" on public.test_exams;
drop policy if exists "Anyone can view test_exams" on public.test_exams;
drop policy if exists "Admins can manage test_exams (insert)" on public.test_exams;
drop policy if exists "Admins can manage test_exams (update)" on public.test_exams;
drop policy if exists "Admins can manage test_exams (delete)" on public.test_exams;
create policy "Anyone can view test_exams" on public.test_exams
  as permissive for select to anon, authenticated
  using (true);
create policy "Admins can manage test_exams (insert)" on public.test_exams
  as permissive for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage test_exams (update)" on public.test_exams
  as permissive for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage test_exams (delete)" on public.test_exams
  as permissive for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.questions: Split ALL into INSERT/UPDATE/DELETE; SELECT USING already ORs the identical admin check (A OR (B OR A) = B OR A).
drop policy if exists "Admin manage questions" on public.questions;
drop policy if exists "Questions readable by admins only" on public.questions;
drop policy if exists "Admin manage questions (insert)" on public.questions;
drop policy if exists "Admin manage questions (update)" on public.questions;
drop policy if exists "Admin manage questions (delete)" on public.questions;
create policy "Questions readable by admins only" on public.questions
  as permissive for select to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage questions (insert)" on public.questions
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage questions (update)" on public.questions
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage questions (delete)" on public.questions
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.coupon_usages: Split ALL into INSERT/UPDATE/DELETE; SELECT = (own/visible rows) OR (admin) - the two old USING clauses OR-ed.
drop policy if exists "Admins can view all coupon usages" on public.coupon_usages;
drop policy if exists "Users can view their own coupon usages" on public.coupon_usages;
drop policy if exists "Admins can view all coupon usages (insert)" on public.coupon_usages;
drop policy if exists "Admins can view all coupon usages (update)" on public.coupon_usages;
drop policy if exists "Admins can view all coupon usages (delete)" on public.coupon_usages;
create policy "Users can view their own coupon usages" on public.coupon_usages
  as permissive for select to authenticated
  using ((((select auth.uid()) = user_id)) OR ((select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admins can view all coupon usages (insert)" on public.coupon_usages
  as permissive for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can view all coupon usages (update)" on public.coupon_usages
  as permissive for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can view all coupon usages (delete)" on public.coupon_usages
  as permissive for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.coupons: Split ALL into INSERT/UPDATE/DELETE; SELECT = (own/visible rows) OR (admin) - the two old USING clauses OR-ed.
drop policy if exists "Admins can manage coupons" on public.coupons;
drop policy if exists "Students can view active coupons" on public.coupons;
drop policy if exists "Admins can manage coupons (insert)" on public.coupons;
drop policy if exists "Admins can manage coupons (update)" on public.coupons;
drop policy if exists "Admins can manage coupons (delete)" on public.coupons;
create policy "Students can view active coupons" on public.coupons
  as permissive for select to authenticated
  using ((((is_active = true) AND ((valid_until IS NULL) OR (valid_until > now())))) OR ((select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admins can manage coupons (insert)" on public.coupons
  as permissive for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage coupons (update)" on public.coupons
  as permissive for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage coupons (delete)" on public.coupons
  as permissive for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.notifications: Split ALL into INSERT/UPDATE/DELETE; SELECT = (own/visible rows) OR (admin) - the two old USING clauses OR-ed.
drop policy if exists "Admins can manage all notifications" on public.notifications;
drop policy if exists "Students can read sent notifications" on public.notifications;
drop policy if exists "Admins can manage all notifications (insert)" on public.notifications;
drop policy if exists "Admins can manage all notifications (update)" on public.notifications;
drop policy if exists "Admins can manage all notifications (delete)" on public.notifications;
create policy "Students can read sent notifications" on public.notifications
  as permissive for select to authenticated
  using (((((status = 'sent'::text) OR ((status = 'scheduled'::text) AND (scheduled_at IS NOT NULL) AND (scheduled_at <= now()))) AND ((COALESCE(cardinality(recipient_ids), 0) = 0) OR ((select auth.uid()) = ANY (recipient_ids))))) OR ((select public.has_role((select auth.uid()), 'admin'::text))));
create policy "Admins can manage all notifications (insert)" on public.notifications
  as permissive for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage all notifications (update)" on public.notifications
  as permissive for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admins can manage all notifications (delete)" on public.notifications
  as permissive for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.attempt_answers: Split ALL; SELECT = admin OR own attempt. EXISTS(id AND (own OR admin)) OR admin == EXISTS(id AND own) OR admin.
drop policy if exists "Admin manage attempt answers" on public.attempt_answers;
drop policy if exists "Users read own attempt answers" on public.attempt_answers;
drop policy if exists "Admin manage attempt answers (insert)" on public.attempt_answers;
drop policy if exists "Admin manage attempt answers (update)" on public.attempt_answers;
drop policy if exists "Admin manage attempt answers (delete)" on public.attempt_answers;
create policy "Users read own attempt answers" on public.attempt_answers
  as permissive for select to public
  using (((select public.has_role((select auth.uid()), 'admin'::text)) OR (EXISTS ( SELECT 1
   FROM test_attempts
  WHERE ((test_attempts.id = attempt_answers.attempt_id) AND (test_attempts.user_id = (select auth.uid())))))));
create policy "Admin manage attempt answers (insert)" on public.attempt_answers
  as permissive for insert to public
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage attempt answers (update)" on public.attempt_answers
  as permissive for update to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));
create policy "Admin manage attempt answers (delete)" on public.attempt_answers
  as permissive for delete to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.test_questions: Drop "Test questions readable by authenticated users": same USING as the ALL policy, which already applies to these roles.
drop policy if exists "Admin manage test questions" on public.test_questions;
drop policy if exists "Test questions readable by authenticated users" on public.test_questions;
create policy "Admin manage test questions" on public.test_questions
  as permissive for all to public
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));

-- public.payment_gateways: Drop "Admin view gateway config": same USING as the ALL policy, which already applies to these roles.
drop policy if exists "Admin manage gateway config" on public.payment_gateways;
drop policy if exists "Admin view gateway config" on public.payment_gateways;
create policy "Admin manage gateway config" on public.payment_gateways
  as permissive for all to public
  using (((select public.has_role((select auth.uid()), 'admin'::text)) OR (((select auth.jwt()) ->> 'email'::text) = 'admin@practicekoro.online'::text)))
  with check (((select public.has_role((select auth.uid()), 'admin'::text)) OR (((select auth.jwt()) ->> 'email'::text) = 'admin@practicekoro.online'::text)));

-- public.live_test_participants: Per command: (own row) OR (admin), exactly the OR of the old permissive policies.
drop policy if exists "Admins manage live test participation" on public.live_test_participants;
drop policy if exists "Students read own live test participation" on public.live_test_participants;
drop policy if exists "Students register own live test participation" on public.live_test_participants;
drop policy if exists "Students update own live test participation" on public.live_test_participants;
drop policy if exists "Students or admins read live test participation" on public.live_test_participants;
drop policy if exists "Students or admins add live test participation" on public.live_test_participants;
drop policy if exists "Students or admins update live test participation" on public.live_test_participants;
drop policy if exists "Admins delete live test participation" on public.live_test_participants;
create policy "Students or admins read live test participation" on public.live_test_participants
  as permissive for select to authenticated
  using (((user_id = (select auth.uid()))) OR ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text)))))));
create policy "Students or admins add live test participation" on public.live_test_participants
  as permissive for insert to authenticated
  with check (((user_id = (select auth.uid()))) OR ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text)))))));
create policy "Students or admins update live test participation" on public.live_test_participants
  as permissive for update to authenticated
  using (((user_id = (select auth.uid()))) OR ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text)))))))
  with check (((user_id = (select auth.uid()))) OR ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text)))))));
create policy "Admins delete live test participation" on public.live_test_participants
  as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'admin'::text) OR (p.admin_role = 'super_admin'::text))))));

-- public.support_ticket_messages: OR of the two authenticated SELECT policies.
drop policy if exists "Students read public ticket messages" on public.support_ticket_messages;
drop policy if exists "Support staff can read messages" on public.support_ticket_messages;
drop policy if exists "Students and support staff read ticket messages" on public.support_ticket_messages;
create policy "Students and support staff read ticket messages" on public.support_ticket_messages
  as permissive for select to authenticated
  using ((((author_kind <> 'internal_note'::text) AND (select public.account_is_active((select auth.uid()))) AND (EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = support_ticket_messages.ticket_id) AND (support_tickets.user_id = (select auth.uid()))))))) OR ((select public.can_manage_support())));

-- public.support_tickets: Contact form keeps its exact check for anon; for authenticated every INSERT branch is OR-ed into one policy.
drop policy if exists "Admins can manage all support tickets" on public.support_tickets;
drop policy if exists "Public can submit contact inquiries" on public.support_tickets;
drop policy if exists "Students insert their tickets" on public.support_tickets;
drop policy if exists "Students read their tickets" on public.support_tickets;
drop policy if exists "Students, visitors and staff insert tickets" on public.support_tickets;
drop policy if exists "Students and staff read tickets" on public.support_tickets;
drop policy if exists "Admins can manage all support tickets (update)" on public.support_tickets;
drop policy if exists "Admins can manage all support tickets (delete)" on public.support_tickets;
create policy "Public can submit contact inquiries" on public.support_tickets
  as permissive for insert to anon
  with check (((user_id IS NULL) AND (assigned_to IS NULL) AND (resolution_notes IS NULL) AND (category = 'Other'::text) AND (priority = 'medium'::text) AND (status = 'open'::text) AND ((length(TRIM(BOTH FROM COALESCE(student_name, ''::text))) >= 2) AND (length(TRIM(BOTH FROM COALESCE(student_name, ''::text))) <= 120)) AND ((length(TRIM(BOTH FROM COALESCE(student_email, ''::text))) >= 5) AND (length(TRIM(BOTH FROM COALESCE(student_email, ''::text))) <= 254)) AND ((length(TRIM(BOTH FROM subject)) >= 3) AND (length(TRIM(BOTH FROM subject)) <= 200)) AND ((length(TRIM(BOTH FROM issue)) >= 10) AND (length(TRIM(BOTH FROM issue)) <= 5000))));
create policy "Students, visitors and staff insert tickets" on public.support_tickets
  as permissive for insert to authenticated
  with check (((select public.can_manage_support())) OR (((user_id IS NULL) AND (assigned_to IS NULL) AND (resolution_notes IS NULL) AND (category = 'Other'::text) AND (priority = 'medium'::text) AND (status = 'open'::text) AND ((length(TRIM(BOTH FROM COALESCE(student_name, ''::text))) >= 2) AND (length(TRIM(BOTH FROM COALESCE(student_name, ''::text))) <= 120)) AND ((length(TRIM(BOTH FROM COALESCE(student_email, ''::text))) >= 5) AND (length(TRIM(BOTH FROM COALESCE(student_email, ''::text))) <= 254)) AND ((length(TRIM(BOTH FROM subject)) >= 3) AND (length(TRIM(BOTH FROM subject)) <= 200)) AND ((length(TRIM(BOTH FROM issue)) >= 10) AND (length(TRIM(BOTH FROM issue)) <= 5000)))) OR (((user_id = (select auth.uid())) AND (select public.account_is_active((select auth.uid()))) AND (status = 'open'::text) AND (resolution_notes IS NULL) AND (assigned_to IS NULL))));
create policy "Students and staff read tickets" on public.support_tickets
  as permissive for select to authenticated
  using ((((user_id = (select auth.uid())) AND (select public.account_is_active((select auth.uid()))))) OR ((select public.can_manage_support())));
create policy "Admins can manage all support tickets (update)" on public.support_tickets
  as permissive for update to authenticated
  using ((select public.can_manage_support()))
  with check ((select public.can_manage_support()));
create policy "Admins can manage all support tickets (delete)" on public.support_tickets
  as permissive for delete to authenticated
  using ((select public.can_manage_support()));

-- public.exam_cutoff_configs: Readers were two identical `true` policies; the two admin ALL policies are OR-ed and split per write command (SELECT is already true).
drop policy if exists "Admin write access for exam cutoff configs" on public.exam_cutoff_configs;
drop policy if exists "cutoff_config_manage" on public.exam_cutoff_configs;
drop policy if exists "Public read access for exam cutoff configs" on public.exam_cutoff_configs;
drop policy if exists "cutoff_config_read" on public.exam_cutoff_configs;
drop policy if exists "Admin write access for exam cutoff configs (insert)" on public.exam_cutoff_configs;
drop policy if exists "Admin write access for exam cutoff configs (update)" on public.exam_cutoff_configs;
drop policy if exists "Admin write access for exam cutoff configs (delete)" on public.exam_cutoff_configs;
create policy "Public read access for exam cutoff configs" on public.exam_cutoff_configs
  as permissive for select to public
  using (true);
create policy "Admin write access for exam cutoff configs (insert)" on public.exam_cutoff_configs
  as permissive for insert to authenticated
  with check ((((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))))) OR ((select public.is_management_super_admin())));
create policy "Admin write access for exam cutoff configs (update)" on public.exam_cutoff_configs
  as permissive for update to authenticated
  using ((((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))))) OR ((select public.is_management_super_admin())))
  with check ((((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))))) OR ((select public.is_management_super_admin())));
create policy "Admin write access for exam cutoff configs (delete)" on public.exam_cutoff_configs
  as permissive for delete to authenticated
  using ((((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))))) OR ((select public.is_management_super_admin())));

-- public.cutoff_records: "Public read active cutoff records" (status = active) is implied by cutoff_crud_read (status = active OR ...), same roles. The two authenticated ALL policies are OR-ed. The authenticated SELECT overlap with the public reader is kept (see header).
drop policy if exists "Admin manage all cutoff records" on public.cutoff_records;
drop policy if exists "cutoff_crud_manage" on public.cutoff_records;
drop policy if exists "Public read active cutoff records" on public.cutoff_records;
drop policy if exists "cutoff_crud_read" on public.cutoff_records;
create policy "cutoff_crud_read" on public.cutoff_records
  as permissive for select to public
  using (((status = 'active'::text) OR (select public.is_management_super_admin())));
create policy "Admin manage all cutoff records" on public.cutoff_records
  as permissive for all to authenticated
  using ((((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))))) OR ((select public.is_management_super_admin())))
  with check ((((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))))) OR ((select public.is_management_super_admin())));

-- ===========================================================================
-- Part 2. Initplan-only rewrites (same name, roles, command and permissiveness)
-- ===========================================================================

drop policy if exists "Admins can insert audit logs" on public.admin_audit_logs;
create policy "Admins can insert audit logs" on public.admin_audit_logs
  as permissive for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = 'admin'::text))))));

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs" on public.admin_audit_logs
  as permissive for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = 'admin'::text))))));

drop policy if exists "server_audit_read" on public.admin_audit_logs;
create policy "server_audit_read" on public.admin_audit_logs
  as restrictive for select to authenticated
  using ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "admin_crud_delete_guard" on public.app_settings;
create policy "admin_crud_delete_guard" on public.app_settings
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('app_settings'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.app_settings;
create policy "admin_crud_insert_guard" on public.app_settings
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('app_settings'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.app_settings;
create policy "admin_crud_update_guard" on public.app_settings
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('app_settings'::text, false)))
  with check ((select public.can_mutate_admin_record('app_settings'::text, false)));

drop policy if exists "app_settings_hide_secrets_authenticated" on public.app_settings;
create policy "app_settings_hide_secrets_authenticated" on public.app_settings
  as restrictive for select to authenticated
  using (((id !~* '(secret|password|service.role|private.key|api.?key|server.?key|smtp.?user)'::text) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_scope_delete" on public.app_settings;
create policy "staff_scope_delete" on public.app_settings
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_attempt_delete" on public.attempt_answers;
create policy "staff_attempt_delete" on public.attempt_answers
  as restrictive for delete to authenticated
  using (((EXISTS ( SELECT 1
   FROM test_attempts a
  WHERE ((a.id = attempt_answers.attempt_id) AND (a.user_id = (select auth.uid()))))) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_attempt_insert" on public.attempt_answers;
create policy "staff_attempt_insert" on public.attempt_answers
  as restrictive for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM test_attempts a
  WHERE ((a.id = attempt_answers.attempt_id) AND (a.user_id = (select auth.uid()))))) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_attempt_read" on public.attempt_answers;
create policy "staff_attempt_read" on public.attempt_answers
  as restrictive for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM test_attempts a
  WHERE ((a.id = attempt_answers.attempt_id) AND (a.user_id = (select auth.uid()))))) OR (select public.admin_scope_allowed('content'::text))));

drop policy if exists "staff_attempt_update" on public.attempt_answers;
create policy "staff_attempt_update" on public.attempt_answers
  as restrictive for update to authenticated
  using (((EXISTS ( SELECT 1
   FROM test_attempts a
  WHERE ((a.id = attempt_answers.attempt_id) AND (a.user_id = (select auth.uid()))))) OR (select public.admin_scope_allowed('super'::text))))
  with check (((EXISTS ( SELECT 1
   FROM test_attempts a
  WHERE ((a.id = attempt_answers.attempt_id) AND (a.user_id = (select auth.uid()))))) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "audiobook_staff_delete" on public.audiobook_categories;
create policy "audiobook_staff_delete" on public.audiobook_categories
  as permissive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_insert" on public.audiobook_categories;
create policy "audiobook_staff_insert" on public.audiobook_categories
  as permissive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_update" on public.audiobook_categories;
create policy "audiobook_staff_update" on public.audiobook_categories
  as permissive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_delete" on public.audiobook_subjects;
create policy "audiobook_staff_delete" on public.audiobook_subjects
  as permissive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_insert" on public.audiobook_subjects;
create policy "audiobook_staff_insert" on public.audiobook_subjects
  as permissive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_update" on public.audiobook_subjects;
create policy "audiobook_staff_update" on public.audiobook_subjects
  as permissive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_delete" on public.audiobook_topics;
create policy "audiobook_staff_delete" on public.audiobook_topics
  as permissive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_insert" on public.audiobook_topics;
create policy "audiobook_staff_insert" on public.audiobook_topics
  as permissive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_update" on public.audiobook_topics;
create policy "audiobook_staff_update" on public.audiobook_topics
  as permissive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_delete" on public.audiobooks;
create policy "audiobook_staff_delete" on public.audiobooks
  as permissive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_insert" on public.audiobooks;
create policy "audiobook_staff_insert" on public.audiobooks
  as permissive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobook_staff_update" on public.audiobooks;
create policy "audiobook_staff_update" on public.audiobooks
  as permissive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "audiobooks_read" on public.audiobooks;
create policy "audiobooks_read" on public.audiobooks
  as permissive for select to authenticated
  using (((status = 'published'::text) OR (select public.admin_scope_allowed('content'::text))));

drop policy if exists "Users manage own bookmarks" on public.bookmarks;
create policy "Users manage own bookmarks" on public.bookmarks
  as permissive for all to public
  using (((select auth.uid()) = user_id));

drop policy if exists "admin_crud_delete_guard" on public.chapters;
create policy "admin_crud_delete_guard" on public.chapters
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('chapters'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.chapters;
create policy "admin_crud_insert_guard" on public.chapters
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('chapters'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.chapters;
create policy "admin_crud_update_guard" on public.chapters
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('chapters'::text, false)))
  with check ((select public.can_mutate_admin_record('chapters'::text, false)));

drop policy if exists "staff_scope_delete" on public.chapters;
create policy "staff_scope_delete" on public.chapters
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_insert" on public.chapters;
create policy "staff_scope_insert" on public.chapters
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.chapters;
create policy "staff_scope_update" on public.chapters
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "admin_crud_delete_guard" on public.coupons;
create policy "admin_crud_delete_guard" on public.coupons
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('coupons'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.coupons;
create policy "admin_crud_insert_guard" on public.coupons
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('coupons'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.coupons;
create policy "admin_crud_update_guard" on public.coupons
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('coupons'::text, false)))
  with check ((select public.can_mutate_admin_record('coupons'::text, false)));

drop policy if exists "staff_money_delete" on public.coupons;
create policy "staff_money_delete" on public.coupons
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_money_insert" on public.coupons;
create policy "staff_money_insert" on public.coupons
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_money_update" on public.coupons;
create policy "staff_money_update" on public.coupons
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('super'::text)))
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "admin_crud_delete_guard" on public.cutoff_records;
create policy "admin_crud_delete_guard" on public.cutoff_records
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('cutoff_records'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.cutoff_records;
create policy "admin_crud_insert_guard" on public.cutoff_records
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('cutoff_records'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.cutoff_records;
create policy "admin_crud_update_guard" on public.cutoff_records
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('cutoff_records'::text, false)))
  with check ((select public.can_mutate_admin_record('cutoff_records'::text, false)));

drop policy if exists "admin_crud_delete_guard" on public.exam_categories;
create policy "admin_crud_delete_guard" on public.exam_categories
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('exam_categories'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.exam_categories;
create policy "admin_crud_insert_guard" on public.exam_categories
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('exam_categories'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.exam_categories;
create policy "admin_crud_update_guard" on public.exam_categories
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('exam_categories'::text, false)))
  with check ((select public.can_mutate_admin_record('exam_categories'::text, false)));

drop policy if exists "staff_scope_delete" on public.exam_categories;
create policy "staff_scope_delete" on public.exam_categories
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_insert" on public.exam_categories;
create policy "staff_scope_insert" on public.exam_categories
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.exam_categories;
create policy "staff_scope_update" on public.exam_categories
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_delete" on public.exam_subjects;
create policy "staff_content_delete" on public.exam_subjects
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_insert" on public.exam_subjects;
create policy "staff_content_insert" on public.exam_subjects
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_update" on public.exam_subjects;
create policy "staff_content_update" on public.exam_subjects
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_delete" on public.exam_topics;
create policy "staff_content_delete" on public.exam_topics
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_insert" on public.exam_topics;
create policy "staff_content_insert" on public.exam_topics
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_update" on public.exam_topics;
create policy "staff_content_update" on public.exam_topics
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "admin_crud_delete_guard" on public.exams;
create policy "admin_crud_delete_guard" on public.exams
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('exams'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.exams;
create policy "admin_crud_insert_guard" on public.exams
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('exams'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.exams;
create policy "admin_crud_update_guard" on public.exams
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('exams'::text, false)))
  with check ((select public.can_mutate_admin_record('exams'::text, false)));

drop policy if exists "staff_scope_delete" on public.exams;
create policy "staff_scope_delete" on public.exams
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_insert" on public.exams;
create policy "staff_scope_insert" on public.exams
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.exams;
create policy "staff_scope_update" on public.exams
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_live_scope" on public.live_test_participants;
create policy "staff_live_scope" on public.live_test_participants
  as restrictive for all to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('content'::text))))
  with check (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('content'::text))));

drop policy if exists "admin_crud_delete_guard" on public.live_tests;
create policy "admin_crud_delete_guard" on public.live_tests
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('live_tests'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.live_tests;
create policy "admin_crud_insert_guard" on public.live_tests
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('live_tests'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.live_tests;
create policy "admin_crud_update_guard" on public.live_tests
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('live_tests'::text, false)))
  with check ((select public.can_mutate_admin_record('live_tests'::text, false)));

drop policy if exists "staff_scope_delete" on public.live_tests;
create policy "staff_scope_delete" on public.live_tests
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_insert" on public.live_tests;
create policy "staff_scope_insert" on public.live_tests
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.live_tests;
create policy "staff_scope_update" on public.live_tests
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "Users manage own mistakes" on public.mistakes;
create policy "Users manage own mistakes" on public.mistakes
  as permissive for all to public
  using (((select auth.uid()) = user_id));

drop policy if exists "admin_crud_delete_guard" on public.notifications;
create policy "admin_crud_delete_guard" on public.notifications
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('notifications'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.notifications;
create policy "admin_crud_insert_guard" on public.notifications
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('notifications'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.notifications;
create policy "admin_crud_update_guard" on public.notifications
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('notifications'::text, false)))
  with check ((select public.can_mutate_admin_record('notifications'::text, false)));

drop policy if exists "staff_scope_delete" on public.notifications;
create policy "staff_scope_delete" on public.notifications
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('support'::text)));

drop policy if exists "staff_scope_insert" on public.notifications;
create policy "staff_scope_insert" on public.notifications
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('support'::text)));

drop policy if exists "staff_scope_update" on public.notifications;
create policy "staff_scope_update" on public.notifications
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('support'::text)))
  with check ((select public.admin_scope_allowed('support'::text)));

drop policy if exists "staff_management_scope" on public.payment_gateways;
create policy "staff_management_scope" on public.payment_gateways
  as restrictive for all to authenticated
  using ((select public.admin_scope_allowed('super'::text)))
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "Users read own payments" on public.payments;
create policy "Users read own payments" on public.payments
  as permissive for select to public
  using ((((select auth.uid()) = user_id) OR (select public.has_role((select auth.uid()), 'admin'::text))));

drop policy if exists "staff_read_scope" on public.payments;
create policy "staff_read_scope" on public.payments
  as restrictive for select to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
create policy "Profiles are viewable by owner or admin" on public.profiles
  as permissive for select to public
  using ((((select auth.uid()) = id) OR (select public.has_role((select auth.uid()), 'admin'::text))));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  as permissive for update to public
  using (((select auth.uid()) = id));

drop policy if exists "staff_read_scope" on public.profiles;
create policy "staff_read_scope" on public.profiles
  as restrictive for select to authenticated
  using (((id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "admin_crud_delete_guard" on public.questions;
create policy "admin_crud_delete_guard" on public.questions
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('questions'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.questions;
create policy "admin_crud_insert_guard" on public.questions
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('questions'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.questions;
create policy "admin_crud_update_guard" on public.questions
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('questions'::text, false)))
  with check ((select public.can_mutate_admin_record('questions'::text, false)));

drop policy if exists "staff_scope_delete" on public.questions;
create policy "staff_scope_delete" on public.questions
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_insert" on public.questions;
create policy "staff_scope_insert" on public.questions
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.questions;
create policy "staff_scope_update" on public.questions
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "Admins can manage student batch members" on public.student_batch_members;
create policy "Admins can manage student batch members" on public.student_batch_members
  as permissive for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));

drop policy if exists "staff_management_scope" on public.student_batch_members;
create policy "staff_management_scope" on public.student_batch_members
  as restrictive for all to authenticated
  using ((select public.admin_scope_allowed('super'::text)))
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "Admins can manage student batches" on public.student_batches;
create policy "Admins can manage student batches" on public.student_batches
  as permissive for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));

drop policy if exists "staff_management_scope" on public.student_batches;
create policy "staff_management_scope" on public.student_batches
  as restrictive for all to authenticated
  using ((select public.admin_scope_allowed('super'::text)))
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "Admins can manage student internal notes" on public.student_notes;
create policy "Admins can manage student internal notes" on public.student_notes
  as permissive for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::text)))
  with check ((select public.has_role((select auth.uid()), 'admin'::text)));

drop policy if exists "student_notes_author_guard" on public.student_notes;
create policy "student_notes_author_guard" on public.student_notes
  as restrictive for insert to authenticated
  with check ((author_id = (select auth.uid())));

drop policy if exists "student_notes_role_guard" on public.student_notes;
create policy "student_notes_role_guard" on public.student_notes
  as restrictive for all to authenticated
  using ((select public.can_mutate_admin_record('support_tickets'::text)))
  with check ((select public.can_mutate_admin_record('support_tickets'::text)));

drop policy if exists "admin_crud_delete_guard" on public.subjects;
create policy "admin_crud_delete_guard" on public.subjects
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('subjects'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.subjects;
create policy "admin_crud_insert_guard" on public.subjects
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('subjects'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.subjects;
create policy "admin_crud_update_guard" on public.subjects
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('subjects'::text, false)))
  with check ((select public.can_mutate_admin_record('subjects'::text, false)));

drop policy if exists "staff_scope_delete" on public.subjects;
create policy "staff_scope_delete" on public.subjects
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_insert" on public.subjects;
create policy "staff_scope_insert" on public.subjects
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.subjects;
create policy "staff_scope_update" on public.subjects
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "Owners and admins read subscription changes" on public.subscription_changes;
create policy "Owners and admins read subscription changes" on public.subscription_changes
  as permissive for select to authenticated
  using ((((select auth.uid()) = user_id) OR (select public.has_role((select auth.uid()), 'admin'::text))));

drop policy if exists "admin_crud_delete_guard" on public.subscription_plans;
create policy "admin_crud_delete_guard" on public.subscription_plans
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('subscription_plans'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.subscription_plans;
create policy "admin_crud_insert_guard" on public.subscription_plans
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('subscription_plans'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.subscription_plans;
create policy "admin_crud_update_guard" on public.subscription_plans
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('subscription_plans'::text, false)))
  with check ((select public.can_mutate_admin_record('subscription_plans'::text, false)));

drop policy if exists "staff_money_delete" on public.subscription_plans;
create policy "staff_money_delete" on public.subscription_plans
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_money_insert" on public.subscription_plans;
create policy "staff_money_insert" on public.subscription_plans
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_money_update" on public.subscription_plans;
create policy "staff_money_update" on public.subscription_plans
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('super'::text)))
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "admin_crud_delete_guard" on public.subscriptions;
create policy "admin_crud_delete_guard" on public.subscriptions
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('subscriptions'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.subscriptions;
create policy "admin_crud_insert_guard" on public.subscriptions
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('subscriptions'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.subscriptions;
create policy "admin_crud_update_guard" on public.subscriptions
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('subscriptions'::text, false)))
  with check ((select public.can_mutate_admin_record('subscriptions'::text, false)));

drop policy if exists "staff_money_delete" on public.subscriptions;
create policy "staff_money_delete" on public.subscriptions
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_money_insert" on public.subscriptions;
create policy "staff_money_insert" on public.subscriptions
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_money_update" on public.subscriptions;
create policy "staff_money_update" on public.subscriptions
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('super'::text)))
  with check ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_read_scope" on public.subscriptions;
create policy "staff_read_scope" on public.subscriptions
  as restrictive for select to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_scope_delete" on public.support_tickets;
create policy "staff_scope_delete" on public.support_tickets
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('support'::text)));

drop policy if exists "staff_scope_update" on public.support_tickets;
create policy "staff_scope_update" on public.support_tickets
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('support'::text)))
  with check ((select public.admin_scope_allowed('support'::text)));

drop policy if exists "staff_attempt_delete" on public.test_attempts;
create policy "staff_attempt_delete" on public.test_attempts
  as restrictive for delete to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_attempt_insert" on public.test_attempts;
create policy "staff_attempt_insert" on public.test_attempts
  as restrictive for insert to authenticated
  with check (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_attempt_read" on public.test_attempts;
create policy "staff_attempt_read" on public.test_attempts
  as restrictive for select to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('content'::text))));

drop policy if exists "staff_attempt_update" on public.test_attempts;
create policy "staff_attempt_update" on public.test_attempts
  as restrictive for update to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))))
  with check (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_content_delete" on public.test_exams;
create policy "staff_content_delete" on public.test_exams
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_insert" on public.test_exams;
create policy "staff_content_insert" on public.test_exams
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_update" on public.test_exams;
create policy "staff_content_update" on public.test_exams
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_delete" on public.test_questions;
create policy "staff_content_delete" on public.test_questions
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_insert" on public.test_questions;
create policy "staff_content_insert" on public.test_questions
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_content_update" on public.test_questions;
create policy "staff_content_update" on public.test_questions
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_attempt_delete" on public.test_results;
create policy "staff_attempt_delete" on public.test_results
  as restrictive for delete to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_attempt_insert" on public.test_results;
create policy "staff_attempt_insert" on public.test_results
  as restrictive for insert to authenticated
  with check (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "staff_attempt_read" on public.test_results;
create policy "staff_attempt_read" on public.test_results
  as restrictive for select to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('content'::text))));

drop policy if exists "staff_attempt_update" on public.test_results;
create policy "staff_attempt_update" on public.test_results
  as restrictive for update to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))))
  with check (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

drop policy if exists "admin_crud_delete_guard" on public.test_series;
create policy "admin_crud_delete_guard" on public.test_series
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('test_series'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.test_series;
create policy "admin_crud_insert_guard" on public.test_series
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('test_series'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.test_series;
create policy "admin_crud_update_guard" on public.test_series
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('test_series'::text, false)))
  with check ((select public.can_mutate_admin_record('test_series'::text, false)));

drop policy if exists "staff_scope_delete" on public.test_series;
create policy "staff_scope_delete" on public.test_series
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_insert" on public.test_series;
create policy "staff_scope_insert" on public.test_series
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.test_series;
create policy "staff_scope_update" on public.test_series
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "admin_crud_delete_guard" on public.tests;
create policy "admin_crud_delete_guard" on public.tests
  as restrictive for delete to authenticated
  using ((select public.can_mutate_admin_record('tests'::text, true)));

drop policy if exists "admin_crud_insert_guard" on public.tests;
create policy "admin_crud_insert_guard" on public.tests
  as restrictive for insert to authenticated
  with check ((select public.can_mutate_admin_record('tests'::text, false)));

drop policy if exists "admin_crud_update_guard" on public.tests;
create policy "admin_crud_update_guard" on public.tests
  as restrictive for update to authenticated
  using ((select public.can_mutate_admin_record('tests'::text, false)))
  with check ((select public.can_mutate_admin_record('tests'::text, false)));

drop policy if exists "staff_scope_delete" on public.tests;
create policy "staff_scope_delete" on public.tests
  as restrictive for delete to authenticated
  using ((select public.admin_scope_allowed('super'::text)));

drop policy if exists "staff_scope_insert" on public.tests;
create policy "staff_scope_insert" on public.tests
  as restrictive for insert to authenticated
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_scope_update" on public.tests;
create policy "staff_scope_update" on public.tests
  as restrictive for update to authenticated
  using ((select public.admin_scope_allowed('content'::text)))
  with check ((select public.admin_scope_allowed('content'::text)));

drop policy if exists "staff_read_scope" on public.user_roles;
create policy "staff_read_scope" on public.user_roles
  as restrictive for select to authenticated
  using (((user_id = (select auth.uid())) OR (select public.admin_scope_allowed('super'::text))));

commit;
