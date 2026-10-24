-- ============================================================================
-- Migration 040: Sync Hero Banners to app_settings & Ensure hero_banners Table
-- ============================================================================
-- Ensures reliable cross-device persistence for promotional hero banners on
-- the student home page by:
--   1. Provisioning public.hero_banners table with robust RLS policies & grants
--   2. Seeding default hero banners into public.app_settings (banners_hero_list)
--   3. Enabling full public read and admin write permissions
-- ============================================================================

-- 1. Ensure public.hero_banners table exists
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id TEXT PRIMARY KEY,
    badge_text TEXT,
    title TEXT NOT NULL,
    highlight_word TEXT,
    subtitle TEXT,
    primary_cta_text TEXT NOT NULL DEFAULT 'Start Now',
    primary_cta_link TEXT NOT NULL DEFAULT '/exams',
    secondary_cta_text TEXT,
    secondary_cta_link TEXT,
    feature_pills JSONB NOT NULL DEFAULT '[]'::JSONB,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    banner_type TEXT NOT NULL DEFAULT 'full_image',
    theme_gradient TEXT NOT NULL DEFAULT 'blue',
    target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'free', 'pro'
    placement TEXT NOT NULL DEFAULT 'home_hero', -- 'home_hero', 'catalog', 'all'
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    click_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_hero_banners_active_order 
    ON public.hero_banners (is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_hero_banners_audience 
    ON public.hero_banners (target_audience);

-- 3. Grants & RLS
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.hero_banners TO anon, authenticated;
GRANT ALL ON public.hero_banners TO authenticated, service_role;

DROP POLICY IF EXISTS "Allow public read access to active hero banners" ON public.hero_banners;
CREATE POLICY "Allow public read access to active hero banners"
ON public.hero_banners
FOR SELECT
USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at >= NOW())
);

DROP POLICY IF EXISTS "Allow admin full access to hero banners" ON public.hero_banners;
CREATE POLICY "Allow admin full access to hero banners"
ON public.hero_banners
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid()
        AND (public.users.role = 'admin' OR auth.jwt() ->> 'email' = 'admin@practicekoro.online')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid()
        AND (public.users.role = 'admin' OR auth.jwt() ->> 'email' = 'admin@practicekoro.online')
    )
);

-- 4. Click increment RPC
CREATE OR REPLACE FUNCTION public.increment_banner_click(p_banner_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.hero_banners
    SET click_count = click_count + 1
    WHERE id = p_banner_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_banner_click(TEXT) TO anon, authenticated;

-- 5. Seed default banners into public.app_settings so students immediately see them
INSERT INTO public.app_settings (id, category, key, value, description, updated_at)
VALUES (
    'banners_hero_list',
    'banners',
    'hero_banners_list',
    '[
      {
        "id": "banner-wb-exam-series",
        "badgeText": "TARGET 2026 🎯",
        "title": "Ace WBPSC & WBP Exams with All-India Standard Mocks",
        "highlightWord": "All-India Standard Mocks",
        "subtitle": "Real exam simulation, detailed bilingual solutions & in-depth AI performance rank analysis.",
        "primaryCtaText": "Attempt Free Mock",
        "primaryCtaLink": "/exams",
        "secondaryCtaText": "View Test Series",
        "secondaryCtaLink": "/exams",
        "featurePills": ["Real Exam Interface", "Instant Rank", "Bilingual (EN/BN)", "Negative Marking", "Full Solutions"],
        "imageUrl": "/images/exam_hero_banner.png",
        "bannerType": "full_image",
        "themeGradient": "blue",
        "targetAudience": "all",
        "placement": "home_hero",
        "clickCount": 0,
        "isActive": true,
        "displayOrder": 1,
        "createdAt": "2026-01-01T00:00:00.000Z"
      },
      {
        "id": "banner-pro-pass-special",
        "badgeText": "UNLIMITED ACCESS 👑",
        "title": "Upgrade to Pro Pass & Unlock 1,000+ Mock Tests & PYQs",
        "highlightWord": "1,000+ Mock Tests & PYQs",
        "subtitle": "Get complete 1-year access to all West Bengal & Central government exam test series with detailed solutions.",
        "primaryCtaText": "Get Pro Pass Now",
        "primaryCtaLink": "/subscription",
        "secondaryCtaText": "Explore Features",
        "secondaryCtaLink": "/dashboard",
        "featurePills": ["All Exams Unlocked", "Chapter-wise Quizzes", "Performance Tracking", "Detailed Analytics", "Ad-Free Experience"],
        "imageUrl": "/images/student_hero_banner.jpg",
        "bannerType": "full_image",
        "themeGradient": "amber",
        "targetAudience": "free",
        "placement": "home_hero",
        "clickCount": 0,
        "isActive": true,
        "displayOrder": 2,
        "createdAt": "2026-01-02T00:00:00.000Z"
      },
      {
        "id": "banner-daily-10",
        "badgeText": "DAILY QUIZ ⚡",
        "title": "Daily 10 Challenge - Solve 10 Rapid MCQs Daily",
        "highlightWord": "Daily 10 Challenge",
        "subtitle": "Build daily consistency with fast topic-wise practice questions & explanations.",
        "primaryCtaText": "Start Daily 10",
        "primaryCtaLink": "/practice",
        "secondaryCtaText": "Practice Topics",
        "secondaryCtaLink": "/practice",
        "featurePills": ["Daily Habit", "Speed & Accuracy", "Subject Revision", "Streak Badges"],
        "imageUrl": "/images/daily_10_banner_exact.png",
        "bannerType": "full_image",
        "themeGradient": "indigo",
        "targetAudience": "all",
        "placement": "home_hero",
        "clickCount": 0,
        "isActive": true,
        "displayOrder": 3,
        "createdAt": "2026-01-03T00:00:00.000Z"
      }
    ]'::JSONB,
    'Dynamic Hero Banners for Student Home and Portals',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();
