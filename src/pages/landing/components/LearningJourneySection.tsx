import React, { useState } from 'react';
import { 
  Bookmark, 
  Check, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  Target, 
  FolderCheck, 
  Lightbulb,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const LearningJourneySection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1); // 1 = Practice Question, 2 = Solution, 3 = Analytics, 0 = Topic Selection
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D'>('C');
  const [isBookmarked, setIsBookmarked] = useState(true);

  const steps = [
    {
      id: 0,
      number: '01',
      title: 'Choose a Topic',
      bengali: 'বিষয় ও অধ্যায় নির্বাচন',
      desc: 'আপনার লক্ষ্য অনুযায়ী সিলেবাসের নির্দিষ্ট টপিক সিলেক্ট করুন',
    },
    {
      id: 1,
      number: '02',
      title: 'Practice Questions',
      bengali: 'টাইমার সহ প্রশ্ন অনুশীলন',
      desc: 'আসল পরীক্ষার অনুকরণে নেগেটিভ মার্কিং সহ টেস্ট দিন',
    },
    {
      id: 2,
      number: '03',
      title: 'Review Solutions',
      bengali: 'বিস্তারিত সমাধান পর্যবেক্ষণ',
      desc: 'প্রতিটি প্রশ্নের নিখুঁত শর্টনোটস ও ব্যাখ্যা দেখে ভুল শুধরে নিন',
    },
    {
      id: 3,
      number: '04',
      title: 'Track Progress',
      bengali: 'অগ্রগতি ও দুর্বলতা বিশ্লেষণ',
      desc: 'স্মার্ট গ্রাফ ও পার্সেন্টাইল দেখে পরবর্তী লক্ষ্য ঠিক করুন',
    },
  ];

  return (
    <section id="how-it-works" className="py-14 sm:py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-headline tracking-tight">
              Learning Journey & App Showcase
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium font-headline">
            সহজ ৪টি ধাপে আপনার সরকারি চাকরির প্রস্তুতিকে নিয়ে যান সর্বোচ্চ পর্যায়ে।
          </p>
        </div>

        {/* 4 Step Clickable Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-8 sm:mb-12">
          {steps.map((st) => {
            const isActive = activeStep === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStep(st.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Step {st.number}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`}
                  />
                </div>
                <h4 className="text-xs sm:text-sm font-bold font-headline">{st.title}</h4>
                <p
                  className={`text-[11px] font-medium mt-1 line-clamp-1 ${
                    isActive ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {st.bengali}
                </p>
              </button>
            );
          })}
        </div>

        {/* Big Rounded Soft-Blue Container matching reference image */}
        <div className="relative bg-gradient-to-b from-[#D4ECFC]/50 via-[#E8F4FD]/70 to-[#D9EDFC]/50 rounded-3xl sm:rounded-[40px] p-4 sm:p-8 md:p-12 border border-blue-100 shadow-lg shadow-blue-500/5 overflow-hidden">
          {/* Subtle Grid Doodles & Sparkles */}
          <div className="absolute top-6 left-8 text-blue-400/40 text-2xl select-none pointer-events-none">✦</div>
          <div className="absolute bottom-8 right-12 text-blue-400/40 text-2xl select-none pointer-events-none">✦</div>

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-6">
            
            {/* LEFT FLOATING BADGES (Desktop) */}
            <div className="w-full lg:w-1/4 flex flex-col gap-3.5 sm:gap-4 items-center lg:items-end order-2 lg:order-1">
              {/* Badge 1: Topic-wise Practice */}
              <div
                onClick={() => setActiveStep(0)}
                className={`w-full max-w-[220px] bg-white rounded-2xl p-3 shadow-md border flex items-center gap-3 transition-all cursor-pointer ${
                  activeStep === 0
                    ? 'border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/20'
                    : 'border-slate-100 hover:border-blue-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800 font-headline leading-tight">
                    Topic-wise Practice
                  </span>
                  <span className="text-[10px] text-slate-400">বিষয়ভিত্তিক টেস্ট</span>
                </div>
              </div>

              {/* Badge 2: Full Mock Tests */}
              <div
                onClick={() => setActiveStep(1)}
                className={`w-full max-w-[220px] bg-white rounded-2xl p-3 shadow-md border flex items-center gap-3 transition-all cursor-pointer ${
                  activeStep === 1
                    ? 'border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/20'
                    : 'border-slate-100 hover:border-rose-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800 font-headline leading-tight">
                    Full Mock Tests
                  </span>
                  <span className="text-[10px] text-slate-400">বাস্তব পরীক্ষার অনুকরণে</span>
                </div>
              </div>

              {/* Badge 3: Previous Year Questions */}
              <div
                onClick={() => setActiveStep(1)}
                className="w-full max-w-[220px] bg-white rounded-2xl p-3 shadow-md border border-slate-100 hover:border-amber-300 flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FolderCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800 font-headline leading-tight">
                    Previous Year Questions
                  </span>
                  <span className="text-[10px] text-slate-400">১০+ বছরের প্রশ্নপত্র</span>
                </div>
              </div>

              {/* Cute smiling mascot in bottom left looking up */}
              <div className="hidden lg:flex flex-col items-center mt-2">
                <img
                  src="/images/mascot_showcase_hd.png"
                  alt="Practice Koro Mascot"
                  className="w-24 h-auto drop-shadow-md hover:scale-105 transition-transform"
                />
              </div>
            </div>

            {/* CENTER: DUAL SMARTPHONE TEST & SOLUTION INTERFACES */}
            <div className="w-full lg:w-2/4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 order-1 lg:order-2">
              
              {/* PHONE 1: MOCK TEST QUESTION SCREEN */}
              <div className="w-full max-w-[270px] sm:max-w-[280px] bg-white rounded-[36px] shadow-2xl border-[6px] border-slate-900 overflow-hidden flex flex-col transition-transform hover:scale-[1.01]">
                {/* Phone Notch & Status Bar */}
                <div className="bg-slate-900 text-white pt-2 pb-1.5 px-5 flex items-center justify-between text-[10px]">
                  <span className="font-semibold">9:41</span>
                  <div className="w-14 h-3.5 bg-black rounded-full" />
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-3.5 h-2 border border-white/60 rounded-xs relative">
                      <div className="w-2 h-full bg-white" />
                    </div>
                  </div>
                </div>

                {/* App Test Top Bar */}
                <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
                  <span className="text-xs font-bold font-headline">Mock Test</span>
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium">
                    <Clock className="w-3 h-3" />
                    <span>00:28:17</span>
                  </div>
                </div>

                {/* Question Area */}
                <div className="p-3.5 flex-1 flex flex-col">
                  {/* Question Counter Pill */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Question 13 of 90
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">+1.0 / -0.25</span>
                  </div>

                  {/* Bengali Question */}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-headline mb-3 leading-snug">
                    ভারতের প্রথম গভর্নর জেনারেল কে ছিলেন?
                  </h4>

                  {/* Options List */}
                  <div className="space-y-1.5 flex-1">
                    {[
                      { key: 'A', label: 'লর্ড কর্নওয়ালিস' },
                      { key: 'B', label: 'লর্ড ওয়েলেসলি' },
                      { key: 'C', label: 'লর্ড ডালহৌসি', correct: true },
                      { key: 'D', label: 'লর্ড ক্যানিং' },
                    ].map((opt) => {
                      const isSelected = selectedOption === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setSelectedOption(opt.key as any)}
                          className={`w-full p-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="font-headline">{opt.label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Navigation on Phone */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'bg-blue-50 border-blue-300 text-blue-600'
                          : 'border-slate-200 text-slate-400'
                      }`}
                      aria-label="Bookmark Question"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <button
                        type="button"
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHONE 2: DETAILED SOLUTION SCREEN */}
              <div className="w-full max-w-[270px] sm:max-w-[280px] bg-white rounded-[36px] shadow-2xl border-[6px] border-slate-900 overflow-hidden flex flex-col transition-transform hover:scale-[1.01] hidden sm:flex">
                {/* Phone Notch & Status Bar */}
                <div className="bg-slate-900 text-white pt-2 pb-1.5 px-5 flex items-center justify-between text-[10px]">
                  <span className="font-semibold">9:41</span>
                  <div className="w-14 h-3.5 bg-black rounded-full" />
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-3.5 h-2 border border-white/60 rounded-xs relative">
                      <div className="w-2 h-full bg-white" />
                    </div>
                  </div>
                </div>

                {/* Solution Top Bar */}
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-headline">Detailed Solution</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    100% Correct
                  </span>
                </div>

                {/* Solution Body */}
                <div className="p-3.5 flex-1 flex flex-col text-slate-700 overflow-hidden text-left">
                  {/* Correct Answer Header Banner */}
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 mb-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 font-headline">
                      সঠিক উত্তর: লর্ড ডালহৌসি
                    </span>
                  </div>

                  {/* Bulleted Short Notes in Bengali */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex-1 space-y-2 text-[11px] leading-relaxed">
                    <span className="block font-bold text-slate-800 text-xs font-headline border-b border-slate-200/60 pb-1">
                      সংক্ষিপ্ত আলোচনা ও গুরুত্বপূর্ণ তথ্য:
                    </span>
                    <ul className="space-y-1.5 text-slate-600 font-medium">
                      <li className="flex items-start gap-1">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>লর্ড ডালহৌসি (১৮৪৮–১৮৫৬) ব্রিটিশ ভারতের গভর্নর জেনারেল ছিলেন।</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>তিনি কুখ্যাত স্বত্ববিলোপ নীতি (Doctrine of Lapse) প্রবর্তন করেন।</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>১৮৫৩ সালে ভারতে প্রথম রেললাইন (বোম্বে থেকে থানে) চালু করেন।</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>ভারতে আধুনিক পোস্ট ও টেলিগ্রাফ ব্যবস্থার প্রতিষ্ঠাতা তিনি।</span>
                      </li>
                    </ul>
                  </div>

                  {/* Mastery Pill */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Accuracy Rate: 84%</span>
                    <span className="text-blue-600 font-bold font-headline">Review Done ✓</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT FLOATING BADGES (Desktop) */}
            <div className="w-full lg:w-1/4 flex flex-col gap-3.5 sm:gap-4 items-center lg:items-start order-3">
              {/* Badge 4: Detailed Solutions */}
              <div
                onClick={() => setActiveStep(2)}
                className={`w-full max-w-[220px] bg-white rounded-2xl p-3 shadow-md border flex items-center gap-3 transition-all cursor-pointer ${
                  activeStep === 2
                    ? 'border-violet-500 shadow-violet-500/20 ring-2 ring-violet-500/20'
                    : 'border-slate-100 hover:border-violet-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800 font-headline leading-tight">
                    Detailed Solutions
                  </span>
                  <span className="text-[10px] text-slate-400">প্রতিটি প্রশ্নের ব্যাখ্যা</span>
                </div>
              </div>

              {/* Badge 5: Track Your Progress */}
              <div
                onClick={() => setActiveStep(3)}
                className={`w-full max-w-[220px] bg-white rounded-2xl p-3 shadow-md border flex items-center gap-3 transition-all cursor-pointer ${
                  activeStep === 3
                    ? 'border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/20'
                    : 'border-slate-100 hover:border-emerald-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800 font-headline leading-tight">
                    Track Your Progress
                  </span>
                  <span className="text-[10px] text-slate-400">র‍্যাঙ্ক ও দুর্বলতা ট্র্যাকিং</span>
                </div>
              </div>

              {/* Playful Doodles on right */}
              <div className="hidden lg:flex flex-col gap-2 mt-4 text-blue-500/80">
                <div className="flex items-center gap-1.5 text-xs font-bold font-headline bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-blue-200/50 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Interactive Real Mock Test</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
