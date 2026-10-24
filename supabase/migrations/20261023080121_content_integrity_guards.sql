-- Content integrity guards for Live Tests.
--
-- save_test_questions already refuses to change the paper of a test that belongs to an
-- upcoming or running Live Test (20261011090000_live_test_question_lock.sql), but other
-- client writes reach the same rows directly (single add/remove/marks edits, TXT bulk import,
-- question edits). These triggers enforce the same rule on the tables themselves:
--
-- 1. test_questions: no insert/update/delete while the test is live-locked.
-- 2. tests: while live-locked, the scoring fields (test_type, duration, negative marking,
--    total marks) are frozen; a test referenced by any non-cancelled Live Test stays a
--    Full Mock (the Live Test trigger only checks on live_tests writes).
-- 3. live_tests: no second active event for the same test, and a running event's source
--    test and duration cannot change.
-- 4. questions: the answer key and options of a question in a running Live Test are frozen.
--
-- The lock condition is the one used by save_test_questions (same derivation as the client).
-- Writes made with the service role or from SQL without a request JWT (migrations,
-- maintenance) are not blocked.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS trg_guard_live_locked_test_questions ON public.test_questions;
--   DROP TRIGGER IF EXISTS trg_guard_live_locked_tests ON public.tests;
--   DROP TRIGGER IF EXISTS trg_guard_live_test_events ON public.live_tests;
--   DROP TRIGGER IF EXISTS trg_guard_running_live_questions ON public.questions;
--   DROP FUNCTION IF EXISTS public.guard_live_locked_test_questions();
--   DROP FUNCTION IF EXISTS public.guard_live_locked_tests();
--   DROP FUNCTION IF EXISTS public.guard_live_test_events();
--   DROP FUNCTION IF EXISTS public.guard_running_live_questions();
--   DROP FUNCTION IF EXISTS public.is_live_test_active(public.live_tests, boolean);
--   DROP FUNCTION IF EXISTS public.is_test_live_locked(text, boolean);
--   DROP FUNCTION IF EXISTS public.live_lock_applies();
BEGIN;

-- Only client (anon/authenticated) requests are guarded.
CREATE OR REPLACE FUNCTION public.live_lock_applies()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT coalesce(auth.role(), '') IN ('authenticated', 'anon');
$$;

-- Whether one live_tests row is active: published, not cancelled/draft/ended/completed and its
-- window has not closed. With p_running_only, it must also have started.
CREATE OR REPLACE FUNCTION public.is_live_test_active(lt public.live_tests, p_running_only boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT coalesce(lt.is_published, true)
    AND coalesce(lt.status, 'upcoming') NOT IN ('cancelled', 'draft', 'ended', 'completed')
    AND (NOT p_running_only OR now() >= lt.start_at)
    AND now() <= lt.start_at + greatest(1, coalesce(
          (SELECT nullif(t.duration_minutes, 0) FROM public.tests t WHERE t.id = lt.test_id),
          nullif(lt.duration_minutes, 0),
          90)) * interval '1 minute';
$$;

CREATE OR REPLACE FUNCTION public.is_test_live_locked(p_test_id text, p_running_only boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.live_tests lt
    WHERE lt.test_id = p_test_id AND public.is_live_test_active(lt, p_running_only)
  );
$$;

REVOKE ALL ON FUNCTION public.is_live_test_active(public.live_tests, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_test_live_locked(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_live_test_active(public.live_tests, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_test_live_locked(text, boolean) TO authenticated;

-- 1. test_questions --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_live_locked_test_questions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.live_lock_applies() THEN
    RETURN coalesce(NEW, OLD);
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') AND public.is_test_live_locked(OLD.test_id) THEN
    RAISE EXCEPTION 'Questions are locked while this test is part of an upcoming or live Live Test'
      USING ERRCODE = '55006';
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND public.is_test_live_locked(NEW.test_id) THEN
    RAISE EXCEPTION 'Questions are locked while this test is part of an upcoming or live Live Test'
      USING ERRCODE = '55006';
  END IF;
  RETURN coalesce(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_live_locked_test_questions ON public.test_questions;
CREATE TRIGGER trg_guard_live_locked_test_questions
BEFORE INSERT OR UPDATE OR DELETE ON public.test_questions
FOR EACH ROW EXECUTE FUNCTION public.guard_live_locked_test_questions();

-- 2. tests -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_live_locked_tests()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.live_lock_applies() THEN
    RETURN NEW;
  END IF;
  IF OLD.test_type = 'full_mock' AND NEW.test_type IS DISTINCT FROM 'full_mock' AND EXISTS (
    SELECT 1 FROM public.live_tests lt
    WHERE lt.test_id = OLD.id AND coalesce(lt.status, 'upcoming') <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'This test is used by a Live Test and must stay a Full Mock test'
      USING ERRCODE = '23514';
  END IF;
  IF (NEW.test_type IS DISTINCT FROM OLD.test_type
      OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
      OR NEW.negative_marking IS DISTINCT FROM OLD.negative_marking
      OR NEW.total_marks IS DISTINCT FROM OLD.total_marks)
     AND public.is_test_live_locked(OLD.id) THEN
    RAISE EXCEPTION 'Scoring settings are locked while this test is part of an upcoming or live Live Test'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_live_locked_tests ON public.tests;
CREATE TRIGGER trg_guard_live_locked_tests
BEFORE UPDATE ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.guard_live_locked_tests();

-- 3. live_tests --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_live_test_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.live_lock_applies() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND public.is_live_test_active(OLD, true)
     AND (NEW.test_id IS DISTINCT FROM OLD.test_id
          OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes) THEN
    RAISE EXCEPTION 'The source test and duration of a running Live Test cannot be changed'
      USING ERRCODE = '55006';
  END IF;
  IF (TG_OP = 'INSERT' OR NEW.test_id IS DISTINCT FROM OLD.test_id
      OR NEW.status IS DISTINCT FROM OLD.status OR NEW.is_published IS DISTINCT FROM OLD.is_published
      OR NEW.start_at IS DISTINCT FROM OLD.start_at)
     AND public.is_live_test_active(NEW, false)
     AND EXISTS (
       SELECT 1 FROM public.live_tests other
       WHERE other.test_id = NEW.test_id AND other.id <> NEW.id
         AND public.is_live_test_active(other, false)
     ) THEN
    RAISE EXCEPTION 'This test is already scheduled for an active or upcoming Live Test event'
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_live_test_events ON public.live_tests;
CREATE TRIGGER trg_guard_live_test_events
BEFORE INSERT OR UPDATE ON public.live_tests
FOR EACH ROW EXECUTE FUNCTION public.guard_live_test_events();

-- 4. questions ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_running_live_questions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.live_lock_applies() THEN
    RETURN NEW;
  END IF;
  IF (NEW.correct_option IS DISTINCT FROM OLD.correct_option
      OR NEW.option_a IS DISTINCT FROM OLD.option_a
      OR NEW.option_b IS DISTINCT FROM OLD.option_b
      OR NEW.option_c IS DISTINCT FROM OLD.option_c
      OR NEW.option_d IS DISTINCT FROM OLD.option_d)
     AND EXISTS (
       SELECT 1 FROM public.test_questions tq
       WHERE tq.question_id = OLD.id AND public.is_test_live_locked(tq.test_id, true)
     ) THEN
    RAISE EXCEPTION 'The answer key of a question in a running Live Test cannot be changed'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_running_live_questions ON public.questions;
CREATE TRIGGER trg_guard_running_live_questions
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.guard_running_live_questions();

COMMIT;
