import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Lock,
  PenLine,
  Radio,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { useSmoothModal } from '@/hooks/useSmoothModal';
import { FileDropZone } from '@/components/common/FileDropZone';
import { parseQuestionsTxt, downloadSampleTxt } from '@/utils/txtQuestionParser';
import type { LiveTest, Question } from '@/types';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface LiveTestUploadModalProps {
  qb: AdminQuestionBankState;
}

type Tab = 'bulk' | 'single';
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

/**
 * Question Bank "Live Test" upload: questions go straight into the chosen Live Test's own paper
 * (hidden from students and from the Exam/Subject bank until the paper is released). Only Draft
 * Live Tests accept questions; a published paper is locked.
 */
export function LiveTestUploadModal({ qb }: LiveTestUploadModalProps) {
  const {
    isLiveUploadOpen,
    setIsLiveUploadOpen,
    liveTests,
    loadInitialData,
    setActiveUploadMode,
    setSelectedLiveTestFilter,
    setViewModeFilter,
    setCurrentPage,
    showToast,
  } = qb;

  const [liveTestId, setLiveTestId] = useState('');
  const [tab, setTab] = useState<Tab>('bulk');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [single, setSingle] = useState({
    questionText: '',
    questionBengaliText: '',
    A: '',
    B: '',
    C: '',
    D: '',
    correct: 'A' as Question['correctOption'],
    explanation: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setRawText('');
    setFileName(null);
    setSingle({
      questionText: '',
      questionBengaliText: '',
      A: '',
      B: '',
      C: '',
      D: '',
      correct: 'A',
      explanation: '',
    });
    setError('');
  };

  const close = () => {
    setIsLiveUploadOpen(false);
    resetForm();
  };
  const { shouldRender, isAnimating, handleSmoothClose } = useSmoothModal(
    isLiveUploadOpen,
    close,
    200
  );

  const draftLiveTests = useMemo(
    () => liveTests.filter((lt) => lt.status === 'draft'),
    [liveTests]
  );
  const lockedLiveTests = useMemo(
    () => liveTests.filter((lt) => lt.status !== 'draft'),
    [liveTests]
  );
  const selected: LiveTest | undefined = draftLiveTests.find((lt) => lt.id === liveTestId);
  const parsed = useMemo(() => (rawText.trim() ? parseQuestionsTxt(rawText) : null), [rawText]);

  const singleValid =
    single.questionText.trim() && OPTION_KEYS.every((k) => single[k].trim().length > 0);

  const baseQuestion = (lt: LiveTest) => ({
    // The paper's exam is stamped on the question by createQuestionForTest.
    subjectId: undefined,
    difficulty: 'medium' as const,
    defaultMarks: 1.0,
    // Questions never carry negative marks — scoring uses the test-level scheme.
    defaultNegativeMarks: 0,
    isActive: true,
    status: 'active' as const,
    sourceExam: lt.examId,
  });

  const finish = async (lt: LiveTest, count: number) => {
    await loadInitialData();
    setActiveUploadMode('live');
    setViewModeFilter('live');
    setSelectedLiveTestFilter(lt.id);
    setCurrentPage(1);
    showToast(`${count} question${count === 1 ? '' : 's'} added to Live Test "${lt.title}".`);
    close();
  };

  const handleBulkImport = async () => {
    if (!selected || !parsed || parsed.valid.length === 0) return;
    try {
      setIsSaving(true);
      setError('');
      let saved = 0;
      const failures: string[] = [];
      for (const q of parsed.valid) {
        const res = await api
          .createQuestionForTest(selected.testId, {
            ...baseQuestion(selected),
            imageUrl: q.imageUrl,
            questionText: q.questionText,
            questionBengaliText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            explanationBengali: q.explanation,
          })
          .catch((err: unknown) => ({ success: false as const, error: getErrorMessage(err, '') }));
        if (res.success) saved++;
        else failures.push(`Question #${q.questionNumber}: ${res.error || 'not saved'}`);
      }
      if (failures.length > 0) {
        await loadInitialData();
        setError(
          `Added ${saved} of ${parsed.valid.length} questions. ${failures.length} failed — ${failures
            .slice(0, 3)
            .join('; ')}${failures.length > 3 ? '; …' : ''}`
        );
        return;
      }
      await finish(selected, saved);
    } catch (err) {
      setError(getErrorMessage(err, 'Live Test questions could not be uploaded.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSingleSave = async () => {
    if (!selected || !singleValid) return;
    try {
      setIsSaving(true);
      setError('');
      const res = await api.createQuestionForTest(selected.testId, {
        ...baseQuestion(selected),
        questionText: single.questionText.trim(),
        questionBengaliText: single.questionBengaliText.trim() || single.questionText.trim(),
        optionA: single.A.trim(),
        optionB: single.B.trim(),
        optionC: single.C.trim(),
        optionD: single.D.trim(),
        correctOption: single.correct,
        explanation: single.explanation.trim() || undefined,
        explanationBengali: single.explanation.trim() || undefined,
      });
      if (!res.success) throw new Error(res.error || 'Question was not saved.');
      await finish(selected, 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Question could not be added to the Live Test.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFile = async (file: File) => {
    try {
      setRawText(await file.text());
      setFileName(file.name);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'The file could not be read.'));
    }
  };

  if (!shouldRender) return null;

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500';

  return (
    <div
      onClick={handleSmoothClose}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0A1024] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Questions — Live Test</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Questions go into the selected Live Test&apos;s own paper. Students see them only
                while the Live Test runs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSmoothClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Live Test picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Live Test <span className="text-rose-500">*</span>
            </label>
            {draftLiveTests.length === 0 ? (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
                No Draft Live Test to add questions to.{' '}
                <Link to="/admin/live-tests" className="font-semibold underline">
                  Create a Live Test
                </Link>{' '}
                first — a published Live Test&apos;s paper is locked.
              </div>
            ) : (
              <select
                value={liveTestId}
                onChange={(e) => setLiveTestId(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Select a Draft Live Test --</option>
                {draftLiveTests.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.title}
                    {lt.examTitle ? ` · ${lt.examTitle}` : ''} ({lt.test?.totalQuestions ?? 0}/
                    {lt.totalQuestions ?? 0} questions)
                  </option>
                ))}
              </select>
            )}
            {lockedLiveTests.length > 0 && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <Lock className="w-3 h-3" />
                {lockedLiveTests.length} published/ended Live Test
                {lockedLiveTests.length === 1 ? ' is' : 's are'} locked and not listed.
              </p>
            )}
            {selected && (
              <Link
                to={`/admin/live-tests/${selected.id}/questions`}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Open this Live Test&apos;s question page
                (reorder, marks, publish)
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
            {(
              [
                ['bulk', 'Bulk Upload (TXT)', FileText],
                ['single', 'Single Question', PenLine],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5',
                  tab === key ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'bulk' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Upload a .txt file or paste questions in the PracticeKoro TXT format.
                </span>
                <button
                  type="button"
                  onClick={() => downloadSampleTxt('live_test_questions_template.txt')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Download className="w-3 h-3" /> Sample TXT
                </button>
              </div>
              <FileDropZone
                accept=".txt"
                onFile={handleFile}
                selectedFile={fileName ? new File([], fileName) : null}
                onClear={() => {
                  setRawText('');
                  setFileName(null);
                }}
                label="Drop a .txt question file here"
              />
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setFileName(null);
                }}
                rows={8}
                placeholder={
                  '1. Question text\n(a) Option A\n(b) Option B\n(c) Option C\n(d) Option D\n\nসঠিক উত্তর: (a) Option A'
                }
                className={cn(inputClass, 'font-mono text-xs')}
              />
              {parsed && (
                <div className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1E] p-3 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {parsed.valid.length} ready · {parsed.errors.length} with errors (detected{' '}
                    {parsed.totalDetected})
                  </p>
                  {parsed.errors.slice(0, 4).map((e, i) => (
                    <p key={i} className="text-rose-600 dark:text-rose-400">
                      Question #{e.questionNumber}: {e.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={single.questionText}
                onChange={(e) => setSingle({ ...single, questionText: e.target.value })}
                rows={3}
                placeholder="Question text *"
                className={inputClass}
              />
              <textarea
                value={single.questionBengaliText}
                onChange={(e) => setSingle({ ...single, questionBengaliText: e.target.value })}
                rows={2}
                placeholder="Bengali text (optional)"
                className={inputClass}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OPTION_KEYS.map((k) => (
                  <input
                    key={k}
                    value={single[k]}
                    onChange={(e) => setSingle({ ...single, [k]: e.target.value })}
                    placeholder={`Option ${k} *`}
                    className={inputClass}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Correct answer</label>
                <select
                  value={single.correct}
                  onChange={(e) =>
                    setSingle({ ...single, correct: e.target.value as Question['correctOption'] })
                  }
                  className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-slate-100 rounded-lg"
                >
                  {OPTION_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={single.explanation}
                onChange={(e) => setSingle({ ...single, explanation: e.target.value })}
                rows={2}
                placeholder="Explanation (optional)"
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSmoothClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              isSaving ||
              !selected ||
              (tab === 'bulk' ? !parsed || parsed.valid.length === 0 : !singleValid)
            }
            onClick={tab === 'bulk' ? handleBulkImport : handleSingleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
          >
            {isSaving
              ? 'Saving…'
              : tab === 'bulk'
                ? `Add ${parsed?.valid.length ?? 0} Questions`
                : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
