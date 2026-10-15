import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import {
  FileText,
  BookOpen,
  Flame,
  Target,
  RotateCcw,
  BarChart3,
  Bookmark,
  Sparkles,
  Check,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

interface AppFeatureItem {
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  title: string;
  titleBengali: string;
  description: string;
  bullets: string[];
}

const APP_FEATURES: AppFeatureItem[] = [
  {
    icon: FileText,
    badge: 'আসল পরীক্ষার ধাঁচে',
    badgeColor:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
    iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Full-Length Mock Tests',
    titleBengali: 'পূর্ণাঙ্গ মক টেস্ট',
    description:
      'WBP, KP, WBCS, WBPSC, Railway ও TET-এর আসল পরীক্ষার প্যাটার্ন, নেগেটিভ মার্কিং ও ওএমআর ফরম্যাট।',
    bullets: [
      'কাউন্টডাউন টাইমার ও নেগেটিভ মার্কিং',
      'ইনস্ট্যান্ট রেজাল্ট ও পার্সেন্টাইল',
      'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা',
    ],
  },
  {
    icon: BookOpen,
    badge: 'বিগত বছরের প্রশ্ন',
    badgeColor:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: '10+ Years Solved PYQs',
    titleBengali: 'বিগত ১০ বছরের সমাধান',
    description:
      'পশ্চিমবঙ্গ ও কেন্দ্রীয় সরকারি চাকরির বিগত ১০ বছরের প্রশ্নপত্র শর্টকাট কৌশল ও স্টেপ-বাই-স্টেপ সমাধান সহ।',
    bullets: [
      'চ্যাপ্টার ও বছরভিত্তিক প্রশ্ন সেট',
      'শর্টকাট ট্রিকস ও মেমোরি এইডস',
      'পরীক্ষার ট্রেন্ড ও ওয়েটেজ বিশ্লেষণ',
    ],
  },
  {
    icon: Flame,
    badge: 'প্রতিদিনের কুইজ',
    badgeColor:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'Daily 10 Quizzes',
    titleBengali: 'ডেইলি ১০ চ্যালেঞ্জ',
    description:
      'প্রতিদিন সকালে বাছাই করা ১০টি তাজা প্রশ্ন। মাত্র ৫ মিনিটে পড়ার নিয়মিত অভ্যাস ও স্ট্রিক ধরে রাখুন।',
    bullets: [
      'প্রতিদিন ১০টি নতুন গুরুত্বপূর্ণ প্রশ্ন',
      'ডেইলি স্ট্রিক (Streak) ট্র্যাকিং',
      'কারেন্ট অ্যাফেয়ার্স ও হাই-ইল্ড জিকে',
    ],
  },
  {
    icon: Target,
    badge: 'অধ্যায়ভিত্তিক প্র্যাকটিস',
    badgeColor:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800',
    iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    iconColor: 'text-purple-600 dark:text-purple-400',
    title: 'Topic-Wise Practice',
    titleBengali: 'বিষয় ও অধ্যায় ড্রিল',
    description:
      'অঙ্ক, রিজনিং, সাধারণ জ্ঞান, ইংরেজি ও বাংলা— প্রতিটি বিষয়ের দুর্বল অধ্যায় আলাদা করে প্র্যাকটিস করুন।',
    bullets: [
      'Easy, Medium, Hard লেভেল ফিল্টার',
      'সীমাহীন রি-অ্যাটেম্পট সুবিধা',
      'বেসিক টু অ্যাডভান্সড প্রশ্ন ব্যাংক',
    ],
  },
  {
    icon: RotateCcw,
    badge: 'স্মার্ট রিভিশন',
    badgeColor:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800',
    iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400',
    title: 'Mistakes Notebook',
    titleBengali: 'স্মার্ট ভুল খাতা',
    description:
      'টেস্টে ভুল হওয়া ও স্কিপ করা প্রশ্নগুলো নিজে থেকেই একটি খাতায় জমা হয়ে যায়। ফলে ভুল শুধরে নেওয়া সহজ।',
    bullets: [
      'ভুল হওয়া প্রশ্ন অটো-সেভ হয়',
      'শুধুমাত্র ভুল প্রশ্নের স্পেশাল টেস্ট',
      'পরীক্ষায় একই ভুল আর হবে না',
    ],
  },
  {
    icon: BarChart3,
    badge: 'লাইভ লিডারবোর্ড',
    badgeColor:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    title: 'Statewide Rank & Analytics',
    titleBengali: 'রাজ্যভিত্তিক র‍্যাংক ও বিশ্লেষণ',
    description:
      'পশ্চিমবঙ্গ জুড়ে হাজার হাজার পরীক্ষার্থীর মধ্যে আপনার লাইভ র‍্যাংক, পার্সেন্টাইল ও নিখুঁত নির্ভুলতার গ্রাফ।',
    bullets: [
      'রিয়েল-টাইম রাজ্যভিত্তিক র‍্যাংক',
      'অ্যাকুরেসি ও সময় ব্যবস্থাপনার গ্রাফ',
      'দুর্বল বিষয় চিহ্নিতকরণ অ্যানালিটিক্স',
    ],
  },
  {
    icon: Bookmark,
    badge: 'কুইক রিভিশন',
    badgeColor:
      'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    title: 'Saved Questions & Notes',
    titleBengali: 'বুকমার্ক ও শর্ট নোটস',
    description:
      'কঠিন অঙ্ক, প্রয়োজনীয় সূত্রের নোটস এক ক্লিকে বুকমার্ক করে রাখুন। পরীক্ষার আগের রাতে দ্রুত রিভিশন দিন।',
    bullets: [
      '১-ক্লিকে যেকোনো প্রশ্ন সেভ করুন',
      'বিষয় ও পরীক্ষা অনুযায়ী সাজানো খাতা',
      'যেকোনো সময় মোবাইল থেকে রিভিশন',
    ],
  },
  {
    icon: Sparkles,
    badge: 'বিস্তারিত ব্যাখ্যা ও সমাধান',
    badgeColor:
      'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80 dark:border-teal-800',
    iconBg: 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400',
    iconColor: 'text-teal-600 dark:text-teal-400',
    title: 'Detailed Explanations',
    titleBengali: 'স্টেপ-বাই-স্টেপ সমাধান',
    description:
      'প্রতিটি প্রশ্নের পেছনে সঠিক উত্তরের লজিক, শর্টকাট ট্রিকস ও রেফারেন্স নোটস সহ বিস্তারিত ব্যাখ্যা।',
    bullets: [
      'স্টেপ-বাই-স্টেপ অঙ্কের সমাধান',
      'শর্টকাট ট্রিকস ও মুখস্থ কৌশল',
      'পরীক্ষার অফিসিয়াল অ্যানসার কি অনুযায়ী',
    ],
  },
];

export const InsideTheApp: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const primaryDestination = user && isAdmin ? '/admin' : '/questions';

  return (
    <section
      id="inside-app"
      className="relative py-14 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 scroll-mt-24 overflow-hidden border-t border-slate-100 dark:border-slate-800/80"
    >
      {/* Anchor for backward compatibility with #how-it-works and #features */}
      <span id="how-it-works" className="absolute -top-24 pointer-events-none" aria-hidden="true" />
      <span id="features" className="absolute -top-24 pointer-events-none" aria-hidden="true" />

      {/* Subtle ambient lighting */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 -right-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/4 -left-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <SectionHeading
          eyebrow="Inside PracticeKoro • অ্যাপে কী কী রয়েছে"
          title={
            <>
              Everything You Need in{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                One Single App
              </span>
            </>
          }
          description="সরকারি চাকরির সেরা প্রস্তুতির জন্য যা কিছু প্রয়োজন — টেস্ট সিরিজ, বিগত ১০ বছরের প্রশ্ন, স্মার্ট ভুল খাতা থেকে লাইভ র‍্যাংক, সবই আপনার হাতের মুঠোয়।"
        />

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-8 sm:mt-10">
          {APP_FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 50} className="h-full">
                <div className="h-full rounded-2xl bg-slate-50/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5.5 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-700/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3.5">
                    {/* Card Top: Icon & Category Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${item.iconBg}`}
                      >
                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    </div>

                    {/* Titles */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.titleBengali}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Bullet Points */}
                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
                    {item.bullets.map((b) => (
                      <div
                        key={b}
                        className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span className="truncate">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom Interactive CTA Bar */}
        <Reveal delay={200}>
          <div className="mt-10 sm:mt-12 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-5 sm:p-8 border border-blue-800/40 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-400">
                <Smartphone className="w-4 h-4" />
                <span>Mobile &amp; Web Optimized</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white">
                এখনই অ্যাপের সমস্ত ফিচারের অভিজ্ঞতা নিন
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-normal">
                ফ্রি অ্যাকাউন্ট তৈরি করে আজই শুরু করুন আপনার লক্ষ্য পূরণের পূর্ণাঙ্গ প্রস্তুতি।
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(primaryDestination)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            >
              <span>{user && isAdmin ? 'Admin Dashboard' : 'Browse Questions'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
