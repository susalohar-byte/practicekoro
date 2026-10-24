-- THROWAWAY DATABASE ONLY (writes test users, payments and subscriptions).
-- Scenario checks for 20261023044215_controlled_subscription_upgrade_renewal.sql.
\set ON_ERROR_STOP 1
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.subscriptions, public.subscription_plans, public.payments, public.notifications TO authenticated;

-- Mirrors create-razorpay-order: quote on the server, persist the quoted amount & context.
CREATE FUNCTION pg_temp.order_for(p_user uuid, p_plan text) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE q jsonb; v_id uuid;
BEGIN
  q := public.quote_subscription_purchase(p_user, p_plan);
  IF NOT (q->>'eligible')::boolean THEN RAISE EXCEPTION 'not eligible: %', q->>'reason_code'; END IF;
  INSERT INTO public.payments (user_id, plan_id, amount, status, order_id, razorpay_order_id,
     purchase_type, target_subscription_id, from_plan_id)
  VALUES (p_user, p_plan, (q->>'amount')::numeric, 'pending', 'order_' || gen_random_uuid(),
     NULL, q->>'purchase_type', (q->>'subscription_id')::uuid, q->>'from_plan_id')
  RETURNING id INTO v_id;
  UPDATE public.payments SET razorpay_order_id = order_id WHERE id = v_id;
  RETURN v_id;
END $$;
CREATE FUNCTION pg_temp.pay(p_payment uuid, p_gateway_id text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE p public.payments%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.payments WHERE id = p_payment;
  RETURN public.activate_verified_razorpay_payment(p.user_id, p.order_id, p_gateway_id, 'sig', p.plan_id);
END $$;
CREATE FUNCTION pg_temp.webhook(p_payment uuid, p_gateway_id text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE p public.payments%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.payments WHERE id = p_payment;
  RETURN public.reconcile_razorpay_webhook(p.order_id, p_gateway_id, p.amount, 'INR', 'evt_' || p_gateway_id);
END $$;
CREATE FUNCTION pg_temp.q(p_user uuid, p_plan text) RETURNS jsonb LANGUAGE sql AS
  $$ SELECT public.quote_subscription_purchase(p_user, p_plan) $$;

SELECT set_config('request.jwt.claim.role', 'service_role', false);
INSERT INTO auth.users VALUES
 ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002'),
 ('00000000-0000-0000-0000-000000000003'), ('00000000-0000-0000-0000-000000000004'),
 ('00000000-0000-0000-0000-000000000005'), ('00000000-0000-0000-0000-000000000006');

DO $$
DECLARE
  u1 uuid := '00000000-0000-0000-0000-000000000001';
  pay uuid; r jsonb; sub public.subscriptions%ROWTYPE; first_exp timestamptz; n int;
BEGIN
  -- 1. New purchase (1 month)
  r := pg_temp.q(u1, 'pro_1_month');
  ASSERT r->>'purchase_type' = 'new' AND (r->>'amount')::numeric = 49, 'S1 quote ' || r;
  pay := pg_temp.order_for(u1, 'pro_1_month');
  r := pg_temp.pay(pay, 'pay_u1_a');
  ASSERT (r->>'success')::boolean AND r->>'purchase_type' = 'new', 'S1 activate ' || r;
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = u1;
  ASSERT sub.expires_at - sub.starts_at = interval '30 days', 'S1 duration';
  first_exp := sub.expires_at;

  -- 2/3. Duplicate verify + duplicate webhooks do not extend
  r := pg_temp.pay(pay, 'pay_u1_a');
  ASSERT (r->>'is_duplicate')::boolean, 'S2 dup verify ' || r;
  r := pg_temp.webhook(pay, 'pay_u1_a');
  ASSERT (r->>'is_duplicate')::boolean, 'S3 dup webhook ' || r;
  r := pg_temp.webhook(pay, 'pay_u1_a');
  SELECT count(*) INTO n FROM public.subscriptions WHERE user_id = u1;
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = u1;
  ASSERT n = 1 AND sub.expires_at = first_exp, 'S3 no stacking after duplicates';

  -- Same plan / shorter while active: rejected (no more "extend")
  ASSERT pg_temp.q(u1, 'pro_1_month')->>'reason_code' = 'same_duration', 'S4 same plan rejected';

  -- 4. Upgrade 1M -> 6M: pays difference, expiry anchored to cycle start
  r := pg_temp.q(u1, 'pro_6_month');
  ASSERT r->>'purchase_type' = 'upgrade' AND (r->>'amount')::numeric = 150, 'S5 quote ' || r;
  pay := pg_temp.order_for(u1, 'pro_6_month');
  r := pg_temp.webhook(pay, 'pay_u1_b');   -- webhook arrives first this time
  ASSERT (r->>'success')::boolean AND r->>'purchase_type' = 'upgrade', 'S5 activate ' || r;
  r := pg_temp.pay(pay, 'pay_u1_b');       -- then the browser verification
  ASSERT (r->>'is_duplicate')::boolean, 'S5 dup';
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = u1;
  ASSERT sub.plan_id = 'pro_6_month' AND sub.expires_at - sub.starts_at = interval '180 days', 'S5 expiry';
  SELECT count(*) INTO n FROM public.subscription_changes WHERE subscription_id = sub.id;
  ASSERT n = 1, 'S5 audit row';

  -- Same/shorter after upgrade rejected
  ASSERT pg_temp.q(u1, 'pro_6_month')->>'reason_code' = 'same_duration', 'S6 same';
  ASSERT pg_temp.q(u1, 'pro_1_month')->>'reason_code' = 'shorter_duration', 'S6 shorter';

  -- 6M -> 1Y
  r := pg_temp.q(u1, 'pro_1_year');
  ASSERT (r->>'amount')::numeric = 100, 'S7 amount ' || r;
  pay := pg_temp.order_for(u1, 'pro_1_year');
  r := pg_temp.pay(pay, 'pay_u1_c');
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = u1;
  ASSERT sub.plan_id = 'pro_1_year' AND sub.expires_at - sub.starts_at = interval '365 days', 'S7 expiry';

  -- Renewal not open with ~365 days left
  r := pg_temp.q(u1, 'pro_1_year');
  ASSERT r->>'reason_code' = 'renewal_not_open' AND r ? 'renewal_opens_at', 'S8 renewal closed ' || r;
  ASSERT (r->>'renewal_opens_at')::timestamptz = sub.expires_at - interval '15 days', 'S8 window';
  RAISE NOTICE 'PASS: new purchase, duplicates, upgrades, same/shorter rejection, early renewal';
END $$;

DO $$
DECLARE
  u2 uuid := '00000000-0000-0000-0000-000000000002';
  cur uuid; pay1 uuid; pay2 uuid; r jsonb; n int; next public.subscriptions%ROWTYPE; cur_exp timestamptz;
BEGIN
  -- Annual pass expiring in 10 days -> renewal window open
  INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at)
  VALUES (u2, 'pro_1_year', now() - interval '355 days', now() + interval '10 days')
  RETURNING id, expires_at INTO cur, cur_exp;
  r := pg_temp.q(u2, 'pro_1_year');
  ASSERT r->>'purchase_type' = 'renewal' AND (r->>'amount')::numeric = 299, 'R1 quote ' || r;

  -- Two checkouts opened while eligible (double click / two tabs)
  pay1 := pg_temp.order_for(u2, 'pro_1_year');
  pay2 := pg_temp.order_for(u2, 'pro_1_year');
  r := pg_temp.pay(pay1, 'pay_u2_a');
  ASSERT (r->>'success')::boolean AND (r->>'is_renewal')::boolean, 'R2 renew ' || r;
  r := pg_temp.pay(pay2, 'pay_u2_b');
  ASSERT NOT (r->>'success')::boolean AND (r->>'activation_blocked')::boolean
     AND r->>'reason_code' = 'already_renewed', 'R3 second renewal blocked ' || r;
  r := pg_temp.webhook(pay2, 'pay_u2_b');
  ASSERT (r->>'activation_blocked')::boolean AND (r->>'is_duplicate')::boolean, 'R3 blocked idempotent ' || r;
  SELECT count(*) INTO n FROM public.subscriptions WHERE user_id = u2;
  ASSERT n = 2, 'R3 exactly one renewal row, got ' || n;
  SELECT * INTO next FROM public.subscriptions WHERE renewed_from_subscription_id = cur;
  ASSERT next.starts_at = cur_exp AND next.expires_at = cur_exp + interval '365 days', 'R4 contiguous cycle';
  ASSERT (SELECT expires_at FROM public.subscriptions WHERE id = cur) = cur_exp, 'R4 current cycle untouched';
  ASSERT (SELECT status FROM public.payments WHERE id = pay2) = 'completed'
     AND (SELECT (raw_response->>'requires_refund')::boolean FROM public.payments WHERE id = pay2),
     'R5 blocked payment flagged for refund';
  ASSERT pg_temp.q(u2, 'pro_1_year')->>'reason_code' = 'already_renewed', 'R6 renew again rejected';

  -- Direct duplicate insert is impossible even outside the functions
  BEGIN
    INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at, renewed_from_subscription_id)
    VALUES (u2, 'pro_1_year', cur_exp, cur_exp + interval '365 days', cur);
    RAISE EXCEPTION 'R7 unique index missing';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  -- Refund the renewal: only the renewal cycle is cancelled, and renewal becomes possible again
  r := public.reconcile_razorpay_refund('pay_u2_a', 'rfnd_1', 299, 'test');
  ASSERT (SELECT status FROM public.subscriptions WHERE id = next.id) = 'cancelled', 'R8 renewal cancelled';
  ASSERT (SELECT status FROM public.subscriptions WHERE id = cur) = 'active', 'R8 current kept';
  ASSERT pg_temp.q(u2, 'pro_1_year')->>'purchase_type' = 'renewal', 'R8 renewal reopened';
  r := public.reconcile_razorpay_refund('pay_u2_a', 'rfnd_1', 299, 'test');
  ASSERT (r->>'is_duplicate')::boolean, 'R9 duplicate refund webhook';
  RAISE NOTICE 'PASS: renewal window, once per cycle, concurrent renewals, refund of renewal';
END $$;

DO $$
DECLARE
  u3 uuid := '00000000-0000-0000-0000-000000000003';
  u4 uuid := '00000000-0000-0000-0000-000000000004';
  pay uuid; r jsonb; sub public.subscriptions%ROWTYPE; before_exp timestamptz;
BEGIN
  -- Failed payment never activates
  pay := pg_temp.order_for(u3, 'pro_1_year');
  UPDATE public.payments SET status = 'failed' WHERE id = pay;
  BEGIN
    r := pg_temp.pay(pay, 'pay_u3_fail');
    RAISE EXCEPTION 'F1 failed payment activated';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  ASSERT NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = u3), 'F1 no subscription';

  -- Amount mismatch on webhook is rejected
  pay := pg_temp.order_for(u3, 'pro_1_year');
  BEGIN
    PERFORM public.reconcile_razorpay_webhook((SELECT order_id FROM public.payments WHERE id = pay),
      'pay_u3_x', 1, 'INR', 'evt');
    RAISE EXCEPTION 'F2 amount mismatch accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  ASSERT NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = u3), 'F2 no subscription';

  -- Expired pass -> fresh purchase allowed, starts now
  INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at)
  VALUES (u4, 'pro_1_month', now() - interval '40 days', now() - interval '10 days');
  r := pg_temp.q(u4, 'pro_1_month');
  ASSERT r->>'purchase_type' = 'new', 'E1 repurchase after expiry ' || r;

  -- Legacy pending order (pre-migration, no purchase_type) for an active user cannot stack
  INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at)
  VALUES (u3, 'pro_1_year', now() - interval '10 days', now() + interval '355 days')
  RETURNING * INTO sub;
  before_exp := sub.expires_at;
  INSERT INTO public.payments (user_id, plan_id, amount, status, order_id, razorpay_order_id)
  VALUES (u3, 'pro_1_year', 299, 'pending', 'order_legacy', 'order_legacy') RETURNING id INTO pay;
  r := pg_temp.pay(pay, 'pay_u3_legacy');
  ASSERT (r->>'activation_blocked')::boolean, 'L1 legacy stacking blocked ' || r;
  ASSERT (SELECT expires_at FROM public.subscriptions WHERE id = sub.id) = before_exp, 'L1 expiry unchanged';

  -- Upgrade refund restores the previous plan and expiry
  DELETE FROM public.subscriptions WHERE user_id = u4;
  INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at)
  VALUES (u4, 'pro_1_month', now() - interval '5 days', now() + interval '25 days') RETURNING * INTO sub;
  pay := pg_temp.order_for(u4, 'pro_1_year');
  r := pg_temp.pay(pay, 'pay_u4_up');
  ASSERT (SELECT plan_id FROM public.subscriptions WHERE id = sub.id) = 'pro_1_year', 'U1 upgraded';
  r := public.reconcile_razorpay_refund('pay_u4_up', 'rfnd_2', 250, 'test');
  ASSERT (SELECT plan_id FROM public.subscriptions WHERE id = sub.id) = 'pro_1_month'
     AND (SELECT expires_at FROM public.subscriptions WHERE id = sub.id) = sub.expires_at
     AND (SELECT status FROM public.subscriptions WHERE id = sub.id) = 'active', 'U2 upgrade reverted';
  RAISE NOTICE 'PASS: failed payment, amount mismatch, expiry repurchase, legacy order, upgrade refund';
END $$;

DO $$
DECLARE
  u5 uuid := '00000000-0000-0000-0000-000000000005';
  u6 uuid := '00000000-0000-0000-0000-000000000006';
  n int; msg text;
BEGIN
  DELETE FROM public.notifications;
  INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at) VALUES
    (u5, 'pro_1_year', now() - interval '355 days', now() + interval '10 days'),
    (u6, 'pro_1_month', now() - interval '35 days', now() - interval '1 day');
  n := public.dispatch_subscription_expiry_reminders();
  ASSERT (SELECT count(*) FROM public.notifications WHERE u5 = ANY(recipient_ids)) = 1, 'N1 15-day reminder';
  SELECT message INTO msg FROM public.notifications WHERE u5 = ANY(recipient_ids);
  ASSERT msg LIKE '%' || to_char((now() + interval '10 days') AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY') || '%',
     'N1 actual expiry date in message: ' || msg;
  ASSERT msg LIKE '%renew%', 'N1 annual plan in window mentions renewal';
  ASSERT (SELECT title FROM public.notifications WHERE u6 = ANY(recipient_ids)) = 'Your Pro Pass has expired', 'N2 expired';
  ASSERT (SELECT action_link FROM public.notifications WHERE u6 = ANY(recipient_ids)) = '/subscription', 'N2 link';
  -- u2 renewal was refunded above, so u2 (10 days left) gets a reminder too; u1 (365 days) does not.
  ASSERT NOT EXISTS (SELECT 1 FROM public.notifications WHERE '00000000-0000-0000-0000-000000000001' = ANY(recipient_ids)), 'N3 no premature reminder';
  -- Idempotent
  n := public.dispatch_subscription_expiry_reminders();
  ASSERT n = 0, 'N4 duplicate reminders sent: ' || n;
  -- Move u5 into the 7-day band -> one new, different reminder
  UPDATE public.subscriptions SET expires_at = now() + interval '5 days' WHERE user_id = u5;
  n := public.dispatch_subscription_expiry_reminders();
  ASSERT (SELECT count(*) FROM public.notifications WHERE u5 = ANY(recipient_ids) AND title LIKE '%7 days%') = 1, 'N5 7-day';
  -- A renewed user gets no reminder for the expiring cycle
  INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at, renewed_from_subscription_id)
  SELECT user_id, plan_id, expires_at, expires_at + interval '365 days', id FROM public.subscriptions WHERE user_id = u5;
  UPDATE public.subscriptions SET expires_at = now() + interval '12 hours' WHERE user_id = u5 AND renewed_from_subscription_id IS NULL;
  UPDATE public.subscriptions SET starts_at = now() + interval '12 hours' WHERE user_id = u5 AND renewed_from_subscription_id IS NOT NULL;
  n := public.dispatch_subscription_expiry_reminders();
  ASSERT (SELECT count(*) FROM public.notifications WHERE u5 = ANY(recipient_ids)) = 2, 'N6 renewed user not reminded';
  RAISE NOTICE 'PASS: reminders (15d, 7d, expired), real dates, idempotency, renewed users skipped';
END $$;

-- Permissions: students can read their options but cannot call internals.
SELECT set_config('request.jwt.claim.role', 'authenticated', false);
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
SET ROLE authenticated;
DO $$
DECLARE r jsonb; d jsonb;
BEGIN
  r := public.get_my_subscription_purchase_options();
  ASSERT jsonb_array_length(r) = 3, 'P1 three paid plans ' || r;
  ASSERT (SELECT count(*) FROM jsonb_array_elements(r) e WHERE e->>'purchase_type' = 'renewal') = 1, 'P1 renewal offered';
  d := public.get_student_subscription_details();
  ASSERT (d->>'is_active')::boolean AND (d->>'renewal_window_days')::int = 15, 'P2 details ' || d;
  BEGIN
    PERFORM public.quote_subscription_purchase('00000000-0000-0000-0000-000000000001', 'pro_1_year');
    RAISE EXCEPTION 'P3 quote callable by student';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.apply_captured_subscription_payment(gen_random_uuid(), 'x', 'x', 'x', NULL);
    RAISE EXCEPTION 'P4 activation callable by student';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.dispatch_subscription_expiry_reminders();
    RAISE EXCEPTION 'P5 dispatch callable by student';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'PASS: student permissions';
END $$;
RESET ROLE;
