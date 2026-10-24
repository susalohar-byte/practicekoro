-- 20261016130000 part 2 (remainder): hero_banners admin policy without the JWT-email trust branch.
-- Not in the split production rollout because production has no hero_banners table; kept so a
-- fresh database built from these migrations matches. No-op where the table is absent.
DO $$
BEGIN
  IF to_regclass('public.hero_banners') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow admin full access to hero banners" ON public.hero_banners;
    CREATE POLICY "Allow admin full access to hero banners"
      ON public.hero_banners FOR ALL TO authenticated
      USING (public.admin_scope_allowed('content'))
      WITH CHECK (public.admin_scope_allowed('content'));
  END IF;
END $$;
