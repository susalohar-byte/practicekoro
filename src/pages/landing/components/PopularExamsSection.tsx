import React from 'react';
import { motion } from 'motion/react';
import { RevealGroup, popIn, hoverLift } from './Reveal';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
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
    subjects: [
      'সাধারণ জ্ঞান ও সচেতনতা',
      'প্রাথমিক গণিত',
      'ইংরেজি',
      'রিজনিং ও লজিক্যাল অ্যানালিসিস',
    ],
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
    logo: '/images/popular_exams/emblem_wbssc.png',
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
    subjects: [
      'জেনারেল সাইন্স (Physics, Chem, Bio)',
      'গণিত',
      'জেনারেল ইন্টেলিজেন্স',
      'সাধারণ সচেতনতা',
    ],
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
    subjects: [
      'জেনারেল ইন্টেলিজেন্স ও রিজনিং',
      'সাধারণ জ্ঞান ও জেনারেল অ্যাওয়ারনেস',
      'প্রাথমিক গণিত',
      'বাংলা / ইংরেজি ব্যাকরণ',
    ],
    features: [
      'নতুন বাংলা ভাষার ইন্টারফেসে পরীক্ষা প্রস্তুতি',
      'দ্রুত গণিত ও রিজনিং শর্টকাট ট্রিক্স',
      'দৈনিক কারেন্ট অ্যাফেয়ার্স আপডেট',
      'অধ্যায়ভিত্তিক দুর্বলতা নির্ণয়',
    ],
  },
];

// Line breaks used on the cards
const CARD_TITLES: Record<string, string> = {
  'wbp-constable': 'WBP\nConstable',
  'wbssc-group-cd': 'WBSSC\nGroup C & D',
  clerkship: 'WBPSC\nClerkship',
  railway: 'Railway\nExams',
  ssc: 'SSC\nExams',
};

export const PopularExamsSection: React.FC<PopularExamsSectionProps> = ({ onSelectExam }) => {
  return (
    <section id="exams" className="scroll-mt-20 pt-6 sm:pt-8 pb-8 sm:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          icon={GraduationCap}
          tone="blue"
          title="Popular Exams"
          subtitle="West Bengal-এর গুরুত্বপূর্ণ সরকারি পরীক্ষার জন্য প্রস্তুতি নিন।"
        />

        <RevealGroup className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {POPULAR_EXAMS.map((exam) => (
            <motion.button
              variants={popIn}
              {...hoverLift}
              key={exam.id}
              type="button"
              onClick={() => onSelectExam(exam)}
              className="group relative bg-white rounded-2xl border border-[#EDF0F8] shadow-[0_6px_24px_rgba(30,50,120,0.07)] hover:shadow-[0_14px_34px_rgba(30,80,240,0.16)] transition-shadow px-3 pt-5 pb-10 sm:pt-6 sm:pb-12 flex flex-col items-center text-center cursor-pointer"
            >
              <img
                src={exam.logo}
                alt={exam.name}
                className="w-14 h-14 sm:w-[76px] sm:h-[76px] object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.fallbackLevel) {
                    target.dataset.fallbackLevel = '1';
                    target.src = target.src.replace('/popular_exams/', '/images/exams/');
                  } else if (target.dataset.fallbackLevel === '1') {
                    target.dataset.fallbackLevel = '2';
                    target.src = target.src.replace('/images/exams/', '/exams/');
                  }
                }}
              />
              <h3 className="mt-3 text-[15px] sm:text-[17px] font-bold text-[#0B1B4F] leading-snug whitespace-pre-line">
                {CARD_TITLES[exam.id] ?? exam.name}
              </h3>
              <span className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-[#EAF1FF] text-[#1A5CFF] flex items-center justify-center group-hover:bg-[#1A5CFF] group-hover:text-white group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </motion.button>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};
