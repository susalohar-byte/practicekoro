-- ============================================================================
-- Migration: 20261105110000_attempt_solutions_private_has_role.sql
-- Description: 20261105100000 rewrote get_attempt_solutions but called the
--   role helper as public.has_role. 20261029140000 moved has_role into the
--   "private" schema, so that call fails whenever it runs (another user's
--   attempt, or a test with a Live Test row), and the post-apply check
--   no_body_calls_helpers_via_public flags it. Same function, with
--   private.has_role. is_live_test_active was not moved and stays in public.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_attempt_solutions(
    p_attempt_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_attempt RECORD;
    v_negative NUMERIC;
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

    IF v_attempt.user_id != v_user_id AND NOT private.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Forbidden: You do not own this attempt' USING ERRCODE = '40300';
    END IF;

    IF v_attempt.status != 'completed' THEN
        RAISE EXCEPTION 'Forbidden: Solutions are only available after test submission' USING ERRCODE = '40301';
    END IF;

    -- COMPETITIVE INTEGRITY GUARD: while this test's Live Test window is still
    -- open, answers stay hidden from students.
    IF EXISTS (
        SELECT 1
        FROM public.live_tests lt
        WHERE lt.test_id = v_attempt.test_id
          AND public.is_live_test_active(lt, false)
    ) AND NOT private.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Solutions for Live Tests are revealed only after the contest window concludes.'
            USING ERRCODE = '40302';
    END IF;

    -- Same test-level deduction submit_test_attempt applies to a wrong answer.
    SELECT GREATEST(COALESCE(t.negative_marking, 0.00), 0.00) INTO v_negative
    FROM public.tests t WHERE t.id = v_attempt.test_id;

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
            'marks', COALESCE(tq.marks, q.default_marks, 1.00),
            'negativeMarks', COALESCE(v_negative, 0.00),
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
