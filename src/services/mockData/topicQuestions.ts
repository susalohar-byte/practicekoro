import type { Question } from '@/types';

// Topic-wise practice sets, merged into MOCK_QUESTIONS after the full tests.
export const TOPIC_QUESTIONS: Record<string, Question[]> = {
  'topic-math-ratio': [
    {
      id: 'q-math-ratio-01',
      subjectId: 'wbp-math',
      chapterId: 'wbp-math-ratio',
      topicId: 'wbp-math-ratio',
      questionText: 'A এবং B এর বয়সের অনুপাত 4:5 এবং তাদের বয়সের সমষ্টি 36 বছর হলে B এর বয়স কত?',
      questionBengaliText:
        'A এবং B এর বয়সের অনুপাত 4:5 এবং তাদের বয়সের সমষ্টি 36 বছর হলে B এর বয়স কত?',
      optionA: '16 বছর',
      optionB: '20 বছর',
      optionC: '24 বছর',
      optionD: '18 বছর',
      correctOption: 'B',
      explanation:
        '• অনুপাতের মোট আনুপাতিক সমষ্টি বা ভাগহার = 4 + 5 = 9 ভাগ।\n• প্রশ্নানুসারে মোট ৯ ভাগ = 36 বছর, সুতরাং ১ ভাগের মান = 36 ÷ 9 = 4 বছর।\n• অতএব B এর বয়স = 5 × 4 = 20 বছর এবং A এর বয়স = 4 × 4 = 16 বছর।\n• সত্যতা যাচাই: 16 + 20 = 36 বছর এবং 16:20 = 4:5, যা প্রশ্নের শর্তের সাথে সম্পূর্ণ মিলে যায়।\n• সরাসরি শর্টকাট সূত্র: নির্দিষ্ট অংশ = (অনুপাত পদ ÷ মোট অনুপাত) × মোট রাশি = (5/9) × 36 = 20 বছর।',
      explanationBengali:
        '• অনুপাতের মোট আনুপাতিক সমষ্টি বা ভাগহার = 4 + 5 = 9 ভাগ।\n• প্রশ্নানুসারে মোট ৯ ভাগ = 36 বছর, সুতরাং ১ ভাগের মান = 36 ÷ 9 = 4 বছর।\n• অতএব B এর বয়স = 5 × 4 = 20 বছর এবং A এর বয়স = 4 × 4 = 16 বছর।\n• সত্যতা যাচাই: 16 + 20 = 36 বছর এবং 16:20 = 4:5, যা প্রশ্নের শর্তের সাথে সম্পূর্ণ মিলে যায়।\n• সরাসরি শর্টকাট সূত্র: নির্দিষ্ট অংশ = (অনুপাত পদ ÷ মোট অনুপাত) × মোট রাশি = (5/9) × 36 = 20 বছর।',
      difficulty: 'easy',
      defaultMarks: 1.0,
      defaultNegativeMarks: 0,
      sourceType: 'topic',
      isActive: true,
      status: 'active',
    },
    {
      id: 'q-math-ratio-02',
      subjectId: 'wbp-math',
      chapterId: 'wbp-math-ratio',
      topicId: 'wbp-math-ratio',
      questionText: 'যদি A : B = 2 : 3 এবং B : C = 4 : 5 হয়, তবে A : C এর মান কত?',
      questionBengaliText: 'যদি A : B = 2 : 3 এবং B : C = 4 : 5 হয়, তবে A : C এর মান কত?',
      optionA: '8 : 15',
      optionB: '6 : 15',
      optionC: '2 : 5',
      optionD: '15 : 8',
      correctOption: 'A',
      explanation:
        '• অনুপাতগুলিকে ভগ্নাংশে প্রকাশ করে পাই: A/B = 2/3 এবং B/C = 4/5।\n• প্রান্তিক অনুপাত নির্ণয়ের সূত্র: A/C = (A/B) × (B/C)।\n• মান বসিয়ে পাই: A/C = (2/3) × (4/5) = (2 × 4) / (3 × 5) = 8/15।\n• অতএব নির্ণেয় যৌগিক অনুপাত A : C = 8 : 15।\n• সম্পূর্ণ সংযুক্ত অনুপাত A:B:C বের করার শর্টকাট নিয়ম: A:B:C = (2×4) : (3×4) : (3×5) = 8 : 12 : 15।',
      explanationBengali:
        '• অনুপাতগুলিকে ভগ্নাংশে প্রকাশ করে পাই: A/B = 2/3 এবং B/C = 4/5।\n• প্রান্তিক অনুপাত নির্ণয়ের সূত্র: A/C = (A/B) × (B/C)।\n• মান বসিয়ে পাই: A/C = (2/3) × (4/5) = (2 × 4) / (3 × 5) = 8/15।\n• অতএব নির্ণেয় যৌগিক অনুপাত A : C = 8 : 15।\n• সম্পূর্ণ সংযুক্ত অনুপাত A:B:C বের করার শর্টকাট নিয়ম: A:B:C = (2×4) : (3×4) : (3×5) = 8 : 12 : 15।',
      difficulty: 'medium',
      defaultMarks: 1.0,
      defaultNegativeMarks: 0,
      sourceType: 'topic',
      isActive: true,
      status: 'active',
    },
  ],
  'topic-math-percentage': [
    {
      id: 'q-math-perc-01',
      subjectId: 'wbp-math',
      chapterId: 'wbp-math-percentage',
      topicId: 'wbp-math-percentage',
      questionText:
        'একটি বইয়ের ধার্যমূল্য 120 টাকা। বইটি 10% ছাড়ে বিক্রি করা হলে বিক্রয়মূল্য কত?',
      questionBengaliText:
        'একটি বইয়ের ধার্যমূল্য 120 টাকা। বইটি 10% ছাড়ে বিক্রি করা হলে বিক্রয়মূল্য কত?',
      optionA: '100 টাকা',
      optionB: '108 টাকা',
      optionC: '110 টাকা',
      optionD: '112 টাকা',
      correctOption: 'B',
      explanation:
        '• বইটির ধার্যমূল্য (Marked Price) = 120 টাকা এবং প্রদত্ত ছাড়ের হার (Discount) = 10%।\n• মোট ছাড়ের পরিমাণ = 120 × (10/100) = 12 টাকা।\n• বিক্রয়মূল্য (Selling Price) = ধার্যমূল্য - ছাড় = 120 - 12 = 108 টাকা।\n• সরাসরি শতকরা সূত্রের শর্টকাট: বিক্রয়মূল্য = 120 × (100 - 10)% = 120 × 0.90 = 108 টাকা।\n• মনে রাখবেন শতকরা ছাড় সর্বদা পণ্যের ধার্যমূল্য বা এমআরপি-র ওপর হিসাব করতে হয়।',
      explanationBengali:
        '• বইটির ধার্যমূল্য (Marked Price) = 120 টাকা এবং প্রদত্ত ছাড়ের হার (Discount) = 10%।\n• মোট ছাড়ের পরিমাণ = 120 × (10/100) = 12 টাকা।\n• বিক্রয়মূল্য (Selling Price) = ধার্যমূল্য - ছাড় = 120 - 12 = 108 টাকা।\n• সরাসরি শতকরা সূত্রের শর্টকাট: বিক্রয়মূল্য = 120 × (100 - 10)% = 120 × 0.90 = 108 টাকা।\n• মনে রাখবেন শতকরা ছাড় সর্বদা পণ্যের ধার্যমূল্য বা এমআরপি-র ওপর হিসাব করতে হয়।',
      difficulty: 'easy',
      defaultMarks: 1.0,
      defaultNegativeMarks: 0,
      sourceType: 'topic',
      isActive: true,
      status: 'active',
    },
  ],
  'topic-sci-physics': [
    {
      id: 'q-sci-phys-01',
      subjectId: 'wbp-science',
      chapterId: 'wbp-sci-physics',
      topicId: 'wbp-sci-physics',
      questionText: 'SI পদ্ধতিতে বলের (Force) একক কী?',
      questionBengaliText: 'SI পদ্ধতিতে বলের (Force) একক কী?',
      optionA: 'ডাইন',
      optionB: 'নিউটন',
      optionC: 'জুল',
      optionD: 'ওয়াট',
      correctOption: 'B',
      explanation:
        '• আন্তর্জাতিক এসআই (SI) পদ্ধতিতে বলের পরম একক হলো নিউটন (Newton), সংক্ষেপে N দ্বারা প্রকাশ করা হয়।\n• বলের সমীকরণ: বল (F) = ভর (m) × ত্বরণ (a), অর্থাৎ ১ নিউটন = ১ কেজি × ১ মিটার/সেকেন্ড² (1 N = 1 kg·m/s²)।\n• সিজিএস (CGS) পদ্ধতিতে বলের পরম একক হলো ডাইন (Dyne)।\n• নিউটন ও ডাইনের মধ্যে পারস্পরিক সম্পর্ক: ১ নিউটন = ১০⁵ ডাইন (1 N = 100,000 Dynes)।\n• কাজের বা শক্তির এসআই একক হলো জুল (Joule) এবং ক্ষমতার এসআই একক হলো ওয়াট (Watt)।',
      explanationBengali:
        '• আন্তর্জাতিক এসআই (SI) পদ্ধতিতে বলের পরম একক হলো নিউটন (Newton), সংক্ষেপে N দ্বারা প্রকাশ করা হয়।\n• বলের সমীকরণ: বল (F) = ভর (m) × ত্বরণ (a), অর্থাৎ ১ নিউটন = ১ কেজি × ১ মিটার/সেকেন্ড² (1 N = 1 kg·m/s²)।\n• সিজিএস (CGS) পদ্ধতিতে বলের পরম একক হলো ডাইন (Dyne)।\n• নিউটন ও ডাইনের মধ্যে পারস্পরিক সম্পর্ক: ১ নিউটন = ১০⁵ ডাইন (1 N = 100,000 Dynes)।\n• কাজের বা শক্তির এসআই একক হলো জুল (Joule) এবং ক্ষমতার এসআই একক হলো ওয়াট (Watt)।',
      difficulty: 'easy',
      defaultMarks: 1.0,
      defaultNegativeMarks: 0,
      sourceType: 'topic',
      isActive: true,
      status: 'active',
    },
  ],
  'topic-pol-rights': [
    {
      id: 'q-pol-rights-01',
      subjectId: 'wbp-polity',
      chapterId: 'wbp-pol-rights',
      topicId: 'wbp-pol-rights',
      questionText: 'ভারতীয় সংবিধানের কত নম্বর ধারায় অস্পৃশ্যতা দূরীকরণের কথা বলা হয়েছে?',
      questionBengaliText: 'ভারতীয় সংবিধানের কত নম্বর ধারায় অস্পৃশ্যতা দূরীকরণের কথা বলা হয়েছে?',
      optionA: 'ধারা 14',
      optionB: 'ধারা 17',
      optionC: 'ধারা 19',
      optionD: 'ধারা 21',
      correctOption: 'B',
      explanation:
        '• ভারতীয় সংবিধানের তৃতীয় অংশে (Part III) অনুচ্ছেদ ১৭-তে অস্পৃশ্যতা বিলোপ (Abolition of Untouchability) নিশ্চিত করা হয়েছে।\n• অনুচ্ছেদ ১৭ হলো একটি পরম অধিকার (Absolute Right), যার কোনো ব্যতিক্রম বা সীমাবদ্ধতা সংবিধানে নেই।\n• অস্পৃশ্যতা দূরীকরণকে আইনত দণ্ডনীয় অপরাধ করতে ১৯৫৫ সালে সংসদ Untouchability (Offences) Act পাস করে, যা বর্তমানে Protection of Civil Rights Act নামে পরিচিত।\n• সংবিধানের ১৪ থেকে ১৮ নম্বর অনুচ্ছেদ পর্যন্ত সাম্যের অধিকার (Right to Equality) বিস্তারিত ব্যাখ্যা করা হয়েছে।\n• ধারা ১৪ আইনের দৃষ্টিতে সমতা, ধারা ১৫ বৈষম্যহীনতা, ধারা ১৬ সরকারি চাকুরিতে সমসুযোগ এবং ধারা ১৮ খেতাব বিলোপ নিশ্চিত করে।',
      explanationBengali:
        '• ভারতীয় সংবিধানের তৃতীয় অংশে (Part III) অনুচ্ছেদ ১৭-তে অস্পৃশ্যতা বিলোপ (Abolition of Untouchability) নিশ্চিত করা হয়েছে।\n• অনুচ্ছেদ ১৭ হলো একটি পরম অধিকার (Absolute Right), যার কোনো ব্যতিক্রম বা সীমাবদ্ধতা সংবিধানে নেই।\n• অস্পৃশ্যতা দূরীকরণকে আইনত দণ্ডনীয় অপরাধ করতে ১৯৫৫ সালে সংসদ Untouchability (Offences) Act পাস করে, যা বর্তমানে Protection of Civil Rights Act নামে পরিচিত।\n• সংবিধানের ১৪ থেকে ১৮ নম্বর অনুচ্ছেদ পর্যন্ত সাম্যের অধিকার (Right to Equality) বিস্তারিত ব্যাখ্যা করা হয়েছে।\n• ধারা ১৪ আইনের দৃষ্টিতে সমতা, ধারা ১৫ বৈষম্যহীনতা, ধারা ১৬ সরকারি চাকুরিতে সমসুযোগ এবং ধারা ১৮ খেতাব বিলোপ নিশ্চিত করে।',
      difficulty: 'easy',
      defaultMarks: 1.0,
      defaultNegativeMarks: 0,
      sourceType: 'topic',
      isActive: true,
      status: 'active',
    },
  ],
};
