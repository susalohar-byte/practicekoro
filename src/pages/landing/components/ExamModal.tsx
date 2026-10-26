import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  CheckCircle2, 
  BookOpen, 
  FileCheck, 
  Clock, 
  ArrowRight
} from 'lucide-react';

export interface ExamData {
  id: string;
  name: string;
  bengaliName: string;
  logo: string;
  badge: string;
  description: string;
  pattern: {
    duration: string;
    questions: string;
    marks: string;
    negativeMarking: string;
  };
  subjects: string[];
  features: string[];
}

interface ExamModalProps {
  exam: ExamData | null;
  onClose: () => void;
}

export const ExamModal: React.FC<ExamModalProps> = ({ exam, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (exam) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exam, onClose]);

  if (!exam) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-modal-title"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-scaleUp"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white relative">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-md flex items-center justify-center flex-shrink-0">
              <img
                src={exam.logo}
                alt={exam.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/popular_exams/logo_wbpsc.png';
                }}
              />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-blue-100 backdrop-blur-sm mb-1">
                {exam.badge}
              </span>
              <h3 id="exam-modal-title" className="text-xl font-bold tracking-tight">
                {exam.name}
              </h3>
              <p className="text-xs text-blue-100/90 font-medium">
                {exam.bengaliName}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {exam.description}
          </p>

          {/* Exam Pattern Grid */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>পরীক্ষার প্যাটার্ন ও মান বণ্টন</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                <span className="block text-[11px] text-slate-400">সময়সীমা</span>
                <span className="text-xs font-bold text-slate-800">{exam.pattern.duration}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                <span className="block text-[11px] text-slate-400">মোট প্রশ্ন</span>
                <span className="text-xs font-bold text-slate-800">{exam.pattern.questions}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                <span className="block text-[11px] text-slate-400">পূর্ণমান</span>
                <span className="text-xs font-bold text-slate-800">{exam.pattern.marks}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                <span className="block text-[11px] text-slate-400">নেগেটিভ মার্কিং</span>
                <span className="text-xs font-bold text-rose-600">{exam.pattern.negativeMarking}</span>
              </div>
            </div>
          </div>

          {/* Key Subjects */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>সিলেবাস অনুযায়ী মূল বিষয়সমূহ</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {exam.subjects.map((sub, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Available in Practice Koro */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Practice Koro তে যা যা পাচ্ছেন</span>
            </h4>
            <ul className="space-y-2">
              {exam.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/login"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 order-2 sm:order-1"
          >
            <span>লগইন করে টেস্ট শুরু করুন</span>
          </Link>

          <Link
            to="/login"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all order-1 sm:order-2"
          >
            <span>Start Practicing Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
