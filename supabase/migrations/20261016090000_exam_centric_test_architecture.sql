-- Exam-centric test architecture (Admin Panel phase 1).
-- Additive and backward compatible: no table, column, row or existing policy is dropped.
--
-- 1. exam_subjects: Exam -> Subject mapping (exam_topics already maps Exam -> Topic).
--    A subject can now be assigned to an exam even before any of its topics are.
-- 2. admin_save_exam_subject_topics: atomic replace of one exam's subject + topic
--    mappings. Only mapping rows change; subjects, chapters and tests are never touched.
-- 3. tests_type_required_links (NOT VALID): new/updated tests must carry the links their
--    type needs (Full Mock / PYQ -> exam, Topic Test -> topic). Existing rows are not
--    re-validated, so legacy data keeps working.
-- 4. Live Tests may only be created from (or re-pointed at) a Full Mock test.
--
-- Rollback: see docs/exam-centric-architecture.md ("Rollback").
BEGIN;

-- 1. exam_subjects -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam_id ON public.exam_subjects(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_subject_id ON public.exam_subjects(subject_id);

ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view exam_subjects" ON public.exam_subjects;
CREATE POLICY "Anyone can view exam_subjects" ON public.exam_subjects
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage exam_subjects" ON public.exam_subjects;
CREATE POLICY "Admins can manage exam_subjects" ON public.exam_subjects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Same restrictive staff-scope guards as exam_topics / test_exams.
DROP POLICY IF EXISTS staff_content_insert ON public.exam_subjects;
CREATE POLICY staff_content_insert ON public.exam_subjects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_update ON public.exam_subjects;
CREATE POLICY staff_content_update ON public.exam_subjects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_scope_allowed('content')) WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_delete ON public.exam_subjects;
CREATE POLICY staff_content_delete ON public.exam_subjects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_scope_allowed('content'));

GRANT SELECT ON public.exam_subjects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exam_subjects TO authenticated;
GRANT ALL ON public.exam_subjects TO service_role;

DROP TRIGGER IF EXISTS audit_privileged_mutation ON public.exam_subjects;
CREATE TRIGGER audit_privileged_mutation BEFORE INSERT OR UPDATE OR DELETE ON public.exam_subjects
  FOR EACH ROW EXECUTE FUNCTION public.audit_privileged_mutation();

-- Backfill from the two relationships that already exist: subjects.exam_id and the
-- parent subjects of topics already mapped in exam_topics.
INSERT INTO public.exam_subjects (exam_id, subject_id, order_index)
SELECT s.exam_id, s.id, s.order_index
FROM public.subjects s
JOIN public.exams e ON e.id = s.exam_id
ON CONFLICT (exam_id, subject_id) DO NOTHING;

INSERT INTO public.exam_subjects (exam_id, subject_id, order_index)
SELECT DISTINCT et.exam_id, c.subject_id, 0
FROM public.exam_topics et
JOIN public.chapters c ON c.id = et.topic_id
ON CONFLICT (exam_id, subject_id) DO NOTHING;

-- 2. Atomic mapping save ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_save_exam_subject_topics(
  p_exam_id text, p_subject_ids text[], p_topic_ids text[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.can_mutate_admin_record('exams') THEN
    RAISE EXCEPTION 'Exam-management privileges required' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.exams WHERE id = p_exam_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exam not found'; END IF;

  IF p_subject_ids IS NULL OR p_topic_ids IS NULL THEN
    RAISE EXCEPTION 'Subject and topic lists are required';
  END IF;
  IF cardinality(p_subject_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_subject_ids) x)
     OR EXISTS (SELECT 1 FROM unnest(p_subject_ids) x WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = x)) THEN
    RAISE EXCEPTION 'Invalid subject IDs';
  END IF;
  IF cardinality(p_topic_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_topic_ids) x)
     OR EXISTS (SELECT 1 FROM unnest(p_topic_ids) x WHERE NOT EXISTS (SELECT 1 FROM public.chapters WHERE id = x)) THEN
    RAISE EXCEPTION 'Invalid topic IDs';
  END IF;
  -- Every mapped topic must sit under a mapped subject, so deselecting a subject
  -- consistently removes its topic mappings.
  IF EXISTS (
    SELECT 1 FROM unnest(p_topic_ids) x JOIN public.chapters c ON c.id = x
    WHERE NOT (c.subject_id = ANY (p_subject_ids))
  ) THEN
    RAISE EXCEPTION 'Each topic must belong to a selected subject';
  END IF;

  -- Mapping rows only. Subjects, topics and tests are never deleted here.
  DELETE FROM public.exam_subjects WHERE exam_id = p_exam_id;
  INSERT INTO public.exam_subjects (exam_id, subject_id, order_index)
  SELECT p_exam_id, x, n FROM unnest(p_subject_ids) WITH ORDINALITY a(x, n);

  DELETE FROM public.exam_topics WHERE exam_id = p_exam_id;
  INSERT INTO public.exam_topics (exam_id, topic_id, order_index)
  SELECT p_exam_id, x, n FROM unnest(p_topic_ids) WITH ORDINALITY a(x, n);

  RETURN jsonb_build_object(
    'success', true,
    'subject_count', cardinality(p_subject_ids),
    'topic_count', cardinality(p_topic_ids)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_exam_subject_topics(text, text[], text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_exam_subject_topics(text, text[], text[]) TO authenticated;

-- 3. Required links per test type (new writes only) ---------------------------
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_type_required_links;
ALTER TABLE public.tests ADD CONSTRAINT tests_type_required_links CHECK (
  (test_type NOT IN ('full_mock', 'pyq') OR exam_id IS NOT NULL)
  AND (test_type <> 'topic' OR chapter_id IS NOT NULL)
) NOT VALID;

-- 4. Live Tests reference Full Mock tests only ---------------------------------
CREATE OR REPLACE FUNCTION public.enforce_live_test_full_mock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_type text;
BEGIN
  SELECT test_type INTO v_type FROM public.tests WHERE id = NEW.test_id;
  IF v_type IS DISTINCT FROM 'full_mock' THEN
    RAISE EXCEPTION 'Live Tests can only be scheduled from a Full Mock test' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_live_test_full_mock() FROM PUBLIC, anon, authenticated;

-- Fires only on insert or when test_id changes, so existing legacy rows are untouched.
DROP TRIGGER IF EXISTS enforce_live_test_full_mock ON public.live_tests;
CREATE TRIGGER enforce_live_test_full_mock
  BEFORE INSERT OR UPDATE OF test_id ON public.live_tests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_live_test_full_mock();

COMMIT;
