import type { LiveTest } from '@/types';

export const ENDED_STATUSES: ReadonlyArray<LiveTest['status']> = [
  'ended',
  'completed',
  'cancelled',
];

export const SAMPLE_TXT_LIVE = `1. ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?
A) জওহরলাল নেহেরু
B) ড. রাজেন্দ্র প্রসাদ
C) সর্দার বল্লভভাই প্যাটেল
D) ড. বি. আর. আম্বেদকর
Answer: B
Explanation: ড. রাজেন্দ্র প্রসাদ ছিলেন ভারতের প্রথম রাষ্ট্রপতি।

2. Who was the first President of India?
A) Jawaharlal Nehru
B) Dr. Rajendra Prasad
C) Sardar Vallabhbhai Patel
D) Dr. B.R. Ambedkar
Answer: B
Explanation: Dr. Rajendra Prasad was the first President of India.`;
