# Student homepage reference implementation

## Scope

Redesigns the `/dashboard` content area in the existing React/Vite app. No new application, CMS, database tables, storage buckets, migrations or backend deployments.

The existing `StudentSidebar.tsx`, `BottomNav.tsx`, `student-panel.css`, branding/design tokens and menu configuration remain unchanged. Sidebar baseline SHA-256: `23f9624a7eef2ebeb14444d70307cd599480b83ae8eccb4a9ec72a662366b1b6`. Main-page spacing and header presentation are scoped to `/dashboard`; other student pages retain their existing header behavior.

## Layout

Header → stored homepage hero → four canonical actions → full live/upcoming mock → unfinished practice carousel → rectangular exam carousel → compact test-series carousel → **Recent Tests / Recently Added Tests / Recommended for You**.

The bottom three panels are sibling columns on desktop and stack in that order on narrow screens. There is no new right sidebar. No Audio Book action or generated motivational artwork is introduced.

## Existing sources of truth

| UI                                 | Existing source                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Platform logo and sidebar identity | Existing BrandLogo / platform branding context, unchanged                                                                           |
| Header name and avatar             | AuthContext; homepage uses initials for missing/broken personal avatars                                                             |
| Search and notification controls   | Existing StudentNavbar search and notification implementation                                                                       |
| Hero artwork                       | `app_settings.banners_hero_list` via bannerService; stored image/mobile image URL, audience, placement, active flag and schedule    |
| Exam artwork                       | Matching `popular_exams_config` entry, then that exam's `banner_url` / image-valued `icon_name` / configured emblem                 |
| Test-series thumbnails             | Corresponding `test_series.icon_url`, then matching configured thumbnail; never unrelated exam artwork                              |
| Popular series placement/badges    | Existing `popular_test_series_config` linked to actual published series; otherwise actual `is_popular` series                       |
| Tests and actual counts            | Complete paginated tests metadata, `tests.exam_id` and `test_exams`; active published tests only                                    |
| Live schedule                      | Existing live-test API, cross-checked against the complete published full-mock catalog; actual start/end/duration/publication state |
| Continue and recent results        | Caller-owned `test_attempts` through existing getUserAttempts                                                                       |
| Answered-question progress         | Caller-session `attempt_answers` read joined to `test_attempts.user_id`; question IDs and selected choices only                     |
| Recommendations                    | Unattempted published tests from the student's target exam/association, not fabricated recommendation records                       |

Active legacy series with a null publication status retain the existing platform convention. Explicit draft/archived/unpublished records are not featured. Disabled configured exam/series showcases are respected.

Image URLs are resolved from the stored configuration, including existing same-origin deployed image paths and legacy inline raster thumbnails. Missing/broken images use generic icons, not another exam's picture. Hero images are rendered at their natural aspect ratio with no generated substitutes or screenshot crops. No active stored hero means no reserved blank hero area.

**Artwork distinction:** the current stored WBP Mock Test hero is different from the cartoon illustration in the reference. The implementation intentionally renders the actual admin-owned WBP asset. Upload/publish different artwork through the existing banner manager to change it.

## Refresh and security

- Reuses banner subscriptions and the existing `hero-banners` invalidation prefix.
- Reuses catalog/settings subscriptions and test-series update events; homepage catalog metadata polling is 60 seconds, live schedule polling 30 seconds, with normal query focus refresh.
- Publication, cohort and scheduling checks are strict for the homepage. Configuration/read errors do not insert fictional demo cards or live events.
- Progress queries run with the caller's normal Supabase session/RLS and explicitly constrain joined attempt ownership. No service-role key, answer-key query or permissions relaxation.
- Existing test-detail, entitlement, test-start, resume and result routes remain responsible for authorization. UI visibility is not treated as authorization.
- Loading, empty and retry states distinguish absent content from failed reads.

## Verification

- TypeScript project check: passed.
- Production build: passed.
- Complete Vitest suite: **840 tests across 112 files passed**.
- ESLint: zero errors; ten existing warnings in unchanged admin/rank modules.
- Local actual-component previews inspected at desktop 1536px, mobile 390px, dark mode, empty/error states, search and profile popovers, mobile sidebar drawer and horizontal carousel navigation. No horizontal page overflow at 320px or 390px; desktop bottom panels have adjacent columns beneath the series.
- Sidebar source hash matches the baseline, and its shared styling is unchanged.

Preview-only test/attempt/schedule fixtures were used to exercise populated and empty layouts; they are not production records and are not included in the application. Stored banner and configured exam artwork were used for image verification.

## Handoff

Source-only change. No Hostinger/server deployment and no database mutation was performed. Use the existing build/deployment process to release it. Validate once signed in on the deployed website with an actual student's unfinished attempt, the current active banner, and a genuinely published full mock schedule.
