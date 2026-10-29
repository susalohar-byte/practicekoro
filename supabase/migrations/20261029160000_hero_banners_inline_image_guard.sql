-- ============================================================================
-- Keep hero banner images out of the database
--
-- 20261029090000_block_inline_images.sql guards every image column except
-- hero_banners, the table the home banner (the one that used up the egress
-- quota as an inline image) is read from. Attach the same trigger to its two
-- image columns: a new base64 data URL is rejected, existing values are left
-- alone. Skipped when the table does not exist. Idempotent; safe to re-run.
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.hero_banners') IS NULL THEN
    RAISE NOTICE 'public.hero_banners does not exist; skipping inline image guard';
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS reject_inline_images ON public.hero_banners;
  CREATE TRIGGER reject_inline_images BEFORE INSERT OR UPDATE ON public.hero_banners
    FOR EACH ROW EXECUTE FUNCTION public.reject_inline_images('image_url', 'mobile_image_url');
END $$;
