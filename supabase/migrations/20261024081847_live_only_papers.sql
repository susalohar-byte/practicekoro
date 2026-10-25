-- ============================================================================
-- Migration: 20261024081847_live_only_papers.sql
-- Live Test papers: hidden live-only Full Mock papers (see 20261024120000 note).
-- Body below is byte-identical to the SQL recorded for this version in
-- production supabase_migrations.schema_migrations (md5 53df5dd51420870e8455880823d8a4b0).
-- ============================================================================

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS is_live_only boolean NOT NULL DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_live_only boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_live_only_full_mock') THEN
    ALTER TABLE public.tests
      ADD CONSTRAINT tests_live_only_full_mock CHECK (NOT is_live_only OR test_type = 'full_mock');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tests_is_live_only ON public.tests(is_live_only) WHERE is_live_only;
CREATE INDEX IF NOT EXISTS idx_questions_is_live_only ON public.questions(is_live_only) WHERE is_live_only;

CREATE OR REPLACE FUNCTION public.sync_question_live_only(p_question_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  UPDATE public.questions q
     SET is_live_only = sub.flag
    FROM (SELECT EXISTS (
            SELECT 1 FROM public.test_questions tq
            JOIN public.tests t ON t.id = tq.test_id
           WHERE tq.question_id = p_question_id AND t.is_live_only
          ) AS flag) sub
   WHERE q.id = p_question_id AND q.is_live_only IS DISTINCT FROM sub.flag;
$$;
REVOKE ALL ON FUNCTION public.sync_question_live_only(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_test_questions_sync_live_only()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.sync_question_live_only(NEW.question_id);
  END IF;
  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    PERFORM public.sync_question_live_only(OLD.question_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_test_questions_sync_live_only
AFTER INSERT OR DELETE OR UPDATE OF question_id, test_id ON public.test_questions
FOR EACH ROW EXECUTE FUNCTION public.trg_test_questions_sync_live_only();

CREATE OR REPLACE FUNCTION public.trg_tests_sync_live_only()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_question_id uuid;
BEGIN
  FOR v_question_id IN SELECT question_id FROM public.test_questions WHERE test_id = NEW.id LOOP
    PERFORM public.sync_question_live_only(v_question_id);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_tests_sync_live_only
AFTER UPDATE OF is_live_only ON public.tests
FOR EACH ROW WHEN (OLD.is_live_only IS DISTINCT FROM NEW.is_live_only)
EXECUTE FUNCTION public.trg_tests_sync_live_only();

CREATE OR REPLACE FUNCTION public.guard_live_only_release()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.is_live_only AND NOT NEW.is_live_only AND public.is_test_live_locked(OLD.id) THEN
    RAISE EXCEPTION 'A Live Test paper can be released to practice only after its Live Test has ended'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_guard_live_only_release
BEFORE UPDATE OF is_live_only ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.guard_live_only_release();

CREATE OR REPLACE FUNCTION public.live_paper_visible(p_test_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.live_tests lt
     WHERE lt.test_id = p_test_id AND public.is_live_test_active(lt, true)
  ) OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.test_attempts ta
       WHERE ta.test_id = p_test_id AND ta.user_id = auth.uid()
    )
  );
$$;
REVOKE ALL ON FUNCTION public.live_paper_visible(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_paper_visible(text) TO anon, authenticated;

ALTER POLICY "Public read published tests" ON public.tests USING (
  (is_active = true AND status = 'published'
    AND (is_live_only = false OR public.live_paper_visible(id)))
  OR public.has_role(auth.uid(), 'admin')
);

ALTER POLICY "Test questions readable by authenticated users" ON public.test_questions
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.live_paper_access_error(p_user_id uuid, p_test_id text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF public.has_role(p_user_id, 'admin') THEN
    RETURN NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.test_attempts
     WHERE user_id = p_user_id AND test_id = p_test_id AND status = 'in_progress'
  ) THEN
    RETURN NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM public.tests WHERE id = p_test_id AND is_live_only) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.live_tests lt
       WHERE lt.test_id = p_test_id AND public.is_live_test_active(lt, true)
    ) THEN
      RETURN 'This Live Test is not open right now';
    END IF;
    RETURN NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.live_tests lt
     WHERE lt.test_id = p_test_id
       AND public.is_live_test_active(lt, false)
       AND now() < lt.start_at
  ) THEN
    RETURN 'This test opens when its Live Test starts';
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.live_paper_access_error(uuid, text) FROM PUBLIC, anon, authenticated;

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

CREATE OR REPLACE FUNCTION public.start_test_attempt(p_test_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id UUID;
    v_test RECORD;
    v_has_access BOOLEAN;
    v_live_error TEXT;
    v_attempt_id UUID;
    v_start_time TIMESTAMPTZ;
    v_status TEXT;
    v_time_spent INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    SELECT * INTO v_test
    FROM public.tests
    WHERE id = p_test_id
      AND is_active = true
      AND (status = 'published' OR public.has_role(v_user_id, 'admin'));

    IF NOT FOUND THEN
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

    SELECT id, start_time, status, time_spent_seconds
    INTO v_attempt_id, v_start_time, v_status, v_time_spent
    FROM public.test_attempts
    WHERE user_id = v_user_id AND test_id = p_test_id AND status = 'in_progress'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_attempt_id IS NULL THEN
        INSERT INTO public.test_attempts (
            user_id, test_id, status, start_time, time_spent_seconds, score,
            total_marks, correct_count, wrong_count, skipped_count, accuracy
        )
        VALUES (
            v_user_id, p_test_id, 'in_progress', NOW(), 0, 0.00,
            v_test.total_marks, 0, 0, 0, 0.00
        )
        RETURNING id, start_time INTO v_attempt_id, v_start_time;
    END IF;

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'test_id', p_test_id,
        'start_time', v_start_time,
        'duration_minutes', v_test.duration_minutes,
        'total_questions', v_test.total_questions,
        'total_marks', v_test.total_marks,
        'negative_marking', v_test.negative_marking
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_question_live_hidden(p_question_id uuid, p_is_live_only boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT coalesce(p_is_live_only, false) OR EXISTS (
    SELECT 1 FROM public.test_questions tq
    JOIN public.live_tests lt ON lt.test_id = tq.test_id
    WHERE tq.question_id = p_question_id
      AND coalesce(lt.status, 'upcoming') NOT IN ('ended', 'completed', 'cancelled')
  );
$$;
REVOKE ALL ON FUNCTION public.is_question_live_hidden(uuid, boolean) FROM PUBLIC, anon, authenticated;

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

NOTIFY pgrst, 'reload schema';
