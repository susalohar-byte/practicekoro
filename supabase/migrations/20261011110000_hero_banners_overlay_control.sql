-- ============================================================================
-- Migration: Add show_text_overlay to hero_banners table
-- Enables admin control over optional text overlays on homepage banners
-- Defaults to FALSE (no text overlay, clean image display)
-- ============================================================================

ALTER TABLE public.hero_banners 
    ADD COLUMN IF NOT EXISTS show_text_overlay BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.hero_banners.show_text_overlay IS 
    'When true, overlays badge, headline, and CTA over the banner image. Defaults to false for clean image display.';
