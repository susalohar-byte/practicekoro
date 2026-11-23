-- Prelims / Mains as a real column on tests, instead of guessing it from the title.
--
-- Some exams are held in two stages (Prelims and Mains / Final Written); most have one paper.
-- tests.stage is 'prelims', 'mains' or NULL (single-paper exam, or not applicable). It is set
-- from the admin panel (Create Test, test Settings) for Full Mock and PYQ tests, and read by
-- the student app and web for their Prelims / Mains filter.
--
-- Backward compatible: nullable, no default. Older app versions ignore the column and keep
-- reading paper_name / title, which the admin panel still fills in.

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS stage text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tests_stage_check' AND conrelid = 'public.tests'::regclass
  ) THEN
    ALTER TABLE public.tests
      ADD CONSTRAINT tests_stage_check CHECK (stage IS NULL OR stage IN ('prelims', 'mains'));
  END IF;
END $$;

COMMENT ON COLUMN public.tests.stage IS
  'Exam stage of a Full Mock / PYQ test: prelims, mains, or NULL for single-paper exams.';

-- One-time backfill with the rule the apps used until now: read paper_name first, then the
-- title; a text naming both stages (or neither) gives no stage. "Final Written" / "Final Exam"
-- is the Mains paper of exams such as WBP Constable. Only rows that have no stage yet.
WITH detected AS (
  SELECT
    t.id,
    src.txt ~* '\yprelim(s|inary|inaries)?\y|প্রিলি' AS is_prelims,
    src.txt ~* '\ymains?\y|\yfinal\s+(written|exam)\y|মেইন|মেন্স|ফাইনাল' AS is_mains,
    src.ord
  FROM public.tests t
  CROSS JOIN LATERAL (
    VALUES (1, NULLIF(btrim(t.paper_name), '')), (2, NULLIF(btrim(t.title), ''))
  ) AS src(ord, txt)
  WHERE t.stage IS NULL
    AND t.test_type IN ('full_mock', 'pyq')
    AND src.txt IS NOT NULL
),
first_match AS (
  -- The first text (paper_name, then title) that names exactly one stage wins.
  SELECT DISTINCT ON (id)
    id,
    CASE WHEN is_prelims THEN 'prelims' ELSE 'mains' END AS stage
  FROM detected
  WHERE is_prelims <> is_mains
  ORDER BY id, ord
)
UPDATE public.tests t
SET stage = f.stage
FROM first_match f
WHERE t.id = f.id;

CREATE INDEX IF NOT EXISTS tests_exam_stage_idx
  ON public.tests (exam_id, stage)
  WHERE stage IS NOT NULL;
