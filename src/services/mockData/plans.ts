import type { SubscriptionPlan } from '@/types';

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_free',
    title: 'Free Plan',
    description:
      'Basic access to free practice content. Topic-wise practice tests and limited mock tests available for all aspirants.',
    durationDays: 36500,
    price: 0,
    originalPrice: 0,
    currency: 'INR',
    features: [
      'Topic-wise Practice Tests (Free)',
      'Limited Free Mock Tests',
      'Basic Performance Summary',
      'Mistakes Notebook (Last 5 Tests)',
      'Full Syllabus Practice Tests',
    ],
    isActive: true,
    orderIndex: 0,
  },
  {
    id: 'pro_1_year',
    title: '1-Year All-Access Pass',
    description:
      'Unlimited access to ALL Premium Mock Tests across all West Bengal exams for 365 days.',
    durationDays: 365,
    price: 299,
    originalPrice: 999,
    currency: 'INR',
    features: [
      'Everything in Free Plan +',
      'Unlock ALL Premium Mock Tests across all exams',
      'WBP Constable, KP SI, WBCS & WBPSC Clerkship',
      'Automatic Mistakes Notebook & Smart Revision',
      'Detailed Step-by-Step Explanations',
      'State-Level Rank & Percentile Analytics',
      'Validity: Full 365 Days',
    ],
    isActive: true,
    orderIndex: 1,
  },
  {
    id: 'pro_6_month',
    title: '6-Month Exam Pass',
    description: 'Complete access to all premium tests for 180 days.',
    durationDays: 180,
    price: 199,
    originalPrice: 599,
    currency: 'INR',
    features: [
      'Everything in Free Plan +',
      'Unlock ALL Premium Mock Tests',
      'Detailed Explanations & Solutions',
      'Mistakes Notebook & Bookmarks',
      'Validity: 180 Days',
    ],
    isActive: true,
    orderIndex: 2,
  },
];
