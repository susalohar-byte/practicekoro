import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import type { EnrichedExamRow } from './examsUtils';
import type { AdminExamsState } from './useAdminExams';

export interface ExamSettingsTabProps {
  qb: AdminExamsState;
  selectedExam: EnrichedExamRow;
}

export function ExamSettingsTab({ qb, selectedExam }: ExamSettingsTabProps) {
  const {
    detailsTab,
    categories,
    handleUploadImageFile,
    handleQuickUploadExamLogo,
    settingsTitle,
    setSettingsTitle,
    settingsCategory,
    setSettingsCategory,
    settingsStatus,
    setSettingsStatus,
    isSavingSettings,
    handleSaveDrawerSettings,
  } = qb;
  return (
    <>
      {/* TAB CONTENT: SETTINGS */}
      {detailsTab === 'settings' && (
        <div className="space-y-3 text-xs">
          {/* Exam Logo Upload & Preset Official Logos */}
          <div className="space-y-2.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Exam Official Logo
            </label>
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
              <ExamEmblemBadge
                title={selectedExam.title}
                slug={selectedExam.slug}
                iconName={selectedExam.iconName}
                className="w-10 h-10 shrink-0 shadow-2xs"
              />
              <div className="space-y-1 min-w-0">
                <label
                  htmlFor={`settings-tab-logo-upload-${selectedExam.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Upload Custom Logo
                  <input
                    id={`settings-tab-logo-upload-${selectedExam.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (ev) => {
                      const file = ev.target.files?.[0];
                      if (!file) return;
                      try {
                        const uploadedUrl = await handleUploadImageFile(file);
                        await handleQuickUploadExamLogo(selectedExam.id, uploadedUrl);
                      } catch (err) {
                        console.error('Failed to upload logo:', err);
                      }
                    }}
                  />
                </label>
                {selectedExam.iconName && (
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickUploadExamLogo(selectedExam.id, '/images/exams/logo_wbp.png')
                    }
                    className="text-[11px] text-slate-500 hover:text-rose-600 block transition-colors"
                  >
                    Reset to default logo
                  </button>
                )}
              </div>
            </div>

            {/* Preset Official Logos */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Preset Exam Logos (Official)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    name: 'WBP Police',
                    url: '/images/exams/logo_wbp.png',
                    label: 'WBP Police',
                  },
                  {
                    name: 'Kolkata Police',
                    url: '/images/exams/logo_kp.png',
                    label: 'Kolkata Police',
                  },
                  { name: 'WBPSC', url: '/images/exams/logo_wbpsc.png', label: 'WBPSC' },
                  {
                    name: 'Indian Railway',
                    url: '/images/exams/logo_railway.png',
                    label: 'Indian Railway',
                  },
                  {
                    name: 'SSC Commission',
                    url: '/images/exams/logo_ssc.png',
                    label: 'SSC Commission',
                  },
                  {
                    name: 'Primary TET',
                    url: '/images/exams/logo_wbtet.png',
                    label: 'Primary TET',
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleQuickUploadExamLogo(selectedExam.id, preset.url)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-xl border text-[11px] font-medium transition-all text-left cursor-pointer',
                      selectedExam.iconName === preset.url
                        ? 'border-[#026BFC] bg-blue-50/80 dark:bg-blue-950/40 text-[#026BFC] dark:text-blue-400 font-bold ring-2 ring-[#026BFC]/25 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                    title={preset.name}
                  >
                    <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-0.5 flex items-center justify-center shrink-0">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Exam Title
            </label>
            <input
              type="text"
              value={settingsTitle}
              onChange={(e) => setSettingsTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Category
            </label>
            <select
              value={settingsCategory}
              onChange={(e) => setSettingsCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white"
            >
              <option value="State Govt">State Govt</option>
              <option value="Central Govt">Central Govt</option>
              <option value="Other">Other</option>
              {categories
                .filter((c) => !['State Govt', 'Central Govt', 'Other'].includes(c))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Status
            </label>
            <select
              value={settingsStatus}
              onChange={(e) => setSettingsStatus(e.target.value as 'Published' | 'Draft')}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white"
            >
              <option value="Published">Published (Active)</option>
              <option value="Draft">Draft / Hidden (Inactive)</option>
            </select>
          </div>
          <button
            type="button"
            disabled={isSavingSettings}
            onClick={handleSaveDrawerSettings}
            className="w-full py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold transition-colors mt-2 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {isSavingSettings ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </>
  );
}
