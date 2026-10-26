-- Students may reply on their own support tickets.
--
-- support_ticket_messages has no INSERT policy for students, and send_support_ticket_message is
-- staff-only, so student replies from the web panel and the app were rejected. This adds a
-- SECURITY DEFINER function instead of opening table inserts: the server, not the client, sets
-- author_id, author_name and author_kind = 'student', so a student cannot post as support staff
-- or as an internal note, and can only post on a ticket they own that is not closed.

CREATE OR REPLACE FUNCTION public.student_reply_support_ticket(p_ticket_id uuid, p_body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_ticket public.support_tickets;
  v_message public.support_ticket_messages;
  v_body TEXT := BTRIM(COALESCE(p_body, ''));
  v_name TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.account_is_active(v_user) THEN
    RAISE EXCEPTION 'Your account is not active' USING ERRCODE = '42501';
  END IF;
  IF v_body = '' THEN
    RAISE EXCEPTION 'Message cannot be empty' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_body) > 2000 THEN
    RAISE EXCEPTION 'Message is too long (2000 characters max)' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND OR v_ticket.user_id IS DISTINCT FROM v_user THEN
    RAISE EXCEPTION 'Ticket not found' USING ERRCODE = 'P0002';
  END IF;
  IF lower(COALESCE(v_ticket.status, '')) = 'closed' THEN
    RAISE EXCEPTION 'This ticket is closed' USING ERRCODE = '42501';
  END IF;

  SELECT NULLIF(BTRIM(full_name), '') INTO v_name FROM public.profiles WHERE id = v_user;

  INSERT INTO public.support_ticket_messages (ticket_id, author_id, author_name, author_kind, body)
  VALUES (p_ticket_id, v_user, COALESCE(v_name, v_ticket.student_name, 'Student'), 'student', v_body)
  RETURNING * INTO v_message;

  UPDATE public.support_tickets SET updated_at = NOW() WHERE id = p_ticket_id;

  RETURN jsonb_build_object('success', true, 'message', to_jsonb(v_message));
END;
$function$;

REVOKE ALL ON FUNCTION public.student_reply_support_ticket(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_reply_support_ticket(uuid, text) TO authenticated;
