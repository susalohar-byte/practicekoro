-- ============================================================================
-- Migration: 20261115100000_admin_delete_archived_test.sql
-- Description: Permanently delete an archived mock test.
--   admin_delete_record refuses a test that students attempted or a Live Test uses,
--   and the admin panel archives it instead. Admins had no way to remove test
--   papers made only for trying things out. This function deletes an archived
--   test for good: its questions list, exam links, attempts, answers, results and
--   past Live Test rows go with it (every foreign key to tests is ON DELETE CASCADE).
--   Guards: active super admin only; the test must already be archived; refused
--   while a Live Test using it is upcoming or running.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_archived_test(p_test_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_status text;
  v_attempts integer;
  v_live_tests integer;
BEGIN
  SELECT admin_role INTO v_role FROM public.profiles WHERE id=auth.uid() AND role='admin' AND account_status='active';
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Active administrator privileges required' USING ERRCODE = '42501';
  END IF;
  IF v_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Only a super admin can permanently delete a test' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_status FROM public.tests WHERE id = p_test_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found; nothing was deleted' USING ERRCODE = 'P0002';
  END IF;
  IF v_status IS DISTINCT FROM 'archived' THEN
    RAISE EXCEPTION 'Only archived tests can be permanently deleted. Archive this test first.'
      USING ERRCODE = '55000';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.live_tests lt
    WHERE lt.test_id = p_test_id AND public.is_live_test_active(lt, false)
  ) THEN
    RAISE EXCEPTION 'This test is used by an upcoming or running Live Test. Cancel or end that Live Test first.'
      USING ERRCODE = '55006';
  END IF;

  SELECT count(*) INTO v_attempts FROM public.test_attempts WHERE test_id = p_test_id;
  SELECT count(*) INTO v_live_tests FROM public.live_tests WHERE test_id = p_test_id;

  DELETE FROM public.tests WHERE id = p_test_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deletion was not confirmed';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', p_test_id,
    'attempts_deleted', v_attempts,
    'live_tests_deleted', v_live_tests
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_archived_test(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_archived_test(text) TO authenticated, service_role;
