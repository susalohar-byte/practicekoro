import React from 'react';
import { Shield, BookOpen, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateMockTestForm } from './useCreateMockTestModal';

export const TestModeSelector: React.FC<{ form: CreateMockTestForm }> = ({ form }) => {
  const { testType, setTestType, applyTypeDefaults } = form;
  return (
    <div>
      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2.5">
        Test Mode *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Full Mock */}
        <button
          type="button"
          onClick={() => {
            setTestType('full_mock');
            applyTypeDefaults('full_mock');
          }}
          className={cn(
            'relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none',
            testType === 'full_mock'
              ? 'border-2 border-[#026BFC] bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/30 dark:via-[#0A1024] dark:to-[#0A1024] shadow-md shadow-blue-500/10 ring-2 ring-[#026BFC]/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1E] hover:border-blue-300 dark:hover:border-blue-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 hover:shadow-sm hover:-translate-y-0.5'
          )}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                testType === 'full_mock'
                  ? 'bg-gradient-to-br from-blue-500 to-[#026BFC] text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300/40 dark:ring-blue-500/40'
                  : 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60'
              )}
            >
              <Shield className="w-5 h-5" />
            </div>
            {testType === 'full_mock' ? (
              <span className="w-5 h-5 rounded-full bg-[#026BFC] text-white flex items-center justify-center shadow-xs ring-2 ring-blue-200 dark:ring-blue-900/60">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/50 transition-colors" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                Full Mock
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                Exam Pattern
              </span>
            </div>
            <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block mt-1.5 leading-snug">
              Complete real syllabus format
            </span>
          </div>
        </button>

        {/* 2. Topic Test */}
        <button
          type="button"
          onClick={() => {
            setTestType('topic');
            applyTypeDefaults('topic');
          }}
          className={cn(
            'relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none',
            testType === 'topic'
              ? 'border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-[#0A1024] dark:to-[#0A1024] shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1E] hover:border-emerald-300 dark:hover:border-emerald-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 hover:shadow-sm hover:-translate-y-0.5'
          )}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                testType === 'topic'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300/40 dark:ring-emerald-500/40'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60'
              )}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            {testType === 'topic' ? (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs ring-2 ring-emerald-200 dark:ring-emerald-900/60">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-emerald-400 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-950/50 transition-colors" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                Topic Test
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                Chapter
              </span>
            </div>
            <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block mt-1.5 leading-snug">
              Subject & chapter specific
            </span>
          </div>
        </button>

        {/* 3. Official PYQ */}
        <button
          type="button"
          onClick={() => {
            setTestType('pyq');
            applyTypeDefaults('pyq');
          }}
          className={cn(
            'relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none',
            testType === 'pyq'
              ? 'border-2 border-amber-500 bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/30 dark:via-[#0A1024] dark:to-[#0A1024] shadow-md shadow-amber-500/10 ring-2 ring-amber-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1E] hover:border-amber-300 dark:hover:border-amber-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 hover:shadow-sm hover:-translate-y-0.5'
          )}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                testType === 'pyq'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300/40 dark:ring-amber-500/40'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 group-hover:scale-105 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60'
              )}
            >
              <Clock className="w-5 h-5" />
            </div>
            {testType === 'pyq' ? (
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs ring-2 ring-amber-200 dark:ring-amber-900/60">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-amber-400 group-hover:bg-amber-50/50 dark:group-hover:bg-amber-950/50 transition-colors" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                Official PYQ
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                Past Papers
              </span>
            </div>
            <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block mt-1.5 leading-snug">
              Previous year solved exams
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
