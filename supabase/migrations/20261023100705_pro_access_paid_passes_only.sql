-- Premium access (has_test_access -> has_active_subscription) now matches what students
-- see as "Pro":
--   * Only paid plans grant Pro. A Free-plan subscription row (the Admin Panel can assign
--     plan_free) no longer unlocks premium tests.
--   * A plan's is_active flag controls whether it is sold, not whether passes already
--     bought keep working. Hiding a plan in the Admin Panel used to revoke every holder.
-- Signature, default argument and caller scoping are unchanged.
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_target_user UUID;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() AND public.has_role(auth.uid(), 'admin') THEN
      v_target_user := p_user_id;
    ELSE
      v_target_user := auth.uid();
    END IF;
  ELSE
    v_target_user := p_user_id;
  END IF;
  RETURN public.account_is_active(v_target_user) AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    WHERE s.user_id = v_target_user AND s.status = 'active'
      AND s.starts_at <= NOW() AND s.expires_at > NOW() AND p.price > 0
  );
END;
$$;
