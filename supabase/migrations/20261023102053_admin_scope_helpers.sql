-- 20261016130000 parts 3-5: audit trigger blocks unaudited writes by inactive staff; pinned search_path helpers.
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

CREATE OR REPLACE FUNCTION public.is_pk_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

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

CREATE OR REPLACE FUNCTION public.is_management_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT public.admin_scope_allowed('super');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_support()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT public.admin_scope_allowed('support');
$$;
