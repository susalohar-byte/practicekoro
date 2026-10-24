import { expect, test, type Page } from '@playwright/test';
import { SupabaseStub } from './support/supabaseStub';

const PAYMENT_ID = '7d3c2b9e-1111-4a2b-9c3d-000000000001';

const paymentRow = {
  id: PAYMENT_ID,
  user_id: '00000000-0000-4000-8000-0000000000aa',
  student_name: 'Riya Sen',
  student_email: 'riya.sen@example.test',
  plan_id: 'pro_annual',
  plan_title: 'Pro Annual',
  amount: 499,
  currency: 'INR',
  gateway: 'razorpay',
  razorpay_order_id: 'order_E2E0001',
  razorpay_payment_id: 'pay_E2E0001',
  transaction_id: 'pay_E2E0001',
  status: 'completed',
  created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
};

function stubPayments(stub: SupabaseStub) {
  stub.on('rpc', 'get_admin_payments', (call) =>
    Number(call.body?.p_offset ?? 0) === 0 ? [paymentRow] : []
  );
}

async function openRefundModal(page: Page) {
  await page.goto('/admin/payments');
  const row = page.getByRole('row').filter({ hasText: 'Riya Sen' });
  await expect(row).toBeVisible();
  await expect(row.getByText('Success')).toBeVisible();
  await row.getByRole('button').last().click();
  await page.getByRole('button', { name: 'Refund Payment' }).click();
  await expect(page.getByText('Process Payment Refund')).toBeVisible();
}

test.describe('Admin refund flow', () => {
  test('a partial gateway refund sends rupees for the payment and marks it refunded', async ({
    page,
  }) => {
    const stub = new SupabaseStub();
    stubPayments(stub);
    stub.on('function', 'process-razorpay-refund', (call) => ({
      body: {
        success: true,
        refundId: 'rfnd_E2E0001',
        refundAmount: call.body.refundAmount,
        revokedSubscription: false,
      },
    }));
    await stub.install(page);

    await openRefundModal(page);
    await page.getByLabel(/Refund Amount/).fill('199.50');
    await expect(page.getByText('Partial Refund')).toBeVisible();
    await page.getByRole('button', { name: /Confirm & Issue ₹199\.5 Refund/ }).click();

    await expect(page.getByText('Refund processed for Riya Sen')).toBeVisible();
    const [refundCall] = stub.callsTo('function', 'process-razorpay-refund');
    expect(refundCall.method).toBe('POST');
    expect(refundCall.body).toMatchObject({
      paymentId: PAYMENT_ID,
      refundAmount: 199.5,
      mode: 'gateway',
      revokeSubscription: true,
    });
    // A gateway refund never carries an admin-typed reference id.
    expect(refundCall.body.refundId).toBeUndefined();

    const row = page.getByRole('row').filter({ hasText: 'Riya Sen' });
    await expect(row.getByText('Refunded')).toBeVisible();
    await expect(page.getByText('Process Payment Refund')).toBeHidden();
  });

  test('an unconfirmed gateway refund (502) is shown as an error, not a success', async ({
    page,
  }) => {
    const stub = new SupabaseStub();
    stubPayments(stub);
    const pendingMessage =
      'Could not confirm the Razorpay refund (network error). The payment is held as refunded ' +
      'to prevent a duplicate refund. Check the Razorpay dashboard; the refund webhook ' +
      'will record it if it went through.';
    stub.on('function', 'process-razorpay-refund', () => ({
      status: 502,
      body: { error: pendingMessage },
    }));
    await stub.install(page);

    await openRefundModal(page);
    await page.getByLabel(/Refund Amount/).fill('100');
    await page.getByRole('button', { name: /Confirm & Issue ₹100 Refund/ }).click();

    await expect(page.getByText(/Could not confirm the Razorpay refund/)).toBeVisible();
    expect(stub.callsTo('function', 'process-razorpay-refund')).toHaveLength(1);
    // The modal stays open with the error; the row is not flipped to Refunded.
    await expect(page.getByText('Process Payment Refund')).toBeVisible();
    await expect(page.getByText('Refund processed for Riya Sen')).toHaveCount(0);
    const row = page.getByRole('row').filter({ hasText: 'Riya Sen' });
    await expect(row.getByText('Success')).toBeVisible();
  });
});
