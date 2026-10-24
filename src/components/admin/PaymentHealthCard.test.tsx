import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const getPaymentHealth = vi.fn();
const resolvePaymentAlert = vi.fn();
vi.mock('@/services/domains/paymentHealth', () => ({
  getPaymentHealth: () => getPaymentHealth(),
  resolvePaymentAlert: (id: string) => resolvePaymentAlert(id),
}));

import { PaymentHealthCard } from './PaymentHealthCard';

const alert = {
  id: 'a1',
  kind: 'function_error' as const,
  source: 'create-razorpay-order',
  message: 'Pending payment could not be saved, so checkout is failing for every student.',
  occurrences: 3,
  firstSeenAt: '2026-10-23T05:00:00Z',
  lastSeenAt: '2026-10-23T06:00:00Z',
  detail: {},
};

describe('PaymentHealthCard', () => {
  beforeEach(() => {
    getPaymentHealth.mockReset();
    resolvePaymentAlert.mockReset();
  });

  it('renders nothing for staff who are not super admins', async () => {
    getPaymentHealth.mockResolvedValue(null);
    const { container } = render(<PaymentHealthCard />);
    await waitFor(() => expect(getPaymentHealth).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when payments are healthy (no open alerts)', async () => {
    getPaymentHealth.mockResolvedValue([]);
    const { container } = render(<PaymentHealthCard />);
    await waitFor(() => expect(getPaymentHealth).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('lists open alerts and removes one once resolved', async () => {
    getPaymentHealth.mockResolvedValue([alert]);
    resolvePaymentAlert.mockResolvedValue(undefined);
    const { container } = render(<PaymentHealthCard />);
    expect(await screen.findByText(/1 open alert/)).toBeInTheDocument();
    expect(screen.getByText(/checkout is failing for every student/)).toBeInTheDocument();
    expect(screen.getByText(/3 times/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark resolved' }));
    await waitFor(() => expect(resolvePaymentAlert).toHaveBeenCalledWith('a1'));
    expect(container).toBeEmptyDOMElement();
  });

  it('offers a retry when the check fails', async () => {
    getPaymentHealth.mockRejectedValue(new Error('network'));
    render(<PaymentHealthCard />);
    expect(await screen.findByText(/could not be checked/)).toBeInTheDocument();
  });
});
