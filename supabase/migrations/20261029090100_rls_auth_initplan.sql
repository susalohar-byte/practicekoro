-- ============================================================================
-- Migration: 20261029090100_rls_auth_initplan.sql
-- Performance advisor fix (auth_rls_initplan, 72 policies): wrap auth.uid(),
-- auth.jwt(), auth.role() and auth.email() in a scalar sub-select so Postgres
-- evaluates them once per query instead of once per row.
-- Semantics are unchanged. Already-wrapped calls are unwrapped first so the
-- rewrite never nests, which makes this idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION pg_temp.wrap_auth_calls(p_expr text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    regexp_replace(
      p_expr,
      '\(\s*SELECT\s+auth\.(uid|jwt|role|email)\(\)(\s+AS\s+\w+)?\s*\)',
      'auth.\1()',
      'gi'
    ),
    'auth\.(uid|jwt|role|email)\(\)',
    '(select auth.\1())',
    'g'
  );
$$;

DO $$
DECLARE
  p record;
  v_qual text;
  v_check text;
  v_sql text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual, '') ~ 'auth\.(uid|jwt|role|email)\(\)'
        OR coalesce(with_check, '') ~ 'auth\.(uid|jwt|role|email)\(\)')
  LOOP
    v_qual := pg_temp.wrap_auth_calls(p.qual);
    v_check := pg_temp.wrap_auth_calls(p.with_check);
    IF v_qual IS NOT DISTINCT FROM p.qual AND v_check IS NOT DISTINCT FROM p.with_check THEN
      CONTINUE;
    END IF;

    v_sql := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF v_qual IS NOT NULL THEN
      v_sql := v_sql || format(' USING (%s)', v_qual);
    END IF;
    IF v_check IS NOT NULL THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
    END IF;
    EXECUTE v_sql;
  END LOOP;
END $$;
