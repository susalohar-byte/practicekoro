import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AppError } from '@/lib/errors';
import { num } from '@/lib/format';
import type {
  AppNotification,
  Bookmark,
  LeaderboardScope,
  Profile,
  RankRow,
  StudentSubscription,
  SubscriptionPlan,
  SupportContact,
  SupportMessage,
  SupportTicket,
  UpgradeOption,
} from '@/types/models';

type Row = Record<string, any>;

// ---------------------------------------------------------------------------
// Profile — public.profiles plus auth user_metadata (AuthRepository.syncProfileFromServer)
// ---------------------------------------------------------------------------

/** Columns of public.profiles a student may edit (role/status are server-owned). */
const EDITABLE_COLUMNS = [
  'full_name',
  'phone',
  'avatar_url',
  'target_exam_id',
  'target_exam_title',
  'state',
  'district',
  'gender',
  'category',
  'dob',
  'preparation_status',
  'preferred_subjects',
] as const;

const str = (v: unknown): string | null => {
  const s = (v ?? '').toString().trim();
  return s ? s : null;
};

export async function fetchProfile(user: User): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name, phone, avatar_url, target_exam_id, target_exam_title, state, district, gender, category, dob, preparation_status, preferred_subjects, created_at')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  const row: Row = data ?? {};
  const meta: Row = user.user_metadata ?? {};
  const customAvatar = str(meta.custom_avatar_url);
  const googleAvatar = str(meta.avatar_url ?? meta.picture);
  const prefs = row.preferred_subjects ?? meta.preferred_subjects;
  return {
    id: user.id,
    email: str(row.email) ?? user.email ?? '',
    fullName:
      str(row.full_name) ?? str(meta.full_name) ?? str(meta.name) ?? (user.email?.split('@')[0] ?? ''),
    phone: str(row.phone) ?? str(meta.phone),
    avatarUrl: str(row.avatar_url) ?? customAvatar ?? googleAvatar,
    targetExamId: str(row.target_exam_id) ?? str(meta.target_exam_id),
    targetExamTitle: str(row.target_exam_title) ?? str(meta.target_exam_title),
    state: str(row.state) ?? str(meta.state) ?? 'West Bengal',
    district: str(row.district) ?? str(meta.district),
    block: str(meta.block),
    gender: str(row.gender) ?? str(meta.gender),
    category: str(row.category) ?? str(meta.category ?? meta.caste),
    dob: str(row.dob) ?? str(meta.dob),
    preparationStatus: str(row.preparation_status) ?? str(meta.preparation_status),
    preferredSubjects: Array.isArray(prefs) ? prefs.map(String) : [],
    createdAt: row.created_at ?? user.created_at ?? null,
  };
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  target_exam_id?: string | null;
  target_exam_title?: string | null;
  state?: string | null;
  district?: string | null;
  block?: string | null;
  gender?: string | null;
  category?: string | null;
  dob?: string | null;
}

/**
 * Saves to public.profiles and mirrors into auth user_metadata, exactly like
 * AuthRepository.pushProfileToServer, so the Flutter app sees the same profile.
 * (`block` has no profiles column; it lives in user metadata only.)
 */
export async function saveProfile(userId: string, update: ProfileUpdate): Promise<void> {
  const row: Row = {};
  for (const k of EDITABLE_COLUMNS) {
    if (k in update) row[k] = (update as Row)[k];
  }
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from('profiles').update(row).eq('id', userId);
    if (error) throw error;
  }
  const meta: Row = { ...update };
  if ('category' in update) meta.caste = update.category;
  if ('avatar_url' in update) meta.custom_avatar_url = update.avatar_url;
  const { error: metaError } = await supabase.auth.updateUser({ data: meta });
  if (metaError) throw metaError;
}

/** Uploads to the `avatars` bucket at {uid}/avatar_{ms}.{ext} (same path as the app). */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new AppError('Please choose an image file.');
  if (file.size > 5 * 1024 * 1024) throw new AppError('Please choose an image smaller than 5 MB.');
  const raw = (file.name.split('.').pop() ?? '').toLowerCase();
  const ext = ['png', 'webp', 'gif'].includes(raw) ? raw : 'jpg';
  const path = `${userId}/avatar_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type || `image/${ext}`, upsert: true });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------------------
// Leaderboard — get_test_leaderboard
// ---------------------------------------------------------------------------

/**
 * Permanently deletes the signed-in student's account (the `delete_own_account` RPC).
 * Avatar files are removed first because the database cascade cannot reach storage.
 * Throws an AppError with a readable message if the server refuses.
 */
export async function deleteOwnAccount(userId: string): Promise<void> {
  const { data: files } = await supabase.storage.from('avatars').list(userId);
  if (files?.length) {
    const { error: removeError } = await supabase.storage
      .from('avatars')
      .remove(files.map((f) => `${userId}/${f.name}`));
    if (removeError) console.warn('Avatar cleanup before account deletion failed', removeError);
  }
  const { error } = await supabase.rpc('delete_own_account');
  if (error) {
    throw new AppError(
      error.code === '42501'
        ? error.message
        : 'Your account could not be deleted. Please try again, or email support@practicekoro.online.'
    );
  }
}

export async function fetchLeaderboard(params: {
  testId: string | null;
  scope: LeaderboardScope;
  district?: string | null;
  block?: string | null;
}): Promise<RankRow[]> {
  const { data, error } = await supabase.rpc('get_test_leaderboard', {
    p_test_id: params.testId,
    p_scope: params.scope,
    p_district: params.scope === 'district' ? params.district || null : null,
    p_block: params.scope === 'district' ? params.block || null : null,
    p_limit: 100,
  });
  if (error) throw error;
  return ((data as Row[]) ?? []).map((r) => {
    const score = num(r.score) ?? 0;
    const total = num(r.total_marks) ?? 0;
    return {
      rank: num(r.rank) ?? 0,
      userId: String(r.user_id ?? ''),
      name: str(r.student_name) ?? 'Aspirant',
      avatarUrl: str(r.avatar_url),
      score,
      totalMarks: total,
      percentage: num(r.percentage) ?? (total > 0 ? (score / total) * 100 : 0),
      district: str(r.district),
      block: str(r.block),
      isCurrentUser: r.is_current_user === true,
    };
  });
}

// ---------------------------------------------------------------------------
// Subscription — subscription_plans + get_student_subscription_details
// ---------------------------------------------------------------------------

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, title, description, duration_days, price, original_price, features, currency, order_index, renewal_window_days')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    id: String(r.id),
    name: r.name ?? '',
    title: r.title ?? r.name ?? 'Pro Plan',
    description: r.description ?? '',
    durationDays: num(r.duration_days) ?? 365,
    price: num(r.price) ?? 0,
    originalPrice: num(r.original_price),
    currency: r.currency ?? 'INR',
    features: Array.isArray(r.features) ? r.features.map(String) : [],
    orderIndex: num(r.order_index) ?? 0,
    renewalWindowDays: num(r.renewal_window_days),
  }));
}

const date = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

export async function fetchSubscription(): Promise<StudentSubscription> {
  const { data, error } = await supabase.rpc('get_student_subscription_details');
  if (error) throw error;
  const j: Row = (data ?? {}) as Row;
  const upgrades: UpgradeOption[] = Array.isArray(j.upgrade_options)
    ? j.upgrade_options
        .map((u: Row) => ({
          planId: String(u.plan_id ?? ''),
          planTitle: u.plan_title ?? 'Pro Pass',
          durationDays: num(u.duration_days),
          amount: num(u.amount) ?? 0,
          currency: u.currency ?? 'INR',
          newExpiresAt: date(u.new_expires_at),
        }))
        .filter((u: UpgradeOption) => u.planId && u.amount > 0)
    : [];
  return {
    hasSubscription: j.has_subscription === true,
    isActive: j.is_active === true,
    status: j.status ?? 'none',
    subscriptionId: j.subscription_id ?? null,
    planId: j.plan_id ?? null,
    planTitle: j.plan_title ?? null,
    durationDays: num(j.duration_days),
    purchasedAt: date(j.purchased_at),
    startsAt: date(j.starts_at),
    expiresAt: date(j.expires_at),
    renewalWindowDays: num(j.renewal_window_days),
    upgradeOptions: upgrades,
  };
}

/** StudentSubscriptionModel.isCurrentlyActive */
export function isPassActive(s: StudentSubscription | null | undefined, now = new Date()): boolean {
  if (!s || !s.hasSubscription || !s.isActive) return false;
  return !(s.expiresAt && s.expiresAt < now);
}

export function remainingDays(s: StudentSubscription, now = new Date()): number {
  if (!isPassActive(s, now) || !s.expiresAt) return 0;
  const hours = (s.expiresAt.getTime() - now.getTime()) / 3_600_000;
  return hours <= 0 ? 0 : Math.ceil(hours / 24);
}

/** "5 months 12 days", "1 year 3 days", "Expires today" (StudentSubscriptionModel.remainingLabel) */
export function remainingLabel(s: StudentSubscription): string {
  if (!isPassActive(s)) return 'Expired';
  const days = remainingDays(s);
  if (days <= 0) return 'Expires today';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const rest = (days % 365) % 30;
  const unit = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  return [
    years > 0 ? unit(years, 'year') : null,
    months > 0 ? unit(months, 'month') : null,
    rest > 0 || (years === 0 && months === 0) ? unit(rest, 'day') : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function usedFraction(s: StudentSubscription, now = new Date()): number {
  if (!s.startsAt || !s.expiresAt) return 0;
  const total = s.expiresAt.getTime() - s.startsAt.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - s.startsAt.getTime()) / total));
}

export function planDuration(p: SubscriptionPlan): string {
  if (p.price <= 0) return 'Lifetime';
  if (p.durationDays >= 365) {
    const y = Math.round(p.durationDays / 365);
    return y === 1 ? '1 Year' : `${y} Years`;
  }
  if (p.durationDays >= 30) {
    const m = Math.round(p.durationDays / 30);
    return m === 1 ? '1 Month' : `${m} Months`;
  }
  return `${p.durationDays} Days`;
}

export function planDiscount(p: SubscriptionPlan): number {
  if (p.originalPrice && p.originalPrice > p.price && p.originalPrice > 0) {
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Razorpay checkout — create-razorpay-order / verify-payment Edge Functions.
// The server decides the amount (new purchase or upgrade) and activates the pass;
// the browser never sees the key secret.
// ---------------------------------------------------------------------------

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planTitle: string;
  purchaseType: string | null;
  newExpiresAt: string | null;
}

const CHECKOUT_FALLBACK =
  'Could not start checkout. No money was deducted. Please try again in a moment.';

async function functionError(err: unknown, fallback: string): Promise<AppError> {
  const ctx = (err as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (body?.error) return new AppError(String(body.error));
    } catch {
      /* not JSON */
    }
  }
  return new AppError(fallback);
}

async function razorpayKeyFromSettings(): Promise<string | null> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('id', 'payment_gateway_razorpay_key_id')
    .maybeSingle();
  const v = (data?.value ?? '').toString().replace(/"/g, '').trim();
  return v.startsWith('rzp_live_') || v.startsWith('rzp_test_') ? v : null;
}

export async function createRazorpayOrder(planId: string): Promise<RazorpayOrder> {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { planId },
  });
  if (error) throw await functionError(error, CHECKOUT_FALLBACK);
  const d: Row = data ?? {};
  if (d.error) throw new AppError(String(d.error));
  const orderId = String(d.order_id ?? d.orderId ?? '');
  const amount = num(d.amount) ?? 0;
  if (!orderId || amount <= 0) throw new AppError(CHECKOUT_FALLBACK);
  let keyId = String(d.key_id ?? d.keyId ?? '');
  if (!keyId || keyId.includes('practicekoro_key')) keyId = (await razorpayKeyFromSettings()) ?? '';
  if (!keyId) throw new AppError(CHECKOUT_FALLBACK);
  return {
    orderId,
    amount,
    currency: d.currency ?? 'INR',
    keyId,
    planTitle: d.plan_title ?? d.planTitle ?? '',
    purchaseType: d.purchase_type ?? d.purchaseType ?? null,
    newExpiresAt: d.new_expires_at ?? d.newExpiresAt ?? null,
  };
}

export async function verifyPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
}): Promise<{ ok: true; expiresAt: string | null } | { ok: false; message: string | null }> {
  const { data, error } = await supabase.functions.invoke('verify-payment', { body: input });
  if (!error && data?.success === true) return { ok: true, expiresAt: data.expiresAt ?? null };
  if (error) {
    const e = await functionError(error, '');
    return { ok: false, message: e.message || null };
  }
  return { ok: false, message: data?.error ? String(data.error) : null };
}

// ---------------------------------------------------------------------------
// Support — app_settings contacts, support_tickets, support_ticket_messages
// ---------------------------------------------------------------------------

function unwrap(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    try {
      const d = JSON.parse(v);
      if (typeof d === 'string' || typeof d === 'number') return String(d).trim() || null;
    } catch {
      /* plain string */
    }
    return v.trim() || null;
  }
  if (typeof v === 'number') return String(v);
  return null;
}

export async function fetchSupportContact(): Promise<SupportContact> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('id, value')
    .in('id', [
      'general_support_email',
      'general_support_whatsapp',
      'general_support_phone',
      'general_support_hours',
    ]);
  if (error) throw error;
  const map = new Map((data ?? []).map((r: Row) => [r.id, unwrap(r.value)]));
  return {
    email: map.get('general_support_email') ?? null,
    whatsapp: map.get('general_support_whatsapp') ?? null,
    phone: map.get('general_support_phone') ?? null,
    hours: map.get('general_support_hours') ?? null,
  };
}

function toMessage(m: Row): SupportMessage {
  return {
    id: String(m.id),
    ticketId: String(m.ticket_id),
    authorName: m.author_name ?? 'Support Staff',
    authorKind: m.author_kind ?? 'support',
    body: m.body ?? '',
    createdAt: new Date(m.created_at),
  };
}

const visibleMessages = (msgs: Row[]): SupportMessage[] =>
  msgs
    .filter((m) => m.author_kind !== 'internal_note')
    .map(toMessage)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

/** List rows carry no conversation; it is loaded per ticket by fetchTicketMessages when opened. */
function toTicket(r: Row): SupportTicket {
  return {
    id: String(r.id),
    subject: r.subject ?? '',
    issue: r.issue ?? '',
    category: r.category ?? 'Other',
    priority: r.priority ?? 'medium',
    status: r.status ?? 'open',
    resolutionNotes: str(r.resolution_notes),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at ?? r.created_at),
    messages: visibleMessages(r.support_ticket_messages ?? r.messages ?? []),
  };
}

const TICKET_COLUMNS = 'id, subject, issue, category, priority, status, resolution_notes, created_at, updated_at';
const TICKET_LIST_LIMIT = 50;
const TICKET_MESSAGE_LIMIT = 200;

/** The student's newest tickets, without their conversations (those load when a ticket is opened). */
export async function fetchTickets(userId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(TICKET_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(TICKET_LIST_LIMIT);
  if (error) throw error;
  return (data ?? []).map(toTicket);
}

/** Latest messages of one ticket, shown oldest first; internal staff notes are never sent to the student. */
export async function fetchTicketMessages(ticketId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .select('id, ticket_id, author_name, author_kind, body, created_at')
    .eq('ticket_id', ticketId)
    .or('author_kind.is.null,author_kind.neq.internal_note')
    .order('created_at', { ascending: false })
    .limit(TICKET_MESSAGE_LIMIT);
  if (error) throw error;
  return visibleMessages(data ?? []);
}

export async function createTicket(input: {
  userId: string;
  name: string;
  email: string;
  subject: string;
  issue: string;
  category: string;
}): Promise<SupportTicket> {
  const { data, error } = await supabase.rpc('create_support_ticket', {
    p_student_name: input.name,
    p_student_email: input.email,
    p_subject: input.subject.trim(),
    p_issue: input.issue.trim(),
    p_category: input.category,
    p_priority: 'medium',
    p_user_id: input.userId,
  });
  if (!error && data && (data as Row).ticket) return toTicket({ ...(data as Row).ticket, support_ticket_messages: [] });
  // Same fallback as the app: a direct insert, which RLS allows for the student's own ticket.
  const { data: row, error: insertError } = await supabase
    .from('support_tickets')
    .insert({
      user_id: input.userId,
      student_name: input.name,
      student_email: input.email,
      subject: input.subject.trim(),
      issue: input.issue.trim(),
      category: input.category,
      priority: 'medium',
      status: 'open',
    })
    .select(TICKET_COLUMNS)
    .single();
  if (insertError) throw insertError;
  return toTicket(row);
}

/** Student reply on their own ticket (student_reply_support_ticket sets the author server-side). */
export async function sendTicketMessage(input: { ticketId: string; body: string }): Promise<void> {
  const { error } = await supabase.rpc('student_reply_support_ticket', {
    p_ticket_id: input.ticketId,
    p_body: input.body.trim(),
  });
  if (error) throw error;
}

export function ticketNumber(id: string): string {
  return `#PKT-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Notifications — rows the admin sent that RLS lets this student read
// ---------------------------------------------------------------------------

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, action_link, sent_at, scheduled_at, created_at, channel')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? [])
    .filter((r: Row) => !r.channel || ['in_app', 'all', 'push', 'app'].includes(String(r.channel)))
    .map((r: Row) => ({
      id: String(r.id),
      title: r.title ?? '',
      message: r.message ?? '',
      type: r.type ?? null,
      actionLink: r.action_link ?? null,
      sentAt: new Date(r.sent_at ?? r.scheduled_at ?? r.created_at),
    }));
}

// ---------------------------------------------------------------------------
// Bookmarks — public.bookmarks (own rows via RLS). Question text is not readable by
// students outside a finished attempt, so a copy of the question is kept in this
// browser for the Saved Questions page (the Flutter app keeps it on the phone).
// ---------------------------------------------------------------------------

export async function fetchBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, question_id, note, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    id: String(r.id),
    questionId: String(r.question_id),
    note: r.note ?? null,
    createdAt: new Date(r.created_at),
  }));
}

export async function addBookmark(userId: string, questionId: string): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .limit(1);
  if (readError) throw readError;
  if (existing && existing.length > 0) return;
  const { error } = await supabase.from('bookmarks').insert({ user_id: userId, question_id: questionId });
  if (error && error.code !== '23505') throw error;
}

export async function removeBookmark(userId: string, questionId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId);
  if (error) throw error;
}
