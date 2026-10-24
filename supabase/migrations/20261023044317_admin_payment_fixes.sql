-- Admin payment fixes.
--   1. Partial refunds are reconciled cumulatively. Access is only revoked once the
--      refunded total covers the whole payment, and a second partial refund is no
--      longer dropped as a duplicate.
--   2. The legacy (purchase_type IS NULL) plan-based revoke fallback moves into
--      revoke_access_for_refunded_payment so the admin refund path gets it too.
--   3. Upgrades only credit what was actually paid for the current cycle, so a
--      complimentary (admin-granted) pass no longer discounts a paid upgrade.
--   4. get_admin_payments has a stable order and exposes the activation-blocked /
--      requires-refund flags.
-- No rows are deleted and no existing price or plan is changed.
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Upgrade pricing credits only the money actually retained for the cycle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.quote_subscription_purchase(p_user_id UUID, p_plan_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_plan public.subscription_plans%ROWTYPE;
    v_cur public.subscriptions%ROWTYPE;
    v_cur_plan public.subscription_plans%ROWTYPE;
    v_has_renewal BOOLEAN := FALSE;
    v_new_expires TIMESTAMPTZ;
    v_opens TIMESTAMPTZ;
    v_amount NUMERIC;
    v_paid NUMERIC;
    v_base JSONB;
BEGIN
    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = p_plan_id;
    v_base := jsonb_build_object('plan_id', p_plan_id, 'plan_title', v_plan.title);

    IF NOT FOUND OR NOT v_plan.is_active OR v_plan.duration_days IS NULL
       OR v_plan.duration_days <= 0 THEN
        RETURN v_base || jsonb_build_object('eligible', false, 'reason_code', 'plan_unavailable',
            'message', 'This plan is not available.');
    END IF;
    IF v_plan.price IS NULL OR v_plan.price <= 0 THEN
        RETURN v_base || jsonb_build_object('eligible', false, 'reason_code', 'free_plan',
            'message', 'The free plan does not require a purchase.');
    END IF;

    -- The paid cycle covering "now".
    SELECT s.* INTO v_cur
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    WHERE s.user_id = p_user_id AND s.status = 'active'
      AND s.starts_at <= v_now AND s.expires_at > v_now AND p.price > 0
    ORDER BY s.expires_at DESC
    LIMIT 1;

    IF v_cur.id IS NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.subscription_plans p ON p.id = s.plan_id
            WHERE s.user_id = p_user_id AND s.status = 'active'
              AND s.expires_at > v_now AND p.price > 0
        ) THEN
            RETURN v_base || jsonb_build_object('eligible', false,
                'reason_code', 'upcoming_pass_exists',
                'message', 'You already have an upcoming pass.');
        END IF;
        RETURN v_base || jsonb_build_object(
            'eligible', true, 'purchase_type', 'new', 'amount', v_plan.price,
            'currency', COALESCE(v_plan.currency, 'INR'),
            'new_starts_at', v_now,
            'new_expires_at', v_now + make_interval(days => v_plan.duration_days));
    END IF;

    SELECT * INTO v_cur_plan FROM public.subscription_plans WHERE id = v_cur.plan_id;
    v_has_renewal := EXISTS (
        SELECT 1 FROM public.subscriptions r
        WHERE r.renewed_from_subscription_id = v_cur.id AND r.status <> 'cancelled');
    v_base := v_base || jsonb_build_object(
        'subscription_id', v_cur.id, 'from_plan_id', v_cur.plan_id,
        'current_expires_at', v_cur.expires_at, 'renewal_used', v_has_renewal);

    IF v_plan.duration_days > v_cur_plan.duration_days THEN
        IF v_has_renewal THEN
            RETURN v_base || jsonb_build_object('eligible', false, 'reason_code', 'already_renewed',
                'message', 'Your pass has already been renewed for the next cycle.');
        END IF;
        v_new_expires := v_cur.starts_at + make_interval(days => v_plan.duration_days);
        IF v_new_expires <= v_cur.expires_at THEN
            RETURN v_base || jsonb_build_object('eligible', false,
                'reason_code', 'upgrade_not_extending',
                'message', 'This upgrade would not add validity to your current pass.');
        END IF;
        -- Credit only money actually retained for this cycle: the purchase that created
        -- it plus any upgrades applied to it, net of refunds. A complimentary or
        -- admin-granted pass has no payment, so it earns no credit.
        SELECT COALESCE(SUM(GREATEST(pm.amount - COALESCE(pm.refund_amount, 0), 0)), 0)
        INTO v_paid
        FROM public.payments pm
        WHERE pm.user_id = p_user_id
          AND pm.status IN ('completed', 'refunded')
          AND NOT COALESCE((pm.raw_response->>'activation_blocked')::boolean, false)
          AND (pm.id = v_cur.payment_id
               OR pm.id IN (SELECT c.payment_id FROM public.subscription_changes c
                            WHERE c.subscription_id = v_cur.id AND c.change_type = 'upgrade'
                              AND c.reverted_at IS NULL));
        v_amount := v_plan.price - LEAST(COALESCE(v_cur_plan.price, 0), v_paid);
        IF v_amount <= 0 THEN
            RETURN v_base || jsonb_build_object('eligible', false,
                'reason_code', 'upgrade_price_invalid',
                'message', 'This upgrade is not available. Please contact support.');
        END IF;
        RETURN v_base || jsonb_build_object(
            'eligible', true, 'purchase_type', 'upgrade', 'amount', v_amount,
            'currency', COALESCE(v_plan.currency, 'INR'),
            'new_starts_at', v_cur.starts_at, 'new_expires_at', v_new_expires);
    END IF;

    IF v_plan.duration_days = v_cur_plan.duration_days AND v_plan.renewal_window_days IS NOT NULL THEN
        v_opens := v_cur.expires_at - make_interval(days => v_plan.renewal_window_days);
        v_base := v_base || jsonb_build_object('renewal_opens_at', v_opens);
        IF v_has_renewal THEN
            RETURN v_base || jsonb_build_object('eligible', false, 'reason_code', 'already_renewed',
                'message', 'You have already renewed this pass for the next cycle.');
        END IF;
        IF v_now < v_opens THEN
            RETURN v_base || jsonb_build_object('eligible', false,
                'reason_code', 'renewal_not_open',
                'message', 'Renewal opens ' || v_plan.renewal_window_days
                    || ' days before your pass expires.');
        END IF;
        RETURN v_base || jsonb_build_object(
            'eligible', true, 'purchase_type', 'renewal', 'amount', v_plan.price,
            'currency', COALESCE(v_plan.currency, 'INR'),
            'new_starts_at', v_cur.expires_at,
            'new_expires_at', v_cur.expires_at + make_interval(days => v_plan.duration_days));
    END IF;

    IF v_plan.duration_days = v_cur_plan.duration_days THEN
        RETURN v_base || jsonb_build_object('eligible', false, 'reason_code', 'same_duration',
            'message', 'You already have an active pass of this duration.');
    END IF;
    RETURN v_base || jsonb_build_object('eligible', false, 'reason_code', 'shorter_duration',
        'message', 'You can only upgrade to a longer plan while your pass is active.');
END;
$$;
REVOKE ALL ON FUNCTION public.quote_subscription_purchase(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quote_subscription_purchase(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Revocation (shared by the admin refund function and the refund webhook)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_access_for_refunded_payment(p_payment_row_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_change public.subscription_changes%ROWTYPE;
    v_cancelled INT := 0;
    v_legacy INT := 0;
    v_reverted BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_row_id;

    SELECT * INTO v_change FROM public.subscription_changes
    WHERE payment_id = p_payment_row_id AND reverted_at IS NULL
    FOR UPDATE;

    IF FOUND AND v_change.change_type = 'upgrade' THEN
        -- Restore the plan and expiry the student had before this upgrade.
        UPDATE public.subscriptions
        SET plan_id = v_change.from_plan_id,
            expires_at = v_change.previous_expires_at,
            updated_at = NOW()
        WHERE id = v_change.subscription_id
          AND status = 'active' AND plan_id = v_change.to_plan_id;
        v_reverted := FOUND;
        UPDATE public.subscription_changes SET reverted_at = NOW() WHERE id = v_change.id;
    ELSIF FOUND THEN
        UPDATE public.subscription_changes SET reverted_at = NOW() WHERE id = v_change.id;
    END IF;

    -- New purchases and renewal cycles are rows activated by this payment.
    UPDATE public.subscriptions
    SET status = 'cancelled', expires_at = LEAST(expires_at, NOW()), updated_at = NOW()
    WHERE payment_id = p_payment_row_id AND status = 'active';
    GET DIAGNOSTICS v_cancelled = ROW_COUNT;

    -- Legacy payments (before purchase_type existed) may have had their subscription's
    -- payment_id overwritten by stacking; keep the plan-based fallback for them only.
    -- Blocked activations never granted access, so there is nothing to revoke.
    IF v_payment.id IS NOT NULL
       AND v_payment.purchase_type IS NULL
       AND NOT v_reverted
       AND v_cancelled = 0
       AND NOT COALESCE((v_payment.raw_response->>'activation_blocked')::boolean, false) THEN
        UPDATE public.subscriptions
        SET status = 'cancelled', expires_at = LEAST(expires_at, NOW()), updated_at = NOW()
        WHERE user_id = v_payment.user_id AND plan_id = v_payment.plan_id
          AND status = 'active' AND renewed_from_subscription_id IS NULL;
        GET DIAGNOSTICS v_legacy = ROW_COUNT;
        v_cancelled := v_cancelled + v_legacy;
    END IF;

    RETURN jsonb_build_object('cancelled_subscriptions', v_cancelled,
        'upgrade_reverted', v_reverted, 'legacy_fallback_cancelled', v_legacy);
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_access_for_refunded_payment(UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_access_for_refunded_payment(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Refund webhook reconciliation: cumulative, idempotent per refund id
-- ---------------------------------------------------------------------------
-- p_refund_id identifies one Razorpay refund; its p_refund_amount is that refund's
-- amount and is added once. When p_refund_id is NULL/empty (payload without a refund
-- entity), p_refund_amount is the payment's cumulative amount_refunded.
CREATE OR REPLACE FUNCTION public.reconcile_razorpay_refund(
    p_payment_id TEXT,
    p_refund_id TEXT,
    p_refund_amount NUMERIC,
    p_refund_reason TEXT DEFAULT 'Razorpay webhook refund'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_refund_id TEXT := NULLIF(btrim(p_refund_id), '');
    v_seen JSONB;
    v_already NUMERIC;
    v_total NUMERIC;
    v_revoke JSONB := NULL;
BEGIN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE razorpay_payment_id = p_payment_id
       OR id::text = p_payment_id
       OR transaction_id = p_payment_id
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Payment record not found for refund reconciliation');
    END IF;

    v_seen := COALESCE(v_payment.raw_response->'refund_ids', '[]'::jsonb);
    IF jsonb_typeof(v_seen) <> 'array' THEN
        v_seen := '[]'::jsonb;
    END IF;
    IF v_refund_id IS NOT NULL
       AND (v_payment.refund_id = v_refund_id OR v_seen ? v_refund_id) THEN
        RETURN jsonb_build_object('success', true, 'payment_id', v_payment.id,
            'status', v_payment.status, 'is_duplicate', true,
            'refund_amount', v_payment.refund_amount);
    END IF;

    v_already := CASE WHEN v_payment.status = 'refunded'
                      THEN COALESCE(v_payment.refund_amount, 0) ELSE 0 END;
    IF p_refund_amount IS NULL THEN
        v_total := v_payment.amount;
    ELSIF v_refund_id IS NULL THEN
        v_total := GREATEST(v_already, p_refund_amount);
    ELSE
        v_total := v_already + p_refund_amount;
    END IF;
    v_total := LEAST(v_total, v_payment.amount);

    IF v_payment.status = 'refunded' AND v_refund_id IS NULL
       AND v_total <= v_already THEN
        RETURN jsonb_build_object('success', true, 'payment_id', v_payment.id,
            'status', 'refunded', 'is_duplicate', true, 'refund_amount', v_already);
    END IF;

    UPDATE public.payments
    SET status = 'refunded',
        refund_amount = v_total,
        refund_id = COALESCE(v_refund_id, refund_id),
        refund_reason = COALESCE(refund_reason, NULLIF(btrim(p_refund_reason), '')),
        refunded_at = COALESCE(refunded_at, NOW()),
        raw_response = COALESCE(raw_response, '{}'::jsonb) || jsonb_build_object(
            'refund_ids', CASE WHEN v_refund_id IS NULL THEN v_seen
                               ELSE v_seen || to_jsonb(v_refund_id) END,
            'refund_pending_confirmation', false),
        updated_at = NOW()
    WHERE id = v_payment.id;

    -- A partial refund keeps access; only a refund of the whole payment revokes it.
    IF v_total >= v_payment.amount THEN
        v_revoke := public.revoke_access_for_refunded_payment(v_payment.id);
    END IF;

    RETURN jsonb_build_object('success', true, 'payment_id', v_payment.id,
        'user_id', v_payment.user_id, 'status', 'refunded',
        'refund_amount', v_total, 'fully_refunded', v_total >= v_payment.amount,
        'revocation', v_revoke);
END;
$$;
REVOKE ALL ON FUNCTION public.reconcile_razorpay_refund(TEXT, TEXT, NUMERIC, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_razorpay_refund(TEXT, TEXT, NUMERIC, TEXT)
    TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Admin payments list: deterministic paging + refund-needed flags
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_payments(p_status text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_result JSONB;
BEGIN
  IF NOT public.admin_scope_allowed('super') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_agg(pay_row) INTO v_result
    FROM (
        SELECT pm.id, pm.user_id, p.full_name AS student_name, p.email AS student_email,
            pm.plan_id, pl.title AS plan_title, pm.amount, pm.currency, pm.gateway,
            pm.order_id, pm.razorpay_order_id, pm.transaction_id, pm.razorpay_payment_id,
            pm.status, pm.refund_id, pm.refund_amount, pm.refund_reason, pm.refunded_at,
            pm.created_at, pm.purchase_type,
            COALESCE((pm.raw_response->>'activation_blocked')::boolean, false) AS activation_blocked,
            COALESCE((pm.raw_response->>'requires_refund')::boolean, false) AS requires_refund
        FROM public.payments pm
        LEFT JOIN public.profiles p ON pm.user_id = p.id
        LEFT JOIN public.subscription_plans pl ON pm.plan_id = pl.id
        WHERE (p_status IS NULL OR pm.status = p_status)
          AND (
              p_search IS NULL
              OR pm.order_id ILIKE '%' || p_search || '%'
              OR pm.razorpay_payment_id ILIKE '%' || p_search || '%'
              OR p.full_name ILIKE '%' || p_search || '%'
              OR p.email ILIKE '%' || p_search || '%'
          )
        ORDER BY pm.created_at DESC, pm.id DESC
        LIMIT p_limit OFFSET p_offset
    ) pay_row;

    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$function$;
REVOKE ALL ON FUNCTION public.get_admin_payments(TEXT, TEXT, INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_payments(TEXT, TEXT, INT, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
