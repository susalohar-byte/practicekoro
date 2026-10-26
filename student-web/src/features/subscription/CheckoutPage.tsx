import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Crown, Lock, ShieldCheck, UserCircle2, Zap, AlertCircle, SearchX } from 'lucide-react';
import { fmtDate, fmtDateLong, inr } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { loadRazorpay, type RazorpaySuccess } from '@/lib/razorpay';
import { useAuth } from '@/auth/AuthProvider';
import { qk, usePlans, useProfile, useSubscription } from '@/hooks/queries';
import { createRazorpayOrder, fetchSubscription, isPassActive, planDuration, verifyPayment } from '@/services/account';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DialogHero, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

type Stage = 'idle' | 'ordering' | 'paying' | 'verifying';

export default function CheckoutPage() {
  const { planId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const plans = usePlans();
  const sub = useSubscription();
  const [stage, setStage] = useState<Stage>('idle');
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ amount: number; expiresAt: string | null; upgrade: boolean } | null>(null);

  if (plans.isLoading || sub.isLoading) return <Loader />;
  if (plans.isError) return <ErrorState message="Plans could not be loaded." error={plans.error} onRetry={() => void plans.refetch()} />;
  const plan = (plans.data ?? []).find((p) => p.id === planId);
  if (!plan) {
    return (
      <>
        <PageHeader title="Order Summary" back="/plans" />
        <Message icon={<SearchX />} title="Plan not found." message="This plan is no longer available." action={<ButtonLink to="/plans" variant="secondary">View Plans</ButtonLink>} />
      </>
    );
  }

  const s = sub.data;
  const active = isPassActive(s);
  const upgrade = s?.upgradeOptions.find((u) => u.planId === plan.id) ?? null;
  const blocked = active && !upgrade;
  const free = plan.price <= 0;
  const payable = upgrade ? upgrade.amount : plan.price;
  const busy = stage !== 'idle';

  const refreshPass = async () => {
    if (!user) return null;
    await queryClient.invalidateQueries({ queryKey: qk.subscription(user.id) });
    try {
      return await fetchSubscription();
    } catch {
      return null;
    }
  };

  /** Poll the pass for ~30 s: the Razorpay webhook may activate it after verify-payment fails. */
  const poll = async (amount: number, isUpgrade: boolean) => {
    for (let i = 0; i < 15; i++) {
      const cur = await refreshPass();
      if (cur && isPassActive(cur) && cur.planId === plan.id) {
        setSuccess({ amount, expiresAt: cur.expiresAt?.toISOString() ?? null, upgrade: isUpgrade });
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    toast('If money was deducted, your Pro Pass will activate automatically within a few minutes. Need help? Contact support from Help & Support.', 'info');
  };

  const pay = async () => {
    if (!user) return;
    setFailure(null);
    setStage('ordering');
    try {
      const [order] = await Promise.all([createRazorpayOrder(plan.id), loadRazorpay()]);
      setStage('paying');
      const isUpgrade = order.purchaseType === 'upgrade';
      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency || 'INR',
        name: 'PracticeKoro',
        description: plan.title,
        order_id: order.orderId,
        timeout: 300,
        prefill: {
          ...(profile?.phone ? { contact: profile.phone } : {}),
          ...(profile?.email || user.email ? { email: profile?.email || user.email } : {}),
          name: profile?.fullName || 'Student',
        },
        theme: { color: '#0158FC' },
        retry: { enabled: true, max_count: 2 },
        config: {
          display: {
            blocks: {
              wallets_and_upi: { name: 'Wallets, UPI & QR Code', instruments: [{ method: 'upi' }, { method: 'wallet', wallets: ['phonepe', 'paytm', 'mobikwik', 'airtelmoney', 'freecharge'] }] },
              cards_and_netbanking: { name: 'Cards & Netbanking', instruments: [{ method: 'card' }, { method: 'netbanking' }] },
            },
            sequence: ['block.wallets_and_upi', 'block.cards_and_netbanking'],
            preferences: { show_default_blocks: false },
            hide: [{ method: 'paylater' }, { method: 'emi' }],
          },
        },
        handler: async (r: RazorpaySuccess) => {
          setStage('verifying');
          const v = await verifyPayment({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature, planId: plan.id });
          if (v.ok) {
            await refreshPass();
            setSuccess({ amount: order.amount, expiresAt: v.expiresAt, upgrade: isUpgrade });
          } else {
            toast(
              v.message ??
                `We received your payment but could not confirm it yet. Your Pro Pass will activate automatically once confirmed. If it does not, contact support with payment ID ${r.razorpay_payment_id}.`,
              'info'
            );
            await poll(order.amount, isUpgrade);
          }
          setStage('idle');
        },
        modal: {
          ondismiss: () => {
            setStage('idle');
            toast('Payment was cancelled. No amount was deducted.');
          },
        },
      });
      rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
        setStage('idle');
        setFailure(resp?.error?.description || 'Payment could not be completed. Please check your bank or UPI app and try again.');
      });
      rzp.open();
    } catch (e) {
      setStage('idle');
      setFailure(friendlyError(e, 'Could not start checkout. No money was deducted. Please try again in a moment.'));
    }
  };

  const label = blocked
    ? 'Pass already active'
    : free
      ? 'Free Plan (No payment needed)'
      : stage === 'verifying'
        ? 'Confirming payment...'
        : upgrade
          ? `Upgrade for ${inr(payable)}`
          : `Pay ${inr(payable)} Now`;

  return (
    <div className="mx-auto max-w-5xl pb-28 lg:pb-0">
      <PageHeader title="Order Summary" back="/plans" />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
      <div>
      <Card className="flex items-center gap-3.5 p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Crown className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-extrabold text-ink">{plan.title}</p>
          <p className="text-[12.5px] text-muted">
            Validity: {planDuration(plan)} ({plan.durationDays} Days)
          </p>
        </div>
        <p className="text-[20px] font-black text-primary">{inr(plan.price)}</p>
      </Card>
      {(profile?.email || user?.email) && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-soft">
          <UserCircle2 className="h-4 w-4 text-muted" /> Activating for: {profile?.fullName || 'Student'} ({profile?.email || user?.email})
          <CheckCircle2 className="h-4 w-4 text-success" />
        </p>
      )}

      {blocked && s?.expiresAt && (
        <Card className="mt-4 border-[#FDE68A] bg-gold-soft p-4 text-[13.5px] text-[#92400E]">
          You already have an active {s.planTitle || 'Pro Pass'} valid until {fmtDateLong(s.expiresAt)}. This plan can be purchased after it expires.
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h2 className="mb-3 text-[15px] font-bold text-ink">{upgrade ? 'Upgrade Breakdown' : 'Price Breakdown'}</h2>
        <dl className="space-y-2.5 text-[14px]">
          {upgrade ? (
            <>
              <div className="flex justify-between">
                <dt className="text-muted">{plan.title} price</dt>
                <dd className="font-semibold">{inr(plan.price)}</dd>
              </div>
              {plan.price - upgrade.amount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Already paid for current pass</dt>
                  <dd className="font-semibold text-success">-{inr(plan.price - upgrade.amount)}</dd>
                </div>
              )}
            </>
          ) : (
            <>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted">Plan MRP</dt>
                    <dd className="font-semibold">{inr(plan.originalPrice)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Special Offer Discount</dt>
                    <dd className="font-semibold text-success">-{inr(plan.originalPrice - plan.price)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Platform & Processing Fee</dt>
                <dd className="font-semibold text-success">FREE</dd>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-line pt-3">
            <dt className="font-bold text-ink">Total Payable</dt>
            <dd className="text-[18px] font-black text-primary">{inr(payable)}</dd>
          </div>
        </dl>
        {upgrade?.newExpiresAt && (
          <p className="mt-3 text-[12.5px] text-muted">
            Your pass will be valid until {fmtDate(upgrade.newExpiresAt)} ({plan.durationDays} days from your original purchase).
          </p>
        )}
      </Card>

      <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-soft">
        <Zap className="h-4 w-4 text-primary" /> Pay with any UPI app, QR code, card, net banking or wallet.
      </p>
      <p className="mt-2 flex items-center gap-2 rounded-xl bg-success-soft p-3 text-[13px] text-[#166534]">
        <ShieldCheck className="h-5 w-5 shrink-0 text-success" /> Guaranteed 100% secure payment with instant subscription activation.
      </p>
      {failure && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-[13.5px] text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Payment Failed: {failure}
        </p>
      )}

      </div>
      <aside className="hidden lg:sticky lg:top-20 lg:block">
        <Card className="p-5">
          <p className="text-[12.5px] text-muted">Total to pay</p>
          <p className="text-[30px] font-black text-ink">{inr(payable)}</p>
          <p className="mb-4 text-[12px] text-muted">{plan.title} · {planDuration(plan)}</p>
          <Button size="lg" block disabled={blocked || free} loading={busy} icon={!busy && !blocked && !free && <Lock className="h-4 w-4" />} onClick={() => void pay()}>
            {label}
          </Button>
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
            <ShieldCheck className="h-4 w-4 text-success" /> UPI • Cards • Net Banking • Wallets
          </p>
        </Card>
      </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[86px] z-20 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.05)] md:bottom-0 md:pl-[calc(var(--pk-sidebar)+16px)] lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div>
            <p className="text-[11.5px] text-muted">Total to pay</p>
            <p className="text-[24px] font-black text-ink">{inr(payable)}</p>
          </div>
          <Button size="lg" className="flex-1" disabled={blocked || free} loading={busy} icon={!busy && !blocked && !free && <Lock className="h-4 w-4" />} onClick={() => void pay()}>
            {label}
          </Button>
        </div>
      </div>

      <Modal open={!!success} onClose={() => undefined} dismissible={false} hideClose size="sm">
        <DialogHero
          icon={<CheckCircle2 />}
          tone="success"
          title="Payment Successful!"
          message={success?.upgrade ? `Your pass has been upgraded to the ${plan.title}.` : `Your ${plan.title} has been successfully activated for your account.`}
        />
        <dl className="mt-4 space-y-1.5 rounded-xl bg-surface p-3.5 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-muted">Amount Paid</dt>
            <dd className="font-bold">{inr(success?.amount ?? 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Valid until</dt>
            <dd className="font-bold text-success">{success?.expiresAt ? fmtDate(success.expiresAt) : planDuration(plan)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Status</dt>
            <dd className="font-bold text-primary">Active (All Tests Unlocked)</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col gap-2">
          <Button block size="lg" onClick={() => navigate('/exams')}>
            Start Practicing Pro Tests
          </Button>
          <Button block variant="ghost" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </div>
      </Modal>
    </div>
  );
}
