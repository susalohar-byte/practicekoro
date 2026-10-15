import React from 'react';
import { Reveal } from './Reveal';
import { Crown, ArrowRight, BarChart3, Target, FileText, Zap, ShieldCheck } from 'lucide-react';

export const Pricing: React.FC = () => {
  return (
    <section
      id="pro-pass"
      className="relative py-14 sm:py-20 lg:py-24 bg-[#F8FAFC] dark:bg-slate-950 scroll-mt-24 overflow-hidden"
    >
      {/* Anchor for backward compatibility with #pricing */}
      <span id="pricing" className="absolute -top-24 pointer-events-none" aria-hidden="true" />

      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -right-20 w-[28rem] h-[28rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
            {/* 1. Centered Eyebrow Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800 text-[#0062FF] dark:text-blue-400 text-xs font-black tracking-wider uppercase shadow-2xs">
              <Crown className="w-3.5 h-3.5 fill-[#0062FF] dark:fill-blue-400 text-[#0062FF] dark:text-blue-400" />
              <span>PRO PASS</span>
            </div>

            {/* 2. Main Title & Description */}
            <div className="space-y-2.5 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                One Pass.{' '}
                <span className="text-[#0062FF] dark:text-blue-400">All Premium Tests.</span>
              </h2>
              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                A single All-Access pass for every exam — WBP, KP, WBCS, WBPSC, Railway &amp; more.
              </p>
            </div>

            {/* 3. 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-4xl mx-auto pt-1">
              {/* Feature 1: Unlimited mock tests */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-3.5 sm:gap-4 transition-transform hover:-translate-y-0.5 text-left">
                <div className="w-13 h-13 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-[#0062FF] dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Unlimited mock tests
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Practice without limits
                  </p>
                </div>
              </div>

              {/* Feature 2: Detailed analytics & rank */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-3.5 sm:gap-4 transition-transform hover:-translate-y-0.5 text-left">
                <div className="w-13 h-13 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Detailed analytics &amp; rank
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Track your progress
                  </p>
                </div>
              </div>

              {/* Feature 3: Topic-wise & PYQ tests */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-3.5 sm:gap-4 transition-transform hover:-translate-y-0.5 text-left">
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Topic-wise &amp; PYQ tests
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Focus on weak areas
                  </p>
                </div>
              </div>

              {/* Feature 4: Priority support */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-3.5 sm:gap-4 transition-transform hover:-translate-y-0.5 text-left">
                <div className="w-13 h-13 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Priority support
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Get help whenever you need
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Blue Pricing Banner Card */}
            <div className="w-full max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#004BD8] via-[#0055EE] to-[#0062FF] p-5 sm:p-8 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
              {/* Left Column: Price & Tag */}
              <div className="space-y-1.5 text-center md:text-left z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-100">
                  <Crown className="w-3.5 h-3.5 fill-blue-200 text-blue-200" />
                  <span>ALL-ACCESS PRO PASS</span>
                </div>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-4xl sm:text-6xl font-black tracking-tight text-white font-sans">
                    ₹199
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-blue-100">
                    / 365 days
                  </span>
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-400/25 border border-emerald-300/30 text-emerald-300 text-xs font-black inline-block mt-0.5">
                    ₹0.54/day
                  </span>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden md:block w-px h-20 bg-blue-300/20 z-10" />

              {/* Right Column: CTA Button & Guarantee */}
              <div className="flex flex-col items-center md:items-end gap-2.5 w-full md:w-auto z-10">
                <button
                  type="button"
                  onClick={() => document.getElementById('app-install')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto min-w-0 sm:min-w-[240px] inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-[#0062FF] font-black text-sm sm:text-base shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>Get the App</span>
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-100 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>One payment • Full year • All exams</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export const ProPass = Pricing;
