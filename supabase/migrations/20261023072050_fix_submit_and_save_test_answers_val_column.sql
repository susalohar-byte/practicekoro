-- Migration: 20261021130000_fix_submit_and_save_test_answers_val_column.sql
-- Fix PostgreSQL error: column "val" does not exist in submit_test_attempt and save_test_answers
-- When p_answers is passed as a JSON object, jsonb_each() yields columns (key, value).
-- The previous definition referenced 'val' without an explicit column alias.

-- 1. Fix save_test_answers
CREATE OR REPLACE FUNCTION public.save_test_answers(
    p_attempt_id UUID,
    p_answers JSONB,
    p_time_spent_seconds INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_attempt RECORD;
    v_test RECORD;
    v_expiry_time TIMESTAMPTZ;
    v_item JSONB;
    v_q_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verify attempt exists, belongs to caller, and is currently in progress
    SELECT * INTO v_attempt FROM public.test_attempts
    WHERE id = p_attempt_id AND user_id = v_user_id AND status = 'in_progress';
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

    -- Validate timer has not completely expired (allow 3 min grace period for network delays)
    v_expiry_time := v_attempt.start_time + (v_test.duration_minutes || ' minutes')::INTERVAL + INTERVAL '3 minutes';
    IF NOW() > v_expiry_time THEN
        RETURN FALSE;
    END IF;

    -- Update time spent (clamped to test duration)
    UPDATE public.test_attempts
    SET time_spent_seconds = GREATEST(0, LEAST(p_time_spent_seconds, v_test.duration_minutes * 60))
    WHERE id = p_attempt_id;

    -- Normalize p_answers if passed as an object map or null
    -- Explicitly alias jsonb_each columns to (key, val) or use j.value
    IF jsonb_typeof(p_answers) = 'object' THEN
        SELECT COALESCE(jsonb_agg(
            CASE 
                WHEN jsonb_typeof(j.value) = 'object' THEN j.value || jsonb_build_object('questionId', j.key)
                ELSE jsonb_build_object('questionId', j.key, 'selectedOption', j.value)
            END
        ), '[]'::JSONB)
        INTO p_answers
        FROM jsonb_each(p_answers) j;
    ELSIF p_answers IS NULL OR jsonb_typeof(p_answers) != 'array' THEN
        p_answers := '[]'::JSONB;
    END IF;

    -- Save/update student selections
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_q_id := (v_item->>'questionId')::UUID;
        IF v_q_id IS NULL THEN
            v_q_id := (v_item->>'question_id')::UUID;
        END IF;

        -- Verify question actually belongs to this test
        IF EXISTS (
            SELECT 1 FROM public.test_questions 
            WHERE test_id = v_attempt.test_id AND question_id = v_q_id
        ) THEN
            INSERT INTO public.attempt_answers (
                attempt_id,
                question_id,
                selected_option,
                is_marked_for_review,
                time_spent_seconds
            )
            VALUES (
                p_attempt_id,
                v_q_id,
                COALESCE(v_item->>'selectedOption', v_item->>'selected_option'),
                COALESCE((v_item->>'isMarkedForReview')::BOOLEAN, (v_item->>'is_marked_for_review')::BOOLEAN, FALSE),
                COALESCE((v_item->>'timeSpentSeconds')::INT, (v_item->>'time_spent_seconds')::INT, 0)
            )
            ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                selected_option = EXCLUDED.selected_option,
                is_marked_for_review = EXCLUDED.is_marked_for_review,
                time_spent_seconds = EXCLUDED.time_spent_seconds;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Fix submit_test_attempt
CREATE OR REPLACE FUNCTION public.submit_test_attempt(
    p_attempt_id UUID,
    p_answers JSONB,
    p_time_spent_seconds INT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_attempt RECORD;
    v_test RECORD;
    v_q RECORD;
    v_selected TEXT;

    v_correct_count INT := 0;
    v_wrong_count INT := 0;
    v_skipped_count INT := 0;
    v_score NUMERIC(6, 2) := 0.00;
    v_accuracy NUMERIC(5, 2) := 0.00;
    v_percentage NUMERIC(5, 2) := 0.00;
    v_passed BOOLEAN := FALSE;

    -- Effective negative deduction per wrong answer (test-level policy).
    v_negative_marks NUMERIC(6, 2) := 0.00;

    v_rank INT;
    v_total_candidates INT;
    v_percentile NUMERIC(5, 2);
    v_existing_result RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    -- Verify attempt and strict ownership
    SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt not found' USING ERRCODE = '40400';
    END IF;

    IF v_attempt.user_id != v_user_id THEN
        RAISE EXCEPTION 'Forbidden: You do not own this attempt' USING ERRCODE = '40300';
    END IF;

    -- SUBMISSION IDEMPOTENCY: If already completed, return existing graded results immediately
    IF v_attempt.status = 'completed' THEN
        SELECT * INTO v_existing_result FROM public.test_results WHERE attempt_id = p_attempt_id;
        IF FOUND THEN
            RETURN jsonb_build_object(
                'attempt_id', p_attempt_id,
                'test_id', v_attempt.test_id,
                'score', v_existing_result.score,
                'total_marks', v_existing_result.total_marks,
                'percentage', v_existing_result.percentage,
                'accuracy', v_existing_result.accuracy,
                'correct_count', v_attempt.correct_count,
                'wrong_count', v_attempt.wrong_count,
                'skipped_count', v_attempt.skipped_count,
                'time_spent_seconds', v_attempt.time_spent_seconds,
                'rank', v_existing_result.rank,
                'total_candidates', v_existing_result.total_candidates,
                'percentile', v_existing_result.percentile,
                'passed', v_existing_result.passed
            );
        END IF;
    END IF;

    SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

    -- TEST-LEVEL NEGATIVE MARKING POLICY: all test types use their saved
    -- value; zero means no deduction. Question-level defaults are ignored.
    v_negative_marks := GREATEST(COALESCE(v_test.negative_marking, 0.00), 0.00);

    -- Normalize p_answers if passed as an object map or null
    -- Explicitly alias jsonb_each columns to (key, val) or use j.value
    IF jsonb_typeof(p_answers) = 'object' THEN
        SELECT COALESCE(jsonb_agg(
            CASE
                WHEN jsonb_typeof(j.value) = 'object' THEN j.value || jsonb_build_object('questionId', j.key)
                ELSE jsonb_build_object('questionId', j.key, 'selectedOption', j.value)
            END
        ), '[]'::JSONB)
        INTO p_answers
        FROM jsonb_each(p_answers) j;
    ELSIF p_answers IS NULL OR jsonb_typeof(p_answers) != 'array' THEN
        p_answers := '[]'::JSONB;
    END IF;

    -- Iterate strictly over AUTHORITATIVE test_questions for this test
    -- Client cannot inject arbitrary external question IDs
    FOR v_q IN
        SELECT
            tq.question_id,
            tq.question_order,
            COALESCE(tq.marks, q.default_marks, 1.00) AS marks,
            q.correct_option
        FROM public.test_questions tq
        JOIN public.questions q ON q.id = tq.question_id
        WHERE tq.test_id = v_test.id AND q.is_active = true
        ORDER BY tq.question_order ASC
    LOOP
        -- Look up student's selected answer from p_answers payload
        SELECT COALESCE(elem->>'selectedOption', elem->>'selected_option')
        INTO v_selected
        FROM jsonb_array_elements(p_answers) elem
        WHERE (COALESCE(elem->>'questionId', elem->>'question_id'))::UUID = v_q.question_id
        LIMIT 1;

        IF v_selected IS NULL OR v_selected = '' THEN
            -- Unanswered / Skipped
            v_skipped_count := v_skipped_count + 1;

            INSERT INTO public.attempt_answers (
                attempt_id, question_id, selected_option, is_correct, marks_awarded, time_spent_seconds
            )
            VALUES (
                p_attempt_id, v_q.question_id, NULL, FALSE, 0.00, 0
            )
            ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                selected_option = NULL,
                is_correct = FALSE,
                marks_awarded = 0.00;

        ELSIF v_selected = v_q.correct_option THEN
            -- Correct Answer
            v_correct_count := v_correct_count + 1;
            v_score := v_score + v_q.marks;

            INSERT INTO public.attempt_answers (
                attempt_id, question_id, selected_option, is_correct, marks_awarded, time_spent_seconds
            )
            VALUES (
                p_attempt_id, v_q.question_id, v_selected, TRUE, v_q.marks, 0
            )
            ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                selected_option = v_selected,
                is_correct = TRUE,
                marks_awarded = v_q.marks;

        ELSE
            -- Wrong Answer: Deduct the TEST-LEVEL negative marks (0 when the
            -- scheme does not apply). Per-question values are ignored.
            v_wrong_count := v_wrong_count + 1;
            v_score := v_score - v_negative_marks;

            INSERT INTO public.attempt_answers (
                attempt_id, question_id, selected_option, is_correct, marks_awarded, time_spent_seconds
            )
            VALUES (
                p_attempt_id, v_q.question_id, v_selected, FALSE, -v_negative_marks, 0
            )
            ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                selected_option = v_selected,
                is_correct = FALSE,
                marks_awarded = -v_negative_marks;

            -- AUTOMATED MISTAKES NOTEBOOK INTEGRATION (Idempotent per test attempt)
            INSERT INTO public.mistakes (
                user_id, question_id, last_attempt_id, wrong_count, is_resolved
            )
            VALUES (
                v_user_id, v_q.question_id, p_attempt_id, 1, FALSE
            )
            ON CONFLICT (user_id, question_id) DO UPDATE SET
                wrong_count = CASE
                    WHEN public.mistakes.last_attempt_id = p_attempt_id THEN public.mistakes.wrong_count
                    ELSE public.mistakes.wrong_count + 1
                END,
                last_attempt_id = p_attempt_id,
                is_resolved = FALSE,
                updated_at = NOW();
        END IF;
    END LOOP;

    -- Clamp minimum score to 0.00
    v_score := GREATEST(0.00, v_score);

    -- Mathematically distinct metrics:
    -- Accuracy: correct / attempted * 100
    IF (v_correct_count + v_wrong_count) > 0 THEN
        v_accuracy := ROUND(((v_correct_count::NUMERIC / (v_correct_count + v_wrong_count)) * 100), 2);
    ELSE
        v_accuracy := 0.00;
    END IF;

    -- Percentage: score / total_marks * 100
    IF v_test.total_marks > 0 THEN
        v_percentage := ROUND(((v_score / v_test.total_marks) * 100), 2);
    ELSE
        v_percentage := 0.00;
    END IF;

    IF v_score >= v_test.passing_marks THEN
        v_passed := TRUE;
    END IF;

    -- REAL-TIME COMPETITIVE RANK & PERCENTILE CALCULATION (No hardcoded values)
    SELECT COUNT(*) + 1 INTO v_rank
    FROM public.test_results
    WHERE test_id = v_attempt.test_id AND score > v_score;

    SELECT COUNT(*) + 1 INTO v_total_candidates
    FROM public.test_results
    WHERE test_id = v_attempt.test_id;

    IF v_total_candidates > 1 THEN
        v_percentile := ROUND((((v_total_candidates - v_rank)::NUMERIC / v_total_candidates) * 100), 2);
    ELSE
        v_percentile := 100.00;
    END IF;

    -- Complete the attempt record (Immutable after completion)
    UPDATE public.test_attempts
    SET status = 'completed',
        end_time = NOW(),
        time_spent_seconds = GREATEST(0, LEAST(p_time_spent_seconds, v_test.duration_minutes * 60)),
        score = v_score,
        correct_count = v_correct_count,
        wrong_count = v_wrong_count,
        skipped_count = v_skipped_count,
        accuracy = v_accuracy,
        rank = v_rank,
        percentile = v_percentile
    WHERE id = p_attempt_id;

    -- Upsert final test_results
    INSERT INTO public.test_results (
        attempt_id,
        user_id,
        test_id,
        score,
        total_marks,
        percentage,
        accuracy,
        rank,
        total_candidates,
        percentile,
        passed
    )
    VALUES (
        p_attempt_id,
        v_user_id,
        v_attempt.test_id,
        v_score,
        v_test.total_marks,
        v_percentage,
        v_accuracy,
        v_rank,
        v_total_candidates,
        v_percentile,
        v_passed
    )
    ON CONFLICT (attempt_id) DO UPDATE SET
        score = EXCLUDED.score,
        percentage = EXCLUDED.percentage,
        accuracy = EXCLUDED.accuracy,
        rank = EXCLUDED.rank,
        total_candidates = EXCLUDED.total_candidates,
        percentile = EXCLUDED.percentile,
        passed = EXCLUDED.passed;

    RETURN jsonb_build_object(
        'attempt_id', p_attempt_id,
        'test_id', v_attempt.test_id,
        'score', v_score,
        'total_marks', v_test.total_marks,
        'percentage', v_percentage,
        'accuracy', v_accuracy,
        'correct_count', v_correct_count,
        'wrong_count', v_wrong_count,
        'skipped_count', v_skipped_count,
        'time_spent_seconds', GREATEST(0, LEAST(p_time_spent_seconds, v_test.duration_minutes * 60)),
        'rank', v_rank,
        'total_candidates', v_total_candidates,
        'percentile', v_percentile,
        'passed', v_passed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
