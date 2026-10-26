import type { Chapter } from '@/types';

// Enriched Topic model matching all visible fields in reference UI
export interface EnrichedTopicRow extends Chapter {
  subjectName: string;
  totalTests: number;
  totalQuestions: number;
  statusLabel: 'Published' | 'Draft';
  orderIndex: number;
  iconName?: string;
  totalAttempts?: number;
  avgScoreFormatted?: string;
  descriptionBengali?: string;
  subjectTopicsCount?: number;
  subjectTotalTestsCount?: number;
  subjectTotalQuestionsCount?: number;
  createdByName?: string;
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
}

// Subject group header interface for accordion
export interface SubjectGroup {
  id: string;
  name: string;
  topicsCount: number;
  iconName: string;
  colorScheme: 'purple' | 'blue' | 'red' | 'green' | 'amber';
  topics: EnrichedTopicRow[];
}

// Canonical 10 Topics Preset matching the reference UI exactly
export const CANONICAL_TOPICS_PRESET: EnrichedTopicRow[] = [
  // Subject 1: General Science
  {
    id: 'top-heat-temperature',
    name: 'Heat & Temperature',
    slug: 'heat-and-temperature',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 8,
    totalQuestions: 240,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 1,
    iconName: 'Thermometer',
    totalAttempts: 12480,
    avgScoreFormatted: '68%',
    descriptionBengali:
      'তাপ ও তাপমাত্রা অধ্যায়ের গুরুত্বপূর্ণ ধারণা, সূত্র, নিয়ম ও প্রয়োগ নিয়ে প্রস্তুত করা হয়েছে। বিভিন্ন সরকারি পরীক্ষায় এই অধ্যায় থেকে নিয়মিত প্রশ্ন আসে, তাই এটি অত্যন্ত গুরুত্বপূর্ণ একটি টপিক।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '12 Aug 2026, 11:20 AM',
    updatedAtFormatted: '14 Sep 2026, 04:15 PM',
  },
  {
    id: 'top-light',
    name: 'Light',
    slug: 'light',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 6,
    totalQuestions: 180,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 2,
    iconName: 'Sun',
    totalAttempts: 10850,
    avgScoreFormatted: '65%',
    descriptionBengali:
      'আলোর প্রতিফলন, প্রতিসরণ, লেন্স ও প্রিজম সংক্রান্ত পদার্থবিজ্ঞানের মূল অধ্যায়।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '13 Aug 2026, 10:15 AM',
    updatedAtFormatted: '14 Sep 2026, 03:00 PM',
  },
  {
    id: 'top-sound',
    name: 'Sound',
    slug: 'sound',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 5,
    totalQuestions: 150,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 3,
    iconName: 'Activity',
    totalAttempts: 9420,
    avgScoreFormatted: '62%',
    descriptionBengali: 'শব্দ তরঙ্গ, গতিবেগ, প্রতিধ্বনি ও ডপলার এফেক্ট সম্পর্কিত বিষয়াবলী।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '14 Aug 2026, 02:30 PM',
    updatedAtFormatted: '15 Sep 2026, 11:45 AM',
  },
  {
    id: 'top-work-power-energy',
    name: 'Work, Power and Energy',
    slug: 'work-power-and-energy',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 6,
    totalQuestions: 180,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 4,
    iconName: 'Zap',
    totalAttempts: 11200,
    avgScoreFormatted: '70%',
    descriptionBengali: 'কার্য, ক্ষমতা ও শক্তির রূপান্তর এবং সংরক্ষণ সূত্রাবলী।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '15 Aug 2026, 09:00 AM',
    updatedAtFormatted: '16 Sep 2026, 05:20 PM',
  },
  {
    id: 'top-electricity',
    name: 'Electricity',
    slug: 'electricity',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 7,
    totalQuestions: 210,
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 5,
    iconName: 'Power',
    totalAttempts: 8140,
    avgScoreFormatted: '58%',
    descriptionBengali: 'তড়িৎ প্রবাহ, ওহমের সূত্র, রোধ ও তড়িৎ বর্তনীর ধারণা।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '16 Aug 2026, 04:10 PM',
    updatedAtFormatted: '17 Sep 2026, 01:10 PM',
  },

  // Subject 2: Indian Polity
  {
    id: 'top-indian-constitution',
    name: 'Indian Constitution',
    slug: 'indian-constitution',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 10,
    totalQuestions: 320,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 1,
    iconName: 'BookOpen',
    totalAttempts: 15640,
    avgScoreFormatted: '72%',
    descriptionBengali: 'ভারতীয় সংবিধান রচনা, প্রস্তাবনা, উৎস এবং সংবিধানের মূল বৈশিষ্ট্যসমূহ।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '14 Aug 2026, 09:15 AM',
    updatedAtFormatted: '15 Sep 2026, 02:40 PM',
  },
  {
    id: 'top-fundamental-rights',
    name: 'Fundamental Rights',
    slug: 'fundamental-rights',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 8,
    totalQuestions: 240,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 2,
    iconName: 'Shield',
    totalAttempts: 14180,
    avgScoreFormatted: '74%',
    descriptionBengali: 'মৌলিক অধিকার (ধারা ১২-৩৫), রিট আবেদন ও মৌলিক কর্তব্য সংক্রান্ত বিধানাবলী।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '15 Aug 2026, 11:30 AM',
    updatedAtFormatted: '16 Sep 2026, 04:50 PM',
  },
  {
    id: 'top-directive-principles',
    name: 'Directive Principles',
    slug: 'directive-principles',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 6,
    totalQuestions: 180,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 3,
    iconName: 'CheckSquare',
    totalAttempts: 10320,
    avgScoreFormatted: '67%',
    descriptionBengali: 'রাষ্ট্র পরিচালনার নির্দেশমূলক নীতি (DPSP) ও ধারা ৩৬-৫১।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '17 Aug 2026, 03:20 PM',
    updatedAtFormatted: '18 Sep 2026, 10:00 AM',
  },
  {
    id: 'top-president',
    name: 'President',
    slug: 'president',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 5,
    totalQuestions: 150,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 4,
    iconName: 'Crown',
    totalAttempts: 11940,
    avgScoreFormatted: '69%',
    descriptionBengali:
      'ভারতের রাষ্ট্রপতি নির্বাচন, ক্ষমতা, জরুরি অবস্থা জারি ও অপসারণ সংক্রান্ত নিয়ম।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '18 Aug 2026, 01:10 PM',
    updatedAtFormatted: '19 Sep 2026, 06:15 PM',
  },
  {
    id: 'top-parliament',
    name: 'Parliament',
    slug: 'parliament',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 8,
    totalQuestions: 240,
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 5,
    iconName: 'Building2',
    totalAttempts: 12850,
    avgScoreFormatted: '63%',
    descriptionBengali: 'লোকসভা, রাজ্যসভা, বিল প্রণয়ন পদ্ধতি, সংসদীয় কমিটি ও কার্যপদ্ধতি।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '19 Aug 2026, 05:45 PM',
    updatedAtFormatted: '20 Sep 2026, 12:30 PM',
  },
];

export const COLOR_PALETTE: SubjectGroup['colorScheme'][] = [
  'purple',
  'blue',
  'green',
  'amber',
  'red',
];
