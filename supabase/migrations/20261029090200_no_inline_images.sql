-- ============================================================================
-- Migration: 20261029090200_no_inline_images.sql
-- Images belong in Storage; tables keep only the URL. A base64 banner in a row
-- caused the egress lockout, so reject `data:` values in every image column.
--
-- Constraints are NOT VALID: existing rows are not checked (two legacy base64
-- icons remain until scripts/move-inline-images.mjs moves them), but every new
-- INSERT/UPDATE is. After the move, validate them:
--   SELECT conrelid::regclass, conname FROM pg_constraint
--   WHERE conname LIKE '%\_no\_inline\_image' AND NOT convalidated;
--   ALTER TABLE <table> VALIDATE CONSTRAINT <name>;
-- Idempotent; safe to re-run.
-- ============================================================================

DO $$
DECLARE
  r record;
  v_name text;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN (VALUES
      ('audiobooks', 'thumbnail_url'),
      ('chapters', 'icon_name'),
      ('exams', 'banner_url'),
      ('exams', 'icon_name'),
      ('live_tests', 'exam_logo'),
      ('live_tests', 'logo'),
      ('profiles', 'avatar_url'),
      ('questions', 'image_url'),
      ('subjects', 'icon_name'),
      ('test_series', 'banner_url'),
      ('test_series', 'icon_url'),
      ('tests', 'icon_url')
    ) AS t(table_name, column_name) USING (table_name, column_name)
    WHERE c.table_schema = 'public'
  LOOP
    v_name := left(format('%s_%s_no_inline_image', r.table_name, r.column_name), 63);
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = format('public.%I', r.table_name)::regclass AND conname = v_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%I IS NULL OR %I NOT ILIKE %L) NOT VALID',
        r.table_name, v_name, r.column_name, r.column_name, 'data:%'
      );
    END IF;
  END LOOP;
END $$;
