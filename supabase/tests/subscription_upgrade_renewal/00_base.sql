-- THROWAWAY DATABASE ONLY. Minimal stand-in for the Supabase objects the
-- controlled upgrade/renewal migration depends on. Never run against production.
--   createdb pk_sub_test && psql -d pk_sub_test -f 00_base.sql
--   psql -d pk_sub_test -f ../../migrations/20261014120000_controlled_subscription_upgrade_renewal.sql
--   psql -d pk_sub_test -f 10_scenarios.sql   # every block prints PASS or aborts
-- Minimal stand-in for the Supabase schema pieces the migration touches.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT NULLIF(current_setting('request.jwt.claim.role', true), '') $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
CREATE FUNCTION public.has_role(uuid, text) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;

CREATE TABLE public.subscription_plans (
  id text PRIMARY KEY, name text, title text NOT NULL, description text,
  duration_days int NOT NULL DEFAULT 365, price numeric(8,2) NOT NULL, original_price numeric(8,2),
  currency text NOT NULL DEFAULT 'INR', features jsonb NOT NULL DEFAULT '[]', is_active boolean NOT NULL DEFAULT true,
  order_index int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(8,2) NOT NULL, currency text NOT NULL DEFAULT 'INR', gateway text NOT NULL DEFAULT 'razorpay',
  transaction_id text, order_id text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  raw_response jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  plan_id text REFERENCES public.subscription_plans(id), razorpay_order_id text, razorpay_payment_id text,
  razorpay_signature text, updated_at timestamptz DEFAULT now(), verification_version int,
  refund_amount numeric, refund_id text, refund_reason text, refunded_at timestamptz, refunded_by uuid);
CREATE UNIQUE INDEX ON public.payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.subscription_plans(id), payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','expired','cancelled','failed')),
  starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, message text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all', channel text NOT NULL DEFAULT 'in_app',
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('draft','sent','scheduled')),
  sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  scheduled_at timestamptz, recipient_ids uuid[] NOT NULL DEFAULT '{}', action_link text, type text);

-- Same service-only payment write guard as production.
CREATE FUNCTION public.guard_service_payment_writes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Payment changes require a trusted server payment workflow' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER payments_service_write_guard BEFORE INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.guard_service_payment_writes();

INSERT INTO public.subscription_plans (id, title, duration_days, price, order_index) VALUES
  ('plan_free', 'Free Plan', 36500, 0, 0),
  ('pro_1_month', '1-Month Pass', 30, 49, 1),
  ('pro_6_month', '6-Month Pass', 180, 199, 2),
  ('pro_1_year', '1-Year All-Access Pro Pass', 365, 299, 3);
