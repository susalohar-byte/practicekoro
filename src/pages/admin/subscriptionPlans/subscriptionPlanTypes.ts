export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  renewalWindowDays?: number | null;
  badge?: string;
  badgeColor?: string;
  buttonText: string;
  buttonClass: string;
  themeColor: string;
  borderClass: string;
  bgClass: string;
  iconType: 'free' | 'basic' | 'pro' | 'ultimate';
  features: PlanFeature[];
}

export interface RecentSubscriptionItem {
  id: number | string;
  studentName: string;
  studentAvatar?: string;
  studentEmail?: string;
  plan: string;
  planBadgeClass: string;
  amount: number;
  date: string;
  status: string;
}
