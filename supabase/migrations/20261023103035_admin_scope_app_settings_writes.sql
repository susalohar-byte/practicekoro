-- 20261016130000 part 1c: content staff may only write their content collections in app_settings.
CREATE OR REPLACE FUNCTION public.app_setting_write_allowed(p_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
  SELECT public.admin_scope_allowed('super')
    OR (public.admin_scope_allowed('content') AND p_id IN (
      'popular_exams_config',
      'popular_test_series_config',
      'banners_hero_list',
      'live_tests_schedule_list',
      'live_tests_participants_list'
    ));
$$;
REVOKE ALL ON FUNCTION public.app_setting_write_allowed(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_setting_write_allowed(text) TO authenticated, service_role;

DROP POLICY IF EXISTS staff_scope_insert ON public.app_settings;
CREATE POLICY staff_scope_insert ON public.app_settings AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.app_setting_write_allowed(id));
DROP POLICY IF EXISTS staff_scope_update ON public.app_settings;
CREATE POLICY staff_scope_update ON public.app_settings AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.app_setting_write_allowed(id)) WITH CHECK (public.app_setting_write_allowed(id));
DROP POLICY IF EXISTS staff_scope_delete ON public.app_settings;
CREATE POLICY staff_scope_delete ON public.app_settings AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_scope_allowed('super'));
