-- Admin reporting aggregates computed in Postgres.
--
-- The dashboard, analytics, revenue and rankings screens previously downloaded whole
-- tables (profiles, attempts, answers, payments) into the browser to total them.
-- These functions return totals only. The client keeps its chart-bucket and label
-- logic and sends bucket bounds in, so screens render exactly as before.
--
-- Semantics mirror the previous client aggregation:
--   * "student" = profiles.role = 'student'; staff test runs are excluded.
--   * Range bounds are inclusive at millisecond precision (JS Date.parse truncation),
--     hence `< end + 1 millisecond`.
--   * Net revenue = src/utils/adminPaymentReporting.ts retainedPaymentAmount: only
--     completed/refunded payments, payments owed back (raw_response.requires_refund)
--     retain nothing, partially refunded payments keep their unrefunded remainder.
--   * Kolkata calendar days for daily revenue buckets.
--
-- Depends only on core tables and public.admin_scope_allowed(text). Profiles and
-- payments are readable by super admins only (staff_read_scope), so every function
-- requires the 'super' scope.

-- ---------------------------------------------------------------------------
-- Supporting indexes for created_at range scans.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_test_attempts_created_at ON public.test_attempts (created_at);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status_created_at
    ON public.test_attempts (status, created_at);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_created_at ON public.attempt_answers (created_at);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments (created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at ON public.profiles (role, created_at);

-- ---------------------------------------------------------------------------
-- Net retained amount of one payment, in paise. Pure helper; not an API endpoint.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_net_payment_paise(
    p_status text,
    p_amount numeric,
    p_refund_amount numeric,
    p_raw_response jsonb
)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
    SELECT CASE
        WHEN p_status IS NULL OR p_status NOT IN ('completed', 'refunded') THEN 0
        WHEN coalesce(p_raw_response ->> 'requires_refund', '') = 'true' THEN 0
        ELSE greatest(
            0,
            round(coalesce(p_amount, 0) * 100)
              - round(coalesce(
                    p_refund_amount,
                    CASE WHEN p_status = 'refunded' THEN p_amount ELSE 0 END,
                    0
                ) * 100)
        )::bigint
    END;
$$;
REVOKE ALL ON FUNCTION public.admin_net_payment_paise(text, numeric, numeric, jsonb)
    FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Earliest reporting event in a range (all-time charts start here, not at 1970).
-- Returns {earliest: timestamptz | null}.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reporting_earliest(
    p_start timestamptz,
    p_end timestamptz,
    p_all_payment_statuses boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_end timestamptz := p_end + interval '1 millisecond';
    v_result timestamptz;
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;
    IF p_start IS NULL OR p_end IS NULL OR p_start > p_end THEN
        RAISE EXCEPTION 'Invalid reporting range' USING ERRCODE = '22023';
    END IF;

    SELECT min(t) INTO v_result FROM (
        SELECT min(p.created_at) AS t
          FROM public.profiles p
         WHERE p.role = 'student' AND p.created_at >= p_start AND p.created_at < v_end
        UNION ALL
        SELECT min(ta.created_at)
          FROM public.test_attempts ta
          JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
         WHERE ta.created_at >= p_start AND ta.created_at < v_end
        UNION ALL
        SELECT min(aa.created_at)
          FROM public.attempt_answers aa
          JOIN public.test_attempts ta ON ta.id = aa.attempt_id
          JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
         WHERE aa.selected_option IS NOT NULL
           AND aa.created_at >= p_start AND aa.created_at < v_end
        UNION ALL
        SELECT min(pm.created_at)
          FROM public.payments pm
         WHERE (p_all_payment_statuses OR pm.status IN ('completed', 'refunded'))
           AND pm.created_at >= p_start AND pm.created_at < v_end
    ) events;
    RETURN jsonb_build_object('earliest', v_result);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reporting_earliest(timestamptz, timestamptz, boolean)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reporting_earliest(timestamptz, timestamptz, boolean)
    TO authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard period totals for a list of ranges ([{start, end}, ...]).
-- Returns {ranges: [...per range totals...], attempt_counts: {test_id: n}} where
-- attempt_counts covers the first range.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_dashboard_range_stats(p_ranges jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_ranges jsonb;
    v_counts jsonb;
    v_first_start timestamptz;
    v_first_end timestamptz;
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;
    IF p_ranges IS NULL OR jsonb_typeof(p_ranges) <> 'array'
       OR jsonb_array_length(p_ranges) = 0 OR jsonb_array_length(p_ranges) > 64 THEN
        RAISE EXCEPTION 'Invalid reporting ranges' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_ranges) r
         WHERE (r ->> 'start') IS NULL OR (r ->> 'end') IS NULL
            OR (r ->> 'start')::timestamptz > (r ->> 'end')::timestamptz
    ) THEN
        RAISE EXCEPTION 'Invalid reporting ranges' USING ERRCODE = '22023';
    END IF;

    WITH r AS (
        SELECT x.ord,
               (x.elem ->> 'start')::timestamptz AS rs,
               (x.elem ->> 'end')::timestamptz + interval '1 millisecond' AS re
          FROM jsonb_array_elements(p_ranges) WITH ORDINALITY AS x(elem, ord)
    )
    SELECT jsonb_agg(jsonb_build_object(
        'new_students', (
            SELECT count(*) FROM public.profiles p
             WHERE p.role = 'student' AND p.created_at >= r.rs AND p.created_at < r.re),
        'active_students', (
            SELECT count(DISTINCT ta.user_id) FROM public.test_attempts ta
              JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
             WHERE ta.created_at >= r.rs AND ta.created_at < r.re),
        'tests_attempted', (
            SELECT count(*) FROM public.test_attempts ta
              JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
             WHERE ta.created_at >= r.rs AND ta.created_at < r.re),
        'completed_tests', (
            SELECT count(*) FROM public.test_attempts ta
              JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
             WHERE ta.status = 'completed' AND ta.created_at >= r.rs AND ta.created_at < r.re),
        'questions_answered', (
            SELECT count(*) FROM public.attempt_answers aa
              JOIN public.test_attempts ta ON ta.id = aa.attempt_id
              JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
             WHERE aa.selected_option IS NOT NULL
               AND aa.created_at >= r.rs AND aa.created_at < r.re),
        'net_revenue_paise', (
            SELECT coalesce(sum(public.admin_net_payment_paise(
                       pm.status, pm.amount, pm.refund_amount, pm.raw_response)), 0)
              FROM public.payments pm
             WHERE pm.status IN ('completed', 'refunded')
               AND pm.created_at >= r.rs AND pm.created_at < r.re)
    ) ORDER BY r.ord)
      INTO v_ranges
      FROM r;

    v_first_start := (p_ranges -> 0 ->> 'start')::timestamptz;
    v_first_end := (p_ranges -> 0 ->> 'end')::timestamptz + interval '1 millisecond';
    SELECT coalesce(jsonb_object_agg(c.test_id, c.n), '{}'::jsonb)
      INTO v_counts
      FROM (
        SELECT ta.test_id::text AS test_id, count(*) AS n
          FROM public.test_attempts ta
          JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
         WHERE ta.test_id IS NOT NULL
           AND ta.created_at >= v_first_start AND ta.created_at < v_first_end
         GROUP BY ta.test_id
      ) c;

    RETURN jsonb_build_object('ranges', v_ranges, 'attempt_counts', v_counts);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_dashboard_range_stats(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_range_stats(jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard all-time overview counters and revenue since today/month/year starts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_dashboard_overview_stats(
    p_today_start timestamptz,
    p_month_start timestamptz,
    p_year_start timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_result jsonb;
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;

    WITH pay AS (
        SELECT pm.created_at,
               public.admin_net_payment_paise(
                   pm.status, pm.amount, pm.refund_amount, pm.raw_response) AS net
          FROM public.payments pm
         WHERE pm.status IN ('completed', 'refunded')
    ),
    subs AS (
        SELECT s.user_id
          FROM public.subscriptions s
         WHERE s.status = 'active' AND s.expires_at > now()
    ),
    t AS (
        SELECT
            count(*) AS total,
            count(*) FILTER (WHERE test_type IN ('topic', 'chapter_mock', 'subject_mock')) AS topic,
            count(*) FILTER (WHERE test_type = 'full_mock') AS full_mock,
            count(*) FILTER (WHERE test_type = 'pyq') AS pyq
          FROM public.tests
    ),
    q AS (
        SELECT
            count(*) AS total,
            count(*) FILTER (WHERE source_type = 'topic') AS topic,
            count(*) FILTER (WHERE source_type = 'other') AS full_mock,
            count(*) FILTER (WHERE source_type = 'pyq') AS pyq
          FROM public.questions
    )
    SELECT jsonb_build_object(
        'total_students', (SELECT count(*) FROM public.profiles WHERE role = 'student'),
        'total_exams', (SELECT count(*) FROM public.exams),
        'total_questions', (SELECT total FROM q),
        'topic_questions', (SELECT topic FROM q),
        'full_mock_questions', (SELECT full_mock FROM q),
        'pyq_questions', (SELECT pyq FROM q),
        'total_tests', (SELECT total FROM t),
        'topic_tests', (SELECT topic FROM t),
        'full_mock_tests', (SELECT full_mock FROM t),
        'pyq_tests', (SELECT pyq FROM t),
        'pro_students', (SELECT count(DISTINCT user_id) FROM subs),
        'active_subscriptions', (SELECT count(*) FROM subs),
        'revenue_total_paise', (SELECT coalesce(sum(net), 0) FROM pay),
        'revenue_today_paise',
            (SELECT coalesce(sum(net), 0) FROM pay WHERE created_at >= p_today_start),
        'revenue_month_paise',
            (SELECT coalesce(sum(net), 0) FROM pay WHERE created_at >= p_month_start),
        'revenue_year_paise',
            (SELECT coalesce(sum(net), 0) FROM pay WHERE created_at >= p_year_start),
        'tests_attempted', (SELECT count(*) FROM public.test_attempts),
        'completed_tests',
            (SELECT count(*) FROM public.test_attempts WHERE status = 'completed'),
        'questions_answered',
            (SELECT count(*) FROM public.attempt_answers WHERE selected_option IS NOT NULL)
    ) INTO v_result;
    RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_dashboard_overview_stats(timestamptz, timestamptz, timestamptz)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_overview_stats(timestamptz, timestamptz, timestamptz)
    TO authenticated;

-- ---------------------------------------------------------------------------
-- Revenue range: per-Kolkata-day net revenue, completed transactions and signups.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_revenue_range_stats(
    p_start timestamptz,
    p_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_end timestamptz := p_end + interval '1 millisecond';
    v_result jsonb;
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;
    IF p_start IS NULL OR p_end IS NULL OR p_start > p_end THEN
        RAISE EXCEPTION 'Invalid reporting range' USING ERRCODE = '22023';
    END IF;

    WITH pay AS (
        SELECT pm.status,
               pm.created_at,
               to_char((pm.created_at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day,
               public.admin_net_payment_paise(
                   pm.status, pm.amount, pm.refund_amount, pm.raw_response) AS net
          FROM public.payments pm
         WHERE pm.status IN ('completed', 'refunded')
           AND pm.created_at >= p_start AND pm.created_at < v_end
    ),
    prof AS (
        SELECT p.created_at,
               to_char((p.created_at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day
          FROM public.profiles p
         WHERE p.role = 'student' AND p.created_at >= p_start AND p.created_at < v_end
    )
    SELECT jsonb_build_object(
        'earliest', least((SELECT min(created_at) FROM pay), (SELECT min(created_at) FROM prof)),
        'total_net_paise', (SELECT coalesce(sum(net), 0) FROM pay),
        'transactions', (SELECT count(*) FROM pay WHERE status = 'completed'),
        'signups', (SELECT count(*) FROM prof),
        'payment_days', (
            SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'date', d.day, 'net_paise', d.net, 'transactions', d.tx)), '[]'::jsonb)
              FROM (
                SELECT day, sum(net) AS net, count(*) FILTER (WHERE status = 'completed') AS tx
                  FROM pay
                 WHERE net > 0 OR status = 'completed'
                 GROUP BY day
              ) d),
        'signup_days', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('date', d.day, 'count', d.n)), '[]'::jsonb)
              FROM (SELECT day, count(*) AS n FROM prof GROUP BY day) d)
    ) INTO v_result;
    RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_revenue_range_stats(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revenue_range_stats(timestamptz, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------------
-- Platform analytics: totals, per-student / per-question / per-subject / per-topic
-- aggregates, demographics and per-bucket trends (buckets sent by the client).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_analytics_overview(
    p_start timestamptz,
    p_end timestamptz,
    p_month_start timestamptz,
    p_month_end timestamptz,
    p_buckets jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_end timestamptz := p_end + interval '1 millisecond';
    v_month_end timestamptz := p_month_end + interval '1 millisecond';
    v_buckets jsonb := coalesce(p_buckets, '[]'::jsonb);
    v_result jsonb;
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;
    IF p_start IS NULL OR p_end IS NULL OR p_start > p_end
       OR p_month_start IS NULL OR p_month_end IS NULL THEN
        RAISE EXCEPTION 'Invalid reporting range' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_buckets) <> 'array' OR jsonb_array_length(v_buckets) > 64 THEN
        RAISE EXCEPTION 'Invalid reporting buckets' USING ERRCODE = '22023';
    END IF;

    WITH att AS (
        SELECT ta.id, ta.user_id, ta.status, ta.score, ta.created_at
          FROM public.test_attempts ta
          JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
         WHERE ta.created_at >= p_start AND ta.created_at < v_end
    ),
    ans AS (
        SELECT aa.id, aa.question_id, aa.is_correct, aa.created_at, ta.user_id
          FROM public.attempt_answers aa
          JOIN public.test_attempts ta ON ta.id = aa.attempt_id
          JOIN public.profiles p ON p.id = ta.user_id AND p.role = 'student'
         WHERE aa.selected_option IS NOT NULL
           AND aa.created_at >= p_start AND aa.created_at < v_end
    ),
    -- Answers rolled up per question first; subjects/topics roll up from these rows.
    qinfo AS (
        SELECT qa.question_id, qa.total, qa.wrong, qa.correct, qa.first_id,
               q.question_text, q.question_bengali_text, q.difficulty,
               q.subject_id, q.chapter_id,
               s.name AS subject_name, c.name AS chapter_name
          FROM (
            SELECT question_id,
                   count(*) AS total,
                   count(*) FILTER (WHERE is_correct IS FALSE) AS wrong,
                   count(*) FILTER (WHERE is_correct IS TRUE) AS correct,
                   min(id::text) AS first_id
              FROM ans GROUP BY question_id
          ) qa
          JOIN public.questions q ON q.id = qa.question_id
          LEFT JOIN public.subjects s ON s.id = q.subject_id
          LEFT JOIN public.chapters c ON c.id = q.chapter_id
    ),
    pay AS (
        SELECT pm.user_id, pm.status, pm.created_at,
               public.admin_net_payment_paise(
                   pm.status, pm.amount, pm.refund_amount, pm.raw_response) AS net
          FROM public.payments pm
         WHERE pm.created_at >= p_start AND pm.created_at < v_end
    ),
    pro AS (
        SELECT DISTINCT s.user_id
          FROM public.subscriptions s
          JOIN public.profiles p ON p.id = s.user_id AND p.role = 'student'
         WHERE s.status = 'active' AND s.expires_at > now()
    ),
    sa AS (
        SELECT user_id,
               count(*) FILTER (WHERE status = 'completed') AS total_tests,
               coalesce(sum(coalesce(score, 0)::float8 ORDER BY id) FILTER (WHERE status = 'completed'), 0)
                   AS total_score,
               max(created_at) AS last_active
          FROM att GROUP BY user_id
    ),
    sq AS (
        SELECT user_id,
               count(*) AS answered,
               count(*) FILTER (WHERE is_correct IS TRUE) AS correct
          FROM ans GROUP BY user_id
    ),
    bk AS (
        SELECT x.ord,
               (x.elem ->> 'start')::timestamptz AS bs,
               (x.elem ->> 'end')::timestamptz + interval '1 millisecond' AS be
          FROM jsonb_array_elements(v_buckets) WITH ORDINALITY AS x(elem, ord)
    ),
    b_att AS (
        SELECT bk.ord,
               count(*) AS attempts,
               count(*) FILTER (WHERE att.status = 'completed') AS completed,
               coalesce(sum(coalesce(att.score, 0)::float8 ORDER BY att.id)
                        FILTER (WHERE att.status = 'completed'), 0) AS score_sum
          FROM bk JOIN att ON att.created_at >= bk.bs AND att.created_at < bk.be
         GROUP BY bk.ord
    ),
    b_ans AS (
        SELECT bk.ord, count(*) AS answers, count(*) FILTER (WHERE ans.is_correct IS TRUE) AS correct
          FROM bk JOIN ans ON ans.created_at >= bk.bs AND ans.created_at < bk.be
         GROUP BY bk.ord
    ),
    b_pay AS (
        SELECT bk.ord, coalesce(sum(pay.net), 0) AS net_paise,
               count(*) FILTER (WHERE pay.status = 'completed') AS transactions
          FROM bk JOIN pay ON pay.created_at >= bk.bs AND pay.created_at < bk.be
         GROUP BY bk.ord
    ),
    b_sig AS (
        SELECT bk.ord, count(*) AS signups
          FROM bk JOIN public.profiles p
            ON p.role = 'student' AND p.created_at >= bk.bs AND p.created_at < bk.be
         GROUP BY bk.ord
    ),
    b_sub AS (
        SELECT ord,
               jsonb_agg(jsonb_build_object(
                   'subject_id', subject_id, 'subject_name', subject_name,
                   'attempts', n, 'correct', c) ORDER BY first_id) AS subjects
          FROM (
            SELECT bq.ord, q.subject_id::text AS subject_id, max(s.name) AS subject_name,
                   sum(bq.n) AS n, sum(bq.c) AS c, min(bq.first_id) AS first_id
              FROM (
                SELECT bk.ord, ans.question_id, count(*) AS n,
                       count(*) FILTER (WHERE ans.is_correct IS TRUE) AS c,
                       min(ans.id::text) AS first_id
                  FROM bk JOIN ans ON ans.created_at >= bk.bs AND ans.created_at < bk.be
                 GROUP BY bk.ord, ans.question_id
              ) bq
              JOIN public.questions q ON q.id = bq.question_id
              LEFT JOIN public.subjects s ON s.id = q.subject_id
             WHERE q.subject_id IS NOT NULL
             GROUP BY bq.ord, q.subject_id
          ) x
         GROUP BY ord
    ),
    demo AS (
        SELECT
            coalesce(nullif(btrim(to_jsonb(p) ->> 'district', E' \t\r\n'), ''), 'Not specified') AS district,
            CASE lower(btrim(coalesce(to_jsonb(p) ->> 'gender', ''), E' \t\r\n'))
                WHEN 'male' THEN 'Male' WHEN 'm' THEN 'Male'
                WHEN 'female' THEN 'Female' WHEN 'f' THEN 'Female'
                WHEN 'transgender' THEN 'Other' WHEN 'other' THEN 'Other'
                ELSE 'Not specified'
            END AS gender
          FROM public.profiles p
         WHERE p.role = 'student'
    )
    SELECT jsonb_build_object(
        'total_students', (SELECT count(*) FROM demo),
        'new_students', (
            SELECT count(*) FROM public.profiles p
             WHERE p.role = 'student' AND p.created_at >= p_start AND p.created_at < v_end),
        'tests_attempted', (SELECT count(*) FROM att),
        'questions_answered', (SELECT count(*) FROM ans),
        'correct_answers', (SELECT count(*) FROM ans WHERE is_correct IS TRUE),
        'active_students', (
            SELECT count(*) FROM (SELECT user_id FROM att UNION SELECT user_id FROM ans) u),
        'districts', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('district', district, 'count', n)), '[]'::jsonb)
              FROM (SELECT district, count(*) AS n FROM demo GROUP BY district) d),
        'genders', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('gender', gender, 'count', n)), '[]'::jsonb)
              FROM (SELECT gender, count(*) AS n FROM demo GROUP BY gender) g),
        'students', (
            SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'user_id', u.user_id,
                       'full_name', p.full_name,
                       'email', p.email,
                       'total_tests', coalesce(sa.total_tests, 0),
                       'total_score', coalesce(sa.total_score, 0),
                       'questions_attempted', coalesce(sq.answered, 0),
                       'correct_count', coalesce(sq.correct, 0),
                       'last_active', sa.last_active,
                       'is_pro', pro.user_id IS NOT NULL
                   )), '[]'::jsonb)
              FROM (SELECT user_id FROM sa UNION SELECT user_id FROM sq) u
              JOIN public.profiles p ON p.id = u.user_id
              LEFT JOIN sa ON sa.user_id = u.user_id
              LEFT JOIN sq ON sq.user_id = u.user_id
              LEFT JOIN pro ON pro.user_id = u.user_id),
        'questions', (
            SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'question_id', question_id::text,
                       'question_text', question_text,
                       'question_bengali_text', question_bengali_text,
                       'difficulty', difficulty::text,
                       'subject_name', subject_name,
                       'chapter_name', chapter_name,
                       'total', total,
                       'wrong', wrong,
                       'correct', correct
                   ) ORDER BY first_id), '[]'::jsonb)
              FROM qinfo),
        'subjects', (
            SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'subject_id', subject_id, 'subject_name', subject_name,
                       'total', total, 'correct', correct) ORDER BY first_id), '[]'::jsonb)
              FROM (
                SELECT subject_id::text AS subject_id, max(subject_name) AS subject_name,
                       sum(total) AS total, sum(correct) AS correct, min(first_id) AS first_id
                  FROM qinfo WHERE subject_id IS NOT NULL GROUP BY subject_id
              ) ss),
        'chapters', (
            SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'chapter_id', chapter_id, 'chapter_name', chapter_name,
                       'subject_name', subject_name, 'total', total, 'correct', correct)
                       ORDER BY first_id), '[]'::jsonb)
              FROM (
                SELECT chapter_id::text AS chapter_id, max(chapter_name) AS chapter_name,
                       -- Subject of the first answered question in this topic.
                       (array_agg(subject_name ORDER BY first_id))[1] AS subject_name,
                       sum(total) AS total, sum(correct) AS correct, min(first_id) AS first_id
                  FROM qinfo WHERE chapter_id IS NOT NULL GROUP BY chapter_id
              ) cs),
        'buckets', (
            SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'attempts', coalesce(ba.attempts, 0),
                       'completed', coalesce(ba.completed, 0),
                       'score_sum', coalesce(ba.score_sum, 0),
                       'answers', coalesce(bn.answers, 0),
                       'correct', coalesce(bn.correct, 0),
                       'net_paise', coalesce(bp.net_paise, 0),
                       'transactions', coalesce(bp.transactions, 0),
                       'signups', coalesce(bg.signups, 0),
                       'subjects', coalesce(bs.subjects, '[]'::jsonb)
                   ) ORDER BY bk.ord), '[]'::jsonb)
              FROM bk
              LEFT JOIN b_att ba ON ba.ord = bk.ord
              LEFT JOIN b_ans bn ON bn.ord = bk.ord
              LEFT JOIN b_pay bp ON bp.ord = bk.ord
              LEFT JOIN b_sig bg ON bg.ord = bk.ord
              LEFT JOIN b_sub bs ON bs.ord = bk.ord),
        'total_net_paise', (SELECT coalesce(sum(net), 0) FROM pay),
        'month_net_paise', (
            SELECT coalesce(sum(public.admin_net_payment_paise(
                       pm.status, pm.amount, pm.refund_amount, pm.raw_response)), 0)
              FROM public.payments pm
             WHERE pm.created_at >= p_month_start AND pm.created_at < v_month_end),
        'paid_students', (
            SELECT count(DISTINCT pay.user_id) FROM pay
              JOIN public.profiles p ON p.id = pay.user_id AND p.role = 'student'
             WHERE pay.net > 0),
        'active_subscriptions', (SELECT count(*) FROM pro)
    ) INTO v_result;
    RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_analytics_overview(timestamptz, timestamptz, timestamptz, timestamptz, jsonb)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_analytics_overview(timestamptz, timestamptz, timestamptz, timestamptz, jsonb)
    TO authenticated;

-- ---------------------------------------------------------------------------
-- Rankings: one row per ranked student with totals, per-subject sums and the three
-- most recent attempts. Filters mirror the previous client filtering; null = all.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_rankings_aggregate(
    p_since timestamptz DEFAULT NULL,
    p_test_types text[] DEFAULT NULL,
    p_scope_types text[] DEFAULT NULL,
    p_exam text DEFAULT NULL,
    p_subject text DEFAULT NULL,
    p_excluded_emails text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_exam text := lower(btrim(coalesce(p_exam, '')));
    v_subject text := lower(btrim(coalesce(p_subject, '')));
    v_excluded text[] := coalesce(
        (SELECT array_agg(lower(btrim(e))) FROM unnest(p_excluded_emails) e), '{}');
    v_result jsonb;
BEGIN
    IF NOT public.admin_scope_allowed('super') THEN
        RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
    END IF;

    WITH a AS (
        SELECT ta.id, ta.user_id, ta.created_at, ta.end_time,
               coalesce(ta.score, 0) AS sc,
               coalesce(nullif(ta.total_marks, 0), nullif(t.total_marks, 0), 0) AS mx,
               coalesce(ta.correct_count, 0) AS cor,
               coalesce(ta.wrong_count, 0) AS wr,
               coalesce(ta.skipped_count, 0) AS sk,
               coalesce(t.title, 'Deleted test') AS title,
               coalesce(nullif(s.name, ''), nullif(e.title, ''), 'Other') AS subject_key,
               row_number() OVER (ORDER BY ta.created_at DESC, ta.id ASC) AS rn
          FROM public.test_attempts ta
          JOIN public.profiles p ON p.id = ta.user_id
          LEFT JOIN public.tests t ON t.id = ta.test_id
          LEFT JOIN public.exams e ON e.id = t.exam_id
          LEFT JOIN public.subjects s ON s.id = t.subject_id
         WHERE ta.status = 'completed'
           AND coalesce(p.role, '') IN ('', 'student')
           AND NOT (coalesce(p.email, '') <> '' AND lower(btrim(p.email)) = ANY (v_excluded))
           AND (p_since IS NULL OR ta.created_at >= p_since)
           AND (p_test_types IS NULL OR lower(coalesce(t.test_type, '')) = ANY (p_test_types))
           AND (p_scope_types IS NULL OR lower(coalesce(t.test_type, '')) = ANY (p_scope_types))
           AND (v_exam = '' OR t.exam_id::text = p_exam
                OR (coalesce(lower(btrim(e.title)), '') <> ''
                    AND strpos(lower(btrim(e.title)), v_exam) > 0))
           AND (v_subject = '' OR t.subject_id::text = p_subject
                OR (coalesce(lower(btrim(s.name)), '') <> ''
                    AND strpos(lower(btrim(s.name)), v_subject) > 0))
    ),
    per_user AS (
        SELECT user_id,
               min(rn) AS first_seen,
               count(*) AS tests_attempted,
               -- Doubles summed in attempt order, exactly as the browser accumulated them.
               sum(sc::float8 ORDER BY rn) AS total_score,
               sum(mx::float8 ORDER BY rn) AS total_max,
               sum(cor) AS total_correct,
               sum(wr) AS total_wrong,
               sum(sk) AS total_skipped,
               max(coalesce(end_time, created_at)) AS latest_at,
               greatest(0, max(floor(sc::float8 / greatest(1, mx)::float8 * 100 + 0.5))) AS max_percentage
          FROM a GROUP BY user_id
    ),
    per_subject AS (
        SELECT user_id, subject_key, min(rn) AS first_seen,
               sum(sc::float8 ORDER BY rn) AS score, sum(mx::float8 ORDER BY rn) AS marks
          FROM a GROUP BY user_id, subject_key
    ),
    subject_json AS (
        SELECT user_id,
               jsonb_agg(jsonb_build_object('subject', subject_key, 'score', score, 'marks', marks)
                         ORDER BY first_seen) AS subjects
          FROM per_subject GROUP BY user_id
    ),
    recent_json AS (
        SELECT user_id,
               jsonb_agg(jsonb_build_object('title', title, 'score', sc, 'max', mx, 'at', at)
                         ORDER BY rn) AS recent
          FROM (
            SELECT user_id, title, sc, mx, coalesce(end_time, created_at) AS at, rn,
                   row_number() OVER (PARTITION BY user_id ORDER BY rn) AS k
              FROM a
          ) r
         WHERE k <= 3
         GROUP BY user_id
    )
    SELECT coalesce(jsonb_agg(jsonb_build_object(
               'user_id', u.user_id,
               'full_name', p.full_name,
               'email', p.email,
               'district', to_jsonb(p) ->> 'district',
               'avatar_url', p.avatar_url,
               'profile_created_at', p.created_at,
               'tests_attempted', u.tests_attempted,
               'total_score', u.total_score,
               'total_max', u.total_max,
               'total_correct', u.total_correct,
               'total_wrong', u.total_wrong,
               'total_skipped', u.total_skipped,
               'latest_at', u.latest_at,
               'max_percentage', u.max_percentage,
               'subjects', coalesce(sj.subjects, '[]'::jsonb),
               'recent', coalesce(rj.recent, '[]'::jsonb)
           ) ORDER BY u.first_seen), '[]'::jsonb)
      INTO v_result
      FROM per_user u
      JOIN public.profiles p ON p.id = u.user_id
      LEFT JOIN subject_json sj ON sj.user_id = u.user_id
      LEFT JOIN recent_json rj ON rj.user_id = u.user_id;
    RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_rankings_aggregate(timestamptz, text[], text[], text, text, text[])
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_rankings_aggregate(timestamptz, text[], text[], text, text, text[])
    TO authenticated;
