-- Images on MCQ answer options (A-D), for Reasoning / Maths / Non-Verbal questions whose
-- options are diagrams, figures or patterns. An option can be text only, image only (text '')
-- or both. Only the public Storage URL is stored here (the file lives in the question-images
-- bucket); inline data: images are rejected like the question image.
--
-- Backward compatible: the columns are nullable and default to NULL, so every existing
-- question keeps working unchanged. Student RPCs return JSON, so the extra keys are ignored
-- by older app versions.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS option_a_image_url text,
  ADD COLUMN IF NOT EXISTS option_b_image_url text,
  ADD COLUMN IF NOT EXISTS option_c_image_url text,
  ADD COLUMN IF NOT EXISTS option_d_image_url text;

-- No inline base64 images in the option columns either (keeps rows small).
DROP TRIGGER IF EXISTS reject_inline_images ON public.questions;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images(
    'image_url', 'option_a_image_url', 'option_b_image_url', 'option_c_image_url', 'option_d_image_url'
  );

-- A running Live Test freezes the options; an option's image is part of the option.
CREATE OR REPLACE FUNCTION public.guard_running_live_questions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.live_lock_applies() THEN
    RETURN NEW;
  END IF;
  IF (NEW.correct_option IS DISTINCT FROM OLD.correct_option
      OR NEW.option_a IS DISTINCT FROM OLD.option_a
      OR NEW.option_b IS DISTINCT FROM OLD.option_b
      OR NEW.option_c IS DISTINCT FROM OLD.option_c
      OR NEW.option_d IS DISTINCT FROM OLD.option_d
      OR NEW.option_a_image_url IS DISTINCT FROM OLD.option_a_image_url
      OR NEW.option_b_image_url IS DISTINCT FROM OLD.option_b_image_url
      OR NEW.option_c_image_url IS DISTINCT FROM OLD.option_c_image_url
      OR NEW.option_d_image_url IS DISTINCT FROM OLD.option_d_image_url)
     AND EXISTS (
       SELECT 1 FROM public.test_questions tq
       WHERE tq.question_id = OLD.id AND public.is_test_live_locked(tq.test_id, true)
     ) THEN
    RAISE EXCEPTION 'The answer key of a question in a running Live Test cannot be changed'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

-- Student RPCs: same bodies as before, plus option{A..D}ImageUrl.
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
            'optionAImageUrl', q.option_a_image_url,
            'optionBImageUrl', q.option_b_image_url,
            'optionCImageUrl', q.option_c_image_url,
            'optionDImageUrl', q.option_d_image_url,
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

CREATE OR REPLACE FUNCTION public.get_public_seo_questions(p_subject_id text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_questions JSONB;
    v_safe_limit INT;
BEGIN
    v_safe_limit := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 2000);

    SELECT jsonb_agg(q_row)
    INTO v_questions
    FROM (
        SELECT jsonb_build_object(
            'id', q.id,
            'subjectId', q.subject_id,
            'subjectName', s.name,
            'chapterId', q.chapter_id,
            'chapterName', c.name,
            'topicId', COALESCE(q.topic_id, q.chapter_id),
            'topicName', c.name,
            'questionText', q.question_text,
            'questionBengaliText', q.question_bengali_text,
            'imageUrl', q.image_url,
            'optionA', q.option_a,
            'optionB', q.option_b,
            'optionC', q.option_c,
            'optionD', q.option_d,
            'optionAImageUrl', q.option_a_image_url,
            'optionBImageUrl', q.option_b_image_url,
            'optionCImageUrl', q.option_c_image_url,
            'optionDImageUrl', q.option_d_image_url,
            'difficulty', COALESCE(q.difficulty, 'medium'),
            'defaultMarks', COALESCE(q.default_marks, 1.0),
            'defaultNegativeMarks', COALESCE(q.default_negative_marks, 0),
            'questionType', COALESCE(q.question_type, 'mcq'),
            'sourceType', COALESCE(q.source_type, 'topic'),
            'sourceYear', q.source_year,
            'sourceExam', q.source_exam,
            'sourcePaper', q.source_paper,
            'sourceShift', q.source_shift,
            'isActive', q.is_active,
            'status', COALESCE(q.status, 'active')
        ) AS q_row
        FROM public.questions q
        LEFT JOIN public.subjects s ON s.id = q.subject_id
        LEFT JOIN public.chapters c ON c.id = COALESCE(q.chapter_id, q.topic_id)
        WHERE q.is_active = true
          AND COALESCE(q.status, 'active') = 'active'
          AND (p_subject_id IS NULL OR p_subject_id = '' OR q.subject_id = p_subject_id)
          AND (
              p_search IS NULL
              OR p_search = ''
              OR q.question_text ILIKE '%' || p_search || '%'
              OR q.question_bengali_text ILIKE '%' || p_search || '%'
          )
          AND NOT public.is_question_live_hidden(q.id, q.is_live_only)
        ORDER BY q.created_at DESC NULLS LAST
        LIMIT v_safe_limit
    ) sub;

    RETURN COALESCE(v_questions, '[]'::JSONB);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_seo_question_by_id(p_question_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_question JSONB;
BEGIN
    IF p_question_id IS NULL OR p_question_id = '' THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'id', q.id,
        'subjectId', q.subject_id,
        'subjectName', s.name,
        'chapterId', q.chapter_id,
        'chapterName', c.name,
        'topicId', COALESCE(q.topic_id, q.chapter_id),
        'topicName', c.name,
        'questionText', q.question_text,
        'questionBengaliText', q.question_bengali_text,
        'imageUrl', q.image_url,
        'optionA', q.option_a,
        'optionB', q.option_b,
        'optionC', q.option_c,
        'optionD', q.option_d,
        'optionAImageUrl', q.option_a_image_url,
        'optionBImageUrl', q.option_b_image_url,
        'optionCImageUrl', q.option_c_image_url,
        'optionDImageUrl', q.option_d_image_url,
        'difficulty', COALESCE(q.difficulty, 'medium'),
        'defaultMarks', COALESCE(q.default_marks, 1.0),
        'defaultNegativeMarks', COALESCE(q.default_negative_marks, 0),
        'questionType', COALESCE(q.question_type, 'mcq'),
        'sourceType', COALESCE(q.source_type, 'topic'),
        'sourceYear', q.source_year,
        'sourceExam', q.source_exam,
        'sourcePaper', q.source_paper,
        'sourceShift', q.source_shift,
        'isActive', q.is_active,
        'status', COALESCE(q.status, 'active')
    )
    INTO v_question
    FROM public.questions q
    LEFT JOIN public.subjects s ON s.id = q.subject_id
    LEFT JOIN public.chapters c ON c.id = COALESCE(q.chapter_id, q.topic_id)
    WHERE q.id::text = p_question_id
      AND q.is_active = true
      AND COALESCE(q.status, 'active') = 'active'
      AND NOT public.is_question_live_hidden(q.id, q.is_live_only)
    LIMIT 1;

    RETURN v_question;
END;
$function$;
