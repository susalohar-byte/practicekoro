import { CheckCircle2, Trash2, Upload } from 'lucide-react';
import type { MockTest } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { renderRowIcon } from './testRowIcon';
import type { AdminTestsState } from './useAdminTests';

export interface TestSettingsFormProps {
  testsState: AdminTestsState;
  selectedTest: MockTest;
}

export function TestSettingsForm({ testsState, selectedTest }: TestSettingsFormProps) {
  const {
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editDurationMinutes,
    setEditDurationMinutes,
    editTotalMarks,
    setEditTotalMarks,
    editPassingMarks,
    setEditPassingMarks,
    editNegativeMarking,
    setEditNegativeMarking,
    editIsPremium,
    setEditIsPremium,
    editStatus,
    setEditStatus,
    editIconUrl,
    setEditIconUrl,
    isUploadingDrawerIcon,
    setIsUploadingDrawerIcon,
    isSavingSettings,
    saveSuccessMsg,
    handleSaveSettings,
  } = testsState;
  return (
    <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
      {saveSuccessMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Test Icon / Logo Section */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Test Icon / Logo
            </span>
            <span className="text-[10.5px] text-slate-400">Upload custom badge for test name</span>
          </div>
          {editIconUrl && (
            <button
              type="button"
              onClick={() => setEditIconUrl('')}
              className="text-[11px] font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              title="Remove icon"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-0.5">
          {/* Live Preview */}
          <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-0.5">
            {editIconUrl ? (
              <img
                src={editIconUrl}
                alt="Test Icon"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              renderRowIcon({ ...selectedTest, iconUrl: '' }, 'w-full h-full')
            )}
          </div>

          {/* Upload button */}
          <div className="flex-1 min-w-0">
            <label
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                isUploadingDrawerIcon
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-[#026BFC] hover:bg-blue-700 text-white'
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              {isUploadingDrawerIcon ? 'Uploading...' : editIconUrl ? 'Change Icon' : 'Upload Icon'}
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingDrawerIcon}
                className="hidden"
                onChange={async (ev) => {
                  const file = ev.target.files?.[0];
                  if (!file) return;
                  try {
                    setIsUploadingDrawerIcon(true);
                    const uploadedUrl = await api.uploadTestIcon(file, selectedTest.id);
                    setEditIconUrl(uploadedUrl);
                  } catch (err: any) {
                    alert('Failed to upload icon: ' + (err?.message || 'Error'));
                  } finally {
                    setIsUploadingDrawerIcon(false);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Title *
        </label>
        <input
          type="text"
          required
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Description
        </label>
        <textarea
          rows={2}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            min={1}
            value={editDurationMinutes}
            onChange={(e) => setEditDurationMinutes(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Total Marks
          </label>
          <input
            type="number"
            min={1}
            value={editTotalMarks}
            onChange={(e) => setEditTotalMarks(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Passing Marks
          </label>
          <input
            type="number"
            min={0}
            value={editPassingMarks}
            onChange={(e) => setEditPassingMarks(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Negative Marking
          </label>
          <input
            type="number"
            step="0.05"
            min={0}
            value={editNegativeMarking}
            onChange={(e) => setEditNegativeMarking(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Status
          </label>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as any)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Access Plan
          </label>
          <select
            value={editIsPremium ? 'pro' : 'free'}
            onChange={(e) => setEditIsPremium(e.target.value === 'pro')}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="free">Free Practice</option>
            <option value="pro">PRO Members Only</option>
          </select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSavingSettings}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
      >
        {isSavingSettings ? 'Saving Changes...' : 'Save Changes'}
      </Button>
    </form>
  );
}
