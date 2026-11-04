-- Deleting a mock test from the admin panel always failed once the test had questions:
-- admin_delete_record refused any record with child rows, and every test has rows in
-- test_questions (its question list) and usually test_exams (its exam tags). Those rows
-- belong to the test, so they no longer block deletion; the existing ON DELETE CASCADE
-- removes them. Student history (test_attempts, test_results) and Live Tests still block
-- it, with a message that says to archive the test instead.
CREATE OR REPLACE FUNCTION public.admin_delete_record(p_table text, p_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_role text; v_table regclass; v_found text; v_fk record; v_join text; v_blocked boolean;
BEGIN
  SELECT admin_role INTO v_role FROM public.profiles WHERE id=auth.uid() AND role='admin' AND account_status='active';
  IF v_role IS NULL THEN RAISE EXCEPTION 'Active administrator privileges required' USING ERRCODE='42501'; END IF;
  IF p_table NOT IN ('exams','subjects','chapters','questions','tests','test_series','notifications','blog_posts','hero_banners','cutoff_records','coupons','subscription_plans','live_tests','test_attempts','exam_categories','student_notes') THEN
    RAISE EXCEPTION 'Unsupported deletion target' USING ERRCODE='42501';
  END IF;
  IF v_role <> 'super_admin' AND NOT (
    v_role='content_writer' AND p_table IN ('exams','subjects','chapters','questions','blog_posts')
    OR v_role='support_agent' AND p_table IN ('notifications','student_notes')) THEN
    RAISE EXCEPTION 'Your role cannot permanently delete this record' USING ERRCODE='42501';
  END IF;
  IF p_table='exam_categories' AND EXISTS(SELECT 1 FROM public.exams WHERE category=(SELECT name FROM public.exam_categories WHERE id=p_id)) THEN RAISE EXCEPTION 'This category is used by exams. Reassign them before deletion'; END IF;
  IF p_table='subscription_plans' AND p_id='plan_free' THEN RAISE EXCEPTION 'The required Free plan cannot be deleted'; END IF;
  v_table := to_regclass(format('public.%I',p_table));
  IF v_table IS NULL THEN RAISE EXCEPTION 'This feature requires its database migration'; END IF;
  EXECUTE format('SELECT id::text FROM %s WHERE id::text=$1 FOR UPDATE',v_table) INTO v_found USING p_id;
  IF v_found IS NULL THEN RAISE EXCEPTION 'Record not found; nothing was deleted' USING ERRCODE='P0002'; END IF;
  -- Lock prevents new FK references racing the dependency check. Existing child rows
  -- block deletion, regardless of CASCADE/SET NULL, preserving history/shared content.
  FOR v_fk IN SELECT oid,conrelid,conkey,confkey FROM pg_constraint WHERE contype='f' AND confrelid=v_table LOOP
    SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ' ORDER BY i.n) INTO v_join
    FROM generate_subscripts(v_fk.conkey,1) i(n)
    JOIN pg_attribute ca ON ca.attrelid=v_fk.conrelid AND ca.attnum=v_fk.conkey[i.n]
    JOIN pg_attribute pa ON pa.attrelid=v_table AND pa.attnum=v_fk.confkey[i.n];
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s c JOIN %s p ON %s WHERE p.id::text=$1)',v_fk.conrelid::regclass,v_table,v_join)
      INTO v_blocked USING p_id;
    IF v_blocked AND p_table='tests' AND v_fk.conrelid IN (to_regclass('public.test_questions'),to_regclass('public.test_exams')) THEN
      -- A test's own question list and exam tags are part of the test; ON DELETE CASCADE removes them with it.
      v_blocked := false;
    END IF;
    IF v_blocked AND p_table='tests' THEN RAISE EXCEPTION 'Cannot delete this test: % still uses it (student attempts, results or a Live Test). Archive it instead so that history is kept.',v_fk.conrelid::regclass USING ERRCODE='23503'; END IF;
    IF v_blocked THEN RAISE EXCEPTION 'Cannot delete: linked records exist in %. Archive this item or explicitly unlink safe associations first.',v_fk.conrelid::regclass USING ERRCODE='23503'; END IF;
  END LOOP;
  EXECUTE format('DELETE FROM %s WHERE id::text=$1 RETURNING id::text',v_table) INTO v_found USING p_id;
  IF v_found IS NULL THEN RAISE EXCEPTION 'Deletion was not confirmed'; END IF;
  RETURN jsonb_build_object('success',true,'deleted_id',v_found);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_record(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_record(text,text) TO authenticated;
