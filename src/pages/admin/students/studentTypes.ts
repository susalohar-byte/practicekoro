// ============================================================================
// DATA MODELS & PRESETS
// ============================================================================

export type SubscriptionTier = '6 Months' | '1 Month' | '1 Year' | 'Free';
export type StudentStatus = 'Active' | 'Inactive' | 'Unavailable';

export interface StudentActivity {
  id: string;
  type: 'completed' | 'attempted' | 'purchase' | 'registration';
  title: string;
  subtitle?: string;
  time: string;
}

export interface StudentNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface EnrichedStudent {
  id: string;
  studentIdFormatted: string; // e.g. "#STU001234"
  order: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  initials?: string;
  initialsBg?: string;
  initialsColor?: string;
  subscriptionPlan: SubscriptionTier;
  subscriptionValidTill?: string;
  subscriptionMonthsLeft?: string;
  testsAttempted: number;
  avgScore?: number | null;
  bestScore?: number | null;
  daysActive?: number | null;
  lastActive: string;
  status: StudentStatus;
  joinedDate: string;
  /** Raw ISO registration timestamp, when known. */
  joinedAt?: string;
  location: string;
  targetExam?: string;
  activities: StudentActivity[];
  notes?: StudentNote[];
}

// Key used by earlier versions to cache student records; purged on mount.
export const LEGACY_STORAGE_KEY = 'practicekoro_students_v2';
