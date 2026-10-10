// Static landing-page content extracted from the original Landing.tsx.
import { FileText, CheckCircle2, Target, BarChart3, Bookmark, Clock } from 'lucide-react';

// West Bengal & Central Competitive Exams Coverage
export const SUPPORTED_EXAM_CATEGORIES = [
  'WBPSC Clerkship',
  'Railway Group D',
  'Primary & Upper Primary TET',
  'WBP Constable',
  'Kolkata Police',
  'WBCS Prelims',
  'WBPSC Misc',
];

export const examCategories = [
  { id: 'all', label: 'All Exams' },
  { id: 'west-bengal', label: 'West Bengal' },
  { id: 'central', label: 'Central' },
  { id: 'state', label: 'State' },
  { id: 'teaching', label: 'Teaching' },
];

export const popularExams = [
  {
    title: 'WBP Constable',
    subtitle: 'West Bengal Police',
    testsCount: '42+ Tests',
    icon: '/images/exams/emblem_wbp.svg',
    route: '/exams/wbp-constable',
    badge: 'Popular',
    categories: ['all', 'west-bengal', 'state'],
  },
  {
    title: 'WBPSC Clerkship',
    subtitle: 'Public Service Commission',
    testsCount: '35+ Tests',
    icon: '/images/exams/emblem_wbpsc.svg',
    route: '/exams/wbpsc-clerkship',
    badge: 'Popular',
    categories: ['all', 'west-bengal', 'state'],
  },
  {
    title: 'Railway (RRB) NTPC',
    subtitle: 'Indian Railways',
    testsCount: '38+ Tests',
    icon: '/images/exams/emblem_railway.svg',
    route: '/exams/railway-ntpc',
    badge: 'Central',
    categories: ['all', 'central'],
  },
  {
    title: 'Primary TET',
    subtitle: 'West Bengal Primary Education',
    testsCount: '25+ Tests',
    icon: '/images/exams/emblem_tet.svg',
    route: '/exams/primary-tet',
    badge: 'Teaching',
    categories: ['all', 'west-bengal', 'teaching'],
  },
  {
    title: 'SSC GD Constable',
    subtitle: 'Staff Selection Commission',
    testsCount: '30+ Tests',
    icon: '/images/exams/emblem_ssc.svg',
    route: '/exams/ssc-gd',
    badge: 'Central',
    categories: ['all', 'central'],
  },
  {
    title: 'WBSSC Group D',
    subtitle: 'School Service Commission',
    testsCount: '25+ Tests',
    icon: '/images/exams/emblem_wbssc.svg',
    route: '/exams/wbssc-group-d',
    badge: 'State',
    categories: ['all', 'west-bengal', 'state'],
  },
  {
    title: 'Kolkata Police SI',
    subtitle: 'KP Recruitment Board',
    testsCount: '28+ Tests',
    icon: '/images/exams/emblem_wbp.svg',
    route: '/exams/kp-constable',
    badge: 'Hot',
    categories: ['all', 'west-bengal', 'state'],
  },
  {
    title: 'More Exams',
    subtitle: 'Explore 500+ mock tests',
    testsCount: '500+ Tests',
    icon: '',
    isCustomIcon: true,
    route: '/exams',
    categories: ['all', 'west-bengal', 'central', 'state', 'teaching'],
  },
];

export const toolsFeatures = [
  {
    icon: FileText,
    title: 'Real-Pattern Mock Tests',
    bengaliTag: 'পরীক্ষার অনুরূপ মক টেস্ট',
    description: 'Exact exam pattern, negative marking scheme, and timed countdown interface.',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    icon: CheckCircle2,
    title: '10+ Years Solved PYQs',
    bengaliTag: 'বিগত বছরের প্রশ্ন ও উত্তর',
    description: 'Solve real past papers with step-by-step solutions and shortcut techniques.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    icon: Target,
    title: 'Topic-Wise Practice',
    bengaliTag: 'টপিক-ভিত্তিক প্র্যাকটিস',
    description: 'Strengthen weak areas in Math, Reasoning, GK, English & Bengali systematically.',
    color: 'text-rose-600 bg-rose-50 border-rose-100',
  },
  {
    icon: BarChart3,
    title: 'Statewide Rank & Analytics',
    bengaliTag: 'রাজ্যভিত্তিক র‍্যাংক ও নির্ভুলতা',
    description: 'Compete against thousands of Bengal aspirants and check percentile accuracy.',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    icon: Bookmark,
    title: 'Smart Bookmarks & Short Notes',
    bengaliTag: 'গুরুত্বপূর্ণ নোট ও বুকমার্ক',
    description:
      'Save difficult formulas, GK tidbits, and questions for quick last-minute revision.',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    icon: Clock,
    title: 'Mistakes Notebook',
    bengaliTag: 'ভুল সংশোধনের বিশেষ সুযোগ',
    description: 'Automatically gathers incorrectly answered questions for targeted re-practice.',
    color: 'text-sky-600 bg-sky-50 border-sky-100',
  },
];

export const testimonials = [
  {
    quote:
      'The WBP Constable mock tests are identical to the actual exam. The Bengali explanations helped me clear doubts instantly.',
    name: 'Ritwik Das',
    role: 'WBP Constable Qualified • Nadia',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    quote:
      'Solving 10 years of WBPSC Clerkship PYQs on PracticeKoro boosted my speed by 35%. The statewide rank gave real confidence!',
    name: 'Puja Saha',
    role: 'WBPSC Clerkship Aspirant • Burdwan',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    quote:
      'Best mock platform for West Bengal students. Clean interface, no annoying ads, and works smoothly on mobile too.',
    name: 'Subrata Ghosh',
    role: 'Railway Group D Aspirant • Howrah',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    quote:
      'Primary TET child pedagogy questions with detailed Bengali explanations are top notch. Recommended to all fellow teachers.',
    name: 'Moumita Mukherjee',
    role: 'Primary TET Aspirant • Kolkata',
    avatar:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    rating: 5,
  },
];

export const faqs = [
  {
    q: 'How does the Mistakes Notebook work?',
    a: 'After submitting any test, questions you answered incorrectly are automatically organized into your Mistakes Notebook with detailed explanations for targeted review.',
  },
  {
    q: 'Are PracticeKoro mock tests fully available in English?',
    a: 'Yes! PracticeKoro is fully optimized for English with authentic exam patterns, timer simulation, and step-by-step answer explanations.',
  },
  {
    q: 'Does the Pro Pass unlock all competitive exams?',
    a: 'Yes. A single All-Access Pro Pass (₹299 / 365 Days) unlocks all premium mock test series across State and Central exams including WBP, KP, WBCS, WBPSC, SSC, and Railway.',
  },
  {
    q: 'Can I attempt mock tests for free?',
    a: 'Absolutely! PracticeKoro offers free full mock tests and daily practice sets so you can experience the test runner immediately with no payment details required.',
  },
];
