import type { QuestionItemAnalysis } from '@/types';

// ─── Item Analysis Seed Store (Question Accuracy & Difficulty) ──────
export const localItemAnalysisStore: QuestionItemAnalysis[] = [
  {
    questionId: 'q-lit-04',
    questionText:
      'কোন কাব্যগ্রন্থটির জন্য মাইকেল মধুসূদন দত্ত অমিত্রাক্ষর ছন্দের প্রথম সার্থক প্রয়োগ ঘটান?',
    questionBengali:
      'কোন কাব্যগ্রন্থটির জন্য মাইকেল মধুসূদন দত্ত অমিত্রাক্ষর ছন্দের প্রথম সার্থক প্রয়োগ ঘটান?',
    subjectId: 'sub_bengali',
    subjectName: 'বাংলা সাহিত্য ও ব্যাকরণ',
    chapterId: 'chap_bengali_modern',
    chapterName: 'আধুনিক বাংলা কাব্য ও নাটক',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_bengali_01',
    testTitle: 'WBCS Bengali Literature Mastery Mock',
    declaredDifficulty: 'medium',
    empiricalDifficulty: 'extreme',
    totalAttempts: 154,
    correctCount: 24,
    wrongCount: 126,
    skippedCount: 4,
    accuracyRate: 15.6,
    failureRate: 81.8, // >= 80% failure rate!
    avgTimeSpentSeconds: 78,
    isHighFailure: true,
    isTimeTrap: false,
    isMisclassified: true, // declared medium but actual extreme failure
    options: {
      A: 'তিলোত্তমাসম্ভব কাব্য',
      B: 'মেঘনাদবধ কাব্য',
      C: 'পদ্মাবতী নাটক',
      D: 'বীরাঙ্গনা কাব্য',
    },
    correctOption: 'A',
    optionDistribution: {
      A: 15.6, // Correct option (only 15.6%)
      B: 58.4, // Trap distractor! Most students mistakenly chose মেঘনাদবধ
      C: 18.2,
      D: 5.2,
    },
    explanation:
      'মাইকেল মধুসূদন দত্ত ১৮৬০ সালে প্রকাশিত "তিলোত্তমাসম্ভব কাব্য"-এ প্রথম সার্থকভাবে অমিত্রাক্ষর ছন্দ (Blank Verse) প্রয়োগ করেন। তবে এই ছন্দের চূড়ান্ত মহাকাব্যিক পরাকাষ্ঠা ঘটে ১৮৬১ সালে "মেঘনাদবধ কাব্য"-এ। ৫৮% শিক্ষার্থী ভুলবশত মেঘনাদবধ নির্বাচন করেছে।',
  },
  {
    questionId: 'q-math-02',
    questionText:
      'একটি নির্বাচনে দুইজন প্রার্থীর মধ্যে বিজয়ী প্রার্থী মোট প্রদত্ত ভোটের ৫৮% পেয়ে ৪,৮০০ ভোটে জয়লাভ করলেন। যদি ২০% ভোট অবৈধ ঘোষিত হয়ে থাকে, তবে ভোটার তালিকায় মোট ভোটারের সংখ্যা কত ছিল?',
    questionBengali:
      'একটি নির্বাচনে দুইজন প্রার্থীর মধ্যে বিজয়ী প্রার্থী মোট প্রদত্ত ভোটের ৫৮% পেয়ে ৪,৮০০ ভোটে জয়লাভ করলেন। যদি ২০% ভোট অবৈধ ঘোষিত হয়ে থাকে, তবে ভোটার তালিকায় মোট ভোটারের সংখ্যা কত ছিল?',
    subjectId: 'sub_math',
    subjectName: 'পাটিগণিত ও সংখ্যাতত্ত্ব',
    chapterId: 'chap_math_percentage',
    chapterName: 'শতকরা ও অনুপাত',
    examId: 'exam_wb_police',
    examTitle: 'West Bengal Police Constable & SI',
    testId: 'test_wbp_math_01',
    testTitle: 'WBP Arithmetic Full Speed Mock',
    declaredDifficulty: 'medium',
    empiricalDifficulty: 'extreme',
    totalAttempts: 168,
    correctCount: 26,
    wrongCount: 138,
    skippedCount: 4,
    accuracyRate: 15.5,
    failureRate: 82.1, // >= 80% failure rate!
    avgTimeSpentSeconds: 124, // > 90s Time Trap!
    isHighFailure: true,
    isTimeTrap: true, // Both High Failure and Time Trap!
    isMisclassified: true,
    options: {
      A: '৩৭,৫০০',
      B: '৩০,০০০',
      C: '৪০,০০০',
      D: '৪২,০০০',
    },
    correctOption: 'A',
    optionDistribution: {
      A: 15.5,
      B: 64.3, // Calculation error without invalid vote adjustment
      C: 12.5,
      D: 5.4,
    },
    explanation:
      'ধরি মোট ভোটার = x। বৈধ ভোট = ০.৮x। বিজয়ী ও পরাজিত প্রার্থীর ব্যবধান = (৫৮% - ৪২%) = ১৬% বৈধ ভোট। সুতরাং ০.১৬ × ০.৮x = ৪,৮০০ => ০.১২৮x = ৪,৮০০ => x = ৩৭,৫০০। ৬৪% ছাত্র ২০% অবৈধ ভোটের হিসাব বাদ দেওয়ায় ৩০,০০০ উত্তর বেছে নিয়েছে।',
  },
  {
    questionId: 'q-hist-03',
    questionText:
      '১৮৫৭ সালের মহাবিদ্রোহ চলাকালে অযোধ্যায় (লখনউ) ব্রিটিশ সৈন্যবাহিনীর বিরুদ্ধে সিপাহীদের কার্যকর নেতৃত্ব কে প্রদান করেছিলেন?',
    questionBengali:
      '১৮৫৭ সালের মহাবিদ্রোহ চলাকালে অযোধ্যায় (লখনউ) ব্রিটিশ সৈন্যবাহিনীর বিরুদ্ধে সিপাহীদের কার্যকর নেতৃত্ব কে প্রদান করেছিলেন?',
    subjectId: 'sub_history',
    subjectName: 'ভারতের আধুনিক ইতিহাস ও জাতীয় আন্দোলন',
    chapterId: 'chap_hist_1857',
    chapterName: 'মহাবিদ্রোহ ও ব্রিটিশ নীতি',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_hist_02',
    testTitle: 'Indian Freedom Movement Core Test',
    declaredDifficulty: 'easy',
    empiricalDifficulty: 'extreme',
    totalAttempts: 145,
    correctCount: 28,
    wrongCount: 116,
    skippedCount: 1,
    accuracyRate: 19.3,
    failureRate: 80.0, // >= 80% failure rate!
    avgTimeSpentSeconds: 48,
    isHighFailure: true,
    isTimeTrap: false,
    isMisclassified: true, // author wrote easy, but 80% candidates failed!
    options: {
      A: 'নানা সাহেব',
      B: 'বেগম হজরত মহল',
      C: 'খান বাহাদুর খান',
      D: 'মৌলভি আহমদুল্লাহ',
    },
    correctOption: 'B',
    optionDistribution: {
      A: 42.1, // Distractor trap (Nana Saheb led Kanpur, not Lucknow)
      B: 19.3, // Correct (Begum Hazrat Mahal)
      C: 8.3,
      D: 29.7, // Maulvi Ahmadullah also operated near Faizabad/Awadh
    },
    explanation:
      'লখনউতে মহাবিদ্রোহের মূল নেতৃত্ব দেন বেগম হজরত মহল। তিনি তার নাবালক পুত্র বিজ্রিস কাদিরকে নবাব ঘোষণা করে যুদ্ধ পরিচালনা করেন। কানপুরে নেতৃত্ব দেন নানা সাহেব।',
  },
  {
    questionId: 'q-reas-03',
    questionText:
      'আটজন ব্যক্তি A, B, C, D, E, F, G, H একটি বৃত্তাকার টেবিলের চারিদিকে কেন্দ্রের দিকে মুখ করে বসে আছেন। B বসেছে D-এর ডানদিকে তৃতীয় স্থানে এবং F-এর বামদিকে দ্বিতীয় স্থানে। H-এর অবস্থান নির্ণয় করো।',
    questionBengali:
      'আটজন ব্যক্তি A, B, C, D, E, F, G, H একটি বৃত্তাকার টেবিলের চারিদিকে কেন্দ্রের দিকে মুখ করে বসে আছেন। B বসেছে D-এর ডানদিকে তৃতীয় স্থানে এবং F-এর বামদিকে দ্বিতীয় স্থানে। H-এর অবস্থান নির্ণয় করো।',
    subjectId: 'sub_reasoning',
    subjectName: 'যৌক্তিক বিশ্লেষণ ও রিজনিং',
    chapterId: 'chap_reas_seating',
    chapterName: 'বৃত্তাকার ও রৈখিক আসন বিন্যাস',
    examId: 'exam_wb_police',
    examTitle: 'West Bengal Police Constable & SI',
    testId: 'test_wbp_reas_02',
    testTitle: 'Advanced Seating & Puzzles Mock',
    declaredDifficulty: 'hard',
    empiricalDifficulty: 'moderate',
    totalAttempts: 122,
    correctCount: 62,
    wrongCount: 46,
    skippedCount: 14,
    accuracyRate: 50.8,
    failureRate: 37.7,
    avgTimeSpentSeconds: 148, // > 90s Time Trap!
    isHighFailure: false,
    isTimeTrap: true, // Time Trap!
    isMisclassified: false,
    options: {
      A: 'C এবং E এর ঠিক মাঝে',
      B: 'F এর মুখোমুখি বিপরীত দিকে',
      C: 'A এর ডানদিকে দ্বিতীয় স্থানে',
      D: 'D এর বামদিকে দ্বিতীয় স্থানে',
    },
    correctOption: 'B',
    optionDistribution: {
      A: 18.0,
      B: 50.8,
      C: 17.2,
      D: 10.7,
    },
    explanation:
      'আসন বিন্যাস তৈরি করলে দেখা যায় F এবং H পরস্পরের মুখোমুখি বিপরীত বিন্দুতে অবস্থান করছে। প্রশ্নটি সমাধান করতে প্রার্থীদের গড়ে ১৪৮ সেকেন্ড লেগেছে, যা আদর্শ সময়ের (৬০ সে.) দ্বিগুণের বেশি।',
  },
  {
    questionId: 'q-sci-05',
    questionText:
      'বায়ুমণ্ডলে ওজন স্তরের ঘনত্ব পরিমাপের জন্য নিচের কোন বৈজ্ঞানিক এককটি ব্যবহার করা হয়?',
    questionBengali:
      'বায়ুমণ্ডলে ওজন স্তরের ঘনত্ব পরিমাপের জন্য নিচের কোন বৈজ্ঞানিক এককটি ব্যবহার করা হয়?',
    subjectId: 'sub_science',
    subjectName: 'সাধারণ বিজ্ঞান ও পরিবেশ বিদ্যা',
    chapterId: 'chap_sci_atmosphere',
    chapterName: 'বায়ুমণ্ডল ও পরিবেশ দূষণ',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_sci_01',
    testTitle: 'WBCS General Science Prelims Drill',
    declaredDifficulty: 'easy',
    empiricalDifficulty: 'easy',
    totalAttempts: 195,
    correctCount: 158,
    wrongCount: 32,
    skippedCount: 5,
    accuracyRate: 81.0,
    failureRate: 16.4,
    avgTimeSpentSeconds: 28,
    isHighFailure: false,
    isTimeTrap: false,
    isMisclassified: false,
    options: {
      A: 'ডবসন একক (Dobson Unit)',
      B: 'পাস্কাল (Pascal)',
      C: 'ক্যান্ডেলা (Candela)',
      D: 'অ্যাম্পিয়ার (Ampere)',
    },
    correctOption: 'A',
    optionDistribution: {
      A: 81.0,
      B: 12.3,
      C: 4.1,
      D: 1.5,
    },
    explanation:
      'ওজন স্তরের মোট ঘনত্ব পরিমাপ করতে ডবসন ইউনিট (DU) ব্যবহৃত হয়। ১ ডবসন ইউনিট হলো মানক চাপ ও তাপমাত্রায় ০.০১ মিমি পুরু বিশুদ্ধ ওজন স্তর।',
  },
  {
    questionId: 'q-geo-02',
    questionText:
      'পশ্চিমবঙ্গের সুন্দরবন অঞ্চলের প্রধান ম্যানগ্রোভ বনভূমির জীববৈচিত্র্য সংরক্ষণের ক্ষেত্রে ইউনেস্কো কোন সালে এটিকে ওয়ার্ল্ড হেরিটেজ সাইট হিসেবে ঘোষণা করে?',
    questionBengali:
      'পশ্চিমবঙ্গের সুন্দরবন অঞ্চলের প্রধান ম্যানগ্রোভ বনভূমির জীববৈচিত্র্য সংরক্ষণের ক্ষেত্রে ইউনেস্কো কোন সালে এটিকে ওয়ার্ল্ড হেরিটেজ সাইট হিসেবে ঘোষণা করে?',
    subjectId: 'sub_geography',
    subjectName: 'পশ্চিমবঙ্গ ও ভারতের ভূগোল',
    chapterId: 'chap_geo_wb',
    chapterName: 'পশ্চিমবঙ্গের ভূপ্রকৃতি ও অরণ্য',
    examId: 'exam_wbcs',
    examTitle: 'WBCS Executive Examination',
    testId: 'test_wbcs_geo_01',
    testTitle: 'West Bengal Geography Core Mock',
    declaredDifficulty: 'easy',
    empiricalDifficulty: 'extreme',
    totalAttempts: 172,
    correctCount: 31,
    wrongCount: 139,
    skippedCount: 2,
    accuracyRate: 18.0,
    failureRate: 80.8, // >= 80% failure rate!
    avgTimeSpentSeconds: 38,
    isHighFailure: true,
    isTimeTrap: false,
    isMisclassified: true, // Declared easy, but 80.8% failure!
    options: {
      A: '১৯৮৪',
      B: '১৯৮৭',
      C: '১৯৮৯',
      D: '২০০১',
    },
    correctOption: 'B',
    optionDistribution: {
      A: 34.9, // National park declaration year (1984) trap!
      B: 18.0, // Correct UNESCO World Heritage (1987)
      C: 38.4, // Biosphere reserve (1989) trap!
      D: 6.4,
    },
    explanation:
      'সুন্দরবন জাতীয় উদ্যানকে ১৯৮৭ সালে ইউনেস্কো ওয়ার্ল্ড হেরিটেজ সাইট হিসেবে স্বীকৃতি দেয়। ১৯৮৪ সালে এটি জাতীয় উদ্যান এবং ১৯৮৯ সালে বায়োস্ফিয়ার রিজার্ভ হিসেবে ঘোষিত হয়েছিল। ৩৫% শিক্ষার্থী ১৯৮৪ এবং ৩৮% শিক্ষার্থী ১৯৮৯ নির্বাচন করেছে।',
  },
];
