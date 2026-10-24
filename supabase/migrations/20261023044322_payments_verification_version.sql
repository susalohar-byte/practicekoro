-- create-razorpay-order records verification_version = 2 on every server-created order,
-- but no migration ever added the column, so every order insert failed and checkout
-- could not record pending payments. Additive only.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verification_version SMALLINT;
COMMENT ON COLUMN public.payments.verification_version IS
    'Order flow version: 2 = Razorpay Orders API order created by create-razorpay-order.';

NOTIFY pgrst, 'reload schema';
