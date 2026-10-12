-- Content architecture: Exams <-> Subjects/Topics, Test Series <-> Tests, test-type rules.
--
-- Principles: Subjects and Topics (chapters) are created once on their own pages and only
-- *assigned* to exams; Test Series reference existing tests (many-to-many, ordered); test
-- type rules live in the database. Nothing here deletes subjects, topics, tests, questions
-- or series. Backfills only copy relationships that already exist explicitly.
-- Re-applying this migration is safe.
BEGIN;

-- ============================================================================
-- 1. Exam <-> Subject (many-to-many)
-- ============================================================================
-- Same shape as exam_topics/test_exams (surrogate id + unique pair).
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id text NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_subjects_exam_subject_key UNIQUE (exam_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_subject ON public.exam_subjects (subject_id);

-- Backfill A: legacy exam-owned subjects (subjects.exam_id) are explicit assignments.
INSERT INTO public.exam_subjects (exam_id, subject_id, order_index)
SELECT s.exam_id, s.id, s.order_index
FROM public.subjects s
WHERE s.exam_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill B: an exam that already has a topic assigned (exam_topics) necessarily covers
-- that topic's parent subject; chapters.subject_id is a NOT NULL FK, so this is exact.
INSERT INTO public.exam_subjects (exam_id, subject_id)
SELECT DISTINCT et.exam_id, c.subject_id
FROM public.exam_topics et
JOIN public.chapters c ON c.id = et.topic_id
ON CONFLICT DO NOTHING;

-- Legacy writers that still set subjects.exam_id (scoped creation on the Subjects page)
-- keep producing a matching assignment.
CREATE OR REPLACE FUNCTION public.sync_subject_exam_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NEW.exam_id IS NOT NULL THEN
    INSERT INTO public.exam_subjects (exam_id, subject_id, order_index)
    VALUES (NEW.exam_id, NEW.id, NEW.order_index)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_subject_exam_assignment() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_subject_exam_assignment ON public.subjects;
CREATE TRIGGER sync_subject_exam_assignment AFTER INSERT OR UPDATE OF exam_id ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.sync_subject_exam_assignment();

-- ============================================================================
-- 2. Exam <-> Topic integrity (reuses existing exam_topics)
-- ============================================================================
-- A topic may be assigned to an exam only when its parent subject is assigned to it.
CREATE OR REPLACE FUNCTION public.guard_exam_topic_parent()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.exam_subjects es ON es.subject_id = c.subject_id AND es.exam_id = NEW.exam_id
    WHERE c.id = NEW.topic_id
  ) THEN
    RAISE EXCEPTION 'Assign the topic''s subject to this exam before assigning the topic'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_exam_topic_parent() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_exam_topic_parent ON public.exam_topics;
CREATE TRIGGER guard_exam_topic_parent BEFORE INSERT OR UPDATE OF exam_id, topic_id ON public.exam_topics
FOR EACH ROW EXECUTE FUNCTION public.guard_exam_topic_parent();

-- Unassigning a subject from an exam removes that exam's assignments for the subject's
-- topics. The subject and topic records themselves are untouched.
CREATE OR REPLACE FUNCTION public.cascade_exam_subject_unassign()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  DELETE FROM public.exam_topics et
  USING public.chapters c
  WHERE et.exam_id = OLD.exam_id AND c.id = et.topic_id AND c.subject_id = OLD.subject_id;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.cascade_exam_subject_unassign() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS cascade_exam_subject_unassign ON public.exam_subjects;
CREATE TRIGGER cascade_exam_subject_unassign AFTER DELETE ON public.exam_subjects
FOR EACH ROW EXECUTE FUNCTION public.cascade_exam_subject_unassign();

-- Moving a topic to another subject (Topics page) drops exam assignments that would no
-- longer satisfy the parent rule, instead of leaving them inconsistent.
CREATE OR REPLACE FUNCTION public.prune_exam_topics_on_reparent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NEW.subject_id IS DISTINCT FROM OLD.subject_id THEN
    DELETE FROM public.exam_topics et
    WHERE et.topic_id = NEW.id
      AND NOT EXISTS (
        SELECT 1 FROM public.exam_subjects es
        WHERE es.exam_id = et.exam_id AND es.subject_id = NEW.subject_id
      );
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.prune_exam_topics_on_reparent() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS prune_exam_topics_on_reparent ON public.chapters;
CREATE TRIGGER prune_exam_topics_on_reparent AFTER UPDATE OF subject_id ON public.chapters
FOR EACH ROW EXECUTE FUNCTION public.prune_exam_topics_on_reparent();

-- Atomic save for the Exam form's "Assigned Subjects & Topics" section.
CREATE OR REPLACE FUNCTION public.admin_save_exam_curriculum(
  p_exam_id text, p_subject_ids text[], p_topic_ids text[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_bad text;
BEGIN
  IF NOT public.can_mutate_admin_record('exams') THEN
    RAISE EXCEPTION 'Exam-management privileges required' USING ERRCODE = '42501';
  END IF;
  p_subject_ids := coalesce(p_subject_ids, '{}');
  p_topic_ids := coalesce(p_topic_ids, '{}');
  PERFORM 1 FROM public.exams WHERE id = p_exam_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exam not found'; END IF;

  IF cardinality(p_subject_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_subject_ids) x)
     OR cardinality(p_topic_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_topic_ids) x) THEN
    RAISE EXCEPTION 'Duplicate subject or topic IDs' USING ERRCODE = '22023';
  END IF;
  SELECT x INTO v_bad FROM unnest(p_subject_ids) x
  WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = x) LIMIT 1;
  IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'Subject % does not exist', v_bad USING ERRCODE = '22023'; END IF;
  SELECT x INTO v_bad FROM unnest(p_topic_ids) x
  WHERE NOT EXISTS (SELECT 1 FROM public.chapters WHERE id = x) LIMIT 1;
  IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'Topic % does not exist', v_bad USING ERRCODE = '22023'; END IF;
  SELECT c.name INTO v_bad FROM unnest(p_topic_ids) x JOIN public.chapters c ON c.id = x
  WHERE c.subject_id <> ALL (p_subject_ids) LIMIT 1;
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Topic "%" belongs to a subject that is not selected', v_bad USING ERRCODE = '23514';
  END IF;

  -- Topics first so the unassign cascade has nothing left to remove for kept subjects.
  DELETE FROM public.exam_topics WHERE exam_id = p_exam_id AND topic_id <> ALL (p_topic_ids);
  DELETE FROM public.exam_subjects WHERE exam_id = p_exam_id AND subject_id <> ALL (p_subject_ids);
  INSERT INTO public.exam_subjects (exam_id, subject_id, order_index)
  SELECT p_exam_id, x, n FROM unnest(p_subject_ids) WITH ORDINALITY a(x, n)
  ON CONFLICT (exam_id, subject_id) DO UPDATE SET order_index = EXCLUDED.order_index;
  INSERT INTO public.exam_topics (exam_id, topic_id, order_index)
  SELECT p_exam_id, x, n FROM unnest(p_topic_ids) WITH ORDINALITY a(x, n)
  ON CONFLICT (exam_id, topic_id) DO UPDATE SET order_index = EXCLUDED.order_index;

  RETURN jsonb_build_object('success', true, 'exam_id', p_exam_id,
    'subject_count', cardinality(p_subject_ids), 'topic_count', cardinality(p_topic_ids));
END $$;
REVOKE ALL ON FUNCTION public.admin_save_exam_curriculum(text, text[], text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_exam_curriculum(text, text[], text[]) TO authenticated;

ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_subjects FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.exam_subjects TO anon, authenticated;
GRANT ALL ON public.exam_subjects TO service_role;
DROP POLICY IF EXISTS exam_subjects_read ON public.exam_subjects;
-- Same visibility as exam_topics; writes only through admin_save_exam_curriculum.
CREATE POLICY exam_subjects_read ON public.exam_subjects FOR SELECT TO anon, authenticated USING (true);

-- ============================================================================
-- 3. Test Series <-> Tests (many-to-many, ordered)
-- ============================================================================
-- Topic/subject collections need not target an exam.
ALTER TABLE public.test_series ALTER COLUMN exam_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.test_series_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id text NOT NULL REFERENCES public.test_series(id) ON DELETE CASCADE,
  test_id text NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT test_series_tests_series_test_key UNIQUE (series_id, test_id)
);
CREATE INDEX IF NOT EXISTS idx_test_series_tests_test ON public.test_series_tests (test_id);
CREATE INDEX IF NOT EXISTS idx_test_series_tests_order ON public.test_series_tests (series_id, order_index);

-- Backfill from the legacy single-series column, keeping the existing display order.
INSERT INTO public.test_series_tests (series_id, test_id, order_index)
SELECT t.test_series_id, t.id,
       row_number() OVER (PARTITION BY t.test_series_id ORDER BY t.order_index, t.id)
FROM public.tests t
WHERE t.test_series_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- tests.test_series_id is kept as the test's *primary* series (result-page rankings and
-- the per-test series leaderboard use it). It always points at one of the memberships.
CREATE OR REPLACE FUNCTION public.sync_primary_series_on_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tests SET test_series_id = NEW.series_id
    WHERE id = NEW.test_id AND test_series_id IS NULL;
    RETURN NEW;
  END IF;
  UPDATE public.tests t SET test_series_id = (
    SELECT m.series_id FROM public.test_series_tests m
    WHERE m.test_id = OLD.test_id ORDER BY m.created_at, m.series_id LIMIT 1
  )
  WHERE t.id = OLD.test_id AND t.test_series_id = OLD.series_id;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.sync_primary_series_on_membership() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_primary_series_on_membership ON public.test_series_tests;
CREATE TRIGGER sync_primary_series_on_membership AFTER INSERT OR DELETE ON public.test_series_tests
FOR EACH ROW EXECUTE FUNCTION public.sync_primary_series_on_membership();

-- Legacy writers that set tests.test_series_id directly still create a membership.
CREATE OR REPLACE FUNCTION public.sync_membership_from_primary_series()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NEW.test_series_id IS NOT NULL THEN
    INSERT INTO public.test_series_tests (series_id, test_id, order_index)
    SELECT NEW.test_series_id, NEW.id,
           coalesce((SELECT max(order_index) FROM public.test_series_tests WHERE series_id = NEW.test_series_id), 0) + 1
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_membership_from_primary_series() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_membership_from_primary_series ON public.tests;
CREATE TRIGGER sync_membership_from_primary_series AFTER INSERT OR UPDATE OF test_series_id ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.sync_membership_from_primary_series();

-- Series compatibility rule: when a series targets an exam, Full Mocks and Official PYQs
-- must be linked to that exam (exam_id or test_exams). Topic Tests are always allowed.
-- Returns NULL when compatible, otherwise a human-readable reason.
CREATE OR REPLACE FUNCTION public.series_test_incompatibility(p_series_id text, p_test_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
  SELECT CASE
    WHEN s.exam_id IS NULL OR t.test_type NOT IN ('full_mock', 'pyq') THEN NULL
    WHEN t.exam_id = s.exam_id
      OR EXISTS (SELECT 1 FROM public.test_exams te WHERE te.test_id = t.id AND te.exam_id = s.exam_id)
      THEN NULL
    ELSE format('"%s" is a %s for a different exam than this series targets',
                t.title, CASE t.test_type WHEN 'pyq' THEN 'Official PYQ' ELSE 'Full Mock' END)
  END
  FROM public.test_series s, public.tests t
  WHERE s.id = p_series_id AND t.id = p_test_id
$$;
REVOKE ALL ON FUNCTION public.series_test_incompatibility(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.series_test_incompatibility(text, text) TO authenticated;

-- Replace a series' test list (add, remove and reorder in one atomic save).
CREATE OR REPLACE FUNCTION public.admin_set_series_tests(p_series_id text, p_test_ids text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_reason text; v_missing text;
BEGIN
  IF NOT public.can_mutate_admin_record('tests') THEN
    RAISE EXCEPTION 'Test-management privileges required' USING ERRCODE = '42501';
  END IF;
  p_test_ids := coalesce(p_test_ids, '{}');
  PERFORM 1 FROM public.test_series WHERE id = p_series_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Series not found'; END IF;
  IF cardinality(p_test_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_test_ids) x) THEN
    RAISE EXCEPTION 'A test can appear only once in a series' USING ERRCODE = '23505';
  END IF;
  SELECT x INTO v_missing FROM unnest(p_test_ids) x
  WHERE NOT EXISTS (SELECT 1 FROM public.tests WHERE id = x) LIMIT 1;
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'Test % no longer exists', v_missing; END IF;
  SELECT r INTO v_reason FROM (
    SELECT public.series_test_incompatibility(p_series_id, x) r FROM unnest(p_test_ids) x
  ) q WHERE r IS NOT NULL LIMIT 1;
  IF v_reason IS NOT NULL THEN RAISE EXCEPTION '%', v_reason USING ERRCODE = '23514'; END IF;

  DELETE FROM public.test_series_tests WHERE series_id = p_series_id AND test_id <> ALL (p_test_ids);
  INSERT INTO public.test_series_tests (series_id, test_id, order_index)
  SELECT p_series_id, x, n FROM unnest(p_test_ids) WITH ORDINALITY a(x, n)
  ON CONFLICT (series_id, test_id) DO UPDATE SET order_index = EXCLUDED.order_index;
  UPDATE public.test_series SET updated_at = now() WHERE id = p_series_id;
  RETURN jsonb_build_object('success', true, 'series_id', p_series_id, 'test_count', cardinality(p_test_ids));
END $$;
REVOKE ALL ON FUNCTION public.admin_set_series_tests(text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_series_tests(text, text[]) TO authenticated;

-- Legacy RPC keeps its signature: with a series it now *adds* memberships (a test may be in
-- several series); with NULL it removes the tests from every series. Tests are never deleted.
CREATE OR REPLACE FUNCTION public.admin_assign_series_tests(p_ids text[], p_series_id text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_count integer; v_reason text;
BEGIN
  IF NOT public.can_mutate_admin_record('tests') THEN
    RAISE EXCEPTION 'Test-management privileges required' USING ERRCODE = '42501';
  END IF;
  IF p_ids IS NULL OR cardinality(p_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_ids) x) THEN
    RAISE EXCEPTION 'Unique test IDs required';
  END IF;
  SELECT count(*) INTO v_count FROM public.tests WHERE id = ANY (p_ids);
  IF v_count <> cardinality(p_ids) THEN RAISE EXCEPTION 'One or more tests no longer exist'; END IF;
  IF p_series_id IS NULL THEN
    DELETE FROM public.test_series_tests WHERE test_id = ANY (p_ids);
  ELSE
    PERFORM 1 FROM public.test_series WHERE id = p_series_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Series not found'; END IF;
    SELECT r INTO v_reason FROM (
      SELECT public.series_test_incompatibility(p_series_id, x) r FROM unnest(p_ids) x
    ) q WHERE r IS NOT NULL LIMIT 1;
    IF v_reason IS NOT NULL THEN RAISE EXCEPTION '%', v_reason USING ERRCODE = '23514'; END IF;
    INSERT INTO public.test_series_tests (series_id, test_id, order_index)
    SELECT p_series_id, x,
           coalesce((SELECT max(order_index) FROM public.test_series_tests WHERE series_id = p_series_id), 0) + n
    FROM unnest(p_ids) WITH ORDINALITY a(x, n)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('success', true, 'saved_ids', to_jsonb(p_ids));
END $$;
REVOKE ALL ON FUNCTION public.admin_assign_series_tests(text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_series_tests(text[], text) TO authenticated;

ALTER TABLE public.test_series_tests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.test_series_tests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.test_series_tests TO anon, authenticated;
GRANT ALL ON public.test_series_tests TO service_role;
DROP POLICY IF EXISTS test_series_tests_read ON public.test_series_tests;
-- Students see a membership only when both the series and the test are published.
CREATE POLICY test_series_tests_read ON public.test_series_tests FOR SELECT TO anon, authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (SELECT 1 FROM public.test_series s
            WHERE s.id = series_id AND s.is_active AND coalesce(s.status, 'published') = 'published')
    AND EXISTS (SELECT 1 FROM public.tests t
                WHERE t.id = test_id AND t.is_active AND t.status = 'published')
  )
);

-- Series visibility: status is authoritative; is_active mirrors it.
CREATE OR REPLACE FUNCTION public.sync_series_active_from_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NEW.status IS NOT NULL THEN
    NEW.is_active := (NEW.status = 'published');
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_series_active_from_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_series_active_from_status ON public.test_series;
CREATE TRIGGER sync_series_active_from_status BEFORE INSERT OR UPDATE OF status, is_active ON public.test_series
FOR EACH ROW EXECUTE FUNCTION public.sync_series_active_from_status();

DROP POLICY IF EXISTS "Public read active test series" ON public.test_series;
CREATE POLICY "Public read active test series" ON public.test_series FOR SELECT
USING ((is_active = true AND coalesce(status, 'published') = 'published') OR public.has_role(auth.uid(), 'admin'));

-- Series analytics now follow memberships instead of the single primary-series column.
CREATE OR REPLACE FUNCTION public.get_test_series_analytics(p_series_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_report JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.test_series WHERE id = p_series_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Test series not found' USING ERRCODE = '40400';
    END IF;

    WITH series_tests AS (
        SELECT t.id, t.title, t.test_type, t.total_marks
        FROM public.tests t
        WHERE EXISTS (SELECT 1 FROM public.test_series_tests sst WHERE sst.series_id = p_series_id AND sst.test_id = t.id)
          AND t.is_active = TRUE
          AND t.status = 'published'
    ),
    all_attempts AS (
        SELECT
            a.id AS attempt_id,
            a.test_id,
            t.title AS test_title,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM public.live_test_participants lp
                    WHERE lp.attempt_id = a.id AND lp.status = 'completed'
                ) THEN 'live_test'
                WHEN t.test_type = 'full_mock' THEN 'full_mock'
                WHEN t.test_type = 'pyq' THEN 'pyq'
                ELSE 'topic_test'
            END AS report_type,
            COALESCE(tr.score, a.score, 0)::NUMERIC AS score,
            COALESCE(tr.total_marks, NULLIF(a.total_marks, 0), t.total_marks, 0)::NUMERIC AS total_marks,
            COALESCE(
                tr.percentage,
                CASE WHEN COALESCE(tr.total_marks, NULLIF(a.total_marks, 0), t.total_marks, 0) > 0
                    THEN ROUND((COALESCE(tr.score, a.score, 0)::NUMERIC / COALESCE(tr.total_marks, NULLIF(a.total_marks, 0), t.total_marks, 0)) * 100, 2)
                    ELSE 0 END
            )::NUMERIC AS percentage,
            COALESCE(tr.accuracy, a.accuracy, 0)::NUMERIC AS accuracy,
            COALESCE(a.correct_count, 0)::INT AS correct_count,
            COALESCE(a.wrong_count, 0)::INT AS wrong_count,
            COALESCE(a.skipped_count, 0)::INT AS skipped_count,
            COALESCE(a.time_spent_seconds, 0)::INT AS time_spent_seconds,
            COALESCE(a.end_time, a.created_at) AS completed_at
        FROM public.test_attempts a
        JOIN public.tests t ON t.id = a.test_id
        LEFT JOIN public.test_results tr ON tr.attempt_id = a.id
        WHERE a.user_id = v_user_id
          AND a.status = 'completed'
          AND EXISTS (SELECT 1 FROM public.test_series_tests sst WHERE sst.series_id = p_series_id AND sst.test_id = t.id)
          AND t.is_active = TRUE
          AND t.status = 'published'
    ),
    negative_by_attempt AS (
        SELECT aa.attempt_id, ROUND(SUM(GREATEST(-aa.marks_awarded, 0)), 2)::NUMERIC AS negative_marks
        FROM all_attempts a
        JOIN public.attempt_answers aa ON aa.attempt_id = a.attempt_id
        GROUP BY aa.attempt_id
    ),
    attempts AS (
        SELECT a.*, COALESCE(n.negative_marks, 0)::NUMERIC AS negative_marks
        FROM all_attempts a
        LEFT JOIN negative_by_attempt n ON n.attempt_id = a.attempt_id
    ),
    ranked_attempts AS (
        SELECT a.*, ROW_NUMBER() OVER (
            PARTITION BY a.test_id ORDER BY a.completed_at DESC, a.attempt_id DESC
        ) AS attempt_rank
        FROM attempts a
    ),
    latest_attempts AS (
        SELECT * FROM ranked_attempts WHERE attempt_rank = 1
    ),
    latest_answers AS (
        SELECT
            l.attempt_id,
            aa.is_correct,
            COALESCE(q.subject_id, c.subject_id) AS subject_id,
            s.name AS subject_name,
            COALESCE(q.topic_id, q.chapter_id) AS topic_id,
            c.name AS topic_name
        FROM latest_attempts l
        JOIN public.attempt_answers aa ON aa.attempt_id = l.attempt_id
        JOIN public.questions q ON q.id = aa.question_id
        LEFT JOIN public.chapters c ON c.id = COALESCE(q.topic_id, q.chapter_id)
        LEFT JOIN public.subjects s ON s.id = COALESCE(q.subject_id, c.subject_id)
        WHERE aa.selected_option IS NOT NULL
    ),
    subject_stats AS (
        SELECT
            subject_id,
            subject_name,
            COUNT(*)::INT AS questions_attempted,
            COUNT(*) FILTER (WHERE is_correct)::INT AS correct_count
        FROM latest_answers
        WHERE subject_id IS NOT NULL AND subject_name IS NOT NULL
        GROUP BY subject_id, subject_name
    ),
    topic_stats AS (
        SELECT
            topic_id,
            topic_name,
            COALESCE(subject_name, 'Other') AS subject_name,
            COUNT(*)::INT AS questions_attempted,
            COUNT(*) FILTER (WHERE is_correct)::INT AS correct_count
        FROM latest_answers
        WHERE topic_id IS NOT NULL AND topic_name IS NOT NULL
        GROUP BY topic_id, topic_name, COALESCE(subject_name, 'Other')
    ),
    summary AS (
        SELECT
            (SELECT COUNT(*)::INT FROM series_tests) AS total_tests,
            COUNT(*)::INT AS tests_attempted,
            CASE WHEN SUM(total_marks) > 0 THEN ROUND(SUM(score) / SUM(total_marks) * 100, 2) ELSE 0 END AS overall_score_percent,
            COALESCE(ROUND(AVG(percentage), 2), 0) AS average_score_percent,
            CASE WHEN SUM(correct_count + wrong_count) > 0
                THEN ROUND(SUM(correct_count)::NUMERIC / SUM(correct_count + wrong_count) * 100, 2)
                ELSE 0 END AS accuracy_percent,
            COALESCE(MAX(percentage), 0) AS best_score_percent,
            CASE WHEN (SELECT COUNT(*) FROM series_tests) > 0
                THEN ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM series_tests) * 100, 2)
                ELSE 0 END AS completion_percent
        FROM latest_attempts
    ),
    type_stats AS (
        SELECT
            categories.type,
            COUNT(l.attempt_id)::INT AS tests_attempted,
            COALESCE(ROUND(AVG(l.percentage), 2), 0) AS average_score_percent,
            COALESCE(MAX(l.percentage), 0) AS best_score_percent,
            CASE WHEN SUM(l.correct_count + l.wrong_count) > 0
                THEN ROUND(SUM(l.correct_count)::NUMERIC / SUM(l.correct_count + l.wrong_count) * 100, 2)
                ELSE 0 END AS accuracy_percent
        FROM (VALUES ('full_mock'::TEXT), ('pyq'::TEXT), ('topic_test'::TEXT), ('live_test'::TEXT)) categories(type)
        LEFT JOIN latest_attempts l ON l.report_type = categories.type
        GROUP BY categories.type
    )
    SELECT jsonb_build_object(
        'totalTests', summary.total_tests,
        'testsAttempted', summary.tests_attempted,
        'overallScorePercent', summary.overall_score_percent,
        'averageScorePercent', summary.average_score_percent,
        'accuracyPercent', summary.accuracy_percent,
        'bestScorePercent', summary.best_score_percent,
        'completionPercent', summary.completion_percent,
        'testTypeBreakdown', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'type', ts.type,
                'testsAttempted', ts.tests_attempted,
                'averageScorePercent', ts.average_score_percent,
                'bestScorePercent', ts.best_score_percent,
                'accuracyPercent', ts.accuracy_percent
            ) ORDER BY CASE ts.type WHEN 'full_mock' THEN 1 WHEN 'pyq' THEN 2 WHEN 'topic_test' THEN 3 ELSE 4 END)
            FROM type_stats ts
        ), '[]'::JSONB),
        'trend', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'attemptId', a.attempt_id,
                'testTitle', a.test_title,
                'percentage', a.percentage,
                'completedAt', a.completed_at
            ) ORDER BY a.completed_at ASC, a.attempt_id ASC)
            FROM attempts a
        ), '[]'::JSONB),
        'subjects', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'subjectId', ss.subject_id,
                'subjectName', ss.subject_name,
                'questionsAttempted', ss.questions_attempted,
                'correctCount', ss.correct_count,
                'accuracyPercent', ROUND(ss.correct_count::NUMERIC / NULLIF(ss.questions_attempted, 0) * 100, 2)
            ) ORDER BY ss.subject_name)
            FROM subject_stats ss
        ), '[]'::JSONB),
        'weakTopics', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'topicId', ws.topic_id,
                'topicName', ws.topic_name,
                'subjectName', ws.subject_name,
                'questionsAttempted', ws.questions_attempted,
                'accuracyPercent', ROUND(ws.correct_count::NUMERIC / NULLIF(ws.questions_attempted, 0) * 100, 2)
            ) ORDER BY ws.correct_count::NUMERIC / NULLIF(ws.questions_attempted, 0), ws.questions_attempted DESC)
            FROM (
                SELECT * FROM topic_stats
                WHERE questions_attempted >= 3
                  AND correct_count::NUMERIC / NULLIF(questions_attempted, 0) < 0.65
                ORDER BY correct_count::NUMERIC / NULLIF(questions_attempted, 0), questions_attempted DESC
                LIMIT 5
            ) ws
        ), '[]'::JSONB),
        'history', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'attemptId', a.attempt_id,
                'testId', a.test_id,
                'testTitle', a.test_title,
                'testType', a.report_type,
                'score', a.score,
                'totalMarks', a.total_marks,
                'percentage', a.percentage,
                'accuracy', a.accuracy,
                'correctCount', a.correct_count,
                'wrongCount', a.wrong_count,
                'skippedCount', a.skipped_count,
                'negativeMarks', a.negative_marks,
                'timeSpentSeconds', a.time_spent_seconds,
                'completedAt', a.completed_at
            ) ORDER BY a.completed_at DESC, a.attempt_id DESC)
            FROM attempts a
        ), '[]'::JSONB)
    ) INTO v_report
    FROM summary;

    RETURN COALESCE(v_report, '{}'::JSONB);
END;
$$;
REVOKE ALL ON FUNCTION public.get_test_series_analytics(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_series_analytics(TEXT) TO authenticated;

-- ============================================================================
-- 4. Test-type rules (Full Mock, Official PYQ, Topic Test)
-- ============================================================================
-- Full Mock: exam required. Official PYQ: exam + year required. Topic Test: subject + topic
-- required, topic must belong to the subject, exam optional. No new "Subject Test" type.
-- Legacy chapter_mock/subject_mock rows keep working but cannot be created any more.
-- Rules run on insert, when a governing column changes, or when a test is published, so
-- untouched legacy rows are never blocked from being archived or edited cosmetically.
CREATE OR REPLACE FUNCTION public.enforce_test_type_rules()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_topic_subject text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.test_type IS NOT DISTINCT FROM OLD.test_type
     AND NEW.exam_id IS NOT DISTINCT FROM OLD.exam_id
     AND NEW.subject_id IS NOT DISTINCT FROM OLD.subject_id
     AND NEW.chapter_id IS NOT DISTINCT FROM OLD.chapter_id
     AND NEW.year IS NOT DISTINCT FROM OLD.year
     AND NOT (NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.test_type IN ('chapter_mock', 'subject_mock') THEN
    RAISE EXCEPTION 'Create a Topic Test instead; % is a legacy test type', NEW.test_type
      USING ERRCODE = '23514';
  END IF;

  IF NEW.test_type = 'full_mock' THEN
    IF NEW.exam_id IS NULL THEN
      RAISE EXCEPTION 'A Full Mock test must be linked to an exam' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.test_type = 'pyq' THEN
    IF NEW.exam_id IS NULL OR NEW.year IS NULL THEN
      RAISE EXCEPTION 'An Official PYQ needs an exam and an exam year' USING ERRCODE = '23514';
    END IF;
    IF NEW.year NOT BETWEEN 1950 AND 2100 THEN
      RAISE EXCEPTION 'Exam year % is not valid', NEW.year USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.test_type = 'topic' THEN
    IF NEW.subject_id IS NULL OR NEW.chapter_id IS NULL THEN
      RAISE EXCEPTION 'A Topic Test needs a subject and a topic' USING ERRCODE = '23514';
    END IF;
    SELECT subject_id INTO v_topic_subject FROM public.chapters WHERE id = NEW.chapter_id;
    IF v_topic_subject IS DISTINCT FROM NEW.subject_id THEN
      RAISE EXCEPTION 'The selected topic does not belong to the selected subject' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_test_type_rules() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_test_type_rules ON public.tests;
CREATE TRIGGER enforce_test_type_rules BEFORE INSERT OR UPDATE ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.enforce_test_type_rules();

-- New tests start hidden from students until explicitly published.
ALTER TABLE public.tests ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.tests ALTER COLUMN test_type SET DEFAULT 'topic';

-- ============================================================================
-- 5. Student exposure fixes
-- ============================================================================
-- Draft/archived/inactive tests' questions were readable by ID; now only published, active
-- tests (or staff previews) are served.
CREATE OR REPLACE FUNCTION public.get_student_exam_questions(p_test_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_questions JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    IF NOT public.has_role(v_user_id, 'admin') AND NOT EXISTS (
        SELECT 1 FROM public.tests WHERE id = p_test_id AND is_active AND status = 'published'
    ) THEN
        RAISE EXCEPTION 'Test not found' USING ERRCODE = '40400';
    END IF;

    IF NOT public.has_test_access(v_user_id, p_test_id) THEN
        RAISE EXCEPTION 'Forbidden: Active All-Access Pro Pass required' USING ERRCODE = '40300';
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
            'difficulty', q.difficulty,
            'marks', COALESCE(tq.marks, q.default_marks, 1.00),
            'negativeMarks', COALESCE(tq.negative_marks, q.default_negative_marks, 0.25)
        ) ORDER BY tq.question_order ASC
    ) INTO v_questions
    FROM public.test_questions tq
    JOIN public.questions q ON q.id = tq.question_id
    LEFT JOIN public.subjects s ON s.id = q.subject_id
    LEFT JOIN public.chapters c ON c.id = q.chapter_id
    WHERE tq.test_id = p_test_id AND q.is_active = true;

    RETURN COALESCE(v_questions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.get_student_exam_questions(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_exam_questions(TEXT) TO authenticated;

-- test_questions rows (ids, order, marks) of unpublished tests are staff-only.
DROP POLICY IF EXISTS "Test questions readable by authenticated users" ON public.test_questions;
CREATE POLICY "Test questions readable by authenticated users" ON public.test_questions
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_id AND t.is_active AND t.status = 'published')
);

-- ============================================================================
-- 6. Audit the new mapping tables like other content tables
-- ============================================================================
DO $$ DECLARE t text; BEGIN
  IF to_regprocedure('public.audit_privileged_mutation()') IS NOT NULL THEN
    FOREACH t IN ARRAY ARRAY['exam_subjects', 'test_series_tests'] LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS audit_privileged_mutation ON public.%I', t);
      EXECUTE format('CREATE TRIGGER audit_privileged_mutation BEFORE INSERT OR UPDATE OR DELETE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.audit_privileged_mutation()', t);
    END LOOP;
  END IF;
END $$;

COMMIT;
