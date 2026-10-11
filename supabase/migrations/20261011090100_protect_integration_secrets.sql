-- Protect integration credentials stored in public.app_settings.
-- "Anyone can read public app settings" (034) is USING (true), so rows such as
-- gateway_fast2sms_api_key / gateway_fcm_server_key / smtp_username were readable by anon.
-- 1. Restrictive SELECT policies hide credential-like ids from everyone except active super admins.
-- 2. admin_update_app_settings refuses to store those ids (regex widened only).
-- Existing values must be rotated at the provider and configured as Edge Function secrets.
BEGIN;

DROP POLICY IF EXISTS app_settings_hide_secrets_anon ON public.app_settings;
CREATE POLICY app_settings_hide_secrets_anon ON public.app_settings
  AS RESTRICTIVE FOR SELECT TO anon
  USING (id !~* '(secret|password|service.role|private.key|api.?key|server.?key|smtp.?user)');

DROP POLICY IF EXISTS app_settings_hide_secrets_authenticated ON public.app_settings;
CREATE POLICY app_settings_hide_secrets_authenticated ON public.app_settings
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    id !~* '(secret|password|service.role|private.key|api.?key|server.?key|smtp.?user)'
    OR public.admin_scope_allowed('super')
  );

CREATE OR REPLACE FUNCTION public.admin_update_app_settings(p_settings jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_item jsonb;v_count integer:=0;
BEGIN
 IF NOT public.is_management_super_admin() THEN RAISE EXCEPTION 'Active Super Admin privileges required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_settings)<>'array' THEN RAISE EXCEPTION 'Settings must be an array'; END IF;
 FOR v_item IN SELECT * FROM jsonb_array_elements(p_settings) LOOP
 IF coalesce(length(trim(v_item->>'id')),0)=0 THEN RAISE EXCEPTION 'Setting ID required'; END IF;
 IF (v_item->>'id') ~* '(secret|password|service.role|private.key|api.?key|server.?key|smtp.?user)' THEN RAISE EXCEPTION 'Credentials must be configured server-side, not in app_settings'; END IF;
 INSERT INTO public.app_settings(id,category,key,value,description,updated_at) VALUES(v_item->>'id',coalesce(v_item->>'category','general'),coalesce(v_item->>'key',v_item->>'id'),v_item->'value',v_item->>'description',now())
 ON CONFLICT(id) DO UPDATE SET value=excluded.value,category=excluded.category,key=excluded.key,description=excluded.description,updated_at=now();v_count:=v_count+1;
 END LOOP;
 RETURN jsonb_build_object('success',true,'updated_count',v_count);
END;$$;
REVOKE ALL ON FUNCTION public.admin_update_app_settings(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_update_app_settings(jsonb) TO authenticated;

COMMIT;
