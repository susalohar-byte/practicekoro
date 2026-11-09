-- ============================================================================
-- Overall (all tests) student leaderboard for the Rank page (web + app).
-- ============================================================================
-- For every student: the best completed attempt of each test they took (same "best attempt"
-- rule as get_test_leaderboard), then the SUM of those scores across all tests. Higher total
-- ranks first; ties go to the higher overall percentage. score / total_marks / percentage are
-- the totals across tests, and tests_attempted is how many tests count.
--
-- Same scopes as get_test_leaderboard ('global', 'west_bengal', 'district'). The top p_limit
-- rows are returned, plus the signed-in student's own row when it is below the limit, so a
-- student always sees their own overall rank.

CREATE OR REPLACE FUNCTION public.get_overall_leaderboard(
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
  is_current_user BOOLEAN,
  tests_attempted INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH best_attempts AS (
    SELECT
      a.user_id,
      a.test_id,
      COALESCE(tr.score, a.score)::NUMERIC AS score,
      COALESCE(NULLIF(tr.total_marks, 0), NULLIF(a.total_marks, 0), NULLIF(t.total_marks, 0), 200)::NUMERIC AS marks,
      ROW_NUMBER() OVER (
        PARTITION BY a.user_id, a.test_id
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
  ),
  totals AS (
    SELECT
      ba.user_id,
      SUM(ba.score) AS score,
      SUM(ba.marks) AS marks,
      COUNT(*)::INT AS tests
    FROM best_attempts ba
    WHERE ba.rn = 1
    GROUP BY ba.user_id
  ),
  filtered_students AS (
    SELECT
      tt.user_id,
      COALESCE(
        NULLIF(NULLIF(btrim(p.full_name), 'Aspirant'), ''),
        CASE
          WHEN NULLIF(btrim(p.email), '') IS NOT NULL AND position('@' in p.email) > 1
          THEN initcap(split_part(btrim(p.email), '@', 1)) || ' (Student)'
          ELSE 'Aspirant Student'
        END
      ) AS full_name,
      p.avatar_url AS avatar,
      tt.score,
      tt.marks,
      ROUND((tt.score / NULLIF(tt.marks, 0) * 100), 1) AS pct,
      p.district,
      NULL::TEXT AS block_name,
      tt.tests
    FROM totals tt
    JOIN public.profiles p ON p.id = tt.user_id
    WHERE (
        p_scope = 'global'
        OR (p_scope = 'west_bengal' AND NULLIF(btrim(p.district), '') IS NOT NULL)
        OR (p_scope = 'district' AND (p_district IS NULL OR lower(btrim(p.district)) = lower(btrim(p_district))))
      )
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY fs.score DESC, fs.pct DESC NULLS LAST, fs.user_id ASC
      ) AS student_rank,
      fs.*
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
    (r.user_id = v_user) AS is_current_user,
    r.tests AS tests_attempted
  FROM ranked r
  WHERE r.student_rank <= COALESCE(p_limit, 100) OR r.user_id = v_user
  ORDER BY r.student_rank ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_overall_leaderboard(TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_overall_leaderboard(TEXT, TEXT, TEXT, INT) TO authenticated;
