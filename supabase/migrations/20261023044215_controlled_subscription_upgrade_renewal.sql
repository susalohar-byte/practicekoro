-- Controlled subscription upgrades & renewals; removes "Extend Pass" stacking.
-- Apply only after review/staging. No payment, subscription or plan row is deleted,
-- and no existing price, title or benefit is changed.
--
-- Policy (enforced only here, on the server):
--   * No active paid pass  -> 'new' purchase at the plan price, starts now.
--   * Upgrade              -> only to a LONGER plan. Pays (new price - current price).
--                             Expiry = current cycle start + new plan duration, so
--                             repeating an upgrade can never add time.
--   * Renewal              -> only for plans with renewal_window_days configured
--                             (1-year plans: 15 days). Opens that many days before
--                             expiry, once per subscription cycle. The renewal is the
--                             next cycle: a new subscription row starting at the
--                             current expiry. A unique index allows one per cycle.
--   * Anything else (same/shorter plan while active, early renewal, second renewal)
--     is rejected. Payments that become ineligible between checkout and capture are
--     recorded as captured but NOT applied, and flagged for refund.
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Schema
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscription_plans
    ADD COLUMN IF NOT EXISTS renewal_window_days INT;
ALTER TABLE public.subscription_plans
    DROP CONSTRAINT IF EXISTS subscription_plans_renewal_window_check;
ALTER TABLE public.subscription_plans
    ADD CONSTRAINT subscription_plans_renewal_window_check
    CHECK (renewal_window_days IS NULL OR renewal_window_days BETWEEN 1 AND 90);
COMMENT ON COLUMN public.subscription_plans.renewal_window_days IS
    'Days before expiry when a once-per-cycle renewal opens. NULL = plan cannot be renewed.';

-- Only annual (or longer) paid plans renew; shorter plans upgrade or repurchase after expiry.
UPDATE public.subscription_plans
SET renewal_window_days = 15
WHERE renewal_window_days IS NULL
  AND duration_days >= 365
  AND price > 0;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS purchase_type TEXT;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_purchase_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_purchase_type_check
    CHECK (purchase_type IS NULL OR purchase_type IN ('new', 'upgrade', 'renewal'));
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS target_subscription_id UUID
    REFERENCES public.subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS from_plan_id TEXT REFERENCES public.subscription_plans(id);

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS renewed_from_subscription_id UUID
    REFERENCES public.subscriptions(id) ON DELETE RESTRICT;
-- One live renewal per subscription cycle. A refunded (cancelled) renewal frees the slot.
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_one_renewal_per_cycle
    ON public.subscriptions(renewed_from_subscription_id)
    WHERE renewed_from_subscription_id IS NOT NULL AND status <> 'cancelled';

-- Audit trail of paid plan changes. Original rows are never overwritten without a record.
CREATE TABLE IF NOT EXISTS public.subscription_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'renewal')),
    payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id),
    from_plan_id TEXT REFERENCES public.subscription_plans(id),
    to_plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
    previous_expires_at TIMESTAMPTZ NOT NULL,
    new_expires_at TIMESTAMPTZ NOT NULL,
    renewal_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    reverted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_subscription
    ON public.subscription_changes(subscription_id);
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.subscription_changes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.subscription_changes TO authenticated;
GRANT ALL ON TABLE public.subscription_changes TO service_role;
DROP POLICY IF EXISTS "Owners and admins read subscription changes" ON public.subscription_changes;
CREATE POLICY "Owners and admins read subscription changes"
    ON public.subscription_changes FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Idempotency ledger for expiry reminders, keyed by the exact expiry being announced.
CREATE TABLE IF NOT EXISTS public.subscription_expiry_reminders (
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    reminder_kind TEXT NOT NULL CHECK (reminder_kind IN ('days_15', 'days_7', 'days_1', 'expired')),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (subscription_id, expires_at, reminder_kind)
);
ALTER TABLE public.subscription_expiry_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.subscription_expiry_reminders FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.subscription_expiry_reminders TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Eligibility & pricing (single source of truth)
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
        v_amount := v_plan.price - v_cur_plan.price;
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

-- Student-facing options: identity always comes from the JWT.
CREATE OR REPLACE FUNCTION public.get_my_subscription_purchase_options()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
    END IF;
    RETURN COALESCE((
        SELECT jsonb_agg(public.quote_subscription_purchase(v_user_id, p.id)
                         ORDER BY p.order_index, p.duration_days)
        FROM public.subscription_plans p
        WHERE p.is_active AND p.price > 0
    ), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_subscription_purchase_options() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_subscription_purchase_options() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Shared activation (called only after the gateway confirmed capture)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_captured_subscription_payment(
    p_payment_row_id UUID,
    p_gateway_payment_id TEXT,
    p_signature TEXT,
    p_source TEXT,
    p_event_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_plan public.subscription_plans%ROWTYPE;
    v_quote JSONB;
    v_type TEXT;
    v_cur public.subscriptions%ROWTYPE;
    v_sub_id UUID;
    v_starts TIMESTAMPTZ;
    v_expires TIMESTAMPTZ;
    v_existing RECORD;
BEGIN
    IF p_gateway_payment_id IS NULL OR btrim(p_gateway_payment_id) = '' THEN
        RAISE EXCEPTION 'Payment ID required' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_row_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment order not found' USING ERRCODE = 'P0002';
    END IF;
    -- Serialize every purchase for this student, then lock the order row.
    PERFORM pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));
    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_row_id FOR UPDATE;

    -- Idempotent replay (duplicate webhook, retried verification, double click).
    IF v_payment.status = 'completed' THEN
        IF v_payment.razorpay_payment_id IS DISTINCT FROM p_gateway_payment_id THEN
            RAISE EXCEPTION 'Completed payment ID mismatch' USING ERRCODE = '23505';
        END IF;
        IF COALESCE((v_payment.raw_response->>'activation_blocked')::boolean, false) THEN
            RETURN jsonb_build_object('success', false, 'activation_blocked', true,
                'requires_refund', true, 'is_duplicate', true,
                'reason_code', v_payment.raw_response->>'reason_code',
                'message', v_payment.raw_response->>'message');
        END IF;
        SELECT s.id, s.status, s.starts_at, s.expires_at INTO v_existing
        FROM public.subscriptions s
        WHERE s.id::text = v_payment.raw_response->>'subscription_id'
           OR s.payment_id = v_payment.id
        ORDER BY s.expires_at DESC LIMIT 1;
        RETURN jsonb_build_object('success', true, 'is_duplicate', true,
            'subscription_id', v_existing.id, 'status', v_existing.status,
            'starts_at', v_existing.starts_at, 'expires_at', v_existing.expires_at,
            'purchase_type', COALESCE(v_payment.purchase_type, 'new'),
            'is_renewal', v_payment.purchase_type = 'renewal');
    END IF;

    -- Failed or refunded orders never activate anything.
    IF v_payment.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Payment is not eligible for activation' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.payments
               WHERE razorpay_payment_id = p_gateway_payment_id AND id <> v_payment.id) THEN
        RAISE EXCEPTION 'Duplicate payment ID already processed' USING ERRCODE = '23505';
    END IF;

    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_payment.plan_id;
    v_type := COALESCE(v_payment.purchase_type, 'new');
    -- Re-check eligibility now, under the lock: state may have changed since checkout.
    v_quote := public.quote_subscription_purchase(v_payment.user_id, v_payment.plan_id);

    IF NOT COALESCE((v_quote->>'eligible')::boolean, false)
       OR v_quote->>'purchase_type' IS DISTINCT FROM v_type
       OR (v_type <> 'new' AND
           (v_quote->>'subscription_id')::uuid IS DISTINCT FROM v_payment.target_subscription_id)
       OR (v_payment.purchase_type IS NULL AND v_payment.amount IS DISTINCT FROM v_plan.price) THEN
        -- Money was captured but must not grant or extend access. Record it for refund.
        UPDATE public.payments
        SET status = 'completed',
            transaction_id = p_gateway_payment_id,
            razorpay_payment_id = p_gateway_payment_id,
            razorpay_signature = COALESCE(NULLIF(p_signature, ''), razorpay_signature),
            raw_response = COALESCE(raw_response, '{}'::jsonb) || jsonb_build_object(
                'activation_blocked', true, 'requires_refund', true,
                'reason_code', COALESCE(v_quote->>'reason_code', 'purchase_changed'),
                'message', 'Payment captured after the purchase stopped being eligible; '
                    || 'access was not changed.',
                'source', p_source, 'event_id', p_event_id, 'checked_at', NOW()),
            updated_at = NOW()
        WHERE id = v_payment.id;
        RETURN jsonb_build_object('success', false, 'activation_blocked', true,
            'requires_refund', true,
            'reason_code', COALESCE(v_quote->>'reason_code', 'purchase_changed'),
            'message', COALESCE(v_quote->>'message', 'This purchase is no longer eligible.'));
    END IF;

    v_starts := (v_quote->>'new_starts_at')::timestamptz;
    v_expires := (v_quote->>'new_expires_at')::timestamptz;

    IF v_type = 'new' THEN
        INSERT INTO public.subscriptions (user_id, plan_id, payment_id, status, starts_at, expires_at)
        VALUES (v_payment.user_id, v_plan.id, v_payment.id, 'active', v_starts, v_expires)
        RETURNING id INTO v_sub_id;
    ELSIF v_type = 'upgrade' THEN
        SELECT * INTO v_cur FROM public.subscriptions
        WHERE id = v_payment.target_subscription_id FOR UPDATE;
        INSERT INTO public.subscription_changes (subscription_id, user_id, change_type, payment_id,
            from_plan_id, to_plan_id, previous_expires_at, new_expires_at)
        VALUES (v_cur.id, v_cur.user_id, 'upgrade', v_payment.id,
            v_cur.plan_id, v_plan.id, v_cur.expires_at, v_expires);
        -- The original purchase payment_id is kept; the upgrade lives in subscription_changes.
        UPDATE public.subscriptions
        SET plan_id = v_plan.id, expires_at = v_expires, updated_at = NOW()
        WHERE id = v_cur.id;
        v_sub_id := v_cur.id;
        v_starts := v_cur.starts_at;
    ELSE -- renewal: the next cycle, contiguous with the current one
        SELECT * INTO v_cur FROM public.subscriptions
        WHERE id = v_payment.target_subscription_id FOR UPDATE;
        INSERT INTO public.subscriptions (user_id, plan_id, payment_id, status, starts_at,
            expires_at, renewed_from_subscription_id)
        VALUES (v_payment.user_id, v_plan.id, v_payment.id, 'active', v_starts, v_expires, v_cur.id)
        RETURNING id INTO v_sub_id;
        INSERT INTO public.subscription_changes (subscription_id, user_id, change_type, payment_id,
            from_plan_id, to_plan_id, previous_expires_at, new_expires_at, renewal_subscription_id)
        VALUES (v_cur.id, v_cur.user_id, 'renewal', v_payment.id,
            v_cur.plan_id, v_plan.id, v_cur.expires_at, v_expires, v_sub_id);
    END IF;

    UPDATE public.payments
    SET status = 'completed',
        transaction_id = p_gateway_payment_id,
        razorpay_payment_id = p_gateway_payment_id,
        razorpay_signature = COALESCE(NULLIF(p_signature, ''), razorpay_signature),
        purchase_type = v_type,
        raw_response = COALESCE(raw_response, '{}'::jsonb) || jsonb_build_object(
            'verified_at', NOW(), 'source', p_source, 'event_id', p_event_id,
            'subscription_id', v_sub_id, 'purchase_type', v_type,
            'is_renewal', v_type = 'renewal'),
        updated_at = NOW()
    WHERE id = v_payment.id;

    RETURN jsonb_build_object('success', true, 'is_duplicate', false,
        'subscription_id', v_sub_id, 'status', 'active',
        'starts_at', v_starts, 'expires_at', v_expires,
        'purchase_type', v_type, 'is_renewal', v_type = 'renewal',
        'plan_title', v_plan.title, 'user_id', v_payment.user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_captured_subscription_payment(UUID, TEXT, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_captured_subscription_payment(UUID, TEXT, TEXT, TEXT, TEXT)
    TO service_role;

-- Checkout verification path (verify-payment Edge Function, after HMAC + captured check).
CREATE OR REPLACE FUNCTION public.activate_verified_razorpay_payment(
    p_user_id UUID,
    p_order_id TEXT,
    p_payment_id TEXT,
    p_signature TEXT,
    p_plan_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
BEGIN
    IF COALESCE(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
    END IF;
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '42501';
    END IF;
    IF p_signature IS NULL OR btrim(p_signature) = '' THEN
        RAISE EXCEPTION 'Forbidden: Payment signature is required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_payment
    FROM public.payments
    WHERE (order_id = p_order_id OR razorpay_order_id = p_order_id) AND user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment order not found for current user' USING ERRCODE = 'P0002';
    END IF;
    IF v_payment.plan_id IS DISTINCT FROM p_plan_id THEN
        RAISE EXCEPTION 'Mismatched subscription plan' USING ERRCODE = '22023';
    END IF;
    IF v_payment.amount IS NULL OR v_payment.amount <= 0
       OR v_payment.currency IS DISTINCT FROM 'INR' THEN
        RAISE EXCEPTION 'Invalid payment amount or currency' USING ERRCODE = '22023';
    END IF;

    RETURN public.apply_captured_subscription_payment(
        v_payment.id, p_payment_id, p_signature, 'checkout', NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.activate_verified_razorpay_payment(UUID,TEXT,TEXT,TEXT,TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_verified_razorpay_payment(UUID,TEXT,TEXT,TEXT,TEXT)
    TO service_role;

-- Webhook path (razorpay-webhook Edge Function, after webhook HMAC verification).
CREATE OR REPLACE FUNCTION public.reconcile_razorpay_webhook(
    p_order_id TEXT,
    p_payment_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_event_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
BEGIN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE order_id = p_order_id OR razorpay_order_id = p_order_id
    ORDER BY created_at DESC
    LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record not found for webhook: %', p_order_id USING ERRCODE = 'P0002';
    END IF;
    IF v_payment.amount IS DISTINCT FROM p_amount THEN
        RAISE EXCEPTION 'Mismatched payment amount: expected %, received %',
            v_payment.amount, p_amount USING ERRCODE = '22023';
    END IF;
    IF p_currency IS NOT NULL AND p_currency <> 'INR' THEN
        RAISE EXCEPTION 'Unsupported payment currency: %', p_currency USING ERRCODE = '22023';
    END IF;

    RETURN public.apply_captured_subscription_payment(
        v_payment.id, p_payment_id, NULL, 'webhook', p_event_id);
END;
$$;
REVOKE ALL ON FUNCTION public.reconcile_razorpay_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_razorpay_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT)
    TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Refunds: undo exactly what the refunded payment granted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_access_for_refunded_payment(p_payment_row_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_change public.subscription_changes%ROWTYPE;
    v_cancelled INT := 0;
    v_reverted BOOLEAN := FALSE;
BEGIN
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

    RETURN jsonb_build_object('cancelled_subscriptions', v_cancelled,
        'upgrade_reverted', v_reverted);
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_access_for_refunded_payment(UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_access_for_refunded_payment(UUID) TO service_role;

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
    v_revoke JSONB;
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
    IF v_payment.status = 'refunded' THEN
        RETURN jsonb_build_object('success', true, 'payment_id', v_payment.id,
            'status', 'refunded', 'is_duplicate', true);
    END IF;

    UPDATE public.payments
    SET status = 'refunded',
        refund_amount = COALESCE(p_refund_amount, v_payment.amount),
        refund_id = NULLIF(btrim(p_refund_id), ''),
        refund_reason = NULLIF(btrim(p_refund_reason), ''),
        refunded_at = NOW(),
        updated_at = NOW()
    WHERE id = v_payment.id;

    v_revoke := public.revoke_access_for_refunded_payment(v_payment.id);

    -- Legacy payments (before purchase_type existed) may have had their subscription's
    -- payment_id overwritten by stacking; keep the previous plan-based fallback for them only.
    IF v_payment.purchase_type IS NULL
       AND (v_revoke->>'cancelled_subscriptions')::int = 0 THEN
        UPDATE public.subscriptions
        SET status = 'cancelled', expires_at = LEAST(expires_at, NOW()), updated_at = NOW()
        WHERE user_id = v_payment.user_id AND plan_id = v_payment.plan_id
          AND status = 'active' AND renewed_from_subscription_id IS NULL;
    END IF;

    RETURN jsonb_build_object('success', true, 'payment_id', v_payment.id,
        'user_id', v_payment.user_id, 'status', 'refunded', 'revocation', v_revoke);
END;
$$;
REVOKE ALL ON FUNCTION public.reconcile_razorpay_refund(TEXT, TEXT, NUMERIC, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_razorpay_refund(TEXT, TEXT, NUMERIC, TEXT)
    TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Student status: report the cycle covering today, plus any scheduled renewal
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_subscription_details()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_sub public.subscriptions%ROWTYPE;
    v_plan public.subscription_plans%ROWTYPE;
    v_next public.subscriptions%ROWTYPE;
    v_active BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions
    WHERE user_id = v_user_id AND status = 'active'
      AND starts_at <= NOW() AND expires_at > NOW()
    ORDER BY expires_at DESC LIMIT 1;
    IF v_sub.id IS NULL THEN
        SELECT * INTO v_sub FROM public.subscriptions
        WHERE user_id = v_user_id AND starts_at <= NOW()
        ORDER BY expires_at DESC LIMIT 1;
    END IF;
    IF v_sub.id IS NULL THEN
        RETURN jsonb_build_object('has_subscription', false, 'is_active', false, 'status', 'none');
    END IF;

    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;
    v_active := v_sub.status = 'active' AND v_sub.expires_at > NOW();
    SELECT * INTO v_next FROM public.subscriptions
    WHERE renewed_from_subscription_id = v_sub.id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;

    RETURN jsonb_build_object(
        'has_subscription', true,
        'is_active', v_active,
        'subscription_id', v_sub.id,
        'status', CASE WHEN v_active THEN 'active' ELSE 'expired' END,
        'plan_id', v_sub.plan_id,
        'plan_title', COALESCE(v_plan.title, 'Pro Pass'),
        'duration_days', v_plan.duration_days,
        'starts_at', v_sub.starts_at,
        'expires_at', v_sub.expires_at,
        'days_remaining', CASE WHEN v_active
            THEN GREATEST(0, EXTRACT(DAY FROM (v_sub.expires_at - NOW()))::INT) ELSE 0 END,
        'renewal_window_days', v_plan.renewal_window_days,
        'renewed', v_next.id IS NOT NULL,
        'renewed_expires_at', v_next.expires_at
    );
END;
$$;
REVOKE ALL ON FUNCTION public.get_student_subscription_details() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_subscription_details() TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Expiry reminders (15 days, 7 days, 1 day, and on expiry)
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
        WHERE s.status = 'active' AND p.price > 0
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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
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
    ELSE
        RAISE NOTICE 'pg_cron not installed: schedule public.dispatch_subscription_expiry_reminders() hourly.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron registration skipped: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
