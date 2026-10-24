-- PracticeKoro: Live Test foundation
create extension if not exists pgcrypto;

alter table if exists public.test_series
  add column if not exists is_featured boolean not null default false;

create table if not exists public.live_tests (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  exam_id text references public.exams(id) on delete set null,
  test_series_id text references public.test_series(id) on delete set null,
  test_id text not null references public.tests(id) on delete restrict,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  instructions text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  subscription_required boolean not null default false,
  max_participants integer,
  result_visibility text not null default 'immediate' check (result_visibility in ('immediate','after_end','manual')),
  ranking_enabled boolean not null default true,
  status text not null default 'draft' check (status in ('draft','scheduled','live','completed','cancelled','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end_at > scheduled_start_at)
);

create index if not exists live_tests_schedule_idx on public.live_tests(status, scheduled_start_at);
create index if not exists live_tests_test_idx on public.live_tests(test_id);

create table if not exists public.live_test_participants (
  id uuid primary key default gen_random_uuid(),
  live_test_id text not null references public.live_tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','started','completed','cancelled')),
  joined_at timestamptz not null default now(),
  unique(live_test_id,user_id)
);

create index if not exists live_test_participants_user_idx on public.live_test_participants(user_id);

create or replace function public.is_pk_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.role::text,'') in ('admin','super_admin')
  );
$$;

alter table public.live_tests enable row level security;
alter table public.live_test_participants enable row level security;

drop policy if exists live_tests_public_read on public.live_tests;
create policy live_tests_public_read on public.live_tests for select using (
  visibility = 'public' and status in ('scheduled','live','completed')
);

drop policy if exists live_tests_admin_all on public.live_tests;
create policy live_tests_admin_all on public.live_tests for all using (public.is_pk_admin()) with check (public.is_pk_admin());

drop policy if exists live_participant_own_read on public.live_test_participants;
create policy live_participant_own_read on public.live_test_participants for select using (user_id = auth.uid() or public.is_pk_admin());

drop policy if exists live_participant_own_insert on public.live_test_participants;
create policy live_participant_own_insert on public.live_test_participants for insert with check (user_id = auth.uid());

drop policy if exists live_participant_admin_all on public.live_test_participants;
create policy live_participant_admin_all on public.live_test_participants for all using (public.is_pk_admin()) with check (public.is_pk_admin());
