-- Migration: 20261015060000_allow_public_read_audiobooks.sql
-- Allow anon/guest users to read published audiobooks and taxonomy so public browsing works seamlessly.

BEGIN;

-- 1. Grant SELECT on taxonomy and audiobooks to anon role
GRANT SELECT ON public.audiobook_categories TO anon;
GRANT SELECT ON public.audiobook_subjects TO anon;
GRANT SELECT ON public.audiobook_topics TO anon;
GRANT SELECT ON public.audiobooks TO anon;

-- 2. Add RLS SELECT policies for anon
DROP POLICY IF EXISTS audiobook_taxonomy_read_anon ON public.audiobook_categories;
CREATE POLICY audiobook_taxonomy_read_anon ON public.audiobook_categories
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS audiobook_subject_read_anon ON public.audiobook_subjects;
CREATE POLICY audiobook_subject_read_anon ON public.audiobook_subjects
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS audiobook_topic_read_anon ON public.audiobook_topics;
CREATE POLICY audiobook_topic_read_anon ON public.audiobook_topics
  FOR SELECT TO anon USING (true);

-- Anon users can only see published audiobooks
DROP POLICY IF EXISTS audiobooks_read_anon ON public.audiobooks;
CREATE POLICY audiobooks_read_anon ON public.audiobooks
  FOR SELECT TO anon USING (status = 'published');

COMMIT;
