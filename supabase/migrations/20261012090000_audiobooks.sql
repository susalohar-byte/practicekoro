-- Audio Book module: an independent taxonomy (category -> subject -> topic) and
-- YouTube-backed audio books. Nothing here references exams, subjects, chapters
-- or exam_categories, so editing exam-prep content can never touch audio books
-- (and vice versa). Re-applying this migration is safe.
BEGIN;

-- 1. Taxonomy ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audiobook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  description text CHECK (description IS NULL OR length(description) <= 500),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS audiobook_categories_name_key
  ON public.audiobook_categories (lower(btrim(name)));

CREATE TABLE IF NOT EXISTS public.audiobook_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.audiobook_categories(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Target for the composite FK that keeps audiobooks.category_id consistent.
  CONSTRAINT audiobook_subjects_id_category_key UNIQUE (id, category_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS audiobook_subjects_name_key
  ON public.audiobook_subjects (category_id, lower(btrim(name)));

CREATE TABLE IF NOT EXISTS public.audiobook_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.audiobook_subjects(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audiobook_topics_id_subject_key UNIQUE (id, subject_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS audiobook_topics_name_key
  ON public.audiobook_topics (subject_id, lower(btrim(name)));

-- 2. Audio books -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audiobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR length(description) <= 500),
  narrator text CHECK (narrator IS NULL OR length(narrator) <= 120),
  category_id uuid NOT NULL REFERENCES public.audiobook_categories(id) ON DELETE RESTRICT,
  subject_id uuid NOT NULL,
  topic_id uuid,
  -- Only durable uploads from the validated raster pipeline; never data:/blob: previews.
  thumbnail_url text CHECK (
    thumbnail_url IS NULL
    OR thumbnail_url ~ '^https://[^/]+/storage/v1/object/public/banners/[A-Za-z0-9/_.-]+$'
  ),
  youtube_url text NOT NULL CHECK (
    length(youtube_url) <= 500
    AND youtube_url ~* '^https://(www\.|m\.|music\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be)/'
  ),
  youtube_video_id text NOT NULL CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 1 AND 86400),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audiobooks_video_id_in_url CHECK (strpos(youtube_url, youtube_video_id) > 0),
  -- Subject must belong to the category; topic must belong to the subject. Moving a
  -- subject to another category cascades; moving a topic across categories is rejected.
  CONSTRAINT audiobooks_subject_category_fkey FOREIGN KEY (subject_id, category_id)
    REFERENCES public.audiobook_subjects(id, category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT audiobooks_topic_subject_fkey FOREIGN KEY (topic_id, subject_id)
    REFERENCES public.audiobook_topics(id, subject_id) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS audiobooks_status_created_idx ON public.audiobooks (status, created_at DESC);
CREATE INDEX IF NOT EXISTS audiobooks_category_idx ON public.audiobooks (category_id);
CREATE INDEX IF NOT EXISTS audiobooks_subject_idx ON public.audiobooks (subject_id, category_id);
CREATE INDEX IF NOT EXISTS audiobooks_topic_idx ON public.audiobooks (topic_id, subject_id);

CREATE OR REPLACE FUNCTION public.audiobooks_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.narrator := nullif(btrim(coalesce(NEW.narrator, '')), '');
  NEW.description := nullif(btrim(coalesce(NEW.description, '')), '');
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  IF NEW.status = 'published' THEN
    IF TG_OP = 'INSERT' OR OLD.status <> 'published' THEN
      NEW.published_at := now();
    ELSE
      NEW.published_at := OLD.published_at;
    END IF;
  ELSE
    NEW.published_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audiobooks_before_write() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS audiobooks_before_write ON public.audiobooks;
CREATE TRIGGER audiobooks_before_write BEFORE INSERT OR UPDATE ON public.audiobooks
FOR EACH ROW EXECUTE FUNCTION public.audiobooks_before_write();

CREATE OR REPLACE FUNCTION public.audiobook_taxonomy_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  NEW.name := btrim(NEW.name);
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audiobook_taxonomy_touch() FROM PUBLIC, anon, authenticated;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['audiobook_categories', 'audiobook_subjects', 'audiobook_topics'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audiobook_taxonomy_touch ON public.%I', t);
    EXECUTE format('CREATE TRIGGER audiobook_taxonomy_touch BEFORE INSERT OR UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.audiobook_taxonomy_touch()', t);
  END LOOP;
END $$;

-- 3. Listen tracking (one listen per student, book and IST day) ---------------
CREATE TABLE IF NOT EXISTS public.audiobook_listens (
  audiobook_id uuid NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listen_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (audiobook_id, user_id, listen_date)
);

CREATE OR REPLACE FUNCTION public.record_audiobook_listen(p_audiobook_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.audiobooks WHERE id = p_audiobook_id AND status = 'published') THEN
    RETURN false;
  END IF;
  INSERT INTO public.audiobook_listens (audiobook_id, user_id)
  VALUES (p_audiobook_id, auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_audiobook_listen(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_audiobook_listen(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_admin_audiobook_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.admin_scope_allowed('content') THEN
    RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'total', count(*),
    'published', count(*) FILTER (WHERE status = 'published'),
    'drafts', count(*) FILTER (WHERE status = 'draft'),
    'total_duration_seconds', coalesce(sum(duration_seconds), 0),
    'timed_count', count(duration_seconds),
    'total_listens', (SELECT count(*) FROM public.audiobook_listens)
  ) INTO result FROM public.audiobooks;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_admin_audiobook_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_audiobook_stats() TO authenticated, service_role;

-- 4. Access control ------------------------------------------------------------
ALTER TABLE public.audiobook_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiobook_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiobook_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiobook_listens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.audiobook_categories, public.audiobook_subjects, public.audiobook_topics,
  public.audiobooks, public.audiobook_listens FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audiobook_categories, public.audiobook_subjects,
  public.audiobook_topics, public.audiobooks TO authenticated;
GRANT ALL ON public.audiobook_categories, public.audiobook_subjects, public.audiobook_topics,
  public.audiobooks, public.audiobook_listens TO service_role;
-- audiobook_listens: no client grants; written only via record_audiobook_listen().

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['audiobook_categories', 'audiobook_subjects', 'audiobook_topics'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS audiobook_taxonomy_read ON public.%I', t);
    EXECUTE format('CREATE POLICY audiobook_taxonomy_read ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['audiobook_categories', 'audiobook_subjects', 'audiobook_topics', 'audiobooks'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS audiobook_staff_insert ON public.%I', t);
    EXECUTE format('CREATE POLICY audiobook_staff_insert ON public.%I FOR INSERT TO authenticated
      WITH CHECK (public.admin_scope_allowed(''content''))', t);
    EXECUTE format('DROP POLICY IF EXISTS audiobook_staff_update ON public.%I', t);
    EXECUTE format('CREATE POLICY audiobook_staff_update ON public.%I FOR UPDATE TO authenticated
      USING (public.admin_scope_allowed(''content'')) WITH CHECK (public.admin_scope_allowed(''content''))', t);
    EXECUTE format('DROP POLICY IF EXISTS audiobook_staff_delete ON public.%I', t);
    EXECUTE format('CREATE POLICY audiobook_staff_delete ON public.%I FOR DELETE TO authenticated
      USING (public.admin_scope_allowed(''content''))', t);
  END LOOP;
END $$;

-- Students see published books only; content staff see drafts too.
DROP POLICY IF EXISTS audiobooks_read ON public.audiobooks;
CREATE POLICY audiobooks_read ON public.audiobooks FOR SELECT TO authenticated
USING (status = 'published' OR public.admin_scope_allowed('content'));

-- 5. Server-side mutation audit (same trigger as other content tables).
DO $$ DECLARE t text; BEGIN
  IF to_regprocedure('public.audit_privileged_mutation()') IS NOT NULL THEN
    FOREACH t IN ARRAY ARRAY['audiobook_categories', 'audiobook_subjects', 'audiobook_topics', 'audiobooks'] LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS audit_privileged_mutation ON public.%I', t);
      EXECUTE format('CREATE TRIGGER audit_privileged_mutation BEFORE INSERT OR UPDATE OR DELETE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.audit_privileged_mutation()', t);
    END LOOP;
  END IF;
END $$;

COMMIT;
