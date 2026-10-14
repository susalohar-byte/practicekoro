import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { StudentLoading, StudentLoadError } from '@/components/student/StudentLoadState';
import { PageHeader, studentCard } from '@/components/student/StudentUI';
import { getErrorMessage } from '@/lib/errors';
import { api } from '@/services/api';
import { CheckCircle2, AlertTriangle, Play, Lock, FileCheck2, Crown, HelpCircle } from 'lucide-react';
import type { MockTest } from '@/types';

export const TestDetails: React.FC = () => {
  const { id, testId: routeTestId } = useParams<{ id?: string; testId?: string }>();
  const testId = routeTestId ?? id;
  const { user } = useAuth();
  const { hasAccessToTest } = useSubscription();
  const navigate = useNavigate();

  const [test, setTest] = useState<MockTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryLoad, setRetryLoad] = useState(0);
  const startLock = useRef(false);
  const [startError, setStartError] = useState('');
  const [starting, setStarting] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadTest() {
      if (!testId) {
        setLoading(false);
        setTest(null);
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        const data = await api.getTestById(testId);
        if (active) setTest(data);
      } catch (err) {
        if (active)
          setLoadError(getErrorMessage(err, 'Unable to load test details. Please retry.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTest();
    return () => {
      active = false;
    };
  }, [testId, retryLoad]);

  if (loading) return <StudentLoading label="Loading test details" />;
  if (loadError)
    return <StudentLoadError message={loadError} onRetry={() => setRetryLoad((v) => v + 1)} />;

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans flex items-center justify-center p-4">
        <div className={`max-w-md w-full text-center space-y-4 p-8 ${studentCard}`}>
          <HelpCircle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-black text-[#0B1B3F] dark:text-white">Mock Test Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The requested test may have been moved or removed.
          </p>
          <div className="pt-2">
            <Link
              to="/test-series"
              className="px-5 py-2.5 bg-[#026BFC] hover:bg-[#0056D2] text-white rounded-xl text-xs font-bold transition-colors inline-block"
            >
              Back to Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const marksPerQuestion = (test.totalMarks / (test.totalQuestions || 1)).toFixed(2);
  const isAccessible = hasAccessToTest(test.isPremium);

  const handleStartTest = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/exams/${test.id}` } } });
      return;
    }

    if (!isAccessible) {
      setShowSubModal(true);
      return;
    }

    if (startLock.current) return;
    startLock.current = true;
    setStartError('');
    setStarting(true);
    try {
      const attemptInfo = await api.startTestAttempt(test.id);
      navigate(`/exams/${test.id}/runner?attemptId=${attemptInfo.attemptId}`);
    } catch (err) {
      console.error('Failed to start attempt:', err);
      setStartError(getErrorMessage(err, 'Failed to initialize test attempt. Please try again.'));
    } finally {
      setStarting(false);
      startLock.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans transition-colors">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {startError && (
          <p
            role="alert"
            className="p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-200 dark:border-red-900"
          >
            {startError}
          </p>
        )}

        <PageHeader
          eyebrow="Test Instructions"
          title={test.title}
          subtitle={test.description || 'Comprehensive exam simulation with live countdown timer and negative marking.'}
          icon={FileCheck2}
          onBack={() => navigate(-1)}
          actions={
            <div className="flex items-center gap-2">
              {test.isPremium ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  PRO PASS TEST
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  FREE MOCK TEST
                </span>
              )}
            </div>
          }
        />

        {/* Main Header Card */}
        <div className={`${studentCard} p-6 sm:p-7 space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                {test.testType === 'full_mock' && (
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    🎯 Full Mock
                  </span>
                )}
                {test.testType === 'pyq' && (
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    📜 PYQ Paper {test.year ? `• ${test.year}` : ''}
                  </span>
                )}
                {(test.testType === 'topic' ||
                  test.testType === 'chapter_mock' ||
                  test.testType === 'subject_mock') && (
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    ⚡ Topic Drill
                  </span>
                )}
                {test.testSeriesTitle && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Series: {test.testSeriesTitle}
                  </span>
                )}
                {test.examTitle && (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {test.examTitle}
                  </span>
                )}
                {test.subjectName && (
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {test.subjectName}
                  </span>
                )}
                {test.chapterName && (
                  <span className="text-xs text-slate-500 font-medium">{test.chapterName}</span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3F] dark:text-white tracking-tight">
                {test.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {test.description ||
                  'Comprehensive exam simulation with live countdown timer and negative marking.'}
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <button
                type="button"
                disabled={starting}
                onClick={handleStartTest}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isAccessible
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                    : 'bg-[#026BFC] hover:bg-[#0056D2] text-white shadow-blue-500/20'
                }`}
              >
                {!isAccessible ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Unlock Pro Pass</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{starting ? 'Starting...' : 'Start Test Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Questions</p>
              <p className="text-lg font-black text-[#0B1B3F] dark:text-white mt-0.5">{test.totalQuestions}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Time Limit</p>
              <p className="text-lg font-black text-[#0B1B3F] dark:text-white mt-0.5">{test.durationMinutes} Mins</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Marks</p>
              <p className="text-lg font-black text-[#0B1B3F] dark:text-white mt-0.5">{test.totalMarks}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Marking Scheme</p>
              <p className="text-sm font-black text-[#0B1B3F] dark:text-white mt-1">
                <span className="text-emerald-600">+{marksPerQuestion}</span>
                {test.negativeMarking > 0 && (
                  <>
                    {' / '}
                    <span className="text-rose-600">-{test.negativeMarking}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Pro Pass Callout */}
          {!isAccessible && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Premium Mock Test
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                      ₹299 / 365 Days
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Unlock this and every other premium mock test with Pro Pass. One subscription,
                    universal access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/subscription')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shrink-0 shadow-sm transition-all cursor-pointer"
              >
                Get Pro Pass
              </button>
            </div>
          )}
        </div>

        {/* Instructions & Guidelines */}
        <div className={`${studentCard} p-6 sm:p-7 space-y-4`}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0B1B3F] dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#026BFC]" />
            Exam Instructions & Rules (নির্দেশাবলি)
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Negative Marking Notice:</span>{' '}
                {test.negativeMarking > 0 ? (
                  <>
                    Every incorrect answer will deduct <strong>{test.negativeMarking} marks</strong>.
                    Unanswered questions do not carry negative marks.
                  </>
                ) : (
                  <>
                    There is <strong>no negative marking</strong> in this test. Unanswered questions
                    do not carry negative marks.
                  </>
                )}
              </div>
            </div>

            <ul className="space-y-2.5 list-disc pl-5">
              <li>
                <strong>Total Duration:</strong> You will have{' '}
                <strong>{test.durationMinutes} minutes</strong> to complete all{' '}
                <strong>{test.totalQuestions} questions</strong>.
              </li>
              <li>
                <strong>Language Support:</strong> Questions can be viewed in{' '}
                <strong>বাংলা (Bengali)</strong> or <strong>English</strong> using the language toggle
                in the exam runner without losing your selected answers.
              </li>
              <li>
                <strong>Mark for Review:</strong> You can mark doubtful questions to revisit later
                before final submission.
              </li>
              <li>
                <strong>Auto-Submission:</strong> Once the countdown timer reaches zero, your test
                will be submitted automatically with your saved answers.
              </li>
              <li>
                <strong>Mistakes Notebook:</strong> Any wrong answers will automatically be archived
                in your <strong>Mistakes Notebook</strong> for focused post-test revision.
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Clicking Start Test begins your countdown session immediately.
            </span>
            <button
              type="button"
              disabled={starting}
              onClick={handleStartTest}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isAccessible
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                  : 'bg-[#026BFC] hover:bg-[#0056D2] text-white shadow-blue-500/20'
              }`}
            >
              {!isAccessible ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock with Pro Pass</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{starting ? 'Starting...' : 'Start Test'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Subscription Modal */}
        {showSubModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center overflow-y-auto p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-amber-200 dark:border-amber-800/60 relative">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Crown className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Pro Pass Exclusive
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {test.examTitle || 'Government Exam'} {test.chapterName ? `• ${test.chapterName}` : ''}
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                    PracticeKoro Pro Pass
                  </span>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                    ₹299 / 365 Days
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                  Unlock this and every other premium mock test with Pro Pass. One subscription,
                  universal access.
                </p>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Access all premium mock tests & test series</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Mistakes Notebook & detailed step-by-step solutions</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Unlimited re-attempts across all test series</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubModal(false);
                    navigate('/subscription');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all text-center block cursor-pointer"
                >
                  Get Pro Pass — ₹299
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="w-full py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Continue with Free Tests
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
