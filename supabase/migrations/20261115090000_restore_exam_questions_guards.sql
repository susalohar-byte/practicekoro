-- ============================================================================
-- Migration: 20261115090000_restore_exam_questions_guards.sql
-- Description: Starting a test (get_student_exam_questions) broke on 9 Nov.
--   20261109120000_question_option_images rewrote the function from its
--   20261029110000 text, before 20261029140000 moved the RLS helpers into the
--   "private" schema. The rewrite therefore:
--     * called public.has_test_access, which no longer exists, so loading a
--       test's questions failed for every student ("function
--       public.has_test_access(uuid, text) does not exist");
--     * dropped the published / active check, so any signed-in user could read
--       the questions of a draft, archived or inactive test by id.
--   Same function, with the check restored, private.* helpers, and the option
--   images 20261109120000 added.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_student_exam_questions(p_test_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
          AND (status = 'published' OR private.has_role(v_user_id, 'admin'))
    ) THEN
        RAISE EXCEPTION 'Test not found or unavailable' USING ERRCODE = '40400';
    END IF;

    v_has_access := private.has_test_access(v_user_id, p_test_id);
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
            'optionAImageUrl', q.option_a_image_url,
            'optionBImageUrl', q.option_b_image_url,
            'optionCImageUrl', q.option_c_image_url,
            'optionDImageUrl', q.option_d_image_url,
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

REVOKE ALL ON FUNCTION public.get_student_exam_questions(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_exam_questions(text) TO authenticated, service_role;
