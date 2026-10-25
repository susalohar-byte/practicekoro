# PracticeKoro Student Web Panel

The web version of the PracticeKoro student app. It gives students the same features as the
Flutter app (`../practicekoro_mobile`), laid out for desktop, tablet and phone browsers.

It is a standalone app. It has its own dependencies, entry point, routing, styles and build. It
shares only the Supabase project with the Flutter app and the admin console (`../src`), and it
uses the same student accounts, data and Row Level Security policies.

## Stack

- React 18, TypeScript, Vite and Tailwind CSS (the same toolchain as the admin console).
- TanStack Query for server state.
- supabase-js for auth, Postgres reads, RPCs, Storage and Edge Functions.
- react-router-dom with lazy-loaded routes.
- Razorpay Checkout.js, loaded only on the checkout page.

## Local development

You need Node.js 22 or newer.

```bash
cd student-web
npm install
npm run dev          # http://localhost:5173 (served at /, not /dashboard/)
```

Without a `.env`, the app talks to the production Supabase project with its public anon key.
That is the same default the Flutter app and admin console use. To point it at another project,
copy `.env.example` to `.env.local` and fill it in.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server on port 5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run check` | Type-check, lint, test and build |

## Environment variables

Only public values go here. They are baked into the bundle at build time.

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | No (defaults to production) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No (defaults to production) | Public anon / publishable key |
| `VITE_BASE_PATH` | No (default `/dashboard/` for builds, `/` in dev) | Path the panel is served from. Must end with `/`. |

Never put the service-role key, the Razorpay key secret or the webhook secret in a `VITE_`
variable. The Razorpay key id comes from the `create-razorpay-order` Edge Function, or else
from `app_settings.payment_gateway_razorpay_key_id`.

## Production build and deployment

The site is laid out as:

| URL | App |
| --- | --- |
| `practicekoro.online/` | Landing page (admin app, `src/pages/landing`) |
| `practicekoro.online/admin` | Admin console |
| `practicekoro.online/dashboard` | Student Web Panel (this app) |

```bash
cd student-web
npm ci
npm run check            # type-check, lint, test, build → dist/ with base /dashboard/
```

Upload the contents of `student-web/dist` to `public_html/dashboard/` (next to the admin
console's files in `public_html/`). `public/.htaccess` is copied into it with
`RewriteBase /dashboard/`, so refreshes and deep links such as `/dashboard/result/<id>` load the
panel. The root `.htaccess` is not involved: Apache uses the one in `dashboard/`.

Because the panel is on the same domain, it shares the login with the landing page and the
admin console (one Supabase session). Everyone signs in at `practicekoro.online/login`:
admins continue to `/admin`, students to `/dashboard`. A signed-in student who opens `/login`
or `/admin` is sent to `/dashboard`, and new students use the **Create account** link there.
The panel's own `/dashboard/login` keeps working for direct visits.

Before going live:

1. **Supabase Auth → URL Configuration:** add
   `https://practicekoro.online/dashboard/login-callback` (and the `www.` variant if used) to
   *Redirect URLs*. Google sign-in, email confirmation and password-reset links return there.
2. **Payments** need no CORS change: `create-razorpay-order` and `verify-payment` already allow
   `practicekoro.online` and `www.practicekoro.online`.
3. **Content-Security-Policy:** the `.htaccess` keeps the admin console's CSP, which allows
   Supabase, Razorpay and Google Fonts.

To serve the panel from its own domain instead, build with `VITE_BASE_PATH=/`, change
`RewriteBase` in `public/.htaccess` to `/`, set `VITE_STUDENT_PANEL_URL` for the landing page,
and add that origin to the payment functions' `ALLOWED_ORIGINS` secret.

## Architecture

```text
src/
  main.tsx, App.tsx      Providers, routes (public auth routes, protected app shell, full-screen runner)
  auth/                  AuthProvider (Supabase session), RequireAuth / GuestOnly guards
  lib/                   Supabase client, error copy, formatting, Razorpay loader, local drafts
  services/              Backend layer, one module per area
    catalog.ts           exams, subjects, chapters, tests, live_tests, banners
    attempts.ts          test RPCs (start / save / submit / solutions / rankings), history
    account.ts           profile, avatar upload, leaderboard, plans, subscription,
                         checkout, support tickets, notifications, bookmarks
  hooks/                 TanStack Query hooks and derived chapter progress
  components/ui/         Design-system components (Button, Card, Modal, Chips, Toast, …)
  components/layout/     AppShell: sidebar (desktop), icon rail (tablet), bottom nav (phone)
  components/domain/     Live test card, subject visuals, Pro dialog
  features/<area>/       Pages: auth, onboarding, home, practice, exams, test-runner,
                         results, profile, support, subscription
  data/westBengal.ts     Districts, blocks, categories (copied from the Flutter model)
```

The design tokens in `tailwind.config.js` mirror the Flutter `UI` class: colours, the 14px
radius, the card shadow and the hero gradient. Fonts are Inter with Noto Sans Bengali.

### Backend contract (same as the Flutter app)

| Feature | Supabase |
| --- | --- |
| Auth | Email/password, Google OAuth, password reset. The `handle_new_user` trigger creates the profile. |
| Catalog | `exams`, `subjects`, `chapters`, `tests` (`is_live_only` papers excluded), `live_tests` |
| Test taking | `start_test_attempt`, `get_student_exam_questions` (no answer keys), `save_test_answers`, `submit_test_attempt` |
| Results | `test_attempts` + `test_results`, `get_attempt_rankings`, `get_attempt_solutions`, `get_test_leaderboard` |
| Pro access | `get_student_subscription_details`. The server also enforces Pro inside the test RPCs. |
| Payments | Edge Functions `create-razorpay-order` and `verify-payment`, plus Razorpay Checkout.js |
| Profile | `profiles` update (own row) mirrored into auth `user_metadata`; `avatars` storage bucket |
| Support | `create_support_ticket`, `support_tickets`, `support_ticket_messages`, `app_settings` contact keys |
| Other | `bookmarks` (own rows), `notifications` (sent, RLS-filtered), `app_settings.banners_hero_list` |

The panel shows only real data. The Flutter app's offline sample catalogue, benchmark attempts,
fallback rankings and placeholder contact numbers are not carried over. Every list has an
honest empty state instead.

## Differences from the Flutter app

- **Test runner:** it is full-screen and shows a question palette beside the question on wide
  screens. Keyboard shortcuts: A–D or 1–4 to pick, ←/→ to move, M to mark, Backspace to clear.
  Answers and Mark for Review flags are also kept in the browser, so a refresh or a closed tab
  resumes the attempt. The server timer keeps running and is the one that counts.
- **Chapter (topic) tests** run as real server attempts. The app's local practice mode used
  bundled sample questions, which the web panel does not use.
- **Re-attempt:** the Result page and Test Instructions page have a *Re-attempt Test* button.
  Unfinished attempts show *Resume Test* and appear under *Continue Practicing* on Home.
- **Bookmarks** are saved to the `bookmarks` table. Students cannot read question text outside a
  finished attempt, so the question content for *Saved Questions* is kept in the browser. A
  bookmark made on another device shows as a count until you open that test's solutions.
- **Weak topics:** a chapter whose tests you answered with under 50% accuracy. The `chapters`
  table has no progress columns, so this is derived from your attempts.
- **Notifications** shows the admin's sent notifications. The app's screen is a static
  placeholder.
- **Checkout** waits for the student to press *Pay*; the app opens Razorpay automatically.
- **Leaderboard by block** is not offered: `get_test_leaderboard` does not support blocks yet.
- **Daily practice reminder** (Settings) is left out. In the app it only stores a flag on the
  device and never schedules a reminder.
- **Update-required gate** is not needed: browsers always load the latest build.
