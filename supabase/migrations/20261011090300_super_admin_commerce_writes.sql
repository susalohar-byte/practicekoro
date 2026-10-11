-- Money tables: only active super admins may write from a client session.
-- The permissive "Admin manage …" policies use has_role('admin'), which is true for
-- every staff sub-role (content_writer, support_agent), so those staff could grant Pro,
-- change plan prices or create coupons. Restrictive policies AND with them.
-- Service-role workflows (payment activation, refunds) bypass RLS and are unaffected;
-- SELECT access is unchanged.
BEGIN;

DROP POLICY IF EXISTS staff_money_insert ON public.subscriptions;
CREATE POLICY staff_money_insert ON public.subscriptions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_money_update ON public.subscriptions;
CREATE POLICY staff_money_update ON public.subscriptions AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.admin_scope_allowed('super')) WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_money_delete ON public.subscriptions;
CREATE POLICY staff_money_delete ON public.subscriptions AS RESTRICTIVE FOR DELETE TO authenticated USING (public.admin_scope_allowed('super'));

DROP POLICY IF EXISTS staff_money_insert ON public.subscription_plans;
CREATE POLICY staff_money_insert ON public.subscription_plans AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_money_update ON public.subscription_plans;
CREATE POLICY staff_money_update ON public.subscription_plans AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.admin_scope_allowed('super')) WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_money_delete ON public.subscription_plans;
CREATE POLICY staff_money_delete ON public.subscription_plans AS RESTRICTIVE FOR DELETE TO authenticated USING (public.admin_scope_allowed('super'));

DROP POLICY IF EXISTS staff_money_insert ON public.coupons;
CREATE POLICY staff_money_insert ON public.coupons AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_money_update ON public.coupons;
CREATE POLICY staff_money_update ON public.coupons AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.admin_scope_allowed('super')) WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_money_delete ON public.coupons;
CREATE POLICY staff_money_delete ON public.coupons AS RESTRICTIVE FOR DELETE TO authenticated USING (public.admin_scope_allowed('super'));

COMMIT;
