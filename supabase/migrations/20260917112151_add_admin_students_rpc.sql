CREATE OR REPLACE FUNCTION public.get_admin_students(
  p_search text DEFAULT NULL,
  p_plan text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(student_row), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.phone,
      p.avatar_url,
      p.created_at,
      COALESCE(active_sub.plan_id, 'plan_free') AS plan_id,
      COALESCE(active_sub.plan_title, 'Free Plan') AS plan_title,
      COALESCE(active_sub.status, 'none') AS subscription_status,
      (active_sub.id IS NOT NULL AND active_sub.status = 'active') AS is_pro,
      active_sub.expires_at,
      COALESCE(attempt_stats.total_attempts, 0) AS total_attempts,
      COALESCE(attempt_stats.last_active, p.created_at) AS last_active
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT
        s.id,
        s.plan_id,
        s.status,
        s.expires_at,
        pl.title AS plan_title
      FROM public.subscriptions s
      LEFT JOIN public.subscription_plans pl ON pl.id = s.plan_id
      WHERE s.user_id = p.id
        AND s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
      ORDER BY s.expires_at DESC NULLS LAST, s.created_at DESC
      LIMIT 1
    ) active_sub ON true
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS total_attempts,
        MAX(ta.created_at) AS last_active
      FROM public.test_attempts ta
      WHERE ta.user_id = p.id
    ) attempt_stats ON true
    WHERE COALESCE(p.role, 'student') <> 'admin'
      AND COALESCE(lower(trim(p.email)), '') NOT IN ('admin@practicekoro.online', 'admin@practicekoro.com')
      AND (
        p_search IS NULL
        OR p.full_name ILIKE '%' || p_search || '%'
        OR p.email ILIKE '%' || p_search || '%'
        OR p.phone ILIKE '%' || p_search || '%'
      )
      AND (
        p_plan IS NULL
        OR p_plan = 'all'
        OR (p_plan = 'pro' AND active_sub.id IS NOT NULL)
        OR (p_plan = 'free' AND active_sub.id IS NULL)
      )
      AND (
        p_status IS NULL
        OR p_status = 'all'
        OR (p_status = 'active' AND active_sub.id IS NOT NULL)
        OR (p_status = 'expired' AND EXISTS (
          SELECT 1 FROM public.subscriptions es
          WHERE es.user_id = p.id AND es.status = 'expired'
        ))
      )
    ORDER BY p.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0)
  ) student_row;

  RETURN v_result;
END;
$function$;
