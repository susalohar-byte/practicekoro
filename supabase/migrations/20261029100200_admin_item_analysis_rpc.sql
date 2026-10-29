-- ============================================================================
-- Migration: 20261029100200_admin_item_analysis_rpc.sql
-- Egress: Admin -> Item Analysis used to download every attempt_answers row
-- (with the full question embedded in each row) and aggregate in the browser.
-- admin_item_analysis() does the same aggregation in Postgres and returns one
-- object per question, so the page receives one row per question instead of
-- one per answer.
--
-- Access: callers need the same rights the old direct read needed in practice
-- (attempt_answers is readable by staff with the 'content' scope:
-- super_admin or content_writer), checked with public.admin_scope_allowed like
-- the other admin RPCs.
--
-- Result: a jsonb array (not a set of rows) so PostgREST's max-rows cap can
-- never truncate it. Order = first answer id per question, ascending, which is
-- the order the old client loop produced.
-- Idempotent: CREATE OR REPLACE + explicit grants.
-- ============================================================================

begin;

create or replace function public.admin_item_analysis(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.admin_scope_allowed('content') then
    raise exception 'Insufficient active staff permissions' using errcode = '42501';
  end if;
  if p_start is not null and p_end is not null and p_start > p_end then
    raise exception 'Invalid reporting range' using errcode = '22023';
  end if;

  with answers as (
    select
      aa.id,
      aa.question_id,
      -- The client treated NULL and '' as skipped.
      nullif(aa.selected_option, '') is null as skipped,
      upper(aa.selected_option) as opt,
      aa.is_correct is true as correct,
      aa.time_spent_seconds as secs
    from public.attempt_answers aa
    where (p_start is null or aa.created_at >= p_start)
      and (p_end is null or aa.created_at <= p_end)
  ),
  agg as (
    select
      a.question_id,
      (array_agg(a.id order by a.id))[1] as first_answer_id,
      count(*) as total,
      count(*) filter (where not a.skipped and a.correct) as correct,
      count(*) filter (where not a.skipped and not a.correct) as wrong,
      count(*) filter (where a.skipped) as skipped,
      coalesce(sum(a.secs) filter (where a.secs > 0), 0) as total_time,
      count(*) filter (where a.secs > 0) as timed_count,
      count(*) filter (where not a.skipped and a.opt = 'A') as opt_a,
      count(*) filter (where not a.skipped and a.opt = 'B') as opt_b,
      count(*) filter (where not a.skipped and a.opt = 'C') as opt_c,
      count(*) filter (where not a.skipped and a.opt = 'D') as opt_d
    from answers a
    group by a.question_id
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'question_id', agg.question_id,
      'total', agg.total,
      'correct', agg.correct,
      'wrong', agg.wrong,
      'skipped', agg.skipped,
      'total_time', agg.total_time,
      'timed_count', agg.timed_count,
      'option_counts', jsonb_build_object('A', agg.opt_a, 'B', agg.opt_b, 'C', agg.opt_c, 'D', agg.opt_d),
      -- Same shape as the old PostgREST embed (questions -> subjects/chapters -> exams).
      'question', case when q.id is null then null else jsonb_build_object(
        'id', q.id,
        'question_text', q.question_text,
        'question_bengali_text', q.question_bengali_text,
        'subject_id', q.subject_id,
        'chapter_id', q.chapter_id,
        'difficulty', q.difficulty,
        'option_a', q.option_a,
        'option_b', q.option_b,
        'option_c', q.option_c,
        'option_d', q.option_d,
        'correct_option', q.correct_option,
        'explanation', q.explanation,
        'subjects', case when qs.id is null then null else jsonb_build_object(
          'id', qs.id, 'name', qs.name,
          'exams', case when qse.id is null then null else jsonb_build_object('id', qse.id, 'title', qse.title) end
        ) end,
        'chapters', case when ch.id is null then null else jsonb_build_object(
          'id', ch.id, 'name', ch.name,
          'subjects', case when cs.id is null then null else jsonb_build_object(
            'id', cs.id, 'name', cs.name,
            'exams', case when cse.id is null then null else jsonb_build_object('id', cse.id, 'title', cse.title) end
          ) end
        ) end
      ) end
    )
    order by agg.first_answer_id
  ), '[]'::jsonb)
  into v_result
  from agg
  left join public.questions q on q.id = agg.question_id
  left join public.subjects qs on qs.id = q.subject_id
  left join public.exams qse on qse.id = qs.exam_id
  left join public.chapters ch on ch.id = q.chapter_id
  left join public.subjects cs on cs.id = ch.subject_id
  left join public.exams cse on cse.id = cs.exam_id;

  return v_result;
end;
$$;

comment on function public.admin_item_analysis(timestamptz, timestamptz) is
  'Admin Item Analysis: per-question answer aggregates (content scope). Replaces reading every attempt_answers row in the browser.';

revoke all on function public.admin_item_analysis(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_item_analysis(timestamptz, timestamptz) to authenticated, service_role;

commit;
