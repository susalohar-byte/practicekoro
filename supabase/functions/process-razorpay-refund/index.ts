// supabase/functions/process-razorpay-refund/index.ts
// PracticeKoro 2.0 - Authoritative Admin Razorpay Payment Refund Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { paiseToRupees, rupeesToPaise } from '../_shared/razorpay-signature.ts';

interface RefundRequestPayload {
  paymentId: string; // Database payments.id (UUID) or razorpay_payment_id
  refundAmount?: number; // In Rupees (optional, defaults to full amount)
  reason?: string;
  notes?: Record<string, any>;
  revokeSubscription?: boolean;
  // 'gateway' refunds through Razorpay; 'manual' records a refund already paid out elsewhere.
  mode?: 'gateway' | 'manual';
  refundId?: string;
}

Deno.serve(async (req: Request) => {
  // 1. CORS Configuration
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (
    requestOrigin &&
    (effectiveOrigins.includes(requestOrigin) || requestOrigin.includes('localhost'))
  ) {
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
  } else {
    corsHeaders['Access-Control-Allow-Origin'] = '*';
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

  // 2. Validate Authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Authentication required' }), {
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

  // Validate admin identity
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // Refunds are a super-admin operation, mirroring admin_scope_allowed('super').
  const [{ data: callerProfile }, { data: callerAdminRole }] = await Promise.all([
    serviceClient
      .from('profiles')
      .select('role, admin_role, account_status')
      .eq('id', user.id)
      .maybeSingle(),
    serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle(),
  ]);
  const hasAdminRole = Boolean(
    callerAdminRole &&
    callerProfile?.role === 'admin' &&
    callerProfile?.admin_role === 'super_admin' &&
    callerProfile?.account_status === 'active'
  );

  if (!hasAdminRole) {
    return new Response(JSON.stringify({ error: 'Forbidden: Super admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Parse request payload
  let payload: RefundRequestPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // The id is interpolated into a PostgREST filter, so only allow plain identifiers.
  if (!payload.paymentId || !/^[A-Za-z0-9_-]{1,100}$/.test(payload.paymentId)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid paymentId in request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Retrieve payment record from DB. payments.id is a uuid column, so only compare
  // it when the identifier is a UUID; otherwise PostgREST rejects the whole filter.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    payload.paymentId
  );
  const { data: payment, error: fetchError } = await serviceClient
    .from('payments')
    .select('*')
    .or(
      isUuid
        ? `id.eq.${payload.paymentId}`
        : `razorpay_payment_id.eq.${payload.paymentId},transaction_id.eq.${payload.paymentId}`
    )
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !payment) {
    return new Response(JSON.stringify({ error: 'Payment record not found in database' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (payment.status === 'refunded') {
    return new Response(
      JSON.stringify({
        error: `Payment is already refunded (Refund ID: ${payment.refund_id || 'N/A'}, Amount: ₹${payment.refund_amount})`,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (payment.status !== 'completed') {
    return new Response(
      JSON.stringify({
        error: `Only completed payments can be refunded. Current payment status is "${payment.status}".`,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const paymentAmountNum = Number(payment.amount);
  const requestedRefund = payload.refundAmount ? Number(payload.refundAmount) : paymentAmountNum;

  if (isNaN(requestedRefund) || requestedRefund <= 0 || requestedRefund > paymentAmountNum) {
    return new Response(
      JSON.stringify({
        error: `Refund amount must be greater than 0 and no greater than original amount (₹${paymentAmountNum})`,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const mode = payload.mode === 'manual' ? 'manual' : 'gateway';
  const razorpayPaymentId: string | null = payment.razorpay_payment_id || payment.transaction_id;
  if (mode === 'gateway' && !razorpayPaymentId?.startsWith('pay_')) {
    return new Response(
      JSON.stringify({
        error: 'This payment has no Razorpay payment id. Record it as a manual refund instead.',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const refundReasonText = payload.reason?.trim() || 'Admin initiated refund';
  const nowIso = new Date().toISOString();

  // 5. Atomically claim the payment so concurrent requests cannot refund it twice.
  const { data: claimed, error: claimError } = await serviceClient
    .from('payments')
    .update({ status: 'refunded', updated_at: nowIso })
    .eq('id', payment.id)
    .eq('status', 'completed')
    .select('id');
  if (claimError || !claimed?.length) {
    return new Response(
      JSON.stringify({
        error: claimError
          ? `Could not lock payment for refund: ${claimError.message}`
          : 'Payment is already being refunded or is no longer completed.',
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const releaseClaim = () =>
    serviceClient
      .from('payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
  const failAndRelease = async (status: number, body: Record<string, unknown>) => {
    await releaseClaim();
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  // 6. Razorpay Refund API Processing
  let finalRefundId = payload.refundId?.trim() || `rfnd_manual_${Date.now()}`;
  let razorpayResponse: any = null;

  if (mode === 'gateway') {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    let resolvedKeyId = keyId;
    if (!resolvedKeyId) {
      try {
        const { data: gwData } = await serviceClient
          .from('payment_gateways')
          .select('key_id')
          .eq('gateway', 'razorpay')
          .eq('is_active', true)
          .maybeSingle();
        if (gwData?.key_id) resolvedKeyId = gwData.key_id;
      } catch (e) {
        console.warn('Could not read gateway credentials from table:', e);
      }
    }

    // Never report a gateway refund that was not actually sent to Razorpay.
    if (!resolvedKeyId || !keySecret || resolvedKeyId === 'rzp_test_practicekoro_key') {
      console.error('Razorpay keys are not configured; gateway refund refused.');
      return failAndRelease(503, {
        error: 'Razorpay refund keys are not configured on the server. No money was refunded.',
      });
    }

    const authHeaderBasic = 'Basic ' + btoa(`${resolvedKeyId.trim()}:${keySecret.trim()}`);
    const refundPaise = rupeesToPaise(requestedRefund);
    const refundNoteKey = `${payment.id}:${nowIso}`;

    // When the refund call's outcome is unknown (timeout, dropped connection, unreadable
    // body), ask Razorpay whether this exact refund exists before releasing the claim.
    // Releasing blindly would let a retry refund the same payment twice.
    const findIssuedRefund = async (): Promise<'none' | 'unknown' | Record<string, any>> => {
      try {
        const res = await fetch(
          `https://api.razorpay.com/v1/payments/${razorpayPaymentId}/refunds?count=100`,
          { headers: { Authorization: authHeaderBasic } }
        );
        if (!res.ok) return 'unknown';
        const body = await res.json();
        const items: any[] = Array.isArray(body?.items) ? body.items : [];
        const match = items.find((r) => r?.notes?.refund_request === refundNoteKey);
        return match ?? 'none';
      } catch {
        return 'unknown';
      }
    };
    const holdForReconciliation = async (detail: string) => {
      // Keep the payment claimed so it cannot be refunded again; the refund webhook
      // (reconcile_razorpay_refund) records the real amount if Razorpay processed it.
      await serviceClient
        .from('payments')
        .update({
          refund_reason: refundReasonText,
          raw_response: {
            ...(payment.raw_response ?? {}),
            refund_pending_confirmation: true,
            refund_request: refundNoteKey,
            refund_requested_amount: requestedRefund,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
      return new Response(
        JSON.stringify({
          error:
            `Could not confirm the Razorpay refund (${detail}). The payment is held as refunded ` +
            'to prevent a duplicate refund. Check the Razorpay dashboard; the refund webhook ' +
            'will record it if it went through.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    };

    try {
      const rzpRefundRes = await fetch(
        `https://api.razorpay.com/v1/payments/${razorpayPaymentId}/refund`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeaderBasic,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: refundPaise,
            notes: {
              reason: payload.reason || 'Admin Initiated Refund',
              admin_email: user.email || '',
              payment_id: payment.id,
              platform: 'PracticeKoro',
              ...(payload.notes || {}),
              refund_request: refundNoteKey,
            },
          }),
        }
      );

      razorpayResponse = await rzpRefundRes.json().catch(() => null);

      if (rzpRefundRes.status >= 500 || (rzpRefundRes.ok && !razorpayResponse?.id)) {
        // The gateway may have processed the refund even though we got no usable answer.
        const issued = await findIssuedRefund();
        if (issued === 'unknown') {
          return holdForReconciliation(`gateway responded ${rzpRefundRes.status}`);
        }
        if (issued !== 'none') razorpayResponse = issued;
      }

      if (!razorpayResponse?.id) {
        const errMsg =
          razorpayResponse?.error?.description ||
          razorpayResponse?.error?.message ||
          'Razorpay refund API call failed';
        console.error('Razorpay Refund API error:', razorpayResponse);
        return failAndRelease(400, {
          error: `Razorpay Gateway Error: ${errMsg}`,
          details: razorpayResponse,
        });
      }
      finalRefundId = razorpayResponse.id;
    } catch (fetchErr: any) {
      console.error('Network error during Razorpay refund:', fetchErr);
      const issued = await findIssuedRefund();
      if (issued === 'none') {
        return failAndRelease(502, {
          error: `Network error connecting to Razorpay: ${fetchErr?.message || 'Gateway unreachable'}. No refund was issued.`,
        });
      }
      if (issued === 'unknown') {
        return holdForReconciliation(fetchErr?.message || 'gateway unreachable');
      }
      razorpayResponse = issued;
      finalRefundId = issued.id;
    }
  }

  // 6b. Record the refund on the claimed payment row.
  const { error: recordError } = await serviceClient
    .from('payments')
    .update({
      status: 'refunded',
      refund_amount: requestedRefund,
      refund_id: finalRefundId,
      refund_reason: refundReasonText,
      refunded_at: nowIso,
      refunded_by: user.id,
      updated_at: nowIso,
    })
    .eq('id', payment.id);
  if (recordError) {
    console.error('Refund recorded at gateway but database update failed:', recordError);
    if (mode === 'manual') {
      return failAndRelease(500, { error: `Could not record refund: ${recordError.message}` });
    }
    // The money has moved; keep the row claimed as refunded and surface the problem.
    return new Response(
      JSON.stringify({
        error: `Razorpay refund ${finalRefundId} succeeded but saving its details failed: ${recordError.message}`,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 6c. Revoke only what this payment granted: a new pass or renewal cycle is
  // cancelled; an upgrade is reverted to the previous plan and expiry.
  let revokedSubscription = false;
  if (payload.revokeSubscription !== false) {
    const { data: revokeResult, error: revokeError } = await serviceClient.rpc(
      'revoke_access_for_refunded_payment',
      { p_payment_row_id: payment.id }
    );
    if (revokeError) {
      console.error('Subscription revoke after refund failed:', revokeError);
    } else {
      // Only report a revoke when something was actually cancelled or reverted.
      revokedSubscription =
        Number(revokeResult?.cancelled_subscriptions ?? 0) > 0 ||
        revokeResult?.upgrade_reverted === true;
    }
  }

  // 7. Audit log insertion
  try {
    await serviceClient.from('admin_audit_logs').insert({
      admin_id: user.id,
      admin_email: user.email || '',
      admin_name: user.user_metadata?.full_name || 'Administrator',
      admin_role: 'super_admin',
      action: 'PAYMENT_REFUND_PROCESSED',
      entity_type: 'payments',
      entity_id: payment.id,
      entity_name: `Payment Refund ₹${requestedRefund}`,
      details: {
        payment_id: payment.id,
        razorpay_payment_id: razorpayPaymentId,
        refund_id: finalRefundId,
        refund_amount: requestedRefund,
        original_amount: paymentAmountNum,
        reason: refundReasonText,
        user_id: payment.user_id,
        mode,
        revoked_subscription: revokedSubscription,
        gateway_response: razorpayResponse,
      },
      created_at: nowIso,
    });
  } catch (auditErr) {
    console.warn('Non-blocking audit log failure:', auditErr);
  }

  // 8. Return success response
  return new Response(
    JSON.stringify({
      success: true,
      message: `Refund of ₹${requestedRefund} successfully processed.`,
      refundId: finalRefundId,
      refundAmount: requestedRefund,
      paymentId: payment.id,
      status: 'refunded',
      revokedSubscription,
      gatewayResponse: razorpayResponse,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
