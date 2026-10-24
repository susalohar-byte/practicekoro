// supabase/functions/verify-payment/index.ts
// PracticeKoro 2.0 - Server-Side Payment Verification Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { buildPaymentSignaturePayload, verifyHmacSha256 } from '../_shared/razorpay-signature.ts';

import { reportPaymentAlert } from '../_shared/payment-alerts.ts';
import { isVerificationPayload, isRecord } from '../_shared/payment-validation.ts';

const SOURCE = 'verify-payment';

Deno.serve(async (req: Request) => {
  // 1. CORS headers — restricted to ALLOWED_ORIGINS; when unset, defaults
  // to the production domains (never the permissive '*' fallback).
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const effectiveOrigins =
    allowedOrigins.length > 0
      ? allowedOrigins
      : ['https://practicekoro.online', 'https://www.practicekoro.online'];
  const requestOrigin = req.headers.get('Origin');
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
  if (requestOrigin && effectiveOrigins.includes(requestOrigin)) {
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Validate user auth token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Server misconfiguration: Supabase environment keys missing');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify caller user identity
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // 3. Resolve key secret — Supabase secrets ONLY. There is intentionally
  // no database fallback: payment secrets must never live in app tables.
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

  if (!keySecret) {
    console.error('Server misconfiguration: RAZORPAY_KEY_SECRET is not set in Supabase secrets');
    await reportPaymentAlert(
      serviceClient,
      SOURCE,
      'key_secret_missing',
      'RAZORPAY_KEY_SECRET is not set; payments cannot be verified.'
    );
    return new Response(JSON.stringify({ error: 'Payment gateway secret not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Parse request payload
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!isVerificationPayload(payload)) {
    return new Response(JSON.stringify({ error: 'Missing required verification fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { orderId, paymentId, signature, planId } = payload;

  // 5. Cryptographic signature verification
  const isValid = await verifyHmacSha256(
    buildPaymentSignaturePayload(orderId, paymentId),
    signature,
    keySecret
  );
  if (!isValid) {
    console.warn('Invalid Razorpay payment signature attempt rejected');
    return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Bind proof to this authenticated user's exact recorded order. Never use
  // an arbitrary/latest pending order as a fallback.
  const { data: payment, error: paymentError } = await serviceClient
    .from('payments')
    .select('id, user_id, plan_id, amount, currency')
    .eq('razorpay_order_id', orderId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (paymentError || !payment || payment.plan_id !== planId) {
    await reportPaymentAlert(
      serviceClient,
      SOURCE,
      `order_not_found:${orderId}`,
      `A signed Razorpay payment (${paymentId}) has no matching order record for this student.`,
      { order_id: orderId, payment_id: paymentId, plan_id: planId, user_id: user.id }
    );
    return new Response(
      JSON.stringify({ error: 'Payment order not found for this account and plan' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // A checkout signature alone does not assert that the payment was captured.
  // Fetch provider-authoritative status/amount before service-only activation.
  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  if (!keyId) {
    await reportPaymentAlert(
      serviceClient,
      SOURCE,
      'key_id_missing',
      'RAZORPAY_KEY_ID is not set; payments cannot be verified.'
    );
    return new Response(JSON.stringify({ error: 'Payment key not configured' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`) },
      }
    );
    const captured: unknown = await response.json();
    if (
      !response.ok ||
      !isRecord(captured) ||
      captured.id !== paymentId ||
      captured.order_id !== orderId ||
      captured.status !== 'captured' ||
      captured.currency !== payment.currency ||
      typeof captured.amount !== 'number' ||
      !Number.isSafeInteger(captured.amount) ||
      captured.amount !== Math.round(Number(payment.amount) * 100)
    ) {
      await reportPaymentAlert(
        serviceClient,
        SOURCE,
        `capture_unconfirmed:${paymentId}`,
        `Razorpay did not confirm capture of ${paymentId} for the recorded amount. Check it in Razorpay.`,
        { order_id: orderId, payment_id: paymentId, user_id: user.id, status: response.status }
      );
      return new Response(
        JSON.stringify({
          error: 'Captured payment could not be confirmed. Do not pay again; retry verification.',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch {
    await reportPaymentAlert(
      serviceClient,
      SOURCE,
      'razorpay_unreachable',
      'Could not reach Razorpay to confirm a payment.',
      { payment_id: paymentId }
    );
    return new Response(
      JSON.stringify({ error: 'Payment provider unavailable. Retry verification, not payment.' }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // 6. Only this trusted endpoint (or another service) may activate access.
  const { data: rpcResult, error: rpcError } = await serviceClient.rpc(
    'activate_verified_razorpay_payment',
    {
      p_user_id: user.id,
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_signature: signature,
      p_plan_id: planId,
    }
  );

  // Captured, but the upgrade/renewal stopped being eligible (e.g. a second renewal
  // paid in another tab). Access was deliberately not changed; the payment is
  // flagged for refund so support can return it.
  if (!rpcError && isRecord(rpcResult) && rpcResult.activation_blocked === true) {
    return new Response(
      JSON.stringify({
        error:
          'Payment received, but this purchase is no longer eligible, so your pass was not changed. It has been flagged for a refund; please contact support.',
        reasonCode: rpcResult.reason_code,
        requiresRefund: true,
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (
    rpcError ||
    !isRecord(rpcResult) ||
    rpcResult.success !== true ||
    !rpcResult.subscription_id
  ) {
    console.error('Payment verification RPC rejected. Error code:', rpcError?.code);
    await reportPaymentAlert(
      serviceClient,
      SOURCE,
      `activation_failed:${orderId}`,
      `Captured payment ${paymentId} could not activate a Pro Pass.`,
      { order_id: orderId, payment_id: paymentId, user_id: user.id, code: rpcError?.code ?? null }
    );
    return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      subscriptionId: rpcResult.subscription_id,
      status: rpcResult.status,
      startsAt: rpcResult.starts_at,
      expiresAt: rpcResult.expires_at,
      isRenewal: rpcResult.is_renewal,
      purchaseType: rpcResult.purchase_type,
      planTitle: rpcResult.plan_title,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
