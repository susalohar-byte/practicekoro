-- ============================================================================
-- Migration: 20261029150000_remove_audiobooks.sql
-- Remove the Audiobook feature. No admin, student-web or mobile screen used it;
-- the only client code (src/services/domains/audiobooks.ts) is deleted with this.
--
-- DESTRUCTIVE: drops the five audiobook tables and their rows (categories,
-- subjects, topics, audiobooks with their YouTube links, listen history).
-- Policies, triggers and indexes on these tables go with them.
-- Idempotent; safe to re-run.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_admin_audiobook_stats();
DROP FUNCTION IF EXISTS public.record_audiobook_listen(uuid);

-- Children first so no CASCADE is needed; an unexpected dependent object
-- (a view or function outside this feature) then fails the migration loudly.
DROP TABLE IF EXISTS public.audiobook_listens;
DROP TABLE IF EXISTS public.audiobooks;
DROP TABLE IF EXISTS public.audiobook_topics;
DROP TABLE IF EXISTS public.audiobook_subjects;
DROP TABLE IF EXISTS public.audiobook_categories;

-- Trigger functions, now unused.
DROP FUNCTION IF EXISTS public.audiobooks_before_write();
DROP FUNCTION IF EXISTS public.audiobook_taxonomy_touch();
