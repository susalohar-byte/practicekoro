-- ============================================================================
-- Migration: 20261029100300_public_blog_rpcs.sql
-- Egress: every landing-page visit read the whole `blog_posts_list` app
-- setting (every post with its full HTML body) just to draw three cards.
--
--   public_blog_summaries(p_limit, p_featured_first) -> card fields only
--   public_blog_post(p_slug)                          -> one full post
--
-- Visibility is the same rule the client used (src/pages/blog/publicBlog.ts):
-- a post needs a slug and is either `published`, or `scheduled` with a
-- scheduledAt that has passed. Order is newest first by
-- publishedAt || scheduledAt || createdAt, ties kept in list order (the client
-- sort was stable). p_featured_first puts featured posts first, which is what
-- the landing page's pickHomepagePosts() does.
--
-- Both functions share the same `visible` CTE (kept inline so no helper that
-- returns full bodies is exposed over the API).
-- SECURITY INVOKER: both functions read app_settings through its existing RLS
-- (the blog_posts_list row is already readable by anon), so they expose nothing
-- new. Idempotent: CREATE OR REPLACE + explicit grants.
-- ============================================================================

begin;

-- Card fields only: never the article body.
create or replace function public.public_blog_summaries(
  p_limit integer default null,
  p_featured_first boolean default false
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with visible as (
    with raw as (
      select case when jsonb_typeof(s.value) = 'string' then (s.value #>> '{}')::jsonb else s.value end as v
      from public.app_settings s
      where s.id = 'blog_posts_list'
    ),
    posts as (
      select p.post, p.ord
      from raw, jsonb_array_elements(case when jsonb_typeof(raw.v) = 'array' then raw.v else '[]'::jsonb end)
        with ordinality as p(post, ord)
      where jsonb_typeof(p.post) = 'object'
    ),
    timed as (
      select
        posts.post,
        posts.ord,
        -- JS `a || b || c`: empty strings fall through to the next field.
        nullif(posts.post ->> 'publishedAt', '') as published_at,
        nullif(posts.post ->> 'scheduledAt', '') as scheduled_at,
        nullif(posts.post ->> 'createdAt', '') as created_at
      from posts
    )
    select
      t.post,
      case when pg_catalog.pg_input_is_valid(coalesce(t.published_at, t.scheduled_at, t.created_at), 'timestamptz')
           then coalesce(t.published_at, t.scheduled_at, t.created_at)::timestamptz end as sort_time,
      coalesce(t.post -> 'isFeatured' not in ('null'::jsonb, 'false'::jsonb, '0'::jsonb, '""'::jsonb), false) as featured,
      t.ord
    from timed t
    where coalesce(t.post ->> 'slug', '') <> ''
      and (
        t.post ->> 'status' = 'published'
        or (
          t.post ->> 'status' = 'scheduled'
          and t.scheduled_at is not null
          and pg_catalog.pg_input_is_valid(t.scheduled_at, 'timestamptz')
          and t.scheduled_at::timestamptz <= now()
        )
      )
  )
  select coalesce(jsonb_agg(x.summary order by x.rn), '[]'::jsonb)
  from (
    select
      (select jsonb_object_agg(e.key, e.value)
         from jsonb_each(v.post) e
        where e.key in ('id', 'title', 'slug', 'excerpt', 'category', 'author', 'status', 'isFeatured',
                        'thumbnail', 'readTime', 'publishedAt', 'scheduledAt', 'createdAt')) as summary,
      row_number() over (
        order by case when p_featured_first then v.featured end desc nulls last,
                 v.sort_time desc nulls last, v.ord
      ) as rn
    from visible v
  ) x
  where p_limit is null or x.rn <= greatest(p_limit, 0);
$$;

-- One full post (with its body) by slug; the newest visible post wins on duplicate slugs.
create or replace function public.public_blog_post(p_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with visible as (
    with raw as (
      select case when jsonb_typeof(s.value) = 'string' then (s.value #>> '{}')::jsonb else s.value end as v
      from public.app_settings s
      where s.id = 'blog_posts_list'
    ),
    posts as (
      select p.post, p.ord
      from raw, jsonb_array_elements(case when jsonb_typeof(raw.v) = 'array' then raw.v else '[]'::jsonb end)
        with ordinality as p(post, ord)
      where jsonb_typeof(p.post) = 'object'
    ),
    timed as (
      select
        posts.post,
        posts.ord,
        -- JS `a || b || c`: empty strings fall through to the next field.
        nullif(posts.post ->> 'publishedAt', '') as published_at,
        nullif(posts.post ->> 'scheduledAt', '') as scheduled_at,
        nullif(posts.post ->> 'createdAt', '') as created_at
      from posts
    )
    select
      t.post,
      case when pg_catalog.pg_input_is_valid(coalesce(t.published_at, t.scheduled_at, t.created_at), 'timestamptz')
           then coalesce(t.published_at, t.scheduled_at, t.created_at)::timestamptz end as sort_time,
      coalesce(t.post -> 'isFeatured' not in ('null'::jsonb, 'false'::jsonb, '0'::jsonb, '""'::jsonb), false) as featured,
      t.ord
    from timed t
    where coalesce(t.post ->> 'slug', '') <> ''
      and (
        t.post ->> 'status' = 'published'
        or (
          t.post ->> 'status' = 'scheduled'
          and t.scheduled_at is not null
          and pg_catalog.pg_input_is_valid(t.scheduled_at, 'timestamptz')
          and t.scheduled_at::timestamptz <= now()
        )
      )
  )
  select v.post
  from visible v
  where v.post ->> 'slug' = p_slug
  order by v.sort_time desc nulls last, v.ord
  limit 1;
$$;

revoke all on function public.public_blog_summaries(integer, boolean) from public;
revoke all on function public.public_blog_post(text) from public;
grant execute on function public.public_blog_summaries(integer, boolean) to anon, authenticated, service_role;
grant execute on function public.public_blog_post(text) to anon, authenticated, service_role;

commit;
