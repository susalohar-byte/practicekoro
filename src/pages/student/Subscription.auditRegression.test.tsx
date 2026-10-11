import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
const m = vi.hoisted(() => ({
  history: vi.fn(),
  validate: vi.fn(),
  create: vi.fn(),
  user: { id: 'u', email: 'u@example.test', fullName: 'Student' },
  plans: [
    {
      id: 'pro_1_year',
      title: 'Pro 1 Year',
      price: 299,
      durationDays: 365,
      features: [],
      isActive: true,
      orderIndex: 1,
    },
    {
      id: 'pro_lifetime',
      title: 'Pro Lifetime',
      price: 999,
      durationDays: 3650,
      features: [],
      isActive: true,
      orderIndex: 2,
    },
  ],
  subDetails: { isActive: false, hasSubscription: false, planId: undefined, daysRemaining: 0, expiresAt: undefined } as any,
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: m.user, refreshProStatus: vi.fn() }),
}));
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    plans: m.plans,
    subscriptionDetails: m.subDetails,
    refreshSubscription: vi.fn(),
  }),
}));
vi.mock('@/services/api', () => ({
  api: {
    getStudentPaymentHistory: m.history,
    validateCoupon: m.validate,
    createRazorpayOrder: m.create,
  },
}));
vi.mock('@/components/student/StudentSupportModal', () => ({ StudentSupportModal: () => null }));
import { Subscription } from './Subscription';
describe('Subscription truthful payment UI', () => {
  beforeEach(() => {
    m.history.mockReset().mockResolvedValue([]);
    m.validate.mockReset();
    m.create.mockReset();
    m.subDetails = { isActive: false, hasSubscription: false, planId: undefined, daysRemaining: 0, expiresAt: undefined };
  });
  it('clearly disables unsupported coupon checkout instead of promising a discount', async () => {
    render(
      <MemoryRouter>
        <Subscription />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Coupon checkout unavailable')).toBeDisabled()
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByText(/Purchases use the listed plan price/)).toBeInTheDocument();
    expect(m.validate).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });
  it('shows history errors and supports retry rather than false empty history', async () => {
    m.history.mockRejectedValueOnce(new Error('Connection unavailable'));
    render(
      <MemoryRouter>
        <Subscription />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Connection unavailable')
    );
    expect(screen.queryByText(/No payment records found/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry payment history' }));
    await waitFor(() => expect(screen.getByText(/No payment records found/)).toBeInTheDocument());
    expect(m.history).toHaveBeenCalledTimes(2);
  });
  it('never displays Extend Pass and blocks repurchasing same package while active', async () => {
    m.subDetails = {
      isActive: true,
      hasSubscription: true,
      planId: 'pro_1_year',
      planTitle: 'Pro 1 Year',
      daysRemaining: 180,
      expiresAt: '2027-01-01T00:00:00Z',
    };
    render(
      <MemoryRouter>
        <Subscription />
      </MemoryRouter>
    );
    // Extend Pass should never exist
    expect(screen.queryByText(/Extend Pass/i)).not.toBeInTheDocument();
    // Repurchase should be disabled for the active plan
    expect(
      screen.getByRole('button', { name: /Plan Currently Active — Repurchase Disabled/i })
    ).toBeDisabled();
    // User can see the upgrade option button for higher tier plan
    const upgradePill = screen.getByRole('button', { name: /Pro Lifetime — ₹999/i });
    expect(upgradePill).toBeInTheDocument();
    fireEvent.click(upgradePill);
    // When higher plan is selected, Upgrade button is enabled
    expect(
      screen.getByRole('button', { name: /Upgrade to Pro Lifetime — ₹999/i })
    ).toBeEnabled();
  });
});
