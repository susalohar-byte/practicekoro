-- ============================================================================
-- Migration: 20261105100000_fix_attempt_solutions_live_guard.sql
-- Description: View Answer never loaded.
--   20261029105000_database_architecture_hardening.sql added a live-test guard
--   to get_attempt_solutions that reads live_tests.is_active and
--   live_tests.window_end. Neither column exists, so every call failed with
--   "column lt.is_active does not exist" for every student and every test.
--   The guard now uses public.is_live_test_active, the same window rule the
--   rest of the live-test code uses (published, not cancelled/ended, and
--   now() before start_at + duration).
--   The result also carries each question's marks and the test's negative
--   marking, so per-subject scores match what submit_test_attempt graded.
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

    IF v_attempt.user_id != v_user_id AND NOT public.has_role(v_user_id, 'admin') THEN
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
    ) AND NOT public.has_role(v_user_id, 'admin') THEN
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
