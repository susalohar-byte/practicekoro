-- 20261016130000 part 1a: restrictive staff-scope write policies on admin-managed tables.
DO $$
DECLARE
  t text;
  v_spec text[];
  v_specs text[][] := ARRAY[
    ARRAY['exams','content','content'], ARRAY['subjects','content','content'],
    ARRAY['chapters','content','content'], ARRAY['questions','content','content'],
    ARRAY['exam_categories','content','content'], ARRAY['test_series','content','content'],
    ARRAY['tests','content','super'], ARRAY['live_tests','content','content'],
    ARRAY['flashcard_decks','content','content'], ARRAY['flashcards','content','content'],
    ARRAY['hero_banners','content','content'], ARRAY['notifications','support','support'],
    ARRAY['blog_posts','super','super']
  ];
BEGIN
  FOREACH v_spec SLICE 1 IN ARRAY v_specs LOOP
    t := v_spec[1];
    CONTINUE WHEN to_regclass('public.' || t) IS NULL;
    EXECUTE format('DROP POLICY IF EXISTS staff_scope_insert ON public.%I', t);
    EXECUTE format('CREATE POLICY staff_scope_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.admin_scope_allowed(%L))', t, v_spec[2]);
    EXECUTE format('DROP POLICY IF EXISTS staff_scope_update ON public.%I', t);
    EXECUTE format('CREATE POLICY staff_scope_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.admin_scope_allowed(%L)) WITH CHECK (public.admin_scope_allowed(%L))', t, v_spec[2], v_spec[2]);
    EXECUTE format('DROP POLICY IF EXISTS staff_scope_delete ON public.%I', t);
    EXECUTE format('CREATE POLICY staff_scope_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.admin_scope_allowed(%L))', t, v_spec[3]);
  END LOOP;
END $$;
