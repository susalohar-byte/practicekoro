import { describe, expect, it, vi } from 'vitest';
import { reportPaymentAlert } from './payment-alerts';

describe('reportPaymentAlert', () => {
  it('records one deduplicated function_error per source and reason', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await reportPaymentAlert(
      { rpc },
      'create-razorpay-order',
      'order_insert_failed',
      'Insert failed',
      {
        code: '42703',
      }
    );
    expect(rpc).toHaveBeenCalledWith('record_payment_alert', {
      p_kind: 'function_error',
      p_ref: 'create-razorpay-order:order_insert_failed',
      p_source: 'create-razorpay-order',
      p_message: 'Insert failed',
      p_detail: { code: '42703' },
    });
  });

  it('never throws, so alerting cannot change the failing response', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rejecting = { rpc: vi.fn().mockRejectedValue(new Error('network down')) };
    const failing = { rpc: vi.fn().mockResolvedValue({ error: { code: '42501' } }) };
    await expect(reportPaymentAlert(rejecting, 's', 'r', 'm')).resolves.toBeUndefined();
    await expect(reportPaymentAlert(failing, 's', 'r', 'm')).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });
});
