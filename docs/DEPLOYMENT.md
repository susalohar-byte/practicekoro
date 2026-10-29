# Deployment guide

## Environments

Use separate Supabase and Razorpay projects for development, staging and production. Store
server credentials only in Supabase Edge Function secrets or the deployment platform's secret
store.

## Build

```bash
npm ci
npm run check
npm run build
```

Publish the generated `dist` directory. `npm run build` also builds the Student Web Panel into
`dist/dashboard/`, so one upload of `dist` to `public_html/` ships the site, `/admin` and
`/dashboard` together.

## Required public variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID`

Values prefixed with `VITE_` are included in the browser bundle and must never contain secrets.

There is no built-in fallback project. If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is
missing at build time, the site shows a configuration error instead of connecting to
production. Set them in `.env` or in your host's build environment (Cloudflare Pages,
Hostinger Git deployments).

## Required Edge Function secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## Hostinger SPA routing

`public/.htaccess` is copied into `dist/` on every build and already handles:
HTTPS force, SPA fallback to `/index.html`, immutable caching for hashed
assets, no-cache for `index.html`, and baseline security headers. Confirm
direct navigation to `/practice`, `/tests/:id` and `/admin` works after
deployment.

## Shared-hosting release (one command)

```bash
npm run deploy:shared          # gate + build + release/*.zip + checklist
# optional FTP upload + extract on server:
HOSTINGER_FTP_HOST=... HOSTINGER_FTP_USER=... HOSTINGER_FTP_PASS='...' \
  HOSTINGER_FTP_DIR=/public_html bash scripts/deploy-shared-hosting.sh --upload
```

Manual hPanel path: upload the newest `release/practicekoro-dist-*.zip` to
`public_html`, extract (overwrite), keep one previous zip for rollback, and
confirm `.htaccess` landed in `public_html`. Then run the post-deploy
checklist printed by the script (migrations → verify-data-layer → smoke URLs).

Critical: `VITE_*` values are baked into the bundle at build time — `.env`
must hold the real `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` before
building, otherwise the deployed site white-screens.

## Release checklist

1. Back up the production database.
2. Apply reviewed migrations.
3. Deploy Edge Functions.
4. Run staging smoke tests and Razorpay test-mode scenarios.
5. Run `npm audit --omit=dev`.
6. Deploy `dist`.
7. Verify authentication, one free test, one premium test and webhook reconciliation.
8. Monitor Edge Function and database logs without logging personal data or credentials.

## Rollback

Keep the previous `dist` artifact and deployment available. Database changes require an
explicit, reviewed down-migration or point-in-time recovery; never improvise destructive SQL in
production.

## Error monitoring

Errors are reported to Sentry only when a DSN is set at build time; without one nothing is
sent and the SDK is not even bundled.

- Website and admin panel: `VITE_SENTRY_DSN` in `.env` (the Student Web Panel build reads
  its own `student-web/.env`).
- Mobile app: `flutter build ... --dart-define=SENTRY_DSN=<dsn>`.

No personal data is sent (`sendDefaultPii` off, no session replay, no performance tracing).
The site's Content-Security-Policy already allows the Sentry ingest hosts.
