import type { PaymentStatus } from '@/types';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface SubscriptionRecord {
  id: number | string;
  userId?: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  plan: string;
  planFullTitle: string;
  planBadgeClass: string;
  amount?: number;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
  paymentCurrency?: string;
  recordedRevenue?: number;
  paymentMethod: 'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card' | '—';
  startDate: string;
  endDate: string;
  expiresAtIso?: string;
  status: 'Active' | 'Expired';
  statusBadgeClass: string;
  daysLeft?: number;
  autoRenew?: boolean;
  transactionId?: string;
  createdAt?: string;
  lastUpdated?: string;
}
