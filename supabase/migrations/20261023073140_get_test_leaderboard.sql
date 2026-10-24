-- ============================================================================
-- PRACTICEKORO 2.0 — TEST-SPECIFIC LEADERBOARD WITH ACTUAL MARKS
-- ============================================================================
-- Returns ranking of students for a specific test with actual marks, district,
-- and current student identification.

CREATE OR REPLACE FUNCTION public.get_test_leaderboard(
  p_test_id TEXT DEFAULT NULL,
  p_scope TEXT DEFAULT 'global',
  p_district TEXT DEFAULT NULL,
  p_block TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  student_name TEXT,
  avatar_url TEXT,
  score NUMERIC,
  total_marks NUMERIC,
  percentage NUMERIC,
  district TEXT,
  block TEXT,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_test_id TEXT := p_test_id;
  v_total_marks NUMERIC;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- Default to latest attempted test if p_test_id is null
  IF v_test_id IS NULL OR btrim(v_test_id) = '' THEN
    SELECT a.test_id INTO v_test_id
    FROM public.test_attempts a
    WHERE a.user_id = v_user AND a.status = 'completed'
    ORDER BY COALESCE(a.end_time, a.created_at) DESC
    LIMIT 1;
  END IF;

  RETURN QUERY
  WITH best_attempts AS (
    SELECT
      a.user_id,
      COALESCE(tr.score, a.score)::NUMERIC AS score,
      COALESCE(NULLIF(tr.total_marks, 0), NULLIF(a.total_marks, 0), NULLIF(t.total_marks, 0), 200)::NUMERIC AS marks,
      COALESCE(tr.accuracy, a.accuracy, 0)::NUMERIC AS accuracy,
      COALESCE(a.time_spent_seconds, 0)::INT AS seconds,
      COALESCE(a.end_time, a.created_at) AS completed_at,
      ROW_NUMBER() OVER (
        PARTITION BY a.user_id
        ORDER BY
          COALESCE(tr.score, a.score) DESC,
          COALESCE(tr.accuracy, a.accuracy, 0) DESC,
          COALESCE(a.time_spent_seconds, 999999) ASC,
          COALESCE(a.end_time, a.created_at) DESC
      ) AS rn
    FROM public.test_attempts a
    JOIN public.tests t ON t.id = a.test_id
    LEFT JOIN public.test_results tr ON tr.attempt_id = a.id
    WHERE a.status = 'completed'
      AND (v_test_id IS NULL OR a.test_id = v_test_id)
  ),
  filtered_students AS (
    SELECT
      ba.user_id,
      COALESCE(
        NULLIF(NULLIF(btrim(p.full_name), 'Aspirant'), ''),
        CASE
          WHEN NULLIF(btrim(p.email), '') IS NOT NULL AND position('@' in p.email) > 1
          THEN initcap(split_part(btrim(p.email), '@', 1)) || ' (Student)'
          ELSE 'Aspirant Student'
        END
      ) AS full_name,
      -- profiles has no custom_avatar_url; the app copies a custom avatar into avatar_url.
      p.avatar_url AS avatar,
      ba.score,
      ba.marks,
      ROUND((ba.score / NULLIF(ba.marks, 0) * 100), 1) AS pct,
      p.district,
      NULL::TEXT AS block_name
    FROM best_attempts ba
    JOIN public.profiles p ON p.id = ba.user_id
    WHERE ba.rn = 1
      AND (
        p_scope = 'global'
        OR (p_scope = 'west_bengal' AND NULLIF(btrim(p.district), '') IS NOT NULL)
        OR (p_scope = 'district' AND (p_district IS NULL OR lower(btrim(p.district)) = lower(btrim(p_district))))
      )
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY fs.score DESC, fs.pct DESC, fs.user_id ASC
      ) AS student_rank,
      fs.user_id,
      fs.full_name,
      fs.avatar,
      fs.score,
      fs.marks,
      fs.pct,
      fs.district,
      fs.block_name,
      (fs.user_id = v_user) AS is_me
    FROM filtered_students fs
  )
  SELECT
    r.student_rank AS rank,
    r.user_id,
    r.full_name AS student_name,
    r.avatar AS avatar_url,
    r.score,
    r.marks AS total_marks,
    r.pct AS percentage,
    r.district,
    r.block_name AS block,
    r.is_me AS is_current_user
  FROM ranked r
  ORDER BY r.student_rank ASC
  LIMIT COALESCE(p_limit, 100);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_test_leaderboard(TEXT, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_leaderboard(TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;
