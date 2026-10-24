export const SMS_BROADCAST_DISABLED_MESSAGE =
  'Direct SMS broadcast is disabled: recipients and the Fast2SMS key must be resolved by a server-side function, which is not configured. No SMS was sent.';

// ============================================================================
// DATA TYPES & INTERFACES
// ============================================================================

export type NotificationCategory =
  | 'Test'
  | 'Promotion'
  | 'Result'
  | 'Update'
  | 'Subscription'
  | 'Content'
  | 'System'
  | 'Welcome'
  | 'General';

export type NotificationStatus = 'Sent' | 'Scheduled' | 'Draft' | 'Archived';

export interface NotificationRecord {
  id: string;
  num: number;
  title: string;
  message: string;
  type: NotificationCategory;
  audience: string;
  /** Raw target_audience value stored on the backend record (e.g. 'all', 'pro', 'free'). */
  targetAudience?: string;
  audienceCount: string;
  status: NotificationStatus;
  sentAtDate?: string;
  sentAtTime?: string;
  scheduledAt?: string;
  eventAt?: string;
  stats?: {
    delivered: number; // e.g. 96
    opened: number; // e.g. 82
    clicked: number; // e.g. 24
  };
  actionLink?: string;
  sendPush?: boolean;
  sendEmail?: boolean;
  sendSms?: boolean;
  channels?: string[];
}
