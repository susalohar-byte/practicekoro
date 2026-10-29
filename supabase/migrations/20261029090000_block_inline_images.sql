-- ============================================================================
-- Keep images out of the database
--
-- Images saved inline as base64 data URLs (data:image/...;base64,...) are sent
-- with every read of their row. One 2.4 MB banner in app_settings was
-- downloaded on every app open and used up the Supabase egress quota.
-- Images belong in Storage or on the website; the database keeps only the URL.
--
-- A trigger rejects a NEW inline image in any image column. A value that is
-- already stored is left alone, so the remaining old rows can still be edited
-- until their images are moved out.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_inline_images()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_col text;
  v_new text;
  v_old text;
BEGIN
  FOREACH v_col IN ARRAY TG_ARGV LOOP
    v_new := to_jsonb(NEW) ->> v_col;
    IF TG_OP = 'UPDATE' THEN
      v_old := to_jsonb(OLD) ->> v_col;
    END IF;
    IF v_new IS DISTINCT FROM v_old AND v_new ~* 'data:image/[a-z0-9.+-]+;base64,' THEN
      RAISE EXCEPTION 'Inline images are not allowed in %.%: upload the image to Storage and save its URL.',
        TG_TABLE_NAME, v_col
        USING ERRCODE = '22023';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_inline_images ON public.app_settings;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('value');

DROP TRIGGER IF EXISTS reject_inline_images ON public.exams;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('icon_name', 'banner_url');

DROP TRIGGER IF EXISTS reject_inline_images ON public.test_series;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.test_series
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('icon_url', 'banner_url');

DROP TRIGGER IF EXISTS reject_inline_images ON public.tests;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('icon_url');

DROP TRIGGER IF EXISTS reject_inline_images ON public.subjects;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('icon_name');

DROP TRIGGER IF EXISTS reject_inline_images ON public.chapters;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('icon_name');

DROP TRIGGER IF EXISTS reject_inline_images ON public.live_tests;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.live_tests
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('logo', 'exam_logo');

DROP TRIGGER IF EXISTS reject_inline_images ON public.questions;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('image_url');

DROP TRIGGER IF EXISTS reject_inline_images ON public.profiles;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('avatar_url');

DROP TRIGGER IF EXISTS reject_inline_images ON public.audiobooks;
CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.audiobooks
  FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('thumbnail_url');

-- The 2.4 MB home banner now ships with the website (PR #30, deployed).
-- Point its row at that copy. Only touches the inline value, so re-running is a no-op.
UPDATE public.app_settings
SET value = (
  SELECT jsonb_agg(
    CASE WHEN e ->> 'id' = '7d61d753-78e7-460e-bbfe-f381cfb6f780' AND e ->> 'imageUrl' LIKE 'data:%'
      THEN jsonb_set(e, '{imageUrl}', '"https://practicekoro.online/images/banners/telepost-promo-01.webp"')
      ELSE e END
    ORDER BY ord)
  FROM jsonb_array_elements(value) WITH ORDINALITY AS t(e, ord)
)
WHERE id = 'banners_hero_list' AND jsonb_typeof(value) = 'array' AND value::text LIKE '%data:image%';
