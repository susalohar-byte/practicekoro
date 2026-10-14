import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { useLanguage } from '@/context/LanguageContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { Button } from '@/components/common/Button';
import {
  Languages,
  Target,
  Shield,
  LogOut,
  Info,
  Check,
  User,
  AlertCircle,
  HelpCircle,
  Settings as SettingsIcon,
} from 'lucide-react';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { PageHeader, studentCard } from '@/components/student/StudentUI';
import { cn } from '@/lib/utils';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { exams, selectedExam, setSelectedExam } = useExam();
  const navigate = useNavigate();

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Language preference: state for UI and question content.
  const { lang: language, setLang: handleLanguageChange } = useLanguage();
  const { isBilingualEnabled } = useContentLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Settings & Preferences"
          eyebrow="Account & App Configuration"
          subtitle="Manage your language, target exam, and account preferences"
          icon={SettingsIcon}
          onBack={() => navigate('/profile')}
        />

        {/* B1. Language Preferences */}
        <div className={cn(studentCard, 'p-5 sm:p-6')}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#026BFC] dark:text-blue-400 border border-blue-100 dark:border-blue-900 shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Question Language Preference
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose your default language for mock tests, questions, and explanations
              </p>
            </div>
          </div>

          {isBilingualEnabled ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleLanguageChange('bn')}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  language === 'bn'
                    ? 'border-[#026BFC] bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">বাংলা (Bengali)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Questions and explanations in Bengali by default
                  </p>
                </div>
                {language === 'bn' && (
                  <div className="w-6 h-6 rounded-full bg-[#026BFC] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  language === 'en'
                    ? 'border-[#026BFC] bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">English</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Questions and explanations in English by default
                  </p>
                </div>
                {language === 'en' && (
                  <div className="w-6 h-6 rounded-full bg-[#026BFC] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">বাংলা (Bengali Only)</p>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#026BFC] text-white">
                    সক্রিয়
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  মক টেস্ট এবং প্রশ্নাবলী সম্পূর্ণ বাংলা ভাষায় প্রস্তুত করা হয়েছে।
                </p>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#026BFC] text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
          )}
        </div>

        {/* B2. Target Exam Preference */}
        <div className={cn(studentCard, 'p-5 sm:p-6')}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Target Exam Preference
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Switching your target exam tailors Home, subject mock tests, and practice questions
                </p>
              </div>
            </div>
            {selectedExam && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#026BFC] dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/60">
                <span>🎯</span>
                <span>{selectedExam.title}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {exams.map((exam) => {
              const isSelected = selectedExam?.id === exam.id;
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => setSelectedExam(exam)}
                  className={`p-3.5 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#026BFC] bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{exam.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{exam.category}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#026BFC] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* B3. Security & Session */}
        <div className={cn(studentCard, 'p-5 sm:p-6')}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Security & Active Session
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your active student authentication session
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.fullName || 'Student'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
              className="text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Help & Support Desk */}
        <div className={cn(studentCard, 'p-5 sm:p-6 bg-gradient-to-br from-blue-50/40 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-200/60 dark:border-blue-900/40')}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#026BFC] dark:text-blue-400 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Helpdesk & Support
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Experiencing technical bugs, question discrepancies, or payment issues? Submit a
                  support ticket directly to our administration.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                to="/support"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <span>Help Center</span>
              </Link>
              <Button
                onClick={() => setIsSupportModalOpen(true)}
                className="bg-[#026BFC] hover:bg-[#0256ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Raise Support Ticket</span>
              </Button>
            </div>
          </div>
        </div>

        {/* B4. Account Actions */}
        <div className={cn(studentCard, 'p-5 sm:p-6')}>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Account Management</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Account deletion requires a dedicated secure backend workflow. To request permanent
                deletion of your account and personal data, please contact PracticeKoro support at{' '}
                <span className="font-semibold text-slate-900 dark:text-white">support@practicekoro.com</span>.
              </p>
            </div>
          </div>
        </div>

        {/* B5. About PracticeKoro */}
        <div className={cn(studentCard, 'p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                PracticeKoro Platform Version 2.0.0
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Focused Mock Test & Competitive Exam Preparation
              </p>
            </div>
          </div>
        </div>

        {/* Student Support Ticket Modal */}
        <StudentSupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      </div>
    </div>
  );
};
