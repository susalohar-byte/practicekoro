-- pg_cron for the hourly subscription jobs. 20261014120000 skipped scheduling the expiry
-- reminders because the extension was missing; schedule them here.
-- (expire_lapsed_subscriptions_hourly is scheduled by 20261023120000.)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;

DO $$
BEGIN
    BEGIN
        PERFORM cron.unschedule('dispatch_subscription_expiry_reminders_hourly');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    PERFORM cron.schedule(
        'dispatch_subscription_expiry_reminders_hourly',
        '7 * * * *',
        'SELECT public.dispatch_subscription_expiry_reminders();'
    );
END $$;
