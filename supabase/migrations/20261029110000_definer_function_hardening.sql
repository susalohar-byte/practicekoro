-- ============================================================================
-- SECURITY DEFINER function hardening (audit 2026-10-29)
-- ============================================================================
-- Every public function is callable at /rest/v1/rpc/<name> with the anon key
-- that ships in the website and the apps. A SECURITY DEFINER function bypasses
-- RLS, so each one must check its own caller. This migration:
--
--   A. get_test_leaderboard          stop exposing other students' e-mail
--                                    local-parts as their display name
--      get_student_exam_questions    refuse unpublished / inactive tests
--                                    (same rule as start_test_attempt)
--      process_scheduled_notifications  notification staff or trusted backend only
--   B. has_role, account_is_active, has_test_access
--                                    answer about the caller only, unless the
--                                    caller is an admin or the trusted backend
--      validate_coupon_code          per-user usage counted for the caller only
--   C. revoke EXECUTE from anon/authenticated on definer functions that no
--      client, RLS policy or invoker view calls.
--   +  pin search_path (pg_temp last) on the two functions pinned to "public".
--
-- Signatures, return types and the behaviour for legitimate callers are
-- unchanged. "Trusted backend" = a request without an anon/authenticated JWT
-- role (service_role edge functions, pg_cron, SQL editor).
-- Idempotent: CREATE OR REPLACE + REVOKE/GRANT only.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- B. has_role: callers may only ask about themselves (RLS always passes
--    auth.uid()); admins and the trusted backend may ask about anyone.
--    Previously anon/authenticated could probe any UUID, e.g. the user_id values
--    returned by get_test_leaderboard, to find staff accounts.
-- ----------------------------------------------------------------------------
create or replace function public.has_role(p_user_id uuid, p_role text)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  -- Nested CASE guarantees evaluation order: the admin lookup runs only for a
  -- non-self target, and it is itself a self check, so it cannot recurse further.
  SELECT CASE WHEN (CASE
      WHEN p_user_id IS NOT DISTINCT FROM auth.uid() THEN true
      WHEN coalesce(auth.jwt() ->> 'role', '') NOT IN ('anon', 'authenticated') THEN true
      ELSE public.has_role(auth.uid(), 'admin')
    END)
    THEN public.account_is_active(p_user_id) AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role)
      OR (p_role = 'admin' AND EXISTS (SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND role = 'admin' AND admin_role IS NOT NULL))
    )
    ELSE false
  END;
$function$;

-- ----------------------------------------------------------------------------
-- B. account_is_active: same self-or-admin-or-backend rule.
-- ----------------------------------------------------------------------------
create or replace function public.account_is_active(p_user_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  SELECT CASE WHEN (CASE
      WHEN p_user_id IS NOT DISTINCT FROM auth.uid() THEN true
      WHEN coalesce(auth.jwt() ->> 'role', '') NOT IN ('anon', 'authenticated') THEN true
      ELSE public.has_role(auth.uid(), 'admin')
    END)
    THEN EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND account_status = 'active')
    ELSE false
  END;
$function$;

-- ----------------------------------------------------------------------------
-- B. has_test_access: the invoker view user_test_access and the attempt RPCs
--    always pass auth.uid(); refuse to reveal another user's Pro status.
-- ----------------------------------------------------------------------------
create or replace function public.has_test_access(p_user_id uuid, p_test_id text)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
DECLARE
    v_is_premium BOOLEAN;
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid()
       AND coalesce(auth.jwt() ->> 'role', '') IN ('anon', 'authenticated')
       AND NOT public.has_role(auth.uid(), 'admin') THEN
        RETURN FALSE;
    END IF;

    -- Check if test is free
    SELECT is_premium INTO v_is_premium FROM public.tests WHERE id = p_test_id;
    IF v_is_premium IS FALSE THEN
        RETURN TRUE;
    END IF;

    -- If user is admin, allow access
    IF public.has_role(p_user_id, 'admin') THEN
        RETURN TRUE;
    END IF;

    -- If test is premium, user MUST have an active subscription
    RETURN public.has_active_subscription(p_user_id);
END;
$function$;

-- ----------------------------------------------------------------------------
-- B. validate_coupon_code: p_user_id was trusted as given, so a student could
--    read another student's per-user coupon usage. Count it for the caller.
--    Also pins search_path with pg_temp last (was "public" only).
-- ----------------------------------------------------------------------------
create or replace function public.validate_coupon_code(p_code text, p_plan_id text, p_amount numeric, p_user_id uuid DEFAULT NULL::uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
DECLARE
    v_coupon RECORD;
    v_user_uses INTEGER := 0;
    v_discount NUMERIC(10, 2) := 0;
    v_final NUMERIC(10, 2) := p_amount;
BEGIN
    IF p_user_id IS NOT NULL
       AND p_user_id IS DISTINCT FROM auth.uid()
       AND coalesce(auth.jwt() ->> 'role', '') IN ('anon', 'authenticated')
       AND NOT public.has_role(auth.uid(), 'admin') THEN
        p_user_id := auth.uid();
    END IF;

    -- Normalize code
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_code))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'Invalid coupon code.');
    END IF;

    IF NOT v_coupon.is_active THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'This coupon is inactive.');
    END IF;

    IF v_coupon.valid_from > NOW() THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'This coupon is not yet active.');
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'This coupon has expired.');
    END IF;

    IF v_coupon.applicable_plan_id IS NOT NULL AND v_coupon.applicable_plan_id != p_plan_id THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'This coupon is not applicable for this plan.');
    END IF;

    IF p_amount < v_coupon.min_order_amount THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'Minimum order amount for this coupon is ₹' || v_coupon.min_order_amount);
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
        RETURN jsonb_build_object('valid', FALSE, 'message', 'This coupon usage limit has been reached.');
    END IF;

    -- Check per-user usage
    IF p_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_uses
        FROM public.coupon_usages
        WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

        IF v_user_uses >= v_coupon.max_uses_per_user THEN
            RETURN jsonb_build_object('valid', FALSE, 'message', 'You have already reached the maximum usage limit for this coupon.');
        END IF;
    END IF;

    -- Calculate discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := ROUND((p_amount * v_coupon.discount_value / 100.0), 2);
        IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
            v_discount := v_coupon.max_discount_amount;
        END IF;
    ELSIF v_coupon.discount_type = 'fixed' THEN
        v_discount := v_coupon.discount_value;
    END IF;

    IF v_discount > p_amount THEN
        v_discount := p_amount;
    END IF;

    v_final := p_amount - v_discount;

    RETURN jsonb_build_object(
        'valid', TRUE,
        'coupon_id', v_coupon.id,
        'code', v_coupon.code,
        'discount_type', v_coupon.discount_type,
        'discount_value', v_coupon.discount_value,
        'discount_amount', v_discount,
        'final_price', v_final,
        'message', 'Coupon applied successfully!'
    );
END;
$function$;

-- ----------------------------------------------------------------------------
-- A. process_scheduled_notifications: any signed-in student could run this
--    job (UPDATE on notifications). Restrict to notification staff (the admin
--    Notifications page calls it) or the trusted backend. Pins search_path.
-- ----------------------------------------------------------------------------
create or replace function public.process_scheduled_notifications()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
DECLARE
    updated_count integer := 0;
BEGIN
    IF coalesce(auth.jwt() ->> 'role', '') IN ('anon', 'authenticated')
       AND NOT public.can_mutate_admin_record('notifications') THEN
        RAISE EXCEPTION 'Notification-management privileges required' USING ERRCODE = '42501';
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
$function$;

-- ----------------------------------------------------------------------------
-- A. get_student_exam_questions: had no tests.status / is_active check, so any
--    student could pull the question paper of a draft, archived or inactive
--    free test by id. Apply the same rule start_test_attempt already uses.
-- ----------------------------------------------------------------------------
create or replace function public.get_student_exam_questions(p_test_id text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
DECLARE
    v_user_id UUID;
    v_has_access BOOLEAN;
    v_live_error TEXT;
    v_questions JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.tests
        WHERE id = p_test_id
          AND is_active = true
          AND (status = 'published' OR public.has_role(v_user_id, 'admin'))
    ) THEN
        RAISE EXCEPTION 'Test not found or unavailable' USING ERRCODE = '40400';
    END IF;

    v_has_access := public.has_test_access(v_user_id, p_test_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Forbidden: Active All-Access Pro Pass required' USING ERRCODE = '40300';
    END IF;

    v_live_error := public.live_paper_access_error(v_user_id, p_test_id);
    IF v_live_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_live_error USING ERRCODE = '40300';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'questionOrder', tq.question_order,
            'questionText', q.question_text,
            'questionBengaliText', q.question_bengali_text,
            'optionA', q.option_a,
            'optionB', q.option_b,
            'optionC', q.option_c,
            'optionD', q.option_d,
            'difficulty', q.difficulty,
            'marks', COALESCE(tq.marks, q.default_marks, 1.00),
            'negativeMarks', COALESCE(tq.negative_marks, q.default_negative_marks, 0.25),
            'imageUrl', q.image_url
        ) ORDER BY tq.question_order ASC
    ) INTO v_questions
    FROM public.test_questions tq
    JOIN public.questions q ON q.id = tq.question_id
    WHERE tq.test_id = p_test_id AND q.is_active = true;

    RETURN COALESCE(v_questions, '[]'::JSONB);
END;
$function$;

-- ----------------------------------------------------------------------------
-- A. get_test_leaderboard: for every ranked student without a full name the
--    display name was built from their e-mail address
--    (initcap(split_part(email,'@',1)) || ' (Student)'), returned to any
--    signed-in user together with user_id. Use the neutral fallback instead.
-- ----------------------------------------------------------------------------
create or replace function public.get_test_leaderboard(p_test_id text DEFAULT NULL::text, p_scope text DEFAULT 'global'::text, p_district text DEFAULT NULL::text, p_block text DEFAULT NULL::text, p_limit integer DEFAULT 100)
 returns table(rank bigint, user_id uuid, student_name text, avatar_url text, score numeric, total_marks numeric, percentage numeric, district text, block text, is_current_user boolean)
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
DECLARE
  v_user UUID := auth.uid();
  v_test_id TEXT := p_test_id;
  v_total_marks NUMERIC;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_test_id IS NULL OR btrim(v_test_id) = '' THEN
    SELECT a.test_id INTO v_test_id
    FROM public.test_attempts a
    WHERE a.user_id = v_user AND a.status = 'completed'
    ORDER BY COALESCE(a.end_time, a.created_at) DESC
    LIMIT 1;
  END IF;

  RETURN QUERY
  WITH best_attempts AS (
    SELECT
      a.user_id,
      COALESCE(tr.score, a.score)::NUMERIC AS score,
      COALESCE(NULLIF(tr.total_marks, 0), NULLIF(a.total_marks, 0), NULLIF(t.total_marks, 0), 200)::NUMERIC AS marks,
      COALESCE(tr.accuracy, a.accuracy, 0)::NUMERIC AS accuracy,
      COALESCE(a.time_spent_seconds, 0)::INT AS seconds,
      COALESCE(a.end_time, a.created_at) AS completed_at,
      ROW_NUMBER() OVER (
        PARTITION BY a.user_id
        ORDER BY
          COALESCE(tr.score, a.score) DESC,
          COALESCE(tr.accuracy, a.accuracy, 0) DESC,
          COALESCE(a.time_spent_seconds, 999999) ASC,
          COALESCE(a.end_time, a.created_at) DESC
      ) AS rn
    FROM public.test_attempts a
    JOIN public.tests t ON t.id = a.test_id
    LEFT JOIN public.test_results tr ON tr.attempt_id = a.id
    WHERE a.status = 'completed'
      AND (v_test_id IS NULL OR a.test_id = v_test_id)
  ),
  filtered_students AS (
    SELECT
      ba.user_id,
      -- Never derive a public name from the e-mail address.
      COALESCE(NULLIF(NULLIF(btrim(p.full_name), 'Aspirant'), ''), 'Aspirant Student') AS full_name,
      -- profiles has no custom_avatar_url; the app copies a custom avatar into avatar_url.
      p.avatar_url AS avatar,
      ba.score,
      ba.marks,
      ROUND((ba.score / NULLIF(ba.marks, 0) * 100), 1) AS pct,
      p.district,
      NULL::TEXT AS block_name
    FROM best_attempts ba
    JOIN public.profiles p ON p.id = ba.user_id
    WHERE ba.rn = 1
      AND (
        p_scope = 'global'
        OR (p_scope = 'west_bengal' AND NULLIF(btrim(p.district), '') IS NOT NULL)
        OR (p_scope = 'district' AND (p_district IS NULL OR lower(btrim(p.district)) = lower(btrim(p_district))))
      )
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY fs.score DESC, fs.pct DESC, fs.user_id ASC
      ) AS student_rank,
      fs.user_id,
      fs.full_name,
      fs.avatar,
      fs.score,
      fs.marks,
      fs.pct,
      fs.district,
      fs.block_name,
      (fs.user_id = v_user) AS is_me
    FROM filtered_students fs
  )
  SELECT
    r.student_rank AS rank,
    r.user_id,
    r.full_name AS student_name,
    r.avatar AS avatar_url,
    r.score,
    r.marks AS total_marks,
    r.pct AS percentage,
    r.district,
    r.block_name AS block,
    r.is_me AS is_current_user
  FROM ranked r
  ORDER BY r.student_rank ASC
  LIMIT COALESCE(p_limit, 100);
END;
$function$;

-- ----------------------------------------------------------------------------
-- C. Not called by any client (src/, student-web/, practicekoro_mobile/),
--    any RLS policy or any invoker view; only by other SECURITY DEFINER
--    functions/triggers (which run as the owner) or not at all.
--    sync_admin_profile promoted the caller to admin from an e-mail match; the
--    app no longer calls it (AuthContext.security.test.tsx asserts this).
--    publish_test only required has_role(admin), so a support_agent could
--    publish tests through it.
-- ----------------------------------------------------------------------------
revoke execute on function public.sync_admin_profile() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.is_pk_admin() from public, anon, authenticated;
revoke execute on function public.publish_test(text) from public, anon, authenticated;
revoke execute on function public.admin_assign_series_tests(text[], text) from public, anon, authenticated;
revoke execute on function public.get_admin_dashboard_v2_stats() from public, anon, authenticated;
revoke execute on function public.is_live_test_active(public.live_tests, boolean) from public, anon, authenticated;
revoke execute on function public.is_test_live_locked(text, boolean) from public, anon, authenticated;

grant execute on function public.sync_admin_profile() to service_role;
grant execute on function public.is_admin() to service_role;
grant execute on function public.is_pk_admin() to service_role;
grant execute on function public.publish_test(text) to service_role;
grant execute on function public.admin_assign_series_tests(text[], text) to service_role;
grant execute on function public.get_admin_dashboard_v2_stats() to service_role;
grant execute on function public.is_live_test_active(public.live_tests, boolean) to service_role;
grant execute on function public.is_test_live_locked(text, boolean) to service_role;

commit;
