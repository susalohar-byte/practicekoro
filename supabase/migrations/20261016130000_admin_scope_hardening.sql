-- Admin sub-role hardening.
-- 1. Restrictive write policies so content/support/super scopes are enforced by the
--    database on every admin-writable table, not only by the admin UI. Existing
--    permissive "admin manage" policies (has_role / is_pk_admin) cannot bypass them.
--    Student read paths are untouched: only INSERT/UPDATE/DELETE are restricted, and
--    only on tables that students never write directly.
-- 2. app_settings and hero_banners no longer trust the JWT email claim.
-- 3. Suspended/invalid staff writes raise instead of silently skipping the audit log.
-- 4. search_path pinned on is_admin() and increment_banner_click().
-- 5. is_management_super_admin() requires the user_roles admin row, like admin_scope_allowed('super').
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Restrictive scope policies
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  v_spec text[];
  -- table, write scope, delete scope
  v_specs text[][] := ARRAY[
    ARRAY['exams',           'content', 'content'],
    ARRAY['subjects',        'content', 'content'],
    ARRAY['chapters',        'content', 'content'],
    ARRAY['questions',       'content', 'content'],
    ARRAY['exam_categories', 'content', 'content'],
    ARRAY['test_series',     'content', 'content'],
    -- Content writers cannot delete tests (canDeleteTests=false); deletion is super-only.
    ARRAY['tests',           'content', 'super'],
    ARRAY['live_tests',      'content', 'content'],
    ARRAY['flashcard_decks', 'content', 'content'],
    ARRAY['flashcards',      'content', 'content'],
    ARRAY['hero_banners',    'content', 'content'],
    ARRAY['notifications',   'support', 'support'],
    ARRAY['blog_posts',      'super',   'super']
  ];
BEGIN
  FOREACH v_spec SLICE 1 IN ARRAY v_specs LOOP
    t := v_spec[1];
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS staff_scope_insert ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY staff_scope_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated
         WITH CHECK (public.admin_scope_allowed(%L))', t, v_spec[2]);
    EXECUTE format('DROP POLICY IF EXISTS staff_scope_update ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY staff_scope_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
         USING (public.admin_scope_allowed(%L)) WITH CHECK (public.admin_scope_allowed(%L))',
      t, v_spec[2], v_spec[2]);
    EXECUTE format('DROP POLICY IF EXISTS staff_scope_delete ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY staff_scope_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
         USING (public.admin_scope_allowed(%L))', t, v_spec[3]);
  END LOOP;
END $$;

-- support_tickets: students and anonymous visitors still INSERT their own tickets
-- (existing policies); only staff UPDATE/DELETE are scoped to support.
DROP POLICY IF EXISTS staff_scope_update ON public.support_tickets;
CREATE POLICY staff_scope_update ON public.support_tickets AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_scope_allowed('support')) WITH CHECK (public.admin_scope_allowed('support'));
DROP POLICY IF EXISTS staff_scope_delete ON public.support_tickets;
CREATE POLICY staff_scope_delete ON public.support_tickets AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_scope_allowed('support'));

-- ---------------------------------------------------------------------------
-- 2. app_settings / hero_banners without the JWT-email trust branch
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.app_settings;
CREATE POLICY "Admins can manage all settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Content staff keep writing the content collections their pages sync
-- (popular exams/series, banners, live test schedule); everything else is super-only.
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

-- hero_banners may not exist (banners can live in app_settings.banners_hero_list).
DO $$
BEGIN
  IF to_regclass('public.hero_banners') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow admin full access to hero banners" ON public.hero_banners;
    CREATE POLICY "Allow admin full access to hero banners"
      ON public.hero_banners FOR ALL TO authenticated
      USING (public.admin_scope_allowed('content'))
      WITH CHECK (public.admin_scope_allowed('content'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Audit trigger: inactive / invalid staff cannot write unaudited
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_privileged_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); actor_email text; actor_name text; actor_role text;
 row_data jsonb; old_data jsonb; fields jsonb; service_actor boolean:=coalesce(auth.role(),'')='service_role';
BEGIN
 IF service_actor THEN
   actor:=NULL; actor_email:='service_role'; actor_name:='Trusted backend'; actor_role:='service_role';
 ELSE
   SELECT p.email,p.full_name,p.admin_role INTO actor_email,actor_name,actor_role
   FROM public.profiles p WHERE p.id=actor AND p.role='admin' AND p.account_status='active'
     AND p.admin_role IN ('super_admin','content_writer','support_agent')
     AND EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=p.id AND ur.role='admin');
   IF NOT FOUND THEN
     -- A staff identity (admin profile or user_roles admin row) that is suspended or
     -- misconfigured must not change admin-managed tables without an audit record.
     -- Self-service tables (own profile, attempts, tickets, uploads) keep working.
     IF actor IS NOT NULL
        AND TG_TABLE_SCHEMA = 'public'
        AND TG_TABLE_NAME NOT IN ('profiles','test_attempts','test_results','attempt_answers',
                                  'live_test_participants','support_tickets')
        AND (EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND p.role='admin')
             OR EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=actor AND ur.role='admin')) THEN
       RAISE EXCEPTION 'Inactive or unverified staff account cannot modify %', TG_TABLE_NAME
         USING ERRCODE='42501';
     END IF;
     RETURN COALESCE(NEW,OLD);
   END IF;
 END IF;
 row_data:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 old_data:=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
 IF TG_OP='UPDATE' AND row_data=old_data THEN RETURN NEW; END IF;
 SELECT coalesce(jsonb_agg(key ORDER BY key),'[]'::jsonb) INTO fields
 FROM jsonb_each(row_data) WHERE TG_OP<>'UPDATE' OR value IS DISTINCT FROM old_data->key;
 INSERT INTO public.admin_audit_logs(admin_id,admin_email,admin_name,admin_role,action,entity_type,entity_id,details)
 VALUES(actor,coalesce(actor_email,'unknown'),actor_name,actor_role,lower(TG_OP),TG_TABLE_NAME,
   coalesce(row_data->>'id',row_data->>'user_id',row_data->>'test_id'),
   jsonb_build_object('source','database_trigger','schema',TG_TABLE_SCHEMA,'version',1,'changed_fields',fields,'actor_kind',CASE WHEN service_actor THEN 'service' ELSE 'staff' END));
 RETURN COALESCE(NEW,OLD);
END $$;
REVOKE ALL ON FUNCTION public.audit_privileged_mutation() FROM PUBLIC,anon,authenticated;

-- live_tests / flashcards admin policies use is_pk_admin(), which ignored account status.
CREATE OR REPLACE FUNCTION public.is_pk_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- ---------------------------------------------------------------------------
-- 4. Pin search_path on remaining SECURITY DEFINER helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

-- Still callable by anonymous visitors (landing-page banner clicks), but only
-- counts clicks on banners that are actually live.
CREATE OR REPLACE FUNCTION public.increment_banner_click(p_banner_id TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  UPDATE public.hero_banners
  SET click_count = click_count + 1
  WHERE id = p_banner_id
    AND is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at >= NOW());
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_banner_click(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Consistent super-admin identity
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_management_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT public.admin_scope_allowed('super');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_support()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT public.admin_scope_allowed('support');
$$;

COMMIT;
