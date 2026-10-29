import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminPayments } from './AdminPayments';
import type { AdminPaymentRow } from '@/types';

vi.mock('@/services/api', () => ({
  api: { getAllAdminPayments: vi.fn(), processPaymentRefund: vi.fn(), cancelSubscription: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => vi.clearAllMocks());

const payment: AdminPaymentRow = {
  id: 'p1',
  userId: 'u1',
  studentName: 'Paid Student',
  studentEmail: 'paid@example.com',
  amount: 199,
  currency: 'INR',
  gateway: 'razorpay',
  status: 'completed',
  transactionId: 'pay_verified',
  createdAt: new Date().toISOString(),
};

// Details are explicitly selected by the user, never auto-opened on load.
async function renderAndSelectPayment() {
  render(<AdminPayments />);
  fireEvent.click(await screen.findByText('Paid Student'));
}

describe('AdminPayments status and subscription display', () => {
  it('excludes pending, failed, and refunded amounts from successful revenue', async () => {
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([
      payment,
      { ...payment, id: 'p2', studentName: 'Pending Student', amount: 699, status: 'pending' },
      { ...payment, id: 'p3', studentName: 'Failed Student', amount: 999, status: 'failed' },
      { ...payment, id: 'p4', studentName: 'Refunded Student', amount: 499, status: 'refunded' },
    ]);
    await renderAndSelectPayment();
    await screen.findByText('Pending Student');
    expect(screen.getAllByText('Retained Revenue')[0].parentElement).toHaveTextContent('₹199');
    expect(screen.getAllByText('Successful')[0].parentElement).toHaveTextContent('25%');
    expect(
      within(screen.getByRole('table', { name: 'Payment records' })).getByText('Pending')
    ).toBeInTheDocument();
  });

  it('offers a Pending filter that only displays pending payments', async () => {
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([
      payment,
      { ...payment, id: 'p2', studentName: 'Pending Student', status: 'pending' },
    ]);
    await renderAndSelectPayment();
    await screen.findByText('Pending Student');
    fireEvent.change(screen.getByDisplayValue('All Status'), { target: { value: 'Pending' } });
    const table = within(screen.getByRole('table', { name: 'Payment records' }));
    expect(table.getByText('Pending Student')).toBeInTheDocument();
    expect(table.queryByText('Paid Student')).not.toBeInTheDocument();
  });

  it('disables refund for a pending payment and does not invent subscription expiry', async () => {
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([{ ...payment, status: 'pending' }]);
    await renderAndSelectPayment();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Refund Payment' })).toBeDisabled()
    );
    expect(screen.getByText('Subscription details unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/12 Feb 2027/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Retained Revenue')[0].parentElement).toHaveTextContent('₹0');
  });

  it('shows real expired subscription date and zero days left for a completed payment', async () => {
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([
      {
        ...payment,
        subscriptionStatus: 'expired',
        subscriptionExpiresAt: '2020-01-02T00:00:00Z',
      },
    ]);
    await renderAndSelectPayment();
    expect(await screen.findByText(/Valid till.*2020.*0 days left/)).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refund Payment' })).toBeEnabled();
  });

  it('displays Success, Pending, and Failed stats in summary cards and filters on card click', async () => {
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([
      { ...payment, id: 'p1', studentName: 'Alice Success', status: 'completed', amount: 499 },
      { ...payment, id: 'p2', studentName: 'Bob Pending', status: 'pending', amount: 299 },
      { ...payment, id: 'p3', studentName: 'Charlie Failed', status: 'failed', amount: 199 },
      { ...payment, id: 'p4', studentName: 'Daisy Refunded', status: 'refunded', amount: 399 },
    ]);
    render(<AdminPayments />);
    await screen.findByText('Alice Success');

    // Stats cards render counts and values
    expect(screen.getByRole('button', { name: /Successful/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pending/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Failed/ })).toBeInTheDocument();
    expect(screen.getAllByText('₹299').length).toBeGreaterThanOrEqual(2); // in card and table row

    // Clicking Pending card filters table to only pending
    fireEvent.click(screen.getByRole('button', { name: /Pending/ }));
    const table = within(screen.getByRole('table', { name: 'Payment records' }));
    expect(table.getByText('Bob Pending')).toBeInTheDocument();
    expect(table.queryByText('Alice Success')).not.toBeInTheDocument();
    expect(table.queryByText('Charlie Failed')).not.toBeInTheDocument();
  });

  it('paginates payments across multiple pages correctly', async () => {
    // Generate 15 payments
    const manyPayments: AdminPaymentRow[] = Array.from({ length: 15 }, (_, i) => ({
      ...payment,
      id: `p-${i + 1}`,
      studentName: `Student ${i + 1}`,
      transactionId: `txn-${i + 1}`,
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
    }));
    vi.mocked(api.getAllAdminPayments).mockResolvedValue(manyPayments);
    render(<AdminPayments />);

    // Page 1 should show Student 1 to 10
    expect(await screen.findByText('Student 1')).toBeInTheDocument();
    expect(screen.getByText('Student 10')).toBeInTheDocument();
    expect(screen.queryByText('Student 11')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1–10 of 15 payments/)).toBeInTheDocument();

    // Click Page 2
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(await screen.findByText('Student 11')).toBeInTheDocument();
    expect(screen.getByText('Student 15')).toBeInTheDocument();
    expect(screen.queryByText('Student 1')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 11–15 of 15 payments/)).toBeInTheDocument();
  });
});

describe('AdminPayments subscription cancellation', () => {
  const linkedPayment: AdminPaymentRow = {
    ...payment,
    subscriptionId: 'subscription-real-id',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: '2099-12-31T00:00:00Z',
  };

  it('waits for backend revocation and preserves successful payment and revenue', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([linkedPayment]);
    let finish!: (result: { success: boolean; expiresAt?: string }) => void;
    vi.mocked(api.cancelSubscription).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    await renderAndSelectPayment();
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(api.cancelSubscription).toHaveBeenCalledWith('subscription-real-id');
    expect(screen.getByRole('button', { name: 'Cancelling…' })).toBeDisabled();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText(/Subscription cancelled for/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelling…' }));
    expect(api.cancelSubscription).toHaveBeenCalledTimes(1);

    await act(async () => finish({ success: true, expiresAt: '2026-10-01T00:00:00Z' }));
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeDisabled();
    expect(
      within(screen.getByRole('table', { name: 'Payment records' })).getByText('Success')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Retained Revenue')[0].parentElement).toHaveTextContent('₹199');
  });

  it('retains active access in the UI and shows an error when backend denies cancellation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([linkedPayment]);
    vi.mocked(api.cancelSubscription).mockResolvedValue({
      success: false,
      error: 'Permission denied',
    });
    await renderAndSelectPayment();
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText(/Subscription cancelled for/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeEnabled();
  });

  it('handles network errors without showing a successful cancellation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([linkedPayment]);
    vi.mocked(api.cancelSubscription).mockRejectedValue(new Error('Network unavailable'));
    await renderAndSelectPayment();
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not revoke access when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([linkedPayment]);
    await renderAndSelectPayment();
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(api.cancelSubscription).not.toHaveBeenCalled();
  });

  it('disables cancellation if no linked active subscription is known', async () => {
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([payment]);
    await renderAndSelectPayment();
    await screen.findByText('Subscription details unavailable');
    expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeDisabled();
    expect(api.cancelSubscription).not.toHaveBeenCalled();
  });

  it('shows a failed complete load and prevents misleading CSV export', async () => {
    vi.mocked(api.getAllAdminPayments).mockRejectedValue(new Error('Later page failed'));
    render(<AdminPayments />);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be fully loaded');
    expect(screen.getByRole('button', { name: 'Export Payments' })).toBeDisabled();
  });
});
