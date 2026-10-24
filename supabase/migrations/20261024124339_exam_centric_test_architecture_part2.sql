-- ============================================================================
-- Migration: 20261024124339_exam_centric_test_architecture_part2.sql
-- Part 2 of the exam-centric architecture: exam_subjects delete policy, DELETE
-- audit trigger and admin_save_exam_subject_topics(). It was run in production
-- from the SQL Editor right after part 1, so production's migration history has
-- no row for this version; `supabase db push` will record it. Every statement
-- is idempotent, so that re-run changes nothing.
-- ============================================================================

BEGIN;

-- Staff may remove mapping rows (same restrictive guard as exam_topics).
-- Created only if missing, so this file can be run again safely.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'exam_subjects'
       AND policyname = 'staff_content_delete'
  ) THEN
    CREATE POLICY staff_content_delete ON public.exam_subjects AS RESTRICTIVE FOR DELETE TO authenticated
      USING (public.admin_scope_allowed('content'));
  END IF;
END $$;
GRANT DELETE ON public.exam_subjects TO authenticated;

-- Audit trigger also on DELETE
CREATE OR REPLACE TRIGGER audit_privileged_mutation BEFORE INSERT OR UPDATE OR DELETE ON public.exam_subjects
  FOR EACH ROW EXECUTE FUNCTION public.audit_privileged_mutation();

-- Atomic save of one exam's Subject + Topic mappings (Exams page -> mapping editor).
-- Only mapping rows change; subjects, topics and tests are never deleted.
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
  IF EXISTS (
    SELECT 1 FROM unnest(p_topic_ids) x JOIN public.chapters c ON c.id = x
    WHERE NOT (c.subject_id = ANY (p_subject_ids))
  ) THEN
    RAISE EXCEPTION 'Each topic must belong to a selected subject';
  END IF;

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

COMMIT;

NOTIFY pgrst, 'reload schema';
