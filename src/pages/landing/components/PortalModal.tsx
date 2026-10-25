import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentPanelUrl } from '@/lib/studentPanel';
import { 
  X, 
  ShieldCheck, 
  GraduationCap, 
  Download, 
  ArrowRight, 
  Sparkles, 
  Smartphone,
  Lock
} from 'lucide-react';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
        aria-labelledby="portal-modal-title"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-scaleUp"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-600 via-pk-primary to-sky-500 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="portal-modal-title" className="text-lg font-bold font-headline tracking-tight">
                প্ল্যাটফর্ম লগইন ও অ্যাক্সেস
              </h3>
              <p className="text-xs text-blue-100">Practice Koro এ স্বাগতম</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            আপনি কি প্রশাসক হিসেবে লগইন করতে চান, নাকি শিক্ষার্থী হিসেবে মক টেস্ট প্র্যাকটিস করতে চান?
          </p>

          {/* Option 1: Admin Panel */}
          <div className="group relative p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/40 transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 font-headline group-hover:text-blue-600 transition-colors">
                    অ্যাডমিন প্যানেল (Admin Console)
                  </h4>
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  মক টেস্ট তৈরি, প্রশ্নব্যাংক, শিক্ষার্থী বিশ্লেষণ ও রেজাল্ট পরিচালনার পূর্ণাঙ্গ ব্যাকএন্ড কনসোল।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all group-hover:shadow cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>অ্যাডমিন লগইন করুন</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Student Panel & Mobile App */}
          <div className="group relative p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 font-headline">
                    শিক্ষার্থী পোর্টাল (Student Access)
                  </h4>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  মক টেস্ট, লাইভ টেস্ট, বিষয়ভিত্তিক অনুশীলন ও বিস্তারিত সমাধান — ওয়েব পোর্টালে বা অ্যান্ড্রয়েড অ্যাপে। একই অ্যাকাউন্ট দুই জায়গাতেই চলবে।
                </p>
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <a
                    href={studentPanelUrl('login')}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>শিক্ষার্থী লগইন (Student Login)</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </a>
                  <a
                    href="/PracticeKoro.apk"
                    download="PracticeKoro.apk"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>অ্যান্ড্রয়েড অ্যাপ ডাউনলোড (APK)</span>
                  </a>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-500" />
                    v2.0 • 70 MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>সাহায্য প্রয়োজন? support@practicekoro.online</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
