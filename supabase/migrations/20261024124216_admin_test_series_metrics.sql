-- ============================================================================
-- Migration: 20261024124216_admin_test_series_metrics.sql
-- Admin Test Series metrics RPC. Dropped again by 20261024150000 (page removed).
-- Body below is byte-identical to the SQL recorded for this version in
-- production supabase_migrations.schema_migrations (md5 51f650477c879d8186a92933523da830).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_test_series_metrics()
RETURNS TABLE (series_id text, enrollment_count bigint, avg_accuracy numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.id,
         count(DISTINCT ta.user_id),
         round(avg(ta.accuracy) FILTER (WHERE ta.status = 'completed'), 2)
    FROM public.test_series s
    LEFT JOIN public.tests t ON t.test_series_id = s.id
    LEFT JOIN public.test_attempts ta ON ta.test_id = t.id
   GROUP BY s.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_test_series_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_test_series_metrics() TO authenticated;

NOTIFY pgrst, 'reload schema';
