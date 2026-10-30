import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { callsTo, mockSupabase, queueTable, resetSupabaseMock } from '@/test/supabaseMock';

vi.mock('@/lib/supabase', async () => ({
  supabase: (await import('@/test/supabaseMock')).mockSupabase,
}));

import { AppError } from '@/lib/errors';
import { readSavedQuestions } from '@/lib/savedQuestions';
import type { StudentSubscription, SubscriptionPlan } from '@/types/models';
import {
  addBookmark,
  createRazorpayOrder,
  createTicket,
  deleteOwnAccount,
  fetchBookmarks,
  fetchLeaderboard,
  fetchNotifications,
  fetchPlans,
  fetchProfile,
  fetchSubscription,
  fetchSupportContact,
  fetchTicketMessages,
  fetchTickets,
  isPassActive,
  planDiscount,
  planDuration,
  remainingDays,
  remainingLabel,
  removeBookmark,
  saveProfile,
  sendTicketMessage,
  ticketNumber,
  uploadAvatar,
  usedFraction,
  verifyPayment,
} from './account';

const bucket = mockSupabase.storage.bucket;

beforeEach(() => {
  resetSupabaseMock();
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

const user = (over: Partial<User> = {}): User =>
  ({
    id: 'u1',
    email: 'ria@example.com',
    created_at: '2026-01-01T00:00:00Z',
    user_metadata: {},
    ...over,
  }) as User;

describe('profile', () => {
  it('prefers profile columns over auth metadata', async () => {
    queueTable('profiles', {
      data: {
        email: 'db@example.com',
        full_name: 'Ria Sen',
        avatar_url: 'https://a/p.png',
        district: 'Nadia',
        preferred_subjects: ['History', 3],
        created_at: '2026-02-02',
      },
    });
    const p = await fetchProfile(
      user({
        user_metadata: {
          full_name: 'Meta Name',
          avatar_url: 'https://google/x.png',
          block: 'Ranaghat I',
        },
      })
    );
    expect(callsTo('profiles')[0].chain).toContainEqual(['eq', 'id', 'u1']);
    expect(p).toMatchObject({
      id: 'u1',
      email: 'db@example.com',
      fullName: 'Ria Sen',
      avatarUrl: 'https://a/p.png',
      district: 'Nadia',
      block: 'Ranaghat I',
      state: 'West Bengal',
      preferredSubjects: ['History', '3'],
      createdAt: '2026-02-02',
    });
  });

  it('falls back to metadata, custom avatar, caste and the email name', async () => {
    queueTable('profiles', { data: null });
    const p = await fetchProfile(
      user({
        user_metadata: {
          custom_avatar_url: 'https://c/custom.png',
          picture: 'https://g/pic.png',
          caste: 'OBC',
          phone: ' 98300 ',
        },
      })
    );
    expect(p).toMatchObject({
      email: 'ria@example.com',
      fullName: 'ria',
      avatarUrl: 'https://c/custom.png',
      category: 'OBC',
      phone: '98300',
      preferredSubjects: [],
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('throws the profile query error', async () => {
    queueTable('profiles', { error: { message: 'rls' } });
    await expect(fetchProfile(user())).rejects.toEqual({ message: 'rls' });
  });

  it('saves only editable columns and mirrors the update into user metadata', async () => {
    queueTable('profiles', { data: null });
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
    await saveProfile('u1', {
      full_name: 'Ria',
      block: 'B1',
      category: 'SC',
      avatar_url: 'https://a/new.png',
    });
    const chain = callsTo('profiles')[0].chain;
    expect(chain[0]).toEqual([
      'update',
      { full_name: 'Ria', category: 'SC', avatar_url: 'https://a/new.png' },
    ]);
    expect(chain[1]).toEqual(['eq', 'id', 'u1']);
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'Ria',
        block: 'B1',
        category: 'SC',
        caste: 'SC',
        avatar_url: 'https://a/new.png',
        custom_avatar_url: 'https://a/new.png',
      },
    });
  });

  it('skips the profiles update when only metadata fields change', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
    await saveProfile('u1', { block: 'B2' });
    expect(callsTo('profiles')).toHaveLength(0);
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ data: { block: 'B2' } });
  });

  it('throws the profile or metadata error', async () => {
    queueTable('profiles', { error: { message: 'update failed' } });
    await expect(saveProfile('u1', { full_name: 'x' })).rejects.toEqual({
      message: 'update failed',
    });
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    mockSupabase.auth.updateUser.mockResolvedValue({ error: { message: 'meta failed' } });
    await expect(saveProfile('u1', { block: 'x' })).rejects.toEqual({ message: 'meta failed' });
  });
});

describe('uploadAvatar', () => {
  const file = (name: string, type: string, size = 10) => {
    const f = new File(['x'], name, { type });
    Object.defineProperty(f, 'size', { value: size });
    return f;
  };

  it('rejects non-images and files over 5 MB', async () => {
    await expect(uploadAvatar('u1', file('a.pdf', 'application/pdf'))).rejects.toThrow(
      'Please choose an image file.'
    );
    await expect(uploadAvatar('u1', file('a.png', 'image/png', 6 * 1024 * 1024))).rejects.toThrow(
      'smaller than 5 MB'
    );
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it('uploads to {uid}/avatar_{ms}.{ext} and returns the public URL', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);
    bucket.upload.mockResolvedValue({ error: null });
    bucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn/avatars/u1/avatar.png' },
    });
    await expect(uploadAvatar('u1', file('Me.PNG', 'image/png'))).resolves.toBe(
      'https://cdn/avatars/u1/avatar.png'
    );
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('avatars');
    expect(bucket.upload).toHaveBeenCalledWith('u1/avatar_1700000000000.png', expect.any(File), {
      contentType: 'image/png',
      upsert: true,
    });
  });

  it('uses jpg for unknown extensions and throws upload errors', async () => {
    bucket.upload.mockResolvedValue({ error: { message: 'too big' } });
    await expect(uploadAvatar('u1', file('photo.heic', 'image/heic'))).rejects.toEqual({
      message: 'too big',
    });
    expect(bucket.upload.mock.calls[0][0]).toMatch(/^u1\/avatar_\d+\.jpg$/);
  });
});

describe('deleteOwnAccount', () => {
  it('removes avatar files first, then calls delete_own_account', async () => {
    bucket.list.mockResolvedValue({ data: [{ name: 'a.png' }, { name: 'b.jpg' }] });
    bucket.remove.mockResolvedValue({ error: null });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    await deleteOwnAccount('u1');
    expect(bucket.list).toHaveBeenCalledWith('u1');
    expect(bucket.remove).toHaveBeenCalledWith(['u1/a.png', 'u1/b.jpg']);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_own_account');
  });

  it('still deletes the account when there are no files or cleanup fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    bucket.list.mockResolvedValue({ data: [{ name: 'a.png' }] });
    bucket.remove.mockResolvedValue({ error: { message: 'denied' } });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    await deleteOwnAccount('u1');
    expect(warn).toHaveBeenCalled();
    expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_own_account');
    bucket.list.mockResolvedValue({ data: [] });
    bucket.remove.mockClear();
    await deleteOwnAccount('u1');
    expect(bucket.remove).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('shows the server message for 42501 and a generic one otherwise', async () => {
    bucket.list.mockResolvedValue({ data: null });
    mockSupabase.rpc.mockResolvedValueOnce({
      error: { code: '42501', message: 'Admins cannot delete here.' },
    });
    await expect(deleteOwnAccount('u1')).rejects.toThrow('Admins cannot delete here.');
    mockSupabase.rpc.mockResolvedValueOnce({ error: { code: 'XX000', message: 'internal' } });
    await expect(deleteOwnAccount('u1')).rejects.toThrow(/could not be deleted/);
  });
});

describe('fetchLeaderboard', () => {
  it('sends district filters only for the district scope and maps rows', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [
        {
          rank: 1,
          user_id: 'u1',
          student_name: 'Ria',
          score: '45',
          total_marks: 50,
          is_current_user: true,
          district: 'Nadia',
        },
        { rank: '2', user_id: null, student_name: ' ', score: 30, total_marks: 0 },
      ],
      error: null,
    });
    const rows = await fetchLeaderboard({
      testId: 't1',
      scope: 'district',
      district: 'Nadia',
      block: '',
    });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_test_leaderboard', {
      p_test_id: 't1',
      p_scope: 'district',
      p_district: 'Nadia',
      p_block: null,
      p_limit: 100,
    });
    expect(rows[0]).toEqual({
      rank: 1,
      userId: 'u1',
      name: 'Ria',
      avatarUrl: null,
      score: 45,
      totalMarks: 50,
      percentage: 90,
      district: 'Nadia',
      block: null,
      isCurrentUser: true,
    });
    expect(rows[1]).toMatchObject({
      rank: 2,
      userId: '',
      name: 'Aspirant',
      percentage: 0,
      isCurrentUser: false,
    });

    await fetchLeaderboard({
      testId: null,
      scope: 'state' as never,
      district: 'Nadia',
      block: 'B',
    });
    expect(mockSupabase.rpc).toHaveBeenLastCalledWith(
      'get_test_leaderboard',
      expect.objectContaining({ p_test_id: null, p_district: null, p_block: null })
    );
  });

  it('throws leaderboard errors', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    await expect(fetchLeaderboard({ testId: 't', scope: 'district' })).rejects.toEqual({
      message: 'x',
    });
  });
});

describe('plans and subscription', () => {
  it('maps active plans with defaults', async () => {
    queueTable('subscription_plans', {
      data: [
        {
          id: 'p1',
          name: 'pro',
          title: 'Pro Pass',
          price: '499',
          original_price: 999,
          duration_days: 180,
          features: ['All tests', 2],
          renewal_window_days: 15,
        },
        { id: 'p2', features: 'nope' },
      ],
    });
    const [a, b] = await fetchPlans();
    expect(callsTo('subscription_plans')[0].chain).toContainEqual(['eq', 'is_active', true]);
    expect(a).toEqual({
      id: 'p1',
      name: 'pro',
      title: 'Pro Pass',
      description: '',
      durationDays: 180,
      price: 499,
      originalPrice: 999,
      currency: 'INR',
      features: ['All tests', '2'],
      orderIndex: 0,
      renewalWindowDays: 15,
    });
    expect(b).toMatchObject({
      title: 'Pro Plan',
      durationDays: 365,
      price: 0,
      originalPrice: null,
      features: [],
    });
  });

  it('maps subscription details and drops invalid upgrade options', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: {
        has_subscription: true,
        is_active: true,
        status: 'active',
        plan_id: 'p1',
        plan_title: 'Pro',
        duration_days: 365,
        starts_at: '2026-01-01T00:00:00Z',
        expires_at: '2027-01-01T00:00:00Z',
        purchased_at: 'bad',
        upgrade_options: [
          { plan_id: 'p2', amount: 200, new_expires_at: '2027-06-01T00:00:00Z' },
          { plan_id: 'p3', amount: 0 },
          { amount: 100 },
        ],
      },
      error: null,
    });
    const s = await fetchSubscription();
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_student_subscription_details');
    expect(s).toMatchObject({
      hasSubscription: true,
      isActive: true,
      status: 'active',
      planId: 'p1',
      purchasedAt: null,
      expiresAt: new Date('2027-01-01T00:00:00Z'),
    });
    expect(s.upgradeOptions).toEqual([
      {
        planId: 'p2',
        planTitle: 'Pro Pass',
        durationDays: null,
        amount: 200,
        currency: 'INR',
        newExpiresAt: new Date('2027-06-01T00:00:00Z'),
      },
    ]);
  });

  it('returns an empty subscription for null data and throws errors', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(fetchSubscription()).resolves.toMatchObject({
      hasSubscription: false,
      status: 'none',
      upgradeOptions: [],
    });
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
    await expect(fetchSubscription()).rejects.toEqual({ message: 'x' });
  });
});

describe('pass helpers', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const sub = (over: Partial<StudentSubscription> = {}): StudentSubscription => ({
    hasSubscription: true,
    isActive: true,
    status: 'active',
    subscriptionId: 's',
    planId: 'p',
    planTitle: 'Pro',
    durationDays: 365,
    purchasedAt: null,
    startsAt: new Date('2026-01-01T00:00:00Z'),
    expiresAt: new Date('2027-01-01T00:00:00Z'),
    renewalWindowDays: null,
    upgradeOptions: [],
    ...over,
  });

  it('isPassActive needs an active, unexpired subscription', () => {
    expect(isPassActive(sub(), now)).toBe(true);
    expect(isPassActive(sub({ expiresAt: null }), now)).toBe(true);
    expect(isPassActive(sub({ expiresAt: new Date('2026-05-31T00:00:00Z') }), now)).toBe(false);
    expect(isPassActive(sub({ isActive: false }), now)).toBe(false);
    expect(isPassActive(sub({ hasSubscription: false }), now)).toBe(false);
    expect(isPassActive(null, now)).toBe(false);
    expect(isPassActive(undefined, now)).toBe(false);
  });

  it('remainingDays rounds partial days up and is 0 when inactive', () => {
    expect(remainingDays(sub({ expiresAt: new Date('2026-06-02T01:00:00Z') }), now)).toBe(2);
    expect(remainingDays(sub({ expiresAt: new Date('2026-06-01T05:00:00Z') }), now)).toBe(1);
    expect(remainingDays(sub({ expiresAt: null }), now)).toBe(0);
    expect(remainingDays(sub({ isActive: false }), now)).toBe(0);
  });

  it('remainingLabel spells out years, months and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const inDays = (d: number) => sub({ expiresAt: new Date(now.getTime() + d * 86_400_000) });
    expect(remainingLabel(inDays(1))).toBe('1 day');
    expect(remainingLabel(inDays(30))).toBe('1 month');
    expect(remainingLabel(inDays(42))).toBe('1 month 12 days');
    expect(remainingLabel(inDays(365 + 3))).toBe('1 year 3 days');
    expect(remainingLabel(inDays(2 * 365 + 60))).toBe('2 years 2 months');
    expect(remainingLabel(sub({ isActive: false }))).toBe('Expired');
    expect(remainingLabel(sub({ expiresAt: null }))).toBe('Expires today');
  });

  it('usedFraction is clamped between 0 and 1', () => {
    expect(
      usedFraction(
        sub({
          startsAt: new Date('2026-05-01T00:00:00Z'),
          expiresAt: new Date('2026-07-01T00:00:00Z'),
        }),
        now
      )
    ).toBeCloseTo(31 / 61);
    expect(
      usedFraction(
        sub({
          startsAt: new Date('2026-07-01T00:00:00Z'),
          expiresAt: new Date('2026-08-01T00:00:00Z'),
        }),
        now
      )
    ).toBe(0);
    expect(
      usedFraction(
        sub({
          startsAt: new Date('2025-01-01T00:00:00Z'),
          expiresAt: new Date('2025-02-01T00:00:00Z'),
        }),
        now
      )
    ).toBe(1);
    expect(usedFraction(sub({ startsAt: now, expiresAt: now }), now)).toBe(1);
    expect(usedFraction(sub({ startsAt: null }), now)).toBe(0);
  });

  const plan = (over: Partial<SubscriptionPlan>): SubscriptionPlan => ({
    id: 'p',
    name: '',
    title: 'Pro',
    description: '',
    durationDays: 365,
    price: 499,
    originalPrice: null,
    currency: 'INR',
    features: [],
    orderIndex: 0,
    renewalWindowDays: null,
    ...over,
  });

  it('planDuration labels the plan length', () => {
    expect(planDuration(plan({ price: 0 }))).toBe('Lifetime');
    expect(planDuration(plan({ durationDays: 365 }))).toBe('1 Year');
    expect(planDuration(plan({ durationDays: 730 }))).toBe('2 Years');
    expect(planDuration(plan({ durationDays: 30 }))).toBe('1 Month');
    expect(planDuration(plan({ durationDays: 180 }))).toBe('6 Months');
    expect(planDuration(plan({ durationDays: 7 }))).toBe('7 Days');
  });

  it('planDiscount is a rounded percentage only when the original price is higher', () => {
    expect(planDiscount(plan({ price: 499, originalPrice: 999 }))).toBe(50);
    expect(planDiscount(plan({ price: 300, originalPrice: 299 }))).toBe(0);
    expect(planDiscount(plan({ originalPrice: null }))).toBe(0);
  });
});

describe('Razorpay checkout', () => {
  it('creates an order through the Edge Function', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        order_id: 'order_1',
        amount: 49900,
        key_id: 'rzp_test_abc',
        plan_title: 'Pro',
        purchase_type: 'upgrade',
        new_expires_at: '2027-01-01',
      },
      error: null,
    });
    await expect(createRazorpayOrder('p1')).resolves.toEqual({
      orderId: 'order_1',
      amount: 49900,
      currency: 'INR',
      keyId: 'rzp_test_abc',
      planTitle: 'Pro',
      purchaseType: 'upgrade',
      newExpiresAt: '2027-01-01',
    });
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-razorpay-order', {
      body: { planId: 'p1' },
    });
    expect(callsTo('app_settings')).toHaveLength(0);
  });

  it('accepts camelCase keys and reads the key id from app_settings when it is a placeholder', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { orderId: 'o2', amount: '100', keyId: 'practicekoro_key' },
      error: null,
    });
    queueTable('app_settings', { data: { value: '"rzp_live_xyz"' } });
    const order = await createRazorpayOrder('p1');
    expect(order).toMatchObject({
      orderId: 'o2',
      amount: 100,
      keyId: 'rzp_live_xyz',
      purchaseType: null,
    });
    expect(callsTo('app_settings')[0].chain).toContainEqual([
      'eq',
      'id',
      'payment_gateway_razorpay_key_id',
    ]);
  });

  it('fails when no valid key is configured', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { order_id: 'o', amount: 1 },
      error: null,
    });
    queueTable('app_settings', { data: { value: 'not-a-key' } });
    await expect(createRazorpayOrder('p1')).rejects.toThrow(/Could not start checkout/);
  });

  it('fails on a missing order id or zero amount, and surfaces a body error', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { order_id: '', amount: 10 },
      error: null,
    });
    await expect(createRazorpayOrder('p')).rejects.toBeInstanceOf(AppError);
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { order_id: 'o', amount: 0 },
      error: null,
    });
    await expect(createRazorpayOrder('p')).rejects.toThrow(/No money was deducted/);
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { error: 'You already own this plan' },
      error: null,
    });
    await expect(createRazorpayOrder('p')).rejects.toThrow('You already own this plan');
  });

  it('reads the Edge Function error body and falls back when it is not JSON', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { context: { json: () => Promise.resolve({ error: 'Plan is inactive' }) } },
    });
    await expect(createRazorpayOrder('p')).rejects.toThrow('Plan is inactive');
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { context: { json: () => Promise.reject(new Error('not json')) } },
    });
    await expect(createRazorpayOrder('p')).rejects.toThrow(/Could not start checkout/);
  });

  it('verifyPayment reports success, server errors and function errors', async () => {
    const input = { orderId: 'o', paymentId: 'pay', signature: 'sig', planId: 'p' };
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { success: true, expiresAt: '2027-01-01' },
      error: null,
    });
    await expect(verifyPayment(input)).resolves.toEqual({ ok: true, expiresAt: '2027-01-01' });
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('verify-payment', { body: input });

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { success: false, error: 'Bad signature' },
      error: null,
    });
    await expect(verifyPayment(input)).resolves.toEqual({ ok: false, message: 'Bad signature' });

    mockSupabase.functions.invoke.mockResolvedValueOnce({ data: {}, error: null });
    await expect(verifyPayment(input)).resolves.toEqual({ ok: false, message: null });

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { context: { json: () => Promise.resolve({ error: 'Expired order' }) } },
    });
    await expect(verifyPayment(input)).resolves.toEqual({ ok: false, message: 'Expired order' });

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: new Error('network'),
    });
    await expect(verifyPayment(input)).resolves.toEqual({ ok: false, message: null });
  });
});

describe('support', () => {
  it('unwraps JSON-encoded contact settings', async () => {
    queueTable('app_settings', {
      data: [
        { id: 'general_support_email', value: '"help@practicekoro.online"' },
        { id: 'general_support_whatsapp', value: 919800000000 },
        { id: 'general_support_phone', value: '  ' },
        { id: 'general_support_hours', value: '10am - 6pm' },
      ],
    });
    await expect(fetchSupportContact()).resolves.toEqual({
      email: 'help@practicekoro.online',
      whatsapp: '919800000000',
      phone: null,
      hours: '10am - 6pm',
    });
    expect(callsTo('app_settings')[0].chain[1][0]).toBe('in');
  });

  it('lists tickets without conversations', async () => {
    queueTable('support_tickets', {
      data: [
        { id: 't1', subject: 'Login', created_at: '2026-10-01T00:00:00Z', resolution_notes: ' ' },
      ],
    });
    const [t] = await fetchTickets('u1');
    expect(t).toEqual({
      id: 't1',
      subject: 'Login',
      issue: '',
      category: 'Other',
      priority: 'medium',
      status: 'open',
      resolutionNotes: null,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-01T00:00:00Z'),
      messages: [],
    });
    expect(callsTo('support_tickets')[0].chain).toContainEqual(['eq', 'user_id', 'u1']);
    expect(callsTo('support_tickets')[0].chain).toContainEqual(['limit', 50]);
  });

  it('shows ticket messages oldest first and never internal notes', async () => {
    queueTable('support_ticket_messages', {
      data: [
        {
          id: 'm3',
          ticket_id: 't',
          body: 'third',
          created_at: '2026-10-03T00:00:00Z',
          author_kind: 'student',
        },
        {
          id: 'm2',
          ticket_id: 't',
          body: 'secret',
          created_at: '2026-10-02T00:00:00Z',
          author_kind: 'internal_note',
        },
        { id: 'm1', ticket_id: 't', body: 'first', created_at: '2026-10-01T00:00:00Z' },
      ],
    });
    const msgs = await fetchTicketMessages('t');
    expect(msgs.map((m) => m.body)).toEqual(['first', 'third']);
    expect(msgs[0]).toMatchObject({ authorName: 'Support Staff', authorKind: 'support' });
    expect(callsTo('support_ticket_messages')[0].chain).toContainEqual([
      'or',
      'author_kind.is.null,author_kind.neq.internal_note',
    ]);
  });

  const ticketInput = {
    userId: 'u1',
    name: 'Ria',
    email: 'r@x.com',
    subject: '  Refund ',
    issue: ' Paid twice ',
    category: 'Payment',
  };

  it('creates a ticket through the RPC with trimmed text', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: { ticket: { id: 'tk', subject: 'Refund', created_at: '2026-10-01T00:00:00Z' } },
      error: null,
    });
    const t = await createTicket(ticketInput);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('create_support_ticket', {
      p_student_name: 'Ria',
      p_student_email: 'r@x.com',
      p_subject: 'Refund',
      p_issue: 'Paid twice',
      p_category: 'Payment',
      p_priority: 'medium',
      p_user_id: 'u1',
    });
    expect(t).toMatchObject({ id: 'tk', subject: 'Refund', messages: [] });
    expect(callsTo('support_tickets')).toHaveLength(0);
  });

  it('falls back to a direct insert when the RPC fails', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'function missing' } });
    queueTable('support_tickets', {
      data: { id: 'tk2', subject: 'Refund', status: 'open', created_at: '2026-10-01T00:00:00Z' },
    });
    const t = await createTicket(ticketInput);
    expect(t.id).toBe('tk2');
    const chain = callsTo('support_tickets')[0].chain;
    expect(chain[0]).toEqual([
      'insert',
      {
        user_id: 'u1',
        student_name: 'Ria',
        student_email: 'r@x.com',
        subject: 'Refund',
        issue: 'Paid twice',
        category: 'Payment',
        priority: 'medium',
        status: 'open',
      },
    ]);
    expect(chain.slice(-1)[0]).toEqual(['single']);
  });

  it('throws when the fallback insert fails too', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });
    queueTable('support_tickets', { error: { message: 'rls' } });
    await expect(createTicket(ticketInput)).rejects.toEqual({ message: 'rls' });
  });

  it('sends a trimmed reply and throws errors', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ error: null });
    await sendTicketMessage({ ticketId: 't1', body: '  thanks  ' });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('student_reply_support_ticket', {
      p_ticket_id: 't1',
      p_body: 'thanks',
    });
    mockSupabase.rpc.mockResolvedValueOnce({ error: { message: 'closed' } });
    await expect(sendTicketMessage({ ticketId: 't1', body: 'x' })).rejects.toEqual({
      message: 'closed',
    });
  });

  it('formats ticket numbers', () => {
    expect(ticketNumber('3f2a9c1b-77aa-4bcd-9e10-000000000000')).toBe('#PKT-3F2A9C1B');
  });
});

describe('notifications', () => {
  it('keeps in-app channels and maps the sent time', async () => {
    queueTable('notifications', {
      data: [
        {
          id: 'n1',
          title: 'New test',
          message: 'Go',
          channel: 'in_app',
          sent_at: '2026-10-02T00:00:00Z',
          created_at: '2026-10-01T00:00:00Z',
        },
        { id: 'n2', title: 'Email only', channel: 'email', created_at: '2026-10-01T00:00:00Z' },
        {
          id: 'n3',
          channel: null,
          scheduled_at: '2026-10-03T00:00:00Z',
          created_at: '2026-10-01T00:00:00Z',
          action_link: '/plans',
        },
      ],
    });
    const list = await fetchNotifications();
    expect(list.map((n) => n.id)).toEqual(['n1', 'n3']);
    expect(list[0]).toEqual({
      id: 'n1',
      title: 'New test',
      message: 'Go',
      type: null,
      actionLink: null,
      sentAt: new Date('2026-10-02T00:00:00Z'),
    });
    expect(list[1]).toMatchObject({
      title: '',
      actionLink: '/plans',
      sentAt: new Date('2026-10-03T00:00:00Z'),
    });
  });

  it('throws notification errors', async () => {
    queueTable('notifications', { error: { message: 'x' } });
    await expect(fetchNotifications()).rejects.toEqual({ message: 'x' });
  });
});

describe('bookmarks', () => {
  it('maps bookmarks and caches the question copy locally', async () => {
    queueTable('bookmarks', {
      data: [
        {
          id: 'b1',
          question_id: 'q1',
          note: null,
          created_at: '2026-10-01T00:00:00Z',
          questions: {
            id: 'q1',
            question_text: 'Q?',
            option_a: 'a',
            option_b: 'b',
            correct_option: 'B',
            explanation: 'why',
          },
        },
        {
          id: 'b2',
          question_id: 'q2',
          note: 'revise',
          created_at: '2026-10-02T00:00:00Z',
          questions: null,
        },
      ],
    });
    const list = await fetchBookmarks('u1');
    expect(list).toEqual([
      { id: 'b1', questionId: 'q1', note: null, createdAt: new Date('2026-10-01T00:00:00Z') },
      { id: 'b2', questionId: 'q2', note: 'revise', createdAt: new Date('2026-10-02T00:00:00Z') },
    ]);
    const saved = readSavedQuestions('u1');
    expect(Object.keys(saved)).toEqual(['q1']);
    expect(saved.q1).toMatchObject({
      textEnglish: 'Q?',
      correct: 'B',
      options: { A: 'a', B: 'b', C: '', D: '' },
      explanation: 'why',
      isBookmarked: true,
    });
    expect(callsTo('bookmarks')[0].chain).toContainEqual(['eq', 'user_id', 'u1']);
  });

  it('throws bookmark read errors', async () => {
    queueTable('bookmarks', { error: { message: 'x' } });
    await expect(fetchBookmarks('u1')).rejects.toEqual({ message: 'x' });
  });

  it('adds a bookmark only when it does not exist yet', async () => {
    queueTable('bookmarks', { data: [] }, { error: null });
    await addBookmark('u1', 'q1');
    expect(callsTo('bookmarks')[1].chain).toEqual([
      ['insert', { user_id: 'u1', question_id: 'q1' }],
    ]);

    resetSupabaseMock();
    queueTable('bookmarks', { data: [{ id: 'b' }] });
    await addBookmark('u1', 'q1');
    expect(callsTo('bookmarks')).toHaveLength(1);
  });

  it('ignores a duplicate insert race but throws other errors', async () => {
    queueTable('bookmarks', { data: [] }, { error: { code: '23505' } });
    await expect(addBookmark('u1', 'q1')).resolves.toBeUndefined();
    queueTable('bookmarks', { data: [] }, { error: { code: '42501' } });
    await expect(addBookmark('u1', 'q1')).rejects.toEqual({ code: '42501' });
    queueTable('bookmarks', { error: { message: 'read' } });
    await expect(addBookmark('u1', 'q1')).rejects.toEqual({ message: 'read' });
  });

  it('removes a bookmark by user and question', async () => {
    queueTable('bookmarks', { error: null }, { error: { message: 'x' } });
    await removeBookmark('u1', 'q1');
    expect(callsTo('bookmarks')[0].chain).toEqual([
      ['delete'],
      ['eq', 'user_id', 'u1'],
      ['eq', 'question_id', 'q1'],
    ]);
    await expect(removeBookmark('u1', 'q1')).rejects.toEqual({ message: 'x' });
  });
});
