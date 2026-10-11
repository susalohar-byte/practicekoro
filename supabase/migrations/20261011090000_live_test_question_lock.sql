-- Server-side live-test question lock.
-- The admin UI (isTestLockedForEditing in src/services/domains/admin.liveTests.ts) hides
-- question edits while a test belongs to a published Live Test that is upcoming or live.
-- This mirrors that rule inside save_test_questions so a stale tab or a direct RPC call
-- cannot change the paper of a scheduled/running live event.
--
-- A live_tests row locks its test when (same derivation as enrichLiveTest/deriveLiveTestStatus):
--   * it is published (unpublished rows are drafts), and
--   * its status is not cancelled / draft / ended / completed, and
--   * its window has not closed: now() <= start_at + greatest(1, duration) minutes,
--     where duration is the source test's duration_minutes (or 90 when unset), or the
--     live_tests snapshot when the test row is missing, exactly as the client resolves it.
-- Everything else below is the unchanged definition from 20261007102959_admin_crud_integrity.sql.

CREATE OR REPLACE FUNCTION public.save_test_questions(p_test_id text,p_questions jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE v_item jsonb;v_id uuid;v_count integer:=0;v_marks numeric;v_total numeric:=0; BEGIN
IF NOT public.can_mutate_admin_record('tests') THEN RAISE EXCEPTION 'Test-management privileges required' USING ERRCODE='42501';END IF;
PERFORM 1 FROM public.tests WHERE id=p_test_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Test not found';END IF;
IF EXISTS(
  SELECT 1 FROM public.live_tests lt LEFT JOIN public.tests t ON t.id=lt.test_id
  WHERE lt.test_id=p_test_id
    AND coalesce(lt.is_published,true)
    AND coalesce(lt.status,'upcoming') NOT IN ('cancelled','draft','ended','completed')
    AND now()<=lt.start_at+greatest(1,CASE WHEN t.id IS NOT NULL THEN coalesce(nullif(t.duration_minutes,0),90) ELSE coalesce(nullif(lt.duration_minutes,0),90) END)*interval '1 minute'
) THEN RAISE EXCEPTION 'Questions are locked while this test is part of an upcoming or live Live Test' USING ERRCODE='55006';END IF;
IF p_questions IS NULL OR jsonb_typeof(p_questions)<>'array' THEN RAISE EXCEPTION 'Questions must be an array';END IF;
IF jsonb_array_length(p_questions)<>(SELECT count(DISTINCT x->>'question_id') FROM jsonb_array_elements(p_questions)x) THEN RAISE EXCEPTION 'Unique valid question IDs required';END IF;
DELETE FROM public.test_questions WHERE test_id=p_test_id;
FOR v_item IN SELECT * FROM jsonb_array_elements(p_questions) LOOP
v_id:=(v_item->>'question_id')::uuid;IF NOT EXISTS(SELECT 1 FROM public.questions WHERE id=v_id) THEN RAISE EXCEPTION 'Question not found';END IF;
v_marks:=coalesce((v_item->>'marks')::numeric,1);IF v_marks<0 THEN RAISE EXCEPTION 'Marks cannot be negative';END IF;
v_count:=v_count+1;INSERT INTO public.test_questions(test_id,question_id,question_order,marks,negative_marks) VALUES(p_test_id,v_id,v_count,v_marks,0);v_total:=v_total+v_marks;
END LOOP;
UPDATE public.tests SET total_questions=v_count,total_marks=v_total,updated_at=now() WHERE id=p_test_id;
RETURN jsonb_build_object('success',true,'test_id',p_test_id,'total_questions',v_count,'total_marks',v_total);END;$$;
REVOKE ALL ON FUNCTION public.save_test_questions(text,jsonb) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.save_test_questions(text,jsonb) TO authenticated;
