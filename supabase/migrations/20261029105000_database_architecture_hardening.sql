-- ============================================================================
-- Migration: 20261029105000_database_architecture_hardening.sql
-- Description: Comprehensive database architecture hardening:
--   1. Live Test Solution Leaks: Prevent early solution disclosure during active live contests.
--   2. App Settings Hardening: Transition from regex blacklist to strict category whitelist.
--   3. Coupon Scraping Shield: Remove student SELECT on coupons; channel through validate RPC.
--   4. Cross-Device Bookmarks: Allow students to read full question details for bookmarked questions.
--   5. Performance Indexes: Add missing indexes on foreign keys to eliminate sequential scans.
--   6. Atomic Coupon Redemption: RPC to safely record coupon usages and track used_count.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. LIVE TEST SOLUTION LEAK PREVENTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_attempt_solutions(
    p_attempt_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_attempt RECORD;
    v_solutions JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    -- Verify attempt exists, belongs to caller, and is COMPLETED
    SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt not found' USING ERRCODE = '40400';
    END IF;

    IF v_attempt.user_id != v_user_id AND NOT public.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Forbidden: You do not own this attempt' USING ERRCODE = '40300';
    END IF;

    IF v_attempt.status != 'completed' THEN
        RAISE EXCEPTION 'Forbidden: Solutions are only available after test submission' USING ERRCODE = '40301';
    END IF;

    -- COMPETITIVE INTEGRITY GUARD:
    -- If this test is attached to an active live event, solutions are STRICTLY BLOCKED
    -- until the live test window has fully concluded.
    IF EXISTS (
        SELECT 1
        FROM public.live_tests lt
        WHERE lt.test_id = v_attempt.test_id
          AND lt.is_active = TRUE
          AND lt.window_end > NOW()
    ) AND NOT public.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Solutions for Live Tests are revealed only after the contest window concludes.'
            USING ERRCODE = '40302';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'questionOrder', tq.question_order,
            'questionText', q.question_text,
            'questionBengaliText', q.question_bengali_text,
            'imageUrl', q.image_url,
            'subjectId', q.subject_id,
            'subjectName', s.name,
            'chapterId', q.chapter_id,
            'chapterName', c.name,
            'optionA', q.option_a,
            'optionB', q.option_b,
            'optionC', q.option_c,
            'optionD', q.option_d,
            'selectedOption', aa.selected_option,
            'correctOption', q.correct_option,
            'isCorrect', COALESCE(aa.is_correct, FALSE),
            'marksAwarded', COALESCE(aa.marks_awarded, 0.00),
            'explanation', q.explanation,
            'explanationBengali', q.explanation_bengali,
            'isBookmarked', EXISTS (
                SELECT 1 FROM public.bookmarks b 
                WHERE b.user_id = v_user_id AND b.question_id = q.id
            )
        ) ORDER BY tq.question_order ASC
    ) INTO v_solutions
    FROM public.test_questions tq
    JOIN public.questions q ON q.id = tq.question_id
    LEFT JOIN public.subjects s ON s.id = q.subject_id
    LEFT JOIN public.chapters c ON c.id = q.chapter_id
    LEFT JOIN public.attempt_answers aa 
        ON aa.attempt_id = p_attempt_id AND aa.question_id = q.id
    WHERE tq.test_id = v_attempt.test_id;

    RETURN COALESCE(v_solutions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_attempt_solutions(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attempt_solutions(UUID) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 2. HARDEN APP_SETTINGS WITH CATEGORY WHITELIST
-- ----------------------------------------------------------------------------
-- Replace permissive USING (true) with an explicit category whitelist
DROP POLICY IF EXISTS "Anyone can read public app settings" ON public.app_settings;
CREATE POLICY "Anyone can read public app settings"
    ON public.app_settings
    FOR SELECT
    TO anon, authenticated
    USING (
        category IN ('general', 'exam_defaults', 'system', 'subscription', 'banners', 'theme')
        OR public.admin_scope_allowed('super')
    );


-- ----------------------------------------------------------------------------
-- 3. COUPONS TABLE SCRAPING SHIELD
-- ----------------------------------------------------------------------------
-- Remove public/student SELECT on coupons table. Validation is handled solely via validate_coupon_code() RPC.
DROP POLICY IF EXISTS "Students can view active coupons" ON public.coupons;


-- ----------------------------------------------------------------------------
-- 4. CROSS-DEVICE BOOKMARKS: ALLOW STUDENTS TO READ SAVED QUESTION CONTENT
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students read own bookmarked questions" ON public.questions;
CREATE POLICY "Students read own bookmarked questions"
    ON public.questions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookmarks b
            WHERE b.question_id = questions.id
              AND b.user_id = auth.uid()
        )
    );


-- ----------------------------------------------------------------------------
-- 5. ATOMIC COUPON REDEMPTION RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_coupon_redemption(
    p_code TEXT,
    p_plan_id TEXT,
    p_payment_id TEXT,
    p_order_amount NUMERIC,
    p_discount_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_coupon RECORD;
    v_final NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User session required' USING ERRCODE = '40100';
    END IF;

    -- Select and lock coupon row for atomic increment
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_code))
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Coupon not found');
    END IF;

    IF NOT v_coupon.is_active THEN
        RETURN jsonb_build_object('success', false, 'message', 'Coupon is inactive');
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Coupon has expired');
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
        RETURN jsonb_build_object('success', false, 'message', 'Maximum coupon usage reached');
    END IF;

    v_final := GREATEST(0, p_order_amount - p_discount_amount);

    -- Record usage
    INSERT INTO public.coupon_usages (
        coupon_id,
        user_id,
        payment_id,
        order_amount,
        discount_amount,
        final_amount,
        used_at
    ) VALUES (
        v_coupon.id,
        v_user_id,
        p_payment_id,
        p_order_amount,
        p_discount_amount,
        v_final,
        NOW()
    );

    -- Increment usage counter atomically
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = v_coupon.id;

    RETURN jsonb_build_object('success', true, 'used_count', v_coupon.used_count + 1);
END;
$$;

REVOKE ALL ON FUNCTION public.record_coupon_redemption(TEXT, TEXT, TEXT, NUMERIC, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_coupon_redemption(TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 6. MISSING FOREIGN KEY & PERFORMANCE COVERING INDEXES
-- ----------------------------------------------------------------------------
-- Eliminate sequential scans during cascading deletes and junction joins
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id ON public.attempt_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_question_id ON public.test_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question_id ON public.bookmarks(question_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_live_tests_test_id ON public.live_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_status ON public.test_attempts(test_id, status);

NOTIFY pgrst, 'reload schema';

COMMIT;
