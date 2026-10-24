import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, Radio, Send, Unlock } from 'lucide-react';
import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import type { LiveTest } from '@/types';
import { AdminTestQuestions } from '../AdminTestQuestions';

const ENDED_STATUSES: ReadonlyArray<LiveTest['status']> = ['ended', 'completed', 'cancelled'];

/**
 * Question workspace of one Live Test's paper, opened from the Live Tests page. Questions are
 * uploaded here (Bulk TXT / Create Question) while the Live Test is a Draft; publishing the
 * Live Test validates the paper and locks it.
 */
export const AdminLiveTestPaper: React.FC = () => {
  const { liveTestId } = useParams<{ liveTestId: string }>();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Remounts the workspace after publish/release so its lock state is re-read.
  const [workspaceKey, setWorkspaceKey] = useState(0);

  const load = useCallback(async () => {
    if (!liveTestId) return;
    try {
      setLoading(true);
      setLiveTest(await api.getLiveTestById(liveTestId));
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Live Test could not be loaded.') });
    } finally {
      setLoading(false);
    }
  }, [liveTestId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    if (!liveTest) return;
    try {
      setBusy(true);
      setMessage(null);
      const updated = await api.updateLiveTest(liveTest.id, { status: 'upcoming' });
      setLiveTest(updated);
      setWorkspaceKey((k) => k + 1);
      setMessage({
        type: 'success',
        text: 'Live Test published. Students can register now; its questions are locked.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: getErrorMessage(err, 'Live Test could not be published.'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async () => {
    if (!liveTest) return;
    try {
      setBusy(true);
      setMessage(null);
      await api.releaseLivePaperToPractice(liveTest.id);
      await load();
      setMessage({
        type: 'success',
        text: 'Paper released: it is now a regular Full Mock test available for practice.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Paper could not be released.') });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <AdminPageSkeleton label="Loading Live Test Paper" variant="detail" />;

  if (!liveTest) {
    return (
      <div className="max-w-xl mx-auto mt-16 space-y-4">
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          {message?.text || 'This Live Test was not found.'}
        </div>
        <Link
          to="/admin/live-tests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Tests
        </Link>
      </div>
    );
  }

  const isDraft = liveTest.status === 'draft';
  const isEnded = ENDED_STATUSES.includes(liveTest.status);
  const isLiveOnly = Boolean(liveTest.test?.isLiveOnly);

  const banner = (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Live Test paper: {liveTest.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDraft &&
                'Draft — upload every question here, check marks, then publish. Students cannot see this paper.'}
              {!isDraft &&
                !isEnded &&
                'Published — the paper is locked. Move the Live Test back to Draft to change questions.'}
              {isEnded &&
                (isLiveOnly
                  ? 'Ended — the paper is still hidden. Release it to make it a practice Full Mock.'
                  : 'Ended — this paper is available for practice.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDraft && (
            <button
              onClick={handlePublish}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {busy ? 'Publishing…' : 'Publish Live Test'}
            </button>
          )}
          {!isDraft && !isEnded && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Lock className="w-3.5 h-3.5" /> Questions locked
            </span>
          )}
          {isEnded && isLiveOnly && (
            <button
              onClick={handleRelease}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              {busy ? 'Releasing…' : 'Release to Practice'}
            </button>
          )}
        </div>
      </div>
      {message && (
        <div
          className={
            message.type === 'success'
              ? 'flex items-start gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700'
              : 'flex items-start gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700'
          }
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );

  return (
    <AdminTestQuestions key={workspaceKey} testId={liveTest.testId} liveMode banner={banner} />
  );
};
