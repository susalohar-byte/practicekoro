import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import { useAdminLiveTestPaper } from './paper/useAdminLiveTestPaper';
import { LiveTestWorkspaceInner } from './paper/LiveTestWorkspace';

/**
 * Question workspace of one Live Test's paper, opened from the Live Tests page. Questions are
 * uploaded here (Bulk TXT / Create Question) while the Live Test is a Draft; publishing the
 * Live Test validates the paper and locks it.
 */
export const AdminLiveTestPaper: React.FC = () => {
  const { liveTest, loading, busy, message, workspaceKey, handlePublish, handleRelease } =
    useAdminLiveTestPaper();

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

  return (
    <LiveTestWorkspaceInner
      key={workspaceKey}
      liveTest={liveTest}
      onPublish={handlePublish}
      onRelease={handleRelease}
      busy={busy}
      message={message}
    />
  );
};
