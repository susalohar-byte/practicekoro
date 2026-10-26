-- process_scheduled_notifications() is SECURITY DEFINER and had no caller check, so any
-- signed-in user could run it. Restrict it to support-scoped staff (the scope that governs
-- writes on public.notifications), the service_role key, and direct database sessions with
-- no request JWT (pg_cron / SQL editor run as postgres or supabase_admin).
CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    updated_count integer := 0;
BEGIN
    IF NOT (
        public.admin_scope_allowed('support')
        OR coalesce(auth.role(), '') = 'service_role'
        OR (auth.uid() IS NULL AND auth.role() IS NULL
            AND session_user IN ('postgres', 'supabase_admin'))
    ) THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;

    UPDATE public.notifications
    SET status = 'sent',
        sent_at = COALESCE(scheduled_at, NOW())
    WHERE status = 'scheduled'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= NOW();

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.process_scheduled_notifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_scheduled_notifications() TO authenticated, service_role;
