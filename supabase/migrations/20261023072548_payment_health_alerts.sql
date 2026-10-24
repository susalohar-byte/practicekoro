-- Payment health alerts, shown on the Admin Dashboard.
--
-- Orders failed to record for ~2 weeks (Oct 2026) without anyone noticing. Now:
--   * The payment Edge Functions record every server-side failure here
--     (record_payment_alert), one open alert per failure kind, counting repeats.
--   * check_payment_health() runs hourly and flags captured payments that never
--     activated a pass and payments flagged for refund; it auto-resolves them once fixed.
--   * Super admins read and resolve alerts via admin_get_payment_health /
--     admin_resolve_payment_alert.
BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_health_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL
        CHECK (kind IN ('function_error', 'captured_not_activated', 'refund_required')),
    ref TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurrences INT NOT NULL DEFAULT 1,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
-- One open alert per problem; repeats bump occurrences instead of piling up rows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_health_alerts_open
    ON public.payment_health_alerts(kind, ref) WHERE resolved_at IS NULL;
ALTER TABLE public.payment_health_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_health_alerts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.payment_health_alerts TO service_role;

CREATE OR REPLACE FUNCTION public.record_payment_alert(
    p_kind TEXT,
    p_ref TEXT,
    p_source TEXT,
    p_message TEXT,
    p_detail JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.payment_health_alerts (kind, ref, source, message, detail)
    VALUES (p_kind, left(p_ref, 200), left(p_source, 80), left(p_message, 500),
            COALESCE(p_detail, '{}'::jsonb))
    ON CONFLICT (kind, ref) WHERE resolved_at IS NULL DO UPDATE
    SET occurrences = public.payment_health_alerts.occurrences + 1,
        last_seen_at = NOW(),
        message = EXCLUDED.message,
        detail = EXCLUDED.detail
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_payment_alert(TEXT, TEXT, TEXT, TEXT, JSONB)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_alert(TEXT, TEXT, TEXT, TEXT, JSONB)
    TO service_role;

CREATE OR REPLACE FUNCTION public.check_payment_health()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    r RECORD;
    v_open INT := 0;
BEGIN
    -- Captured (completed) payments that granted nothing: no pass row, no upgrade/renewal.
    FOR r IN
        SELECT pm.id, pm.user_id, pm.plan_id, pm.amount, pm.razorpay_payment_id, pm.created_at
        FROM public.payments pm
        WHERE pm.status = 'completed'
          AND pm.created_at > NOW() - INTERVAL '60 days'
          AND NOT COALESCE((pm.raw_response->>'activation_blocked')::boolean, false)
          AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.payment_id = pm.id)
          AND NOT EXISTS (SELECT 1 FROM public.subscription_changes c WHERE c.payment_id = pm.id)
          AND NOT EXISTS (SELECT 1 FROM public.subscriptions s
                          WHERE s.id::text = pm.raw_response->>'subscription_id')
    LOOP
        PERFORM public.record_payment_alert('captured_not_activated', r.id::text, 'health_check',
            'Payment ' || COALESCE(r.razorpay_payment_id, r.id::text) || ' (₹' || r.amount
                || ') was captured but no Pro Pass was activated.',
            jsonb_build_object('payment_id', r.id, 'user_id', r.user_id, 'plan_id', r.plan_id,
                'razorpay_payment_id', r.razorpay_payment_id, 'paid_at', r.created_at));
        v_open := v_open + 1;
    END LOOP;

    -- Captured after the purchase stopped being eligible: money must go back.
    FOR r IN
        SELECT pm.id, pm.user_id, pm.amount, pm.razorpay_payment_id, pm.raw_response->>'reason_code' AS reason
        FROM public.payments pm
        WHERE pm.status = 'completed'
          AND COALESCE((pm.raw_response->>'requires_refund')::boolean, false)
    LOOP
        PERFORM public.record_payment_alert('refund_required', r.id::text, 'health_check',
            'Payment ' || COALESCE(r.razorpay_payment_id, r.id::text) || ' (₹' || r.amount
                || ') was captured but not applied and needs a refund.',
            jsonb_build_object('payment_id', r.id, 'user_id', r.user_id,
                'razorpay_payment_id', r.razorpay_payment_id, 'reason_code', r.reason));
        v_open := v_open + 1;
    END LOOP;

    -- Auto-resolve health-check alerts whose condition has cleared.
    UPDATE public.payment_health_alerts a
    SET resolved_at = NOW()
    WHERE a.resolved_at IS NULL
      AND a.kind = 'captured_not_activated'
      AND (EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.payment_id::text = a.ref)
           OR EXISTS (SELECT 1 FROM public.subscription_changes c WHERE c.payment_id::text = a.ref)
           OR EXISTS (SELECT 1 FROM public.payments pm
                      WHERE pm.id::text = a.ref AND pm.status <> 'completed'));
    UPDATE public.payment_health_alerts a
    SET resolved_at = NOW()
    WHERE a.resolved_at IS NULL
      AND a.kind = 'refund_required'
      AND EXISTS (SELECT 1 FROM public.payments pm
                  WHERE pm.id::text = a.ref AND pm.status = 'refunded');

    RETURN v_open;
END;
$$;
REVOKE ALL ON FUNCTION public.check_payment_health() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_payment_health() TO service_role;

CREATE OR REPLACE FUNCTION public.admin_get_payment_health()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;
    RETURN COALESCE((
        SELECT jsonb_agg(to_jsonb(a) ORDER BY a.last_seen_at DESC)
        FROM (
            SELECT id, kind, ref, source, message, detail, occurrences,
                   first_seen_at, last_seen_at
            FROM public.payment_health_alerts
            WHERE resolved_at IS NULL
            ORDER BY last_seen_at DESC
            LIMIT 50
        ) a
    ), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_payment_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_payment_health() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_resolve_payment_alert(p_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;
    UPDATE public.payment_health_alerts
    SET resolved_at = NOW(), resolved_by = auth.uid()
    WHERE id = p_alert_id AND resolved_at IS NULL;
    RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_resolve_payment_alert(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_payment_alert(UUID) TO authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        BEGIN
            PERFORM cron.unschedule('check_payment_health_hourly');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        PERFORM cron.schedule(
            'check_payment_health_hourly',
            '15 * * * *',
            'SELECT public.check_payment_health();'
        );
    ELSE
        RAISE NOTICE 'pg_cron not installed: schedule public.check_payment_health() hourly.';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
