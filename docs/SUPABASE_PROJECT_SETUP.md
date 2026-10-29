# Setting up (or moving to) a Supabase project

Copying the database is not enough. Auth settings, the Google provider, Edge Function
secrets and the Razorpay webhook live outside the database, and a new project starts
without them. When production moved to `wzcmhowowoyeldfqzkeh` (October 2026), Google
login failed with "provider is not enabled" and checkout stopped because these steps
were missed. Work through every step, in order.

Production today: project `wzcmhowowoyeldfqzkeh`, site `https://practicekoro.online`.

## 1. Database

1. Apply the migrations: `supabase link --project-ref <ref>`, then `supabase db push`.
2. If students are moving from an old project, move `auth.users` and `auth.identities`
   with the data. Without them every student gets a new, empty account on first login
   and loses their subscription, results and profile.
3. Run the security assertions: `scripts/supabase-sql.sh -f supabase/tests/rls_security.sql`.

## 2. Auth (Authentication in the dashboard)

The values below are in `supabase/config.toml`; `supabase config push` applies them.
To do it by hand instead:

- **URL Configuration → Site URL:** `https://practicekoro.online`. Email links (sign-up
  confirmation, password reset) use it; left at `http://localhost:3000` they go nowhere.
- **URL Configuration → Redirect URLs:** `https://practicekoro.online/**`,
  `https://www.practicekoro.online/**`, `com.practicekoro://login-callback`.
- **Sign In / Providers → Google:** enable, and paste the Client ID and Client Secret from
  Google Cloud Console → APIs & Services → Credentials.
- **Google Cloud Console**, same OAuth client → Authorized redirect URIs: add
  `https://<ref>.supabase.co/auth/v1/callback`.
- **Email:** keep "Confirm email" on.
- **Password security:** turn on leaked password protection.

## 3. Edge Functions

1. Deploy: `supabase functions deploy` (the `razorpay-webhook` JWT exception comes from
   `supabase/config.toml`).
2. **Edge Functions → Secrets:** add

   | Secret                    | Where it comes from                                                                 |
   | ------------------------- | ----------------------------------------------------------------------------------- |
   | `RAZORPAY_KEY_ID`         | Razorpay → Account & Settings → API Keys (`rzp_live_...`)                           |
   | `RAZORPAY_KEY_SECRET`     | Same place; shown once, regenerate if lost                                          |
   | `RAZORPAY_WEBHOOK_SECRET` | The secret you set on the Razorpay webhook (step 4)                                 |
   | `ALLOWED_ORIGINS`         | Optional; defaults to `https://practicekoro.online,https://www.practicekoro.online` |

   `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided by
   Supabase automatically.

## 4. Razorpay

**Account & Settings → Webhooks:** point the webhook at
`https://<ref>.supabase.co/functions/v1/razorpay-webhook`, with events `payment.captured`,
`payment.failed` and `refund.processed`. Without this, a student who pays and closes the
app before verification never gets Pro.

## 5. Storage

Buckets `avatars`, `question-images` and `banners` are created by the migrations. If the
old project's files are needed (question images, banners, avatars), copy the bucket
contents across; rows store full URLs, so also rewrite the old project ref in those URLs.

## 6. Apps

1. Point the apps at the new project: `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
   for the website, `--dart-define-from-file=config/supabase.json` for the mobile app.
   Rebuild and redeploy both; the mobile app needs a new store release.
2. In the admin panel → Settings → Payment Gateway: Razorpay active, Key ID filled in.
3. Regenerate the types: `npx supabase gen types typescript --project-id <ref> > src/types/database.generated.ts`.

## 7. Check it works

- [ ] Google sign-in on `/dashboard/`, `/login` (admin) and the mobile app
- [ ] Email sign-up: the confirmation link opens `practicekoro.online`
- [ ] Password reset email link opens `practicekoro.online`
- [ ] Buy the cheapest plan with real money; Pro activates; Razorpay shows the webhook
      delivered with 200. Refund it from the admin panel.
- [ ] Upload an image in the admin panel (goes through `upload-raster-image`)
