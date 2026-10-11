-- Admin district rankings: real aggregates of completed student attempts grouped by profile district.
-- Gated like the other admin reporting RPCs (admin_scope_allowed); never callable by anon.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_admin_district_rankings(
  p_exam_id text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  district text,
  student_count bigint,
  attempts_count bigint,
  avg_percentage numeric,
  top_student_name text,
  top_student_score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT (public.admin_scope_allowed('content') OR public.admin_scope_allowed('super')) THEN
    RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH scored AS (
    SELECT
      ta.user_id,
      COALESCE(NULLIF(lower(btrim(p.district)), ''), '') AS district_key,
      NULLIF(btrim(p.district), '') AS district_label,
      p.full_name,
      CASE
        WHEN COALESCE(NULLIF(ta.total_marks, 0), NULLIF(t.total_marks, 0)) > 0
          THEN ta.score * 100.0 / COALESCE(NULLIF(ta.total_marks, 0), NULLIF(t.total_marks, 0))
        ELSE NULL
      END AS pct
    FROM public.test_attempts ta
    JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
    JOIN public.tests t ON t.id = ta.test_id
    WHERE ta.status = 'completed'
      AND (p_from IS NULL OR ta.created_at >= p_from)
      AND (p_to IS NULL OR ta.created_at <= p_to)
      AND (
        p_exam_id IS NULL
        OR t.exam_id = p_exam_id
        OR EXISTS (
          SELECT 1 FROM public.test_exams te WHERE te.test_id = ta.test_id AND te.exam_id = p_exam_id
        )
      )
  ),
  per_student AS (
    SELECT
      s.district_key,
      s.user_id,
      max(s.full_name) AS full_name,
      count(*) AS attempts,
      avg(s.pct) AS avg_pct
    FROM scored s
    GROUP BY s.district_key, s.user_id
  ),
  labels AS (
    -- Display the most common original spelling for each case/space-insensitive district.
    SELECT DISTINCT ON (s.district_key) s.district_key, s.district_label
    FROM scored s
    WHERE s.district_key <> ''
    GROUP BY s.district_key, s.district_label
    ORDER BY s.district_key, count(*) DESC, s.district_label
  ),
  top_students AS (
    SELECT DISTINCT ON (ps.district_key) ps.district_key, ps.full_name, ps.avg_pct
    FROM per_student ps
    WHERE ps.avg_pct IS NOT NULL
    ORDER BY ps.district_key, ps.avg_pct DESC, ps.attempts DESC, ps.full_name
  ),
  districts AS (
    SELECT
      s.district_key,
      count(DISTINCT s.user_id) AS student_count,
      count(*) AS attempts_count,
      avg(s.pct) AS avg_pct
    FROM scored s
    GROUP BY s.district_key
  )
  SELECT
    CASE WHEN d.district_key = '' THEN 'Not specified' ELSE l.district_label END,
    d.student_count,
    d.attempts_count,
    round(d.avg_pct, 2),
    ts.full_name,
    round(ts.avg_pct, 2)
  FROM districts d
  LEFT JOIN labels l ON l.district_key = d.district_key
  LEFT JOIN top_students ts ON ts.district_key = d.district_key
  ORDER BY d.avg_pct DESC NULLS LAST, d.attempts_count DESC, 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_district_rankings(text, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_district_rankings(text, timestamptz, timestamptz) TO authenticated, service_role;

COMMIT;
