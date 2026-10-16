import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  response: { data: [] as unknown, error: null as unknown },
  invoke: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    from: () => ({ select: () => ({ order: async () => m.response }) }),
    functions: { invoke: m.invoke },
    rpc: m.rpc,
  },
}));
import { subscriptionApi } from './subscription';
describe('Controlled upgrade & renewal client contract', () => {
  beforeEach(() => {
    m.invoke.mockReset();
    m.rpc.mockReset();
  });
  it('maps server-computed purchase options without recomputing them', async () => {
    m.rpc.mockResolvedValue({
      data: [
        { plan_id: 'pro_1_year', eligible: true, purchase_type: 'upgrade', amount: '250' },
        { plan_id: 'pro_1_month', eligible: false, reason_code: 'shorter_duration', message: 'no' },
      ],
      error: null,
    });
    const options = await subscriptionApi.getSubscriptionPurchaseOptions();
    expect(m.rpc).toHaveBeenCalledWith('get_my_subscription_purchase_options');
    expect(options).toEqual([
      expect.objectContaining({
        planId: 'pro_1_year',
        eligible: true,
        purchaseType: 'upgrade',
        amount: 250,
      }),
      expect.objectContaining({
        planId: 'pro_1_month',
        eligible: false,
        reasonCode: 'shorter_duration',
      }),
    ]);
  });
  it('throws instead of guessing when eligibility cannot be loaded', async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: 'denied' } });
    await expect(subscriptionApi.getSubscriptionPurchaseOptions()).rejects.toThrow('denied');
  });
  it('surfaces a captured-but-not-applied payment instead of asking to retry', async () => {
    m.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'non-2xx',
        context: {
          json: async () => ({
            error: 'Payment received, but not eligible.',
            requiresRefund: true,
          }),
        },
      },
    });
    await expect(
      subscriptionApi.verifyRazorpayPayment({
        orderId: 'o',
        paymentId: 'p',
        signature: 's',
        planId: 'x',
      })
    ).rejects.toThrow('Payment received, but not eligible.');
  });
  it('passes the server purchase type and quoted amount through from order creation', async () => {
    m.invoke.mockResolvedValue({
      data: {
        verification_version: 2,
        order_id: 'order_1',
        amount: 250,
        key_id: 'key',
        purchase_type: 'upgrade',
        new_expires_at: '2027-10-01T00:00:00Z',
      },
      error: null,
    });
    expect(await subscriptionApi.createRazorpayOrder('pro_1_year')).toMatchObject({
      amount: 250,
      purchaseType: 'upgrade',
      newExpiresAt: '2027-10-01T00:00:00Z',
    });
  });
});

describe('Payment integrity boundaries', () => {
  beforeEach(() => {
    m.response = { data: [], error: null };
    m.invoke.mockReset();
    m.rpc.mockReset();
    localStorage.clear();
    localStorage.setItem('practicekoro_payments', JSON.stringify([{ id: 'phantom' }]));
    localStorage.setItem('practicekoro_is_pro', 'true');
  });
  it('returns real empty data instead of local payment rows', async () => {
    expect(await subscriptionApi.getStudentPaymentHistory()).toEqual([]);
  });
  it.each([
    { data: null, error: null },
    { data: [], error: { message: 'denied' } },
    { data: {}, error: null },
  ])('throws on failed/incomplete production history %j', async (response) => {
    m.response = response;
    await expect(subscriptionApi.getStudentPaymentHistory()).rejects.toThrow();
  });
  it('does not call insecure legacy RPC when Edge verification fails', async () => {
    m.invoke.mockResolvedValue({ data: null, error: { message: 'offline' } });
    await expect(
      subscriptionApi.verifyRazorpayPayment({
        orderId: 'o',
        paymentId: 'p',
        signature: 's',
        planId: 'plan',
      })
    ).rejects.toThrow(/Do not pay again/);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it('blocks checkout when the backend security version is not deployed', async () => {
    m.invoke.mockResolvedValue({ data: { order_id: 'order_1', amount: 100 }, error: null });
    await expect(subscriptionApi.createRazorpayOrder('plan')).rejects.toThrow(/security update/);
  });
  it('accepts orders from the coordinated security rollout', async () => {
    m.invoke.mockResolvedValue({
      data: { verification_version: 2, order_id: 'order_1', amount: 100, key_id: 'key' },
      error: null,
    });
    expect(await subscriptionApi.createRazorpayOrder('plan')).toMatchObject({
      orderId: 'order_1',
      amount: 100,
    });
  });
  it('accepts confirmed service verification', async () => {
    m.invoke.mockResolvedValue({
      data: {
        success: true,
        subscriptionId: 's',
        status: 'active',
        startsAt: '2026-10-01',
        expiresAt: '2027-10-01',
      },
      error: null,
    });
    expect(
      await subscriptionApi.verifyRazorpayPayment({
        orderId: 'o',
        paymentId: 'p',
        signature: 's',
        planId: 'plan',
      })
    ).toMatchObject({ success: true, subscriptionId: 's' });
    expect(m.rpc).not.toHaveBeenCalled();
  });
});
