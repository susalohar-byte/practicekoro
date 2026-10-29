-- ============================================================================
-- Migration: 20261029130000_app_settings_lists_to_tables.sql
--
-- `public.app_settings` was used as a document store: whole lists lived in one
-- jsonb value. Every read downloaded the whole list (a 2.4 MB inline banner
-- image once locked the project out on egress), and the live-test mirror drifted
-- from `public.live_tests` and showed a draft test to students.
--
-- Each list becomes a real table (one row per item, typed columns, RLS):
--
--   app_settings id               -> table
--   banners_hero_list             -> public.hero_banners
--   blog_posts_list               -> public.blog_posts
--   popular_exams_config          -> public.popular_exam_cards
--   popular_test_series_config    -> public.popular_test_series_cards
--   live_tests_schedule_list      -> removed (public.live_tests is the only source)
--
-- Data is copied from the current JSON rows (ids and order preserved) only
-- while the target table is still empty, so re-running never resurrects items
-- deleted after the first run.
--
-- Old app builds: mobile builds before this change read
-- app_settings.banners_hero_list. That row stays and becomes a read-only
-- snapshot of the active banners, rebuilt by a statement trigger on
-- public.hero_banners (small JSON, URLs only). Drop the trigger, the snapshot
-- function and the row once `mobile_min_build_number` forces every phone onto a
-- build that reads public.hero_banners. The other old rows (blog_posts_list,
-- popular_exams_config, popular_test_series_config) are left untouched and
-- frozen; nothing reads them any more and they can be deleted later.
-- live_tests_schedule_list is emptied to `[]`: old mobile builds read it only
-- when the live_tests query fails, and an empty list is the safe answer.
--
-- Admin writes keep going through public.admin_mutate_collection (same
-- arguments and return shape) and the new public.admin_save_popular_exam_cards.
-- Both are SECURITY DEFINER with the content-scope check written inline (the
-- RLS helpers may later move to another schema; function bodies resolve names
-- at run time, policies do not).
--
-- Idempotent: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE /
-- DROP ... IF EXISTS, and guarded data copies.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. JSON value helpers (internal; not callable through the API)
-- ---------------------------------------------------------------------------

-- A scalar as text (strings, numbers, booleans); null for null/objects/arrays.
create or replace function public.pk_json_text(p jsonb)
returns text language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p) in ('string', 'number', 'boolean') then p #>> '{}' end;
$$;

-- JavaScript truthiness of a JSON value (missing, null, false, 0 and "" are false).
create or replace function public.pk_json_truthy(p jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p not in ('null'::jsonb, 'false'::jsonb, '0'::jsonb, '""'::jsonb), false);
$$;

-- A timestamp, or null when the value is missing, empty or not a valid date.
create or replace function public.pk_json_ts(p jsonb)
returns timestamptz language sql stable set search_path = '' as $$
  select case
    when nullif(public.pk_json_text(p), '') is not null
     and pg_catalog.pg_input_is_valid(public.pk_json_text(p), 'timestamptz')
    then public.pk_json_text(p)::timestamptz
  end;
$$;

-- A whole number (rounded, clamped to integer range), or null.
create or replace function public.pk_json_int(p jsonb)
returns integer language sql immutable set search_path = '' as $$
  select case
    when nullif(btrim(public.pk_json_text(p)), '') is not null
     and pg_catalog.pg_input_is_valid(btrim(public.pk_json_text(p)), 'numeric')
     and btrim(public.pk_json_text(p))::numeric not in ('NaN'::numeric)
    then greatest(-2147483648, least(2147483647, round(btrim(public.pk_json_text(p))::numeric)))::integer
  end;
$$;

-- A JSON array as text[] (non-scalar items dropped); '{}' otherwise.
create or replace function public.pk_json_text_array(p jsonb)
returns text[] language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p) = 'array'
    then coalesce((select array_agg(public.pk_json_text(e.v) order by e.n)
                     from jsonb_array_elements(p) with ordinality as e(v, n)
                    where public.pk_json_text(e.v) is not null), '{}'::text[])
    else '{}'::text[] end;
$$;

-- JavaScript Date#toISOString() format (UTC, milliseconds, trailing Z).
create or replace function public.pk_iso(p timestamptz)
returns text language sql immutable set search_path = '' as $$
  select to_char(p at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- Home hero banners. Production has no hero_banners table (migration 037 was
-- never applied there); in an environment that has 037's table the columns are
-- added in place.
create table if not exists public.hero_banners (
  id text primary key,
  title text not null default ''
);
alter table public.hero_banners
  add column if not exists badge_text text,
  add column if not exists title text not null default '',
  add column if not exists highlight_word text,
  add column if not exists subtitle text,
  add column if not exists primary_cta_text text not null default 'Start Now',
  add column if not exists primary_cta_link text not null default '/exams',
  add column if not exists secondary_cta_text text,
  add column if not exists secondary_cta_link text,
  add column if not exists feature_pills text[] not null default '{}'::text[],
  add column if not exists image_url text not null default '',
  add column if not exists mobile_image_url text,
  add column if not exists banner_type text not null default 'full_image',
  add column if not exists show_text_overlay boolean not null default false,
  add column if not exists theme_gradient text not null default 'blue',
  add column if not exists target_audience text not null default 'all',
  add column if not exists placement text not null default 'home_hero',
  add column if not exists starts_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists click_count integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists display_order integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();
alter table public.hero_banners alter column image_url set default '';
alter table public.hero_banners drop constraint if exists hero_banners_banner_type_check;
alter table public.hero_banners add constraint hero_banners_banner_type_check
  check (banner_type in ('full_image', 'text_overlay'));
alter table public.hero_banners drop constraint if exists hero_banners_click_count_check;
alter table public.hero_banners add constraint hero_banners_click_count_check
  check (click_count >= 0);
comment on table public.hero_banners is
  'Home hero banners (admin: Banners). Replaces app_settings.banners_hero_list, which is now a read-only snapshot for old app builds.';

-- Blog posts. `seq` keeps the admin list order (insertion order).
create table if not exists public.blog_posts (
  id text primary key,
  seq bigint generated by default as identity,
  title text not null default '',
  slug text not null default '',
  excerpt text not null default '',
  content text not null default '',
  category text,
  author text,
  author_role text,
  author_avatar text,
  status text not null default 'draft'
    constraint blog_posts_status_check check (status in ('draft', 'published', 'scheduled', 'archived')),
  is_featured boolean not null default false,
  thumbnail text,
  views integer not null default 0,
  unique_views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  read_time text,
  published_at timestamptz,
  scheduled_at timestamptz,
  seo_title text,
  seo_description text,
  seo_keywords text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.blog_posts is
  'Blog posts (admin: Blog). Replaces app_settings.blog_posts_list. Visitors read through public_blog_summaries / public_blog_post.';

-- Popular Exam cards.
create table if not exists public.popular_exam_cards (
  id text primary key,
  exam_id text,
  title text not null default '',
  slug text,
  route text not null default '',
  tests_count text not null default '',
  card_badge text,
  card_gradient_start text not null default '',
  card_gradient_end text not null default '',
  card_arrow_color text,
  card_bg_image text,
  card_emblem_url text,
  order_index integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.popular_exam_cards is
  'Popular Exam cards. Replaces app_settings.popular_exams_config. exam_id is not a foreign key: cards may name an exam that does not exist yet.';

-- Popular Test Series cards (no screen reads or writes them today; kept as data).
create table if not exists public.popular_test_series_cards (
  id text primary key,
  test_series_id text,
  title text not null default '',
  subtitle text,
  badge_text text,
  route text,
  card_gradient_start text not null default '',
  card_gradient_end text not null default '',
  card_arrow_color text,
  card_bg_image text,
  card_logo_url text,
  full_mock_count integer,
  topic_test_count integer,
  pyq_test_count integer,
  order_index integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.popular_test_series_cards is
  'Popular Test Series cards. Replaces app_settings.popular_test_series_config.';

-- ---------------------------------------------------------------------------
-- 2. JSON <-> row mapping (camelCase JSON is what the apps already speak)
-- ---------------------------------------------------------------------------

-- Banner JSON (camelCase, or the snake_case of migration 037) -> snake_case
-- object for jsonb_populate_record. Same defaults as the admin's sanitizeBanner().
create or replace function public.hero_banner_normalize(p jsonb, p_default_order integer default 1)
returns jsonb language sql stable set search_path = '' as $$
  with v as (
    select
      coalesce(nullif(public.pk_json_text(p -> 'bannerType'), ''), nullif(public.pk_json_text(p -> 'banner_type'), '')) as banner_type_raw,
      case when p ? 'showTextOverlay' then public.pk_json_truthy(p -> 'showTextOverlay')
           when p ? 'show_text_overlay' then public.pk_json_truthy(p -> 'show_text_overlay') end as overlay_raw
  )
  select jsonb_build_object(
    'id', public.pk_json_text(p -> 'id'),
    'badge_text', coalesce(public.pk_json_text(p -> 'badgeText'), public.pk_json_text(p -> 'badge_text')),
    'title', coalesce(public.pk_json_text(p -> 'title'), ''),
    'highlight_word', coalesce(public.pk_json_text(p -> 'highlightWord'), public.pk_json_text(p -> 'highlight_word')),
    'subtitle', public.pk_json_text(p -> 'subtitle'),
    'primary_cta_text', coalesce(nullif(public.pk_json_text(p -> 'primaryCtaText'), ''), nullif(public.pk_json_text(p -> 'primary_cta_text'), ''), 'Start Now'),
    'primary_cta_link', coalesce(nullif(public.pk_json_text(p -> 'primaryCtaLink'), ''), nullif(public.pk_json_text(p -> 'primary_cta_link'), ''), '/exams'),
    'secondary_cta_text', coalesce(public.pk_json_text(p -> 'secondaryCtaText'), public.pk_json_text(p -> 'secondary_cta_text')),
    'secondary_cta_link', coalesce(public.pk_json_text(p -> 'secondaryCtaLink'), public.pk_json_text(p -> 'secondary_cta_link')),
    'feature_pills', to_jsonb(public.pk_json_text_array(coalesce(p -> 'featurePills', p -> 'feature_pills'))),
    'image_url', coalesce(public.pk_json_text(p -> 'imageUrl'), public.pk_json_text(p -> 'image_url'), ''),
    'mobile_image_url', coalesce(public.pk_json_text(p -> 'mobileImageUrl'), public.pk_json_text(p -> 'mobile_image_url')),
    'banner_type', case
       when v.banner_type_raw in ('full_image', 'text_overlay') then v.banner_type_raw
       when coalesce(v.overlay_raw, false) then 'text_overlay'
       else 'full_image' end,
    'show_text_overlay', coalesce(v.overlay_raw, v.banner_type_raw = 'text_overlay', false),
    'theme_gradient', coalesce(nullif(public.pk_json_text(p -> 'themeGradient'), ''), nullif(public.pk_json_text(p -> 'theme_gradient'), ''), 'blue'),
    'target_audience', coalesce(nullif(public.pk_json_text(p -> 'targetAudience'), ''), nullif(public.pk_json_text(p -> 'target_audience'), ''), 'all'),
    'placement', coalesce(nullif(public.pk_json_text(p -> 'placement'), ''), 'home_hero'),
    'starts_at', coalesce(public.pk_json_ts(p -> 'startsAt'), public.pk_json_ts(p -> 'starts_at')),
    'expires_at', coalesce(public.pk_json_ts(p -> 'expiresAt'), public.pk_json_ts(p -> 'expires_at')),
    'click_count', greatest(0, coalesce(public.pk_json_int(p -> 'clickCount'), public.pk_json_int(p -> 'click_count'), 0)),
    'is_active', case when p ? 'isActive' then public.pk_json_truthy(p -> 'isActive')
                      when p ? 'is_active' then public.pk_json_truthy(p -> 'is_active')
                      else true end,
    'display_order', coalesce(public.pk_json_int(p -> 'displayOrder'), public.pk_json_int(p -> 'display_order'), p_default_order, 1),
    'created_at', coalesce(public.pk_json_ts(p -> 'createdAt'), public.pk_json_ts(p -> 'created_at'), now()),
    'updated_at', coalesce(public.pk_json_ts(p -> 'updatedAt'), public.pk_json_ts(p -> 'updated_at'),
                           public.pk_json_ts(p -> 'createdAt'), public.pk_json_ts(p -> 'created_at'), now())
  )
  from v;
$$;

-- Banner row -> the camelCase object the apps (and old app builds) read.
create or replace function public.hero_banner_to_json(b public.hero_banners)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', b.id,
    'badgeText', b.badge_text,
    'title', b.title,
    'highlightWord', b.highlight_word,
    'subtitle', b.subtitle,
    'primaryCtaText', b.primary_cta_text,
    'primaryCtaLink', b.primary_cta_link,
    'secondaryCtaText', b.secondary_cta_text,
    'secondaryCtaLink', b.secondary_cta_link,
    'featurePills', to_jsonb(b.feature_pills),
    'imageUrl', b.image_url,
    'mobileImageUrl', b.mobile_image_url,
    'bannerType', b.banner_type,
    'showTextOverlay', b.show_text_overlay,
    'themeGradient', b.theme_gradient,
    'targetAudience', b.target_audience,
    'placement', b.placement,
    'startsAt', public.pk_iso(b.starts_at),
    'expiresAt', public.pk_iso(b.expires_at),
    'clickCount', b.click_count,
    'isActive', b.is_active,
    'displayOrder', b.display_order,
    'createdAt', public.pk_iso(b.created_at),
    'updatedAt', public.pk_iso(b.updated_at)
  ));
$$;

-- Blog post JSON (the admin's BlogPost shape) -> snake_case object.
create or replace function public.blog_post_normalize(p jsonb, p_default_created timestamptz default now())
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', public.pk_json_text(p -> 'id'),
    'title', coalesce(public.pk_json_text(p -> 'title'), ''),
    'slug', coalesce(public.pk_json_text(p -> 'slug'), ''),
    'excerpt', coalesce(public.pk_json_text(p -> 'excerpt'), ''),
    'content', coalesce(public.pk_json_text(p -> 'content'), ''),
    'category', public.pk_json_text(p -> 'category'),
    'author', public.pk_json_text(p -> 'author'),
    'author_role', public.pk_json_text(p -> 'authorRole'),
    'author_avatar', public.pk_json_text(p -> 'authorAvatar'),
    'status', case when public.pk_json_text(p -> 'status') in ('draft', 'published', 'scheduled', 'archived')
                   then public.pk_json_text(p -> 'status') else 'draft' end,
    'is_featured', public.pk_json_truthy(p -> 'isFeatured'),
    'thumbnail', public.pk_json_text(p -> 'thumbnail'),
    'views', greatest(0, coalesce(public.pk_json_int(p -> 'views'), 0)),
    'unique_views', greatest(0, coalesce(public.pk_json_int(p -> 'uniqueViews'), 0)),
    'likes', greatest(0, coalesce(public.pk_json_int(p -> 'likes'), 0)),
    'comments', greatest(0, coalesce(public.pk_json_int(p -> 'comments'), 0)),
    'shares', greatest(0, coalesce(public.pk_json_int(p -> 'shares'), 0)),
    'read_time', public.pk_json_text(p -> 'readTime'),
    'published_at', public.pk_json_ts(p -> 'publishedAt'),
    'scheduled_at', public.pk_json_ts(p -> 'scheduledAt'),
    'seo_title', public.pk_json_text(p -> 'seoTitle'),
    'seo_description', public.pk_json_text(p -> 'seoDescription'),
    'seo_keywords', public.pk_json_text(p -> 'seoKeywords'),
    'tags', to_jsonb(public.pk_json_text_array(p -> 'tags')),
    'created_at', coalesce(public.pk_json_ts(p -> 'createdAt'), p_default_created),
    'updated_at', coalesce(public.pk_json_ts(p -> 'updatedAt'), public.pk_json_ts(p -> 'createdAt'), p_default_created)
  );
$$;

-- Blog post row -> the full BlogPost object (admin list and public_blog_post).
create or replace function public.blog_post_to_json(b public.blog_posts)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', b.id,
    'title', b.title,
    'slug', b.slug,
    'excerpt', b.excerpt,
    'content', b.content,
    'category', b.category,
    'author', b.author,
    'authorRole', b.author_role,
    'authorAvatar', b.author_avatar,
    'status', b.status,
    'isFeatured', b.is_featured,
    'thumbnail', b.thumbnail,
    'views', b.views,
    'uniqueViews', b.unique_views,
    'likes', b.likes,
    'comments', b.comments,
    'shares', b.shares,
    'readTime', b.read_time,
    'publishedAt', public.pk_iso(b.published_at),
    'scheduledAt', public.pk_iso(b.scheduled_at),
    'createdAt', public.pk_iso(b.created_at),
    'updatedAt', public.pk_iso(b.updated_at),
    'seoTitle', b.seo_title,
    'seoDescription', b.seo_description,
    'seoKeywords', b.seo_keywords,
    'tags', to_jsonb(b.tags)
  );
$$;

-- Popular Exam card JSON (PopularExamCard) -> snake_case object.
create or replace function public.popular_exam_card_normalize(p jsonb, p_default_order integer default 1)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', public.pk_json_text(p -> 'id'),
    'exam_id', nullif(public.pk_json_text(p -> 'examId'), ''),
    'title', coalesce(public.pk_json_text(p -> 'title'), ''),
    'slug', public.pk_json_text(p -> 'slug'),
    'route', coalesce(public.pk_json_text(p -> 'route'), ''),
    'tests_count', coalesce(public.pk_json_text(p -> 'testsCount'), ''),
    'card_badge', public.pk_json_text(p -> 'cardBadge'),
    'card_gradient_start', coalesce(public.pk_json_text(p -> 'cardGradientStart'), ''),
    'card_gradient_end', coalesce(public.pk_json_text(p -> 'cardGradientEnd'), ''),
    'card_arrow_color', public.pk_json_text(p -> 'cardArrowColor'),
    'card_bg_image', public.pk_json_text(p -> 'cardBgImage'),
    'card_emblem_url', public.pk_json_text(p -> 'cardEmblemUrl'),
    'order_index', coalesce(public.pk_json_int(p -> 'orderIndex'), p_default_order, 1),
    'is_active', case when p ? 'isActive' then public.pk_json_truthy(p -> 'isActive') else true end
  );
$$;

create or replace function public.popular_exam_card_to_json(c public.popular_exam_cards)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', c.id,
    'examId', c.exam_id,
    'title', c.title,
    'slug', c.slug,
    'route', c.route,
    'testsCount', c.tests_count,
    'cardBadge', c.card_badge,
    'cardGradientStart', c.card_gradient_start,
    'cardGradientEnd', c.card_gradient_end,
    'cardArrowColor', c.card_arrow_color,
    'cardBgImage', c.card_bg_image,
    'cardEmblemUrl', c.card_emblem_url,
    'orderIndex', c.order_index,
    'isActive', c.is_active
  ));
$$;

-- Popular Test Series card JSON (the removed PopularTestSeriesCard) -> snake_case object.
create or replace function public.popular_test_series_card_normalize(p jsonb, p_default_order integer default 1)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', public.pk_json_text(p -> 'id'),
    'test_series_id', nullif(public.pk_json_text(p -> 'testSeriesId'), ''),
    'title', coalesce(public.pk_json_text(p -> 'title'), ''),
    'subtitle', public.pk_json_text(p -> 'subtitle'),
    'badge_text', public.pk_json_text(p -> 'badgeText'),
    'route', public.pk_json_text(p -> 'route'),
    'card_gradient_start', coalesce(public.pk_json_text(p -> 'cardGradientStart'), ''),
    'card_gradient_end', coalesce(public.pk_json_text(p -> 'cardGradientEnd'), ''),
    'card_arrow_color', public.pk_json_text(p -> 'cardArrowColor'),
    'card_bg_image', public.pk_json_text(p -> 'cardBgImage'),
    'card_logo_url', public.pk_json_text(p -> 'cardLogoUrl'),
    'full_mock_count', public.pk_json_int(p -> 'fullMockCount'),
    'topic_test_count', public.pk_json_int(p -> 'topicTestCount'),
    'pyq_test_count', public.pk_json_int(p -> 'pyqTestCount'),
    'order_index', coalesce(public.pk_json_int(p -> 'orderIndex'), p_default_order, 1),
    'is_active', case when p ? 'isActive' then public.pk_json_truthy(p -> 'isActive') else true end
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Copy the current JSON rows (only into an empty table)
-- ---------------------------------------------------------------------------
do $copy$
declare
  v_unknown text;
begin
  -- Hero banners: JSON order is the tie-break; displayOrder falls back to the position.
  if not exists (select 1 from public.hero_banners) then
    insert into public.hero_banners (
      id, badge_text, title, highlight_word, subtitle, primary_cta_text, primary_cta_link,
      secondary_cta_text, secondary_cta_link, feature_pills, image_url, mobile_image_url,
      banner_type, show_text_overlay, theme_gradient, target_audience, placement,
      starts_at, expires_at, click_count, is_active, display_order, created_at, updated_at)
    select r.id, r.badge_text, r.title, r.highlight_word, r.subtitle, r.primary_cta_text, r.primary_cta_link,
      r.secondary_cta_text, r.secondary_cta_link, r.feature_pills, r.image_url, r.mobile_image_url,
      r.banner_type, r.show_text_overlay, r.theme_gradient, r.target_audience, r.placement,
      r.starts_at, r.expires_at, r.click_count, r.is_active, r.display_order, r.created_at, r.updated_at
    from public.app_settings s
    cross join lateral (select case when jsonb_typeof(s.value) = 'string' then (s.value #>> '{}')::jsonb else s.value end as v) j
    cross join lateral jsonb_array_elements(case when jsonb_typeof(j.v) = 'array' then j.v else '[]'::jsonb end)
      with ordinality as e(item, ord)
    cross join lateral jsonb_populate_record(null::public.hero_banners,
      public.hero_banner_normalize(
        e.item || jsonb_build_object('id', coalesce(nullif(e.item ->> 'id', ''), 'banner-legacy-' || e.ord)),
        e.ord::integer)) r
    where s.id = 'banners_hero_list' and jsonb_typeof(e.item) = 'object'
    order by e.ord
    on conflict (id) do nothing;
  end if;

  -- Blog posts: insertion order = JSON order (seq). A slug used by several posts
  -- stays with the post visitors were shown for it (visible, newest; else the
  -- first); the others get "-<id>" appended so every post keeps a unique URL.
  -- A post with no valid createdAt gets 1970-01-01, so it still sorts last on the
  -- public list (the old functions sorted an unparseable date as null, last).
  if not exists (select 1 from public.blog_posts) then
    select string_agg(distinct k, ', ') into v_unknown
    from public.app_settings s
    cross join lateral (select case when jsonb_typeof(s.value) = 'string' then (s.value #>> '{}')::jsonb else s.value end as v) j
    cross join lateral jsonb_array_elements(case when jsonb_typeof(j.v) = 'array' then j.v else '[]'::jsonb end) e(item)
    cross join lateral jsonb_object_keys(case when jsonb_typeof(e.item) = 'object' then e.item else '{}'::jsonb end) k
    where s.id = 'blog_posts_list'
      and k not in ('id', 'title', 'slug', 'excerpt', 'content', 'category', 'author', 'authorRole',
                    'authorAvatar', 'status', 'isFeatured', 'thumbnail', 'views', 'uniqueViews', 'likes',
                    'comments', 'shares', 'readTime', 'publishedAt', 'scheduledAt', 'createdAt',
                    'updatedAt', 'seoTitle', 'seoDescription', 'seoKeywords', 'tags');
    if v_unknown is not null then
      raise notice 'blog_posts_list keys with no column (not copied): %', v_unknown;
    end if;

    insert into public.blog_posts (
      id, title, slug, excerpt, content, category, author, author_role, author_avatar, status,
      is_featured, thumbnail, views, unique_views, likes, comments, shares, read_time,
      published_at, scheduled_at, seo_title, seo_description, seo_keywords, tags, created_at, updated_at)
    select x.id, x.title,
      case when x.slug <> '' and x.slug_rank > 1 then x.slug || '-' || x.id else x.slug end,
      x.excerpt, x.content, x.category, x.author, x.author_role, x.author_avatar, x.status,
      x.is_featured, x.thumbnail, x.views, x.unique_views, x.likes, x.comments, x.shares, x.read_time,
      x.published_at, x.scheduled_at, x.seo_title, x.seo_description, x.seo_keywords, x.tags,
      x.created_at, x.updated_at
    from (
      select r.*, d.ord,
        row_number() over (
          partition by r.slug
          order by (r.status = 'published' or (r.status = 'scheduled' and r.scheduled_at <= now())) desc,
                   coalesce(r.published_at, r.scheduled_at, r.created_at) desc nulls last,
                   d.ord) as slug_rank
      from (
        select distinct on (coalesce(nullif(e.item ->> 'id', ''), 'blog-legacy-' || e.ord))
          e.item, e.ord
        from public.app_settings s
        cross join lateral (select case when jsonb_typeof(s.value) = 'string' then (s.value #>> '{}')::jsonb else s.value end as v) j
        cross join lateral jsonb_array_elements(case when jsonb_typeof(j.v) = 'array' then j.v else '[]'::jsonb end)
          with ordinality as e(item, ord)
        where s.id = 'blog_posts_list' and jsonb_typeof(e.item) = 'object'
        order by coalesce(nullif(e.item ->> 'id', ''), 'blog-legacy-' || e.ord), e.ord
      ) d
      cross join lateral jsonb_populate_record(null::public.blog_posts,
        public.blog_post_normalize(
          d.item || jsonb_build_object('id', coalesce(nullif(d.item ->> 'id', ''), 'blog-legacy-' || d.ord)),
          'epoch'::timestamptz)) r
    ) x
    order by x.ord
    on conflict (id) do nothing;
  end if;

  if not exists (select 1 from public.popular_exam_cards) then
    insert into public.popular_exam_cards (
      id, exam_id, title, slug, route, tests_count, card_badge, card_gradient_start,
      card_gradient_end, card_arrow_color, card_bg_image, card_emblem_url, order_index, is_active)
    select r.id, r.exam_id, r.title, r.slug, r.route, r.tests_count, r.card_badge, r.card_gradient_start,
      r.card_gradient_end, r.card_arrow_color, r.card_bg_image, r.card_emblem_url, r.order_index, r.is_active
    from public.app_settings s
    cross join lateral (select case when jsonb_typeof(s.value) = 'string' then (s.value #>> '{}')::jsonb else s.value end as v) j
    cross join lateral jsonb_array_elements(case when jsonb_typeof(j.v) = 'array' then j.v else '[]'::jsonb end)
      with ordinality as e(item, ord)
    cross join lateral jsonb_populate_record(null::public.popular_exam_cards,
      public.popular_exam_card_normalize(
        e.item || jsonb_build_object('id', coalesce(nullif(e.item ->> 'id', ''), 'popular-legacy-' || e.ord)),
        e.ord::integer)) r
    where s.id = 'popular_exams_config' and jsonb_typeof(e.item) = 'object'
    order by e.ord
    on conflict (id) do nothing;
  end if;

  if not exists (select 1 from public.popular_test_series_cards) then
    insert into public.popular_test_series_cards (
      id, test_series_id, title, subtitle, badge_text, route, card_gradient_start, card_gradient_end,
      card_arrow_color, card_bg_image, card_logo_url, full_mock_count, topic_test_count,
      pyq_test_count, order_index, is_active)
    select r.id, r.test_series_id, r.title, r.subtitle, r.badge_text, r.route, r.card_gradient_start,
      r.card_gradient_end, r.card_arrow_color, r.card_bg_image, r.card_logo_url, r.full_mock_count,
      r.topic_test_count, r.pyq_test_count, r.order_index, r.is_active
    from public.app_settings s
    cross join lateral (select case when jsonb_typeof(s.value) = 'string' then (s.value #>> '{}')::jsonb else s.value end as v) j
    cross join lateral jsonb_array_elements(case when jsonb_typeof(j.v) = 'array' then j.v else '[]'::jsonb end)
      with ordinality as e(item, ord)
    cross join lateral jsonb_populate_record(null::public.popular_test_series_cards,
      public.popular_test_series_card_normalize(
        e.item || jsonb_build_object('id', coalesce(nullif(e.item ->> 'id', ''), 'popular-series-legacy-' || e.ord)),
        e.ord::integer)) r
    where s.id = 'popular_test_series_config' and jsonb_typeof(e.item) = 'object'
    order by e.ord
    on conflict (id) do nothing;
  end if;
end
$copy$;

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
create index if not exists hero_banners_live_order_idx
  on public.hero_banners (display_order) where is_active;
create unique index if not exists blog_posts_slug_key
  on public.blog_posts (slug) where slug <> '';
create index if not exists blog_posts_visible_idx
  on public.blog_posts (status, scheduled_at) where slug <> '';
create index if not exists popular_exam_cards_order_idx
  on public.popular_exam_cards (order_index);
create index if not exists popular_test_series_cards_order_idx
  on public.popular_test_series_cards (order_index);

-- ---------------------------------------------------------------------------
-- 5. Triggers (created after the copy, so old stored values can be copied as-is)
-- ---------------------------------------------------------------------------

-- updated_at. A banner click (click_count only) is not an edit.
drop trigger if exists trg_hero_banners_updated_at on public.hero_banners;
create trigger trg_hero_banners_updated_at
  before update of badge_text, title, highlight_word, subtitle, primary_cta_text, primary_cta_link,
    secondary_cta_text, secondary_cta_link, feature_pills, image_url, mobile_image_url, banner_type,
    show_text_overlay, theme_gradient, target_audience, placement, starts_at, expires_at, is_active,
    display_order
  on public.hero_banners
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_popular_exam_cards_updated_at on public.popular_exam_cards;
create trigger trg_popular_exam_cards_updated_at before update on public.popular_exam_cards
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_popular_test_series_cards_updated_at on public.popular_test_series_cards;
create trigger trg_popular_test_series_cards_updated_at before update on public.popular_test_series_cards
  for each row execute function public.handle_updated_at();

-- No inline (base64) images: URLs only.
drop trigger if exists reject_inline_images on public.hero_banners;
create trigger reject_inline_images before insert or update on public.hero_banners
  for each row execute function public.reject_inline_images('image_url', 'mobile_image_url');
drop trigger if exists reject_inline_images on public.blog_posts;
create trigger reject_inline_images before insert or update on public.blog_posts
  for each row execute function public.reject_inline_images('thumbnail', 'author_avatar', 'content');
drop trigger if exists reject_inline_images on public.popular_exam_cards;
create trigger reject_inline_images before insert or update on public.popular_exam_cards
  for each row execute function public.reject_inline_images('card_bg_image', 'card_emblem_url');
drop trigger if exists reject_inline_images on public.popular_test_series_cards;
create trigger reject_inline_images before insert or update on public.popular_test_series_cards
  for each row execute function public.reject_inline_images('card_bg_image', 'card_logo_url');

-- Staff audit log, like every other admin-managed table.
drop trigger if exists audit_privileged_mutation on public.hero_banners;
create trigger audit_privileged_mutation before insert or update or delete on public.hero_banners
  for each row execute function public.audit_privileged_mutation();
drop trigger if exists audit_privileged_mutation on public.blog_posts;
create trigger audit_privileged_mutation before insert or update or delete on public.blog_posts
  for each row execute function public.audit_privileged_mutation();
drop trigger if exists audit_privileged_mutation on public.popular_exam_cards;
create trigger audit_privileged_mutation before insert or update or delete on public.popular_exam_cards
  for each row execute function public.audit_privileged_mutation();
drop trigger if exists audit_privileged_mutation on public.popular_test_series_cards;
create trigger audit_privileged_mutation before insert or update or delete on public.popular_test_series_cards
  for each row execute function public.audit_privileged_mutation();

-- Old-build snapshot: app_settings.banners_hero_list = the active banners as
-- camelCase JSON, rebuilt after any banner change (not after a click).
-- DROP once mobile_min_build_number is past the first build that reads hero_banners.
create or replace function public.rebuild_banners_hero_snapshot()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_list jsonb;
begin
  select coalesce(jsonb_agg(public.hero_banner_to_json(b) order by b.display_order, b.created_at, b.id), '[]'::jsonb)
    into v_list
    from public.hero_banners b
   where b.is_active;
  insert into public.app_settings (id, category, key, value, description, updated_at)
  values ('banners_hero_list', 'banners', 'hero_banners_list', v_list,
          'Read-only snapshot of public.hero_banners for old app builds (rebuilt by trigger)', now())
  on conflict (id) do update
    set value = excluded.value, description = excluded.description, updated_at = now()
    where public.app_settings.value is distinct from excluded.value;
end;
$$;
create or replace function public.refresh_banners_hero_snapshot()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.rebuild_banners_hero_snapshot();
  return null;
end;
$$;
drop trigger if exists hero_banners_snapshot on public.hero_banners;
create trigger hero_banners_snapshot
  after insert or delete or update of id, badge_text, title, highlight_word, subtitle, primary_cta_text,
    primary_cta_link, secondary_cta_text, secondary_cta_link, feature_pills, image_url, mobile_image_url,
    banner_type, show_text_overlay, theme_gradient, target_audience, placement, starts_at, expires_at,
    is_active, display_order
  on public.hero_banners
  for each statement execute function public.refresh_banners_hero_snapshot();
drop trigger if exists hero_banners_snapshot_truncate on public.hero_banners;
create trigger hero_banners_snapshot_truncate after truncate on public.hero_banners
  for each statement execute function public.refresh_banners_hero_snapshot();

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- Visitors see only what is live; content staff (super_admin, content_writer)
-- see and change everything. Helpers wrapped in (select ...) run once per query.
-- ---------------------------------------------------------------------------
alter table public.hero_banners enable row level security;
alter table public.blog_posts enable row level security;
alter table public.popular_exam_cards enable row level security;
alter table public.popular_test_series_cards enable row level security;

-- Policies from migration 037 (only in environments that ran it).
drop policy if exists "Allow public read access to active hero banners" on public.hero_banners;
drop policy if exists "Allow admin full access to hero banners" on public.hero_banners;

do $policies$
declare
  t record;
begin
  for t in
    select * from (values
      ('hero_banners',
       'is_active and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at >= now())'),
      ('blog_posts',
       'slug <> '''' and (status = ''published'' or (status = ''scheduled'' and scheduled_at <= now()))'),
      ('popular_exam_cards', 'is_active'),
      ('popular_test_series_cards', 'is_active')
    ) as v(tbl, visible)
  loop
    execute format('drop policy if exists %I on public.%I', t.tbl || '_anon_read', t.tbl);
    execute format('create policy %I on public.%I as permissive for select to anon using (%s)',
                   t.tbl || '_anon_read', t.tbl, t.visible);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_authenticated_read', t.tbl);
    execute format('create policy %I on public.%I as permissive for select to authenticated using ((%s) or (select public.admin_scope_allowed(''content'')))',
                   t.tbl || '_authenticated_read', t.tbl, t.visible);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_content_insert', t.tbl);
    execute format('create policy %I on public.%I as permissive for insert to authenticated with check ((select public.admin_scope_allowed(''content'')))',
                   t.tbl || '_content_insert', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_content_update', t.tbl);
    execute format('create policy %I on public.%I as permissive for update to authenticated using ((select public.admin_scope_allowed(''content''))) with check ((select public.admin_scope_allowed(''content'')))',
                   t.tbl || '_content_update', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_content_delete', t.tbl);
    execute format('create policy %I on public.%I as permissive for delete to authenticated using ((select public.admin_scope_allowed(''content'')))',
                   t.tbl || '_content_delete', t.tbl);

    execute format('revoke all on table public.%I from public, anon, authenticated', t.tbl);
    execute format('grant select on table public.%I to anon, authenticated', t.tbl);
    execute format('grant insert, update, delete on table public.%I to authenticated', t.tbl);
    execute format('grant all on table public.%I to service_role', t.tbl);
  end loop;
end
$policies$;

-- Realtime: the admin listens for Popular Exam changes. Publish the table only
-- where app_settings (its old source) is published.
do $realtime$
begin
  if exists (select 1 from pg_publication_tables
              where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings')
     and not exists (select 1 from pg_publication_tables
              where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'popular_exam_cards') then
    alter publication supabase_realtime add table public.popular_exam_cards;
  end if;
end
$realtime$;

-- ---------------------------------------------------------------------------
-- 7. Admin writes
-- ---------------------------------------------------------------------------

-- Same arguments and result as before ({success, record, deleted_id, records},
-- records in camelCase), now backed by the tables.
create or replace function public.admin_mutate_collection(
  p_collection text,
  p_action text,
  p_id text default null,
  p_item jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb := case when jsonb_typeof(p_item) = 'object' then p_item else '{}'::jsonb end;
  v_now jsonb := to_jsonb(public.pk_iso(now()));
  v_old jsonb;
  v_norm jsonb;
  v_row jsonb;
  v_id text;
  v_records jsonb;
  v_ids text[];
  v_total integer;
begin
  -- Content scope (super_admin or content_writer, active, verified staff).
  if not exists (
    select 1 from public.profiles p
     where p.id = (select auth.uid()) and p.role = 'admin' and p.account_status = 'active'
       and p.admin_role in ('super_admin', 'content_writer')
       and exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'admin')
  ) then
    raise exception 'Content-management privileges required' using errcode = '42501';
  end if;

  if p_collection = 'banners' then
    if p_action = 'create' then
      if coalesce(length(btrim(v_item ->> 'title')), 0) = 0 then raise exception 'Title is required'; end if;
      v_id := gen_random_uuid()::text;
      v_norm := public.hero_banner_normalize(
        v_item || jsonb_build_object('id', v_id, 'createdAt', v_now, 'updatedAt', v_now, 'clickCount', 0),
        (select coalesce(max(display_order), 0) + 1 from public.hero_banners));
      insert into public.hero_banners (
        id, badge_text, title, highlight_word, subtitle, primary_cta_text, primary_cta_link,
        secondary_cta_text, secondary_cta_link, feature_pills, image_url, mobile_image_url,
        banner_type, show_text_overlay, theme_gradient, target_audience, placement,
        starts_at, expires_at, click_count, is_active, display_order, created_at, updated_at)
      select r.id, r.badge_text, r.title, r.highlight_word, r.subtitle, r.primary_cta_text, r.primary_cta_link,
        r.secondary_cta_text, r.secondary_cta_link, r.feature_pills, r.image_url, r.mobile_image_url,
        r.banner_type, r.show_text_overlay, r.theme_gradient, r.target_audience, r.placement,
        r.starts_at, r.expires_at, r.click_count, r.is_active, r.display_order, r.created_at, r.updated_at
      from jsonb_populate_record(null::public.hero_banners, v_norm) r;
      select public.hero_banner_to_json(b) into v_row from public.hero_banners b where b.id = v_id;

    elsif p_action in ('update', 'delete') then
      select public.hero_banner_to_json(b) into v_old from public.hero_banners b where b.id = p_id for update;
      if v_old is null then raise exception 'Record not found; nothing was changed' using errcode = 'P0002'; end if;
      if p_action = 'delete' then
        delete from public.hero_banners where id = p_id;
        v_row := v_old;
      else
        v_norm := public.hero_banner_normalize(
          v_old || (v_item - 'clickCount' - 'click_count') || jsonb_build_object('id', p_id, 'createdAt', v_old -> 'createdAt'),
          (v_old ->> 'displayOrder')::integer);
        if coalesce(length(btrim(v_norm ->> 'title')), 0) = 0 then raise exception 'Title is required'; end if;
        update public.hero_banners b set
          badge_text = r.badge_text, title = r.title, highlight_word = r.highlight_word, subtitle = r.subtitle,
          primary_cta_text = r.primary_cta_text, primary_cta_link = r.primary_cta_link,
          secondary_cta_text = r.secondary_cta_text, secondary_cta_link = r.secondary_cta_link,
          feature_pills = r.feature_pills, image_url = r.image_url, mobile_image_url = r.mobile_image_url,
          banner_type = r.banner_type, show_text_overlay = r.show_text_overlay, theme_gradient = r.theme_gradient,
          target_audience = r.target_audience, placement = r.placement, starts_at = r.starts_at,
          expires_at = r.expires_at, is_active = r.is_active, display_order = r.display_order
        from jsonb_populate_record(null::public.hero_banners, v_norm) r
        where b.id = p_id;
        select public.hero_banner_to_json(b) into v_row from public.hero_banners b where b.id = p_id;
      end if;

    elsif p_action = 'reorder' then
      if coalesce(jsonb_typeof(v_item -> 'ids'), '') <> 'array' then raise exception 'Refresh the list before reordering'; end if;
      select array_agg(x order by n) into v_ids from jsonb_array_elements_text(v_item -> 'ids') with ordinality a(x, n);
      perform 1 from public.hero_banners for update;
      select count(*) into v_total from public.hero_banners;
      if coalesce(cardinality(v_ids), 0) <> v_total
         or (select count(distinct x) from unnest(v_ids) x) <> v_total
         or (select count(*) from public.hero_banners b where b.id = any (v_ids)) <> v_total then
        raise exception 'Refresh the list before reordering';
      end if;
      update public.hero_banners b set display_order = a.n
        from unnest(v_ids) with ordinality a(x, n)
       where b.id = a.x and b.display_order is distinct from a.n::integer;
    else
      raise exception 'Unsupported collection action';
    end if;

    select coalesce(jsonb_agg(public.hero_banner_to_json(b) order by b.display_order, b.created_at, b.id), '[]'::jsonb)
      into v_records from public.hero_banners b;

  elsif p_collection = 'blog' then
    if p_action = 'create' then
      if coalesce(length(btrim(v_item ->> 'title')), 0) = 0 then raise exception 'Title is required'; end if;
      v_id := gen_random_uuid()::text;
      v_norm := public.blog_post_normalize(v_item || jsonb_build_object('id', v_id, 'createdAt', v_now, 'updatedAt', v_now));
      if v_norm ->> 'slug' <> '' and exists (select 1 from public.blog_posts where slug = v_norm ->> 'slug') then
        raise exception 'Blog slug already exists';
      end if;
      insert into public.blog_posts (
        id, title, slug, excerpt, content, category, author, author_role, author_avatar, status,
        is_featured, thumbnail, views, unique_views, likes, comments, shares, read_time,
        published_at, scheduled_at, seo_title, seo_description, seo_keywords, tags, created_at, updated_at)
      select r.id, r.title, r.slug, r.excerpt, r.content, r.category, r.author, r.author_role, r.author_avatar, r.status,
        r.is_featured, r.thumbnail, r.views, r.unique_views, r.likes, r.comments, r.shares, r.read_time,
        r.published_at, r.scheduled_at, r.seo_title, r.seo_description, r.seo_keywords, r.tags, r.created_at, r.updated_at
      from jsonb_populate_record(null::public.blog_posts, v_norm) r;
      select public.blog_post_to_json(b) into v_row from public.blog_posts b where b.id = v_id;

    elsif p_action in ('update', 'delete') then
      select public.blog_post_to_json(b) into v_old from public.blog_posts b where b.id = p_id for update;
      if v_old is null then raise exception 'Record not found; nothing was changed' using errcode = 'P0002'; end if;
      if p_action = 'delete' then
        delete from public.blog_posts where id = p_id;
        v_row := v_old;
      else
        v_norm := public.blog_post_normalize(v_old || v_item || jsonb_build_object('id', p_id, 'createdAt', v_old -> 'createdAt'));
        if coalesce(length(btrim(v_norm ->> 'title')), 0) = 0 then raise exception 'Title is required'; end if;
        if v_norm ->> 'slug' <> '' and exists (
             select 1 from public.blog_posts where slug = v_norm ->> 'slug' and id <> p_id) then
          raise exception 'Blog slug already exists';
        end if;
        update public.blog_posts b set
          title = r.title, slug = r.slug, excerpt = r.excerpt, content = r.content, category = r.category,
          author = r.author, author_role = r.author_role, author_avatar = r.author_avatar, status = r.status,
          is_featured = r.is_featured, thumbnail = r.thumbnail, views = r.views, unique_views = r.unique_views,
          likes = r.likes, comments = r.comments, shares = r.shares, read_time = r.read_time,
          published_at = r.published_at, scheduled_at = r.scheduled_at, seo_title = r.seo_title,
          seo_description = r.seo_description, seo_keywords = r.seo_keywords, tags = r.tags
        from jsonb_populate_record(null::public.blog_posts, v_norm) r
        where b.id = p_id;
        select public.blog_post_to_json(b) into v_row from public.blog_posts b where b.id = p_id;
      end if;
    else
      raise exception 'Unsupported collection action';
    end if;

    select coalesce(jsonb_agg(public.blog_post_to_json(b) order by b.seq), '[]'::jsonb)
      into v_records from public.blog_posts b;
  else
    raise exception 'Unsupported collection';
  end if;

  return jsonb_build_object(
    'success', true,
    'record', v_row,
    'deleted_id', case when p_action = 'delete' then p_id end,
    'records', v_records);
end;
$$;
revoke all on function public.admin_mutate_collection(text, text, text, jsonb) from public, anon;
grant execute on function public.admin_mutate_collection(text, text, text, jsonb) to authenticated, service_role;

-- Replace the whole Popular Exam list in one transaction (the admin saves the
-- list as a unit). Order follows the array; orderIndex is rewritten 1..n.
create or replace function public.admin_save_popular_exam_cards(p_cards jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids text[];
begin
  if not exists (
    select 1 from public.profiles p
     where p.id = (select auth.uid()) and p.role = 'admin' and p.account_status = 'active'
       and p.admin_role in ('super_admin', 'content_writer')
       and exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'admin')
  ) then
    raise exception 'Content-management privileges required' using errcode = '42501';
  end if;
  if coalesce(jsonb_typeof(p_cards), '') <> 'array' then raise exception 'Cards must be an array'; end if;
  if exists (select 1 from jsonb_array_elements(p_cards) c
              where jsonb_typeof(c) <> 'object' or coalesce(btrim(c ->> 'id'), '') = ''
                 or coalesce(btrim(c ->> 'title'), '') = '') then
    raise exception 'Every card needs an id and a title';
  end if;
  select array_agg(c ->> 'id') into v_ids from jsonb_array_elements(p_cards) c;
  if (select count(distinct x) from unnest(v_ids) x) <> coalesce(cardinality(v_ids), 0) then
    raise exception 'Duplicate card ids';
  end if;

  delete from public.popular_exam_cards where id <> all (coalesce(v_ids, '{}'::text[]));

  insert into public.popular_exam_cards as t (
    id, exam_id, title, slug, route, tests_count, card_badge, card_gradient_start,
    card_gradient_end, card_arrow_color, card_bg_image, card_emblem_url, order_index, is_active)
  select r.id, r.exam_id, r.title, r.slug, r.route, r.tests_count, r.card_badge, r.card_gradient_start,
    r.card_gradient_end, r.card_arrow_color, r.card_bg_image, r.card_emblem_url, e.n::integer, r.is_active
  from jsonb_array_elements(p_cards) with ordinality e(card, n)
  cross join lateral jsonb_populate_record(null::public.popular_exam_cards,
    public.popular_exam_card_normalize(e.card, e.n::integer)) r
  on conflict (id) do update set
    exam_id = excluded.exam_id, title = excluded.title, slug = excluded.slug, route = excluded.route,
    tests_count = excluded.tests_count, card_badge = excluded.card_badge,
    card_gradient_start = excluded.card_gradient_start, card_gradient_end = excluded.card_gradient_end,
    card_arrow_color = excluded.card_arrow_color, card_bg_image = excluded.card_bg_image,
    card_emblem_url = excluded.card_emblem_url, order_index = excluded.order_index,
    is_active = excluded.is_active
  where (t.exam_id, t.title, t.slug, t.route, t.tests_count, t.card_badge, t.card_gradient_start,
         t.card_gradient_end, t.card_arrow_color, t.card_bg_image, t.card_emblem_url, t.order_index, t.is_active)
        is distinct from
        (excluded.exam_id, excluded.title, excluded.slug, excluded.route, excluded.tests_count,
         excluded.card_badge, excluded.card_gradient_start, excluded.card_gradient_end,
         excluded.card_arrow_color, excluded.card_bg_image, excluded.card_emblem_url,
         excluded.order_index, excluded.is_active);

  return jsonb_build_object('success', true, 'count', coalesce(cardinality(v_ids), 0));
end;
$$;
revoke all on function public.admin_save_popular_exam_cards(jsonb) from public, anon;
grant execute on function public.admin_save_popular_exam_cards(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Public blog functions: same names, arguments and output shape, now
-- reading blog_posts (SECURITY INVOKER: the anon read policy already limits
-- rows to visible posts; the filter is repeated so signed-in staff get the
-- same answer as visitors).
-- ---------------------------------------------------------------------------
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
  select coalesce(jsonb_agg(x.summary order by x.rn), '[]'::jsonb)
  from (
    select
      jsonb_build_object(
        'id', b.id, 'title', b.title, 'slug', b.slug, 'excerpt', b.excerpt, 'category', b.category,
        'author', b.author, 'status', b.status, 'isFeatured', b.is_featured, 'thumbnail', b.thumbnail,
        'readTime', b.read_time, 'publishedAt', public.pk_iso(b.published_at),
        'scheduledAt', public.pk_iso(b.scheduled_at), 'createdAt', public.pk_iso(b.created_at)) as summary,
      row_number() over (
        order by case when p_featured_first then b.is_featured end desc nulls last,
                 coalesce(b.published_at, b.scheduled_at, b.created_at) desc nulls last,
                 b.seq
      ) as rn
    from public.blog_posts b
    where b.slug <> ''
      and (b.status = 'published' or (b.status = 'scheduled' and b.scheduled_at <= now()))
  ) x
  where p_limit is null or x.rn <= greatest(p_limit, 0);
$$;

create or replace function public.public_blog_post(p_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select public.blog_post_to_json(b)
  from public.blog_posts b
  where b.slug = p_slug and b.slug <> ''
    and (b.status = 'published' or (b.status = 'scheduled' and b.scheduled_at <= now()))
  order by coalesce(b.published_at, b.scheduled_at, b.created_at) desc nulls last, b.seq
  limit 1;
$$;

revoke all on function public.public_blog_summaries(integer, boolean) from public;
revoke all on function public.public_blog_post(text) from public;
grant execute on function public.public_blog_summaries(integer, boolean) to anon, authenticated, service_role;
grant execute on function public.public_blog_post(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. Function privileges. Pure row -> JSON formatters used by the invoker
-- blog functions stay callable; everything else is internal.
-- ---------------------------------------------------------------------------
revoke all on function public.pk_json_text(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_truthy(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_ts(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_int(jsonb) from public, anon, authenticated;
revoke all on function public.pk_json_text_array(jsonb) from public, anon, authenticated;
revoke all on function public.hero_banner_normalize(jsonb, integer) from public, anon, authenticated;
revoke all on function public.hero_banner_to_json(public.hero_banners) from public, anon, authenticated;
revoke all on function public.blog_post_normalize(jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.popular_exam_card_normalize(jsonb, integer) from public, anon, authenticated;
revoke all on function public.popular_exam_card_to_json(public.popular_exam_cards) from public, anon, authenticated;
revoke all on function public.popular_test_series_card_normalize(jsonb, integer) from public, anon, authenticated;
revoke all on function public.refresh_banners_hero_snapshot() from public, anon, authenticated;
revoke all on function public.rebuild_banners_hero_snapshot() from public, anon, authenticated;
revoke all on function public.pk_iso(timestamptz) from public;
revoke all on function public.blog_post_to_json(public.blog_posts) from public;
grant execute on function public.pk_iso(timestamptz) to anon, authenticated, service_role;
grant execute on function public.blog_post_to_json(public.blog_posts) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 10. Old rows
-- ---------------------------------------------------------------------------

-- Rebuild the banner snapshot from the table now (normalised, active banners only).
do $$ begin perform public.rebuild_banners_hero_snapshot(); end $$;

-- The live-test mirror is gone: public.live_tests is the only source. Old
-- mobile builds read this row only when the live_tests query fails; an empty
-- list never shows a draft or stale event. The row itself is kept.
update public.app_settings
   set value = '[]'::jsonb, updated_at = now(),
       description = 'Retired: live tests are read from public.live_tests only'
 where id = 'live_tests_schedule_list' and value is distinct from '[]'::jsonb;

commit;
