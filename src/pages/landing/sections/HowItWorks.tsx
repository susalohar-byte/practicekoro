import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { MousePointerClick, PenLine, LineChart } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: MousePointerClick,
    title: 'Choose Your Exam',
    bengali: 'Target Selection',
    description: "Select the exam you're preparing for — WBP, SSC, Railway & more.",
    graphic: (
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { src: '/images/exams/emblem_wbp.svg', alt: 'WBP' },
          { src: '/images/exams/emblem_wbpsc.svg', alt: 'WBPSC' },
          { src: '/images/exams/emblem_railway.svg', alt: 'Railway' },
          { src: '/images/exams/emblem_tet.svg', alt: 'TET' },
        ].map((img) => (
          <span
            key={img.alt}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1.5"
          >
            <img src={img.src} alt={img.alt} loading="lazy" className="w-8 h-8 object-contain" />
          </span>
        ))}
      </div>
    ),
  },
  {
    number: '02',
    icon: PenLine,
    title: 'Practice & Test',
    bengali: 'Timed Practice',
    description: 'Take full mock tests, PYQs and topic quizzes with instant solutions.',
    graphic: (
      <div className="w-full space-y-2 text-left">
        <div className="h-2 bg-slate-200 rounded-full w-full" />
        {['Option A', 'Option B', 'Option C'].map((opt, i) => (
          <div
            key={opt}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
              i === 1
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                i === 1 ? 'border-white bg-white/20' : 'border-slate-300'
              }`}
            >
              {i === 1 && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            {opt}
            {i === 1 && <span className="ml-auto text-[9px] opacity-90">Selected</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '03',
    icon: LineChart,
    title: 'Check Your Results',
    bengali: 'Scorecard & Analytics',
    description: 'Get detailed analysis, fix mistakes in your notebook and improve.',
    graphic: (
      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="9"
              className="stroke-slate-200"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="url(#howScore)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - 0.78)}`}
            />
            <defs>
              <linearGradient id="howScore" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-900">
            78%
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 mt-1.5">Your Score</span>
      </div>
    ),
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="relative min-h-screen min-h-[100dvh] flex flex-col justify-center py-20 sm:py-24 bg-white dark:bg-slate-950 scroll-mt-24 overflow-hidden"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How PracticeKoro Works"
          title={
            <>
              From{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Preparation
              </span>{' '}
              to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Progress
              </span>
            </>
          }
          description="A simple way to practice, test and improve — all in one place."
        />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Connector line (desktop) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-16 left-[18%] right-[18%] border-t-2 border-dashed border-blue-200 dark:border-slate-800"
          />
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 120}>
              <div className="group relative h-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06)] hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center overflow-hidden">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <span className="absolute top-4 right-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none group-hover:text-blue-100 dark:group-hover:text-blue-900/40 transition-colors">
                  {step.number}
                </span>

                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-5 group-hover:scale-105 transition-transform">
                  <step.icon className="w-6 h-6" />
                </div>

                <div className="w-full min-h-[7.5rem] bg-blue-50/50 dark:bg-slate-800/60 rounded-2xl border border-blue-100/60 dark:border-slate-700/60 flex items-center justify-center p-4 mb-5">
                  {step.graphic}
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {step.bengali}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
