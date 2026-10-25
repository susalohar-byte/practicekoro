import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ExamData } from './ExamModal';

interface PopularExamsSectionProps {
  onSelectExam: (exam: ExamData) => void;
}

export const POPULAR_EXAMS: ExamData[] = [
  {
    id: 'wbp-constable',
    name: 'WBP Constable',
    bengaliName: 'ওয়েস্ট বেঙ্গল পুলিশ কনস্টেবল ও লেডি কনস্টেবল',
    logo: '/images/popular_exams/logo_wbp.png',
    badge: 'Police Recruitment',
    description:
      'পশ্চিমবঙ্গ পুলিশ রিক্রুটমেন্ট বোর্ডের (PRB) প্রিলিমিনারি ও মেইনস পরীক্ষার জন্য অধ্যায়ভিত্তিক প্রশ্ন ও পূর্ণাঙ্গ মক টেস্ট।',
    pattern: {
      duration: '৬০ মিনিট',
      questions: '৮৫ টি প্রশ্ন',
      marks: '৮৫ নম্বর',
      negativeMarking: '১/৪ (০.২৫)',
    },
    subjects: ['সাধারণ জ্ঞান ও সচেতনতা', 'প্রাথমিক গণিত', 'ইংরেজি', 'রিজনিং ও লজিক্যাল অ্যানালিসিস'],
    features: [
      'বিগত ৫ বছরের সম্পূর্ণ সমাধান সহ PYQ',
      'নেগেটিভ মার্কিং সহ রিয়েল-টাইম টাইমার টেস্ট',
      'পশ্চিমবঙ্গ র‍্যাঙ্কিং ও পারসেন্টাইল বিশ্লেষণ',
      'বোর্ড সিলেবাস অনুযায়ী সংক্ষিপ্ত নোটস',
    ],
  },
  {
    id: 'wbssc-group-cd',
    name: 'WBSSC Group C & D',
    bengaliName: 'ওয়েস্ট বেঙ্গল স্কুল সার্ভিস কমিশন গ্রুপ C & D',
    logo: '/images/popular_exams/logo_wbpsc.png',
    badge: 'School Service',
    description:
      'স্কুল সার্ভিস কমিশনের গ্রুপ সি (করণিক) ও গ্রুপ ডি পদের জন্য নতুন সিলেবাস ভিত্তিক স্পেশাল প্র্যাকটিস সেট ও মক টেস্ট।',
    pattern: {
      duration: '৬০ মিনিট',
      questions: '৬০ টি প্রশ্ন',
      marks: '৬০ নম্বর',
      negativeMarking: 'প্রযোজ্য নয় / ০',
    },
    subjects: ['জেনারেল নলেজ', 'কারেন্ট অ্যাফেয়ার্স', 'পাটিগণিত', 'সাধারণ ইংরেজি'],
    features: [
      'টপিক অনুযায়ী আনলিমিটেড কুইজ',
      'বিগত বছরের প্রশ্নপত্র সমাধান',
      'সহজ ভাষায় প্রতিটি উত্তরের নোটস',
      'সরাসরি মোবাইল অ্যাপে প্র্যাকটিস',
    ],
  },
  {
    id: 'clerkship',
    name: 'Clerkship',
    bengaliName: 'WBPSC ক্লার্কশিপ রিক্রুটমেন্ট পরীক্ষা',
    logo: '/images/popular_exams/logo_wbpsc.png',
    badge: 'PSC Bengal',
    description:
      'ওয়েস্ট বেঙ্গল পাবলিক সার্ভিস কমিশনের ক্লার্কশিপ পার্ট-১ ও পার্ট-২ পরীক্ষার জন্য সেরা প্রশ্নসংগ্রহ ও পূর্ণাঙ্গ টেস্ট সিরিজ।',
    pattern: {
      duration: '৯০ মিনিট',
      questions: '১০০ টি প্রশ্ন',
      marks: '১০০ নম্বর',
      negativeMarking: '০.২৫ নম্বর',
    },
    subjects: ['English (30 Marks)', 'General Studies (40 Marks)', 'Arithmetic (30 Marks)'],
    features: [
      'লেটেস্ট WBPSC প্যাটার্নে ১০০ নম্বরের ফুল মক টেস্ট',
      'প্রতিটি প্রশ্নের কনসেপচুয়াল ব্যাকগ্রাউন্ড নোটস',
      'দুর্বল বিষয় চিহ্নিত করার পারফরম্যান্স অ্যানালিটিক্স',
      'বাংলা ও ইংরেজি উভয় ভাষায় প্রশ্নাবলি',
    ],
  },
  {
    id: 'railway',
    name: 'Railway Exams',
    bengaliName: 'RRB NTPC & Group D (বাংলা ও ইংরেজি)',
    logo: '/images/popular_exams/logo_railway.png',
    badge: 'RRB Eastern',
    description:
      'রেলওয়ে রিক্রুটমেন্ট বোর্ডের NTPC ও গ্রুপ ডি পরীক্ষার জন্য বাংলা ভাষায় প্রশ্নব্যাংক ও প্রিভিয়াস ইয়ার কোয়েশ্চেন।',
    pattern: {
      duration: '৯০ মিনিট',
      questions: '১০০ টি প্রশ্ন',
      marks: '১০০ নম্বর',
      negativeMarking: '১/৩ (০.৩৩)',
    },
    subjects: ['জেনারেল সাইন্স (Physics, Chem, Bio)', 'গণিত', 'জেনারেল ইন্টেলিজেন্স', 'সাধারণ সচেতনতা'],
    features: [
      'TCS এক্সাম ইন্টারফেস অনুযায়ী মক টেস্ট',
      'রেলওয়ের প্রিভিয়াস ইয়ার শিফট কোয়েশ্চেন',
      'বিজ্ঞান ও গণিতের ফর্মুলা শিট ও নোটস',
      'অল ইন্ডিয়া ও ওয়েস্ট বেঙ্গল জোন র‍্যাঙ্ক',
    ],
  },
  {
    id: 'ssc',
    name: 'SSC Exams',
    bengaliName: 'SSC GD Constable, MTS & CHSL',
    logo: '/images/popular_exams/logo_ssc.png',
    badge: 'Staff Selection',
    description:
      'স্টাফ সিলেকশন কমিশনের জিডি কনস্টেবল ও এমটিএস বাংলা ভাষায় অনুষ্ঠিত পরীক্ষার জন্য নির্ভরযোগ্য মক টেস্ট সিরিজ।',
    pattern: {
      duration: '৬০ মিনিট',
      questions: '৮০ টি প্রশ্ন',
      marks: '১৬০ নম্বর',
      negativeMarking: '০.২৫ / ০.৫০',
    },
    subjects: ['জেনারেল ইন্টেলিজেন্স ও রিজনিং', 'সাধারণ জ্ঞান ও জেনারেল অ্যাওয়ারনেস', 'প্রাথমিক গণিত', 'বাংলা / ইংরেজি ব্যাকরণ'],
    features: [
      'নতুন বাংলা ভাষার ইন্টারফেসে পরীক্ষা প্রস্তুতি',
      'দ্রুত গণিত ও রিজনিং শর্টকাট ট্রিক্স',
      'দৈনিক কারেন্ট অ্যাফেয়ার্স আপডেট',
      'অধ্যায়ভিত্তিক দুর্বলতা নির্ণয়',
    ],
  },
];

export const PopularExamsSection: React.FC<PopularExamsSectionProps> = ({ onSelectExam }) => {
  return (
    <section id="exams" className="py-12 sm:py-16 bg-[#FAFCFF] border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header matching reference */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-lg">📈</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-headline tracking-tight">
              Popular Exams
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium font-headline">
            পশ্চিমবঙ্গের গুরুত্বপূর্ণ সরকারি পরীক্ষার জন্য প্রস্তুতি নিন।
          </p>
        </div>

        {/* 5 Rounded Cards Grid matching reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {POPULAR_EXAMS.map((exam) => (
            <div
              key={exam.id}
              onClick={() => onSelectExam(exam)}
              className="group relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
            >
              {/* Emblem Logo */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 group-hover:bg-blue-50/60 p-2 sm:p-2.5 transition-colors flex items-center justify-center mb-3 sm:mb-4">
                <img
                  src={exam.logo}
                  alt={exam.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/popular_exams/logo_wbpsc.png';
                  }}
                />
              </div>

              {/* Title */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-headline">
                {exam.name}
              </h3>

              {/* Specs subtitle */}
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400 font-medium">
                Mock Test, PYQ,<br className="hidden sm:inline" /> Topic Test
              </p>

              {/* Blue circular arrow button */}
              <div className="mt-3 sm:mt-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
