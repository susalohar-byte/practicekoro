-- ============================================================================
-- Migration: 20261029090000_index_hygiene.sql
-- Performance advisor fixes: drop duplicate indexes, cover every single-column
-- foreign key with an index. Idempotent; safe to re-run.
-- ============================================================================

-- 1. Duplicate indexes (advisor: identical definitions). Keep one of each pair.
DO $$
BEGIN
  IF to_regclass('public.idx_subscriptions_user') IS NOT NULL
     AND to_regclass('public.idx_subscriptions_user_status') IS NOT NULL THEN
    DROP INDEX public.idx_subscriptions_user;
  END IF;
  IF to_regclass('public.idx_test_questions_test') IS NOT NULL
     AND to_regclass('public.idx_test_questions_test_id') IS NOT NULL THEN
    DROP INDEX public.idx_test_questions_test;
  END IF;
END $$;

-- 2. Foreign keys without a covering index (32 at the time of writing).
-- An index "covers" a FK when its leading column is the FK column.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, cl.relname AS tname, a.attname AS col
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND array_length(c.conkey, 1) = 1
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]
      )
  LOOP
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %s (%I)',
      left(format('idx_%s_%s', r.tname, r.col), 63), r.tbl, r.col
    );
  END LOOP;
END $$;
