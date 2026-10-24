-- 20261016130000 part 1b: only support staff may update/delete support tickets.
DROP POLICY IF EXISTS staff_scope_update ON public.support_tickets;
CREATE POLICY staff_scope_update ON public.support_tickets AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_scope_allowed('support')) WITH CHECK (public.admin_scope_allowed('support'));
DROP POLICY IF EXISTS staff_scope_delete ON public.support_tickets;
CREATE POLICY staff_scope_delete ON public.support_tickets AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_scope_allowed('support'));
