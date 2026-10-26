import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import type { LiveTest } from '@/types';

/** State and actions of the Live Test paper page: loads the Live Test and publishes / releases it. */
export function useAdminLiveTestPaper() {
  const { liveTestId } = useParams<{ liveTestId: string }>();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
        text: 'Live Test published successfully. Students can register now; questions are locked.',
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
      setWorkspaceKey((k) => k + 1);
      setMessage({
        type: 'success',
        text: 'Paper released to Practice: it is now an open Full Mock test available for practice.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Paper could not be released.') });
    } finally {
      setBusy(false);
    }
  };

  return {
    liveTest,
    loading,
    busy,
    message,
    workspaceKey,
    handlePublish,
    handleRelease,
  };
}
