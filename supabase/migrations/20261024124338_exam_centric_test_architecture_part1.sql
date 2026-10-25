-- ============================================================================
-- Migration: 20261024124338_exam_centric_test_architecture_part1.sql
-- Exam -> Subject mapping, test link constraint, Live Test Full Mock trigger.
-- Body below is byte-identical to the SQL recorded for this version in
-- production supabase_migrations.schema_migrations (md5 78c55ca4a969a99c71f440d06f2bb3dd).
-- ============================================================================

-- Part 1 of supabase/migrations/20261016090000_exam_centric_test_architecture.sql
-- (everything except admin_save_exam_subject_topics), without DROP statements.

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
CREATE POLICY "Anyone can view exam_subjects" ON public.exam_subjects
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage exam_subjects" ON public.exam_subjects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY staff_content_insert ON public.exam_subjects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_scope_allowed('content'));
CREATE POLICY staff_content_update ON public.exam_subjects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_scope_allowed('content')) WITH CHECK (public.admin_scope_allowed('content'));

GRANT SELECT ON public.exam_subjects TO anon, authenticated;
GRANT INSERT, UPDATE ON public.exam_subjects TO authenticated;
GRANT ALL ON public.exam_subjects TO service_role;

CREATE OR REPLACE TRIGGER audit_privileged_mutation BEFORE INSERT OR UPDATE ON public.exam_subjects
  FOR EACH ROW EXECUTE FUNCTION public.audit_privileged_mutation();

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_type_required_links') THEN
    ALTER TABLE public.tests ADD CONSTRAINT tests_type_required_links CHECK (
      (test_type NOT IN ('full_mock', 'pyq') OR exam_id IS NOT NULL)
      AND (test_type <> 'topic' OR chapter_id IS NOT NULL)
    ) NOT VALID;
  END IF;
END $$;

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

CREATE OR REPLACE TRIGGER enforce_live_test_full_mock
  BEFORE INSERT OR UPDATE OF test_id ON public.live_tests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_live_test_full_mock();

NOTIFY pgrst, 'reload schema';
