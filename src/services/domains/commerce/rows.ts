import type { AdminPaymentRow, AdminStudentRow, AdminSubscriptionRow, CouponItem } from '@/types';

export type { AdminTestAttempt } from '@/pages/admin/AdminTestAttempts';

// Row shapes returned by the direct Supabase queries in this folder. The generated
// Database types do not cover payments/coupons yet, so these mirror each `.select()`.

interface JoinedProfile {
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  avatar_url: string | null;
}

interface JoinedPlan {
  title: string | null;
}

/** `payments` row with the profile/plan joins selected by getAdminPayments. */
export interface PaymentJoinRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number | string | null;
  currency: string | null;
  gateway: string | null;
  order_id: string | null;
  razorpay_order_id: string | null;
  transaction_id: string | null;
  razorpay_payment_id: string | null;
  status: AdminPaymentRow['status'];
  refund_id: string | null;
  refund_amount: number | string | null;
  refund_reason: string | null;
  refunded_at: string | null;
  created_at: string;
  purchase_type: AdminPaymentRow['purchaseType'] | null;
  requires_refund: string | boolean | null;
  profiles: JoinedProfile | null;
  subscription_plans: JoinedPlan | null;
}

/** The subset of a `payments` row the refund fallback reads. */
export interface PaymentRecordRow {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  amount: number | string | null;
}

/** `subscriptions` row with the profile/plan joins selected by getAdminSubscriptions. */
export interface SubscriptionJoinRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: AdminSubscriptionRow['status'];
  starts_at: string;
  expires_at: string;
  payment_id: string | null;
  created_at: string;
  profiles: JoinedProfile | null;
  subscription_plans: JoinedPlan | null;
}

/** `coupons` row. */
export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponItem['discountType'];
  discount_value: number | string;
  max_discount_amount: number | string | null;
  min_order_amount: number | string | null;
  max_uses: number | string | null;
  used_count: number | string | null;
  max_uses_per_user: number | string | null;
  applicable_plan_id: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

/** Columns getAdminCoupons/updateAdminCoupon may write. */
export type CouponWrite = Partial<Omit<CouponRow, 'id' | 'used_count' | 'created_at'>>;

/** Local-storage student record touched when a refund revokes Pro access. */
export interface StoredStudent {
  id: string;
  isPro?: boolean;
  subscriptionStatus?: string;
}

/** Edge-function error that may carry the HTTP response with a JSON `{ error }` body. */
export interface EdgeFunctionError {
  message?: string;
  context?: { json?: () => Promise<{ error?: string } | null> };
}

/** Completed `test_attempts` row read by the rankings aggregation. */
export interface RankingAttemptRow {
  id: string;
  user_id: string | null;
  test_id: string | null;
  status: string | null;
  score: number | null;
  total_marks: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  skipped_count: number | null;
  accuracy: number | null;
  time_spent_seconds: number | null;
  created_at: string | null;
  end_time: string | null;
}

/** `profiles` columns read for rankings. */
export interface RankingProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  district: string | null;
  role: string | null;
  created_at: string | null;
}

/** `tests` columns read for rankings. */
export interface RankingTestRow {
  id: string;
  title: string | null;
  test_type: string | null;
  exam_id: string | null;
  subject_id: string | null;
  total_questions: number | null;
  total_marks: number | null;
}

/** `test_attempts` row with the test/exam joins selected by getAllAdminTestAttempts. */
export interface AttemptListRow {
  id: string;
  user_id: string | null;
  test_id: string | null;
  status: string | null;
  start_time: string | null;
  end_time: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  total_marks: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  skipped_count: number | null;
  accuracy: number | null;
  created_at: string | null;
  tests: {
    title: string | null;
    test_type: string | null;
    total_questions: number | null;
    exams: { title: string | null } | null;
  } | null;
}

/** `profiles` columns joined onto admin test attempts. */
export interface AttemptProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

/** `profiles` columns read by the direct getAdminStudents fallback. */
export interface StudentProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
  category: AdminStudentRow['category'] | null;
  gender: AdminStudentRow['gender'] | null;
  district: string | null;
  state: string | null;
  target_exam_title: string | null;
}

/** Latest `subscriptions` row per student, with its plan title. */
export interface StudentSubscriptionRow {
  user_id: string;
  plan_id: string | null;
  status: string | null;
  expires_at: string | null;
  subscription_plans: { title: string | null } | null;
}

/** `student_notes` columns read and returned by the notes API. */
export interface StudentNoteRow {
  id: string;
  author_name: string | null;
  note: string;
  created_at: string;
}

/** A student note as shown in the admin student drawer. */
export interface StudentNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

/** `student_batches` row with its member count aggregate. */
export interface StudentBatchRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  student_batch_members: { count: number }[] | null;
}

/** Student shape used by the local-mode platform analytics. */
export interface AnalyticsStudent {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

/** `test_attempts` fields used by the local-mode platform analytics. */
export interface AnalyticsAttemptRow {
  user_id: string | null;
  created_at: string;
  score: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  accuracy: number | null;
}

/** Question joined onto an answer row for item analysis. */
export interface AnalyticsQuestionInfo {
  question_text?: string | null;
  question_bengali_text?: string | null;
  difficulty?: string | null;
  subject_id?: string | null;
  chapter_id?: string | null;
  subjects?: { name: string | null } | null;
  chapters?: { name: string | null } | null;
}

/** `attempt_answers` row with its question, used for item analysis. */
export interface AnalyticsAnswerRow {
  question_id: string;
  is_correct: boolean | null;
  questions: AnalyticsQuestionInfo | null;
}
