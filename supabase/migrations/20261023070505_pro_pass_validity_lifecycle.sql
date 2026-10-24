-- Pro Pass validity lifecycle: stored expiry status, richer student status, upgrade offers.
-- Requires 20261014120000_controlled_subscription_upgrade_renewal.sql (quote function,
-- subscription_changes, renewed_from_subscription_id). No subscription or payment row is
-- deleted, and no plan price, title or duration is changed.
--
--   * Validity is always plan.duration_days from the purchase (set in the Admin Panel):
--     6-month pass = 180 days, 1-year pass = 365 days. Expiry is computed and stored on
--     the server only (quote_subscription_purchase / apply_captured_subscription_payment).
--   * Lapsed passes are flipped from 'active' to 'expired' hourly (pg_cron) and on read,
--     so the Admin Panel's stored status matches what the student sees.
--   * get_student_subscription_details() now also reports the purchase date, last upgrade
--     and the upgrades the student may buy (empty for the longest plan).
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Expiry status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_lapsed_subscriptions(p_user_id UUID DEFAULT NULL)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.subscriptions
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active'
      AND expires_at <= NOW()
      AND (p_user_id IS NULL OR user_id = p_user_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_lapsed_subscriptions(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_lapsed_subscriptions(UUID) TO service_role;

-- Catch up on passes that already lapsed.
SELECT public.expire_lapsed_subscriptions(NULL);

-- ---------------------------------------------------------------------------
-- 2. Student status (identity from the JWT)
-- ---------------------------------------------------------------------------
-- VOLATILE (was STABLE): it marks the caller's own lapsed passes as expired.
DROP FUNCTION IF EXISTS public.get_student_subscription_details();
CREATE FUNCTION public.get_student_subscription_details()
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_sub public.subscriptions%ROWTYPE;
    v_plan public.subscription_plans%ROWTYPE;
    v_next public.subscriptions%ROWTYPE;
    v_active BOOLEAN;
    v_upgraded_at TIMESTAMPTZ;
    v_upgrades JSONB := '[]'::jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
    END IF;

    PERFORM public.expire_lapsed_subscriptions(v_user_id);

    -- Paid pass covering today; otherwise the most recent paid pass that has started.
    SELECT s.* INTO v_sub FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    WHERE s.user_id = v_user_id AND s.status = 'active' AND p.price > 0
      AND s.starts_at <= NOW() AND s.expires_at > NOW()
    ORDER BY s.expires_at DESC LIMIT 1;
    IF v_sub.id IS NULL THEN
        SELECT s.* INTO v_sub FROM public.subscriptions s
        JOIN public.subscription_plans p ON p.id = s.plan_id
        WHERE s.user_id = v_user_id AND p.price > 0 AND s.starts_at <= NOW()
        ORDER BY s.expires_at DESC LIMIT 1;
    END IF;
    IF v_sub.id IS NULL THEN
        RETURN jsonb_build_object('has_subscription', false, 'is_active', false,
            'status', 'none', 'upgrade_options', '[]'::jsonb, 'can_upgrade', false);
    END IF;

    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;
    v_active := v_sub.status = 'active' AND v_sub.expires_at > NOW();
    SELECT * INTO v_next FROM public.subscriptions
    WHERE renewed_from_subscription_id = v_sub.id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;
    SELECT MAX(c.created_at) INTO v_upgraded_at FROM public.subscription_changes c
    WHERE c.subscription_id = v_sub.id AND c.change_type = 'upgrade' AND c.reverted_at IS NULL;

    IF v_active THEN
        SELECT COALESCE(jsonb_agg(q ORDER BY (q->>'amount')::numeric), '[]'::jsonb)
        INTO v_upgrades
        FROM (
            SELECT public.quote_subscription_purchase(v_user_id, p.id)
                   || jsonb_build_object('duration_days', p.duration_days) AS q
            FROM public.subscription_plans p
            WHERE p.is_active AND p.price > 0 AND p.duration_days > v_plan.duration_days
        ) t
        WHERE (q->>'eligible')::boolean AND q->>'purchase_type' = 'upgrade';
    END IF;

    RETURN jsonb_build_object(
        'has_subscription', true,
        'is_active', v_active,
        'subscription_id', v_sub.id,
        'status', CASE WHEN v_active THEN 'active' ELSE 'expired' END,
        'plan_id', v_sub.plan_id,
        'plan_title', COALESCE(v_plan.title, 'Pro Pass'),
        'duration_days', v_plan.duration_days,
        'purchased_at', v_sub.created_at,
        'starts_at', v_sub.starts_at,
        'expires_at', v_sub.expires_at,
        'upgraded_at', v_upgraded_at,
        -- Whole days still covered, counting today's partial day.
        'days_remaining', CASE WHEN v_active
            THEN CEIL(EXTRACT(EPOCH FROM (v_sub.expires_at - NOW())) / 86400)::INT ELSE 0 END,
        'renewal_window_days', v_plan.renewal_window_days,
        'renewed', v_next.id IS NOT NULL,
        'renewed_expires_at', v_next.expires_at,
        'upgrade_options', v_upgrades,
        'can_upgrade', jsonb_array_length(v_upgrades) > 0
    );
END;
$$;
REVOKE ALL ON FUNCTION public.get_student_subscription_details() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_subscription_details() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Expiry reminders: still announce passes already marked 'expired'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dispatch_subscription_expiry_reminders()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    r RECORD;
    v_kind TEXT;
    v_title TEXT;
    v_message TEXT;
    v_date TEXT;
    v_can_renew BOOLEAN;
    v_notification_id UUID;
    v_sent INT := 0;
BEGIN
    FOR r IN
        SELECT s.id, s.user_id, s.expires_at, p.title AS plan_title, p.renewal_window_days
        FROM public.subscriptions s
        JOIN public.subscription_plans p ON p.id = s.plan_id
        -- 'expired' too: expire_lapsed_subscriptions() may flip the row before this runs.
        WHERE s.status IN ('active', 'expired') AND p.price > 0
          AND s.starts_at <= NOW()
          AND s.expires_at <= NOW() + INTERVAL '15 days'
          -- Announce an expiry at most 3 days late (first run / missed cron), never older.
          AND s.expires_at > NOW() - INTERVAL '3 days'
          -- A renewal, upgrade or later pass that continues access means nothing is expiring.
          AND NOT EXISTS (
              SELECT 1 FROM public.subscriptions n
              JOIN public.subscription_plans np ON np.id = n.plan_id
              WHERE n.user_id = s.user_id AND n.id <> s.id AND n.status = 'active'
                AND np.price > 0 AND n.starts_at <= s.expires_at AND n.expires_at > s.expires_at)
    LOOP
        v_kind := CASE
            WHEN r.expires_at <= NOW() THEN 'expired'
            WHEN r.expires_at <= NOW() + INTERVAL '1 day' THEN 'days_1'
            WHEN r.expires_at <= NOW() + INTERVAL '7 days' THEN 'days_7'
            ELSE 'days_15' END;

        INSERT INTO public.subscription_expiry_reminders (subscription_id, expires_at, reminder_kind)
        VALUES (r.id, r.expires_at, v_kind)
        ON CONFLICT DO NOTHING;
        IF NOT FOUND THEN
            CONTINUE; -- already sent for this exact expiry
        END IF;

        v_date := to_char(r.expires_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY');
        v_can_renew := r.renewal_window_days IS NOT NULL
            AND NOW() >= r.expires_at - make_interval(days => r.renewal_window_days);

        IF v_kind = 'expired' THEN
            v_title := 'Your Pro Pass has expired';
            v_message := 'Your ' || r.plan_title || ' expired on ' || v_date
                || '. Choose a plan on the Subscription page to unlock premium tests again.';
        ELSE
            v_title := CASE v_kind
                WHEN 'days_1' THEN 'Your Pro Pass expires tomorrow'
                WHEN 'days_7' THEN 'Your Pro Pass expires in 7 days'
                ELSE 'Your Pro Pass expires in 15 days' END;
            v_message := 'Your ' || r.plan_title || ' expires on ' || v_date || '. '
                || CASE WHEN v_can_renew
                        THEN 'You can renew it once for the next cycle from the Subscription page.'
                        ELSE 'Visit the Subscription page to see your upgrade and purchase options.'
                   END;
        END IF;

        INSERT INTO public.notifications (title, message, target_audience, channel, status,
            sent_at, recipient_ids, action_link, type)
        VALUES (v_title, v_message, 'selected', 'in_app', 'sent', NOW(), ARRAY[r.user_id],
            '/subscription', 'subscription_expiry')
        RETURNING id INTO v_notification_id;

        UPDATE public.subscription_expiry_reminders SET notification_id = v_notification_id
        WHERE subscription_id = r.id AND expires_at = r.expires_at AND reminder_kind = v_kind;
        v_sent := v_sent + 1;
    END LOOP;
    RETURN v_sent;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_subscription_expiry_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_subscription_expiry_reminders() TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Schedule expiry (hourly, alongside the expiry reminders)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        BEGIN
            PERFORM cron.unschedule('expire_lapsed_subscriptions_hourly');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        PERFORM cron.schedule(
            'expire_lapsed_subscriptions_hourly',
            '5 * * * *',
            'SELECT public.expire_lapsed_subscriptions(NULL);'
        );
    ELSE
        RAISE NOTICE 'pg_cron not installed: schedule public.expire_lapsed_subscriptions() hourly.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron registration skipped: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
