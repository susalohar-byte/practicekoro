import React from 'react';
import { Trash2, Shield, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import type { SettingsFormState } from './mockTestDetailsUtils';

interface SettingsTabProps {
  settingsForm: SettingsFormState;
  setSettingsForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
  dragActiveIcon: boolean;
  setDragActiveIcon: (active: boolean) => void;
  isUploadingIcon: boolean;
  isSavingSettings: boolean;
  handleUploadIconFile: (file: File) => void;
  handleSaveSettings: (e: React.FormEvent) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settingsForm,
  setSettingsForm,
  dragActiveIcon,
  setDragActiveIcon,
  isUploadingIcon,
  isSavingSettings,
  handleUploadIconFile,
  handleSaveSettings,
}) => (
  <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
    {/* Test Icon Section */}
    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            Test Icon / Logo
          </span>
          <span className="text-[10.5px] text-slate-400">Upload custom badge for test name</span>
        </div>
        {settingsForm.iconUrl && (
          <button
            type="button"
            onClick={() => setSettingsForm({ ...settingsForm, iconUrl: '' })}
            className="text-[11px] font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            title="Remove icon"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUploadIconFile(file);
        }}
        className={cn(
          'flex items-center gap-3 p-2 rounded-2xl transition-all border-2',
          dragActiveIcon
            ? 'border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
            : 'border-transparent'
        )}
      >
        <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-0.5">
          {settingsForm.iconUrl ? (
            <img
              src={settingsForm.iconUrl}
              alt="Test Icon"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Shield className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
              isUploadingIcon
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#026BFC] hover:bg-blue-700 text-white'
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploadingIcon
              ? 'Uploading...'
              : settingsForm.iconUrl
                ? 'Change Icon'
                : 'Upload or Drop Icon'}
            <input
              type="file"
              accept="image/*"
              disabled={isUploadingIcon}
              className="hidden"
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                if (file) handleUploadIconFile(file);
              }}
            />
          </label>
          {dragActiveIcon && (
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
              Drop image to set icon
            </p>
          )}
        </div>
      </div>
    </div>

    <div>
      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
        Test Title *
      </label>
      <input
        type="text"
        required
        value={settingsForm.title}
        onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
        Description
      </label>
      <textarea
        rows={3}
        value={settingsForm.description}
        onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Duration (Minutes) *
        </label>
        <input
          type="number"
          min={1}
          required
          value={settingsForm.durationMinutes}
          onChange={(e) =>
            setSettingsForm({
              ...settingsForm,
              durationMinutes: Number(e.target.value),
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Total Marks *
        </label>
        <input
          type="number"
          min={1}
          required
          value={settingsForm.totalMarks}
          onChange={(e) => setSettingsForm({ ...settingsForm, totalMarks: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Passing Marks
        </label>
        <input
          type="number"
          min={0}
          value={settingsForm.passingMarks}
          onChange={(e) =>
            setSettingsForm({ ...settingsForm, passingMarks: Number(e.target.value) })
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
          value={settingsForm.negativeMarking}
          onChange={(e) =>
            setSettingsForm({
              ...settingsForm,
              negativeMarking: Number(e.target.value),
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 pt-2">
      <div>
        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Status
        </label>
        <select
          value={settingsForm.status}
          onChange={(e) =>
            setSettingsForm({
              ...settingsForm,
              status: e.target.value as 'draft' | 'published' | 'archived',
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div>
        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Access Type
        </label>
        <select
          value={settingsForm.isPremium ? 'pro' : 'free'}
          onChange={(e) =>
            setSettingsForm({
              ...settingsForm,
              isPremium: e.target.value === 'pro',
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="free">Free Practice</option>
          <option value="pro">PRO Members Only</option>
        </select>
      </div>
    </div>

    <div className="pt-4">
      <Button
        type="submit"
        disabled={isSavingSettings}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        {isSavingSettings ? 'Saving Changes...' : 'Save Mock Test Settings'}
      </Button>
    </div>
  </form>
);
