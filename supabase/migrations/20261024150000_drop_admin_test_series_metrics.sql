-- ============================================================================
-- Migration: 20261024150000_drop_admin_test_series_metrics.sql
-- The admin Test Series page was removed, so its metrics RPC has no caller.
-- admin_get_test_series_metrics() was created directly in production and never
-- committed; IF EXISTS makes this a no-op on any other database.
-- ============================================================================

DROP FUNCTION IF EXISTS public.admin_get_test_series_metrics();
