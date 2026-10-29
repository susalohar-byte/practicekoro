-- Admins name coupons in the coupon form ("Welcome Offer"). Until now the title was
-- derived from the code and the field was read-only. Nullable: old rows keep showing
-- the code-derived title.
alter table public.coupons add column if not exists title text;

comment on column public.coupons.title is 'Display title set by admins; null falls back to the coupon code.';
