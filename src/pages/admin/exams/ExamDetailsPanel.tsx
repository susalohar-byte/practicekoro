import { Edit2, X, Upload, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import { ExamSubjectTopicMapper } from '@/components/admin/ExamSubjectTopicMapper';
import { ExamRelatedTests } from '@/components/admin/ExamRelatedTests';
import { ExamOverviewTab } from './ExamOverviewTab';
import { ExamSettingsTab } from './ExamSettingsTab';
import type { AdminExamsState } from './useAdminExams';

export interface ExamDetailsPanelProps {
  qb: AdminExamsState;
}

export function ExamDetailsPanel({ qb }: ExamDetailsPanelProps) {
  const {
    setExams,
    selectedExam,
    setSelectedExam,
    showDetailsPanel,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    handleUploadImageFile,
    handleQuickUploadExamLogo,
    handleToggleExamStatus,
    handleOpenEditModal,
  } = qb;
  return (
    <>
      {/* Right Column: Exam Details Card (Side-by-side with Table) */}
      {showDetailsPanel && selectedExam && (
        <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5">
          {/* Header: Exam Details & Close X */}
          <div className="flex items-center justify-between pb-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Exam Details</h2>
            <button
              type="button"
              onClick={() => {
                setShowDetailsPanel(false);
                setSelectedExam(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Exam Summary Banner: Shield + Title + Badges + Edit */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="relative group/drawerlogo shrink-0">
                <ExamEmblemBadge
                  title={selectedExam.title}
                  slug={selectedExam.slug}
                  iconName={selectedExam.iconName}
                  className="w-10 h-11 shrink-0"
                />
                <label
                  htmlFor={`drawer-logo-upload-${selectedExam.id}`}
                  className="absolute inset-0 bg-slate-900/70 rounded-xl opacity-0 group-hover/drawerlogo:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white shadow-2xs"
                  title="Upload new logo"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    id={`drawer-logo-upload-${selectedExam.id}`}
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
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {selectedExam.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-400 truncate">
                    {selectedExam.subtitle || 'West Bengal Police Constable'}
                  </p>
                  <label
                    htmlFor={`drawer-logo-upload-badge-${selectedExam.id}`}
                    className="text-[10px] text-[#026BFC] hover:underline font-semibold cursor-pointer shrink-0 flex items-center gap-0.5"
                    title="Upload new logo image"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    Logo
                    <input
                      id={`drawer-logo-upload-badge-${selectedExam.id}`}
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
                </div>
              </div>
            </div>

            {/* Status Badge + Edit Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleExamStatus(selectedExam)}
                title={`Click to switch status to ${selectedExam.statusLabel === 'Published' ? 'Draft' : 'Published'}`}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer',
                  selectedExam.statusLabel === 'Published'
                    ? 'bg-[#E8F8F0] text-[#10B981] hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-[#FEF8E7] text-[#D97706] hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                )}
              >
                {selectedExam.statusLabel}
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedExam)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-50 shrink-0"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            </div>
          </div>

          {/* Horizontal Tabs: Overview, Subjects & Topics, Tests, Settings */}
          <div className="flex items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
            {(
              [
                { key: 'overview', label: 'Overview' },
                { key: 'subjects', label: `Subjects & Topics (${selectedExam.subjectsCount})` },
                { key: 'tests', label: 'Tests' },
                { key: 'settings', label: 'Settings' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDetailsTab(tab.key)}
                className={cn(
                  'pb-2.5 relative transition-colors',
                  detailsTab === tab.key
                    ? 'text-[#026BFC] font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                )}
              >
                {tab.label}
                {detailsTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#026BFC] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <ExamOverviewTab qb={qb} selectedExam={selectedExam} />

          {/* TAB CONTENT: SUBJECTS & TOPICS (mapping to central records) */}
          {detailsTab === 'subjects' && (
            <ExamSubjectTopicMapper
              key={selectedExam.id}
              examId={selectedExam.id}
              examTitle={selectedExam.title}
              onSaved={({ subjects: subjectCount }) => {
                setExams((prev) =>
                  prev.map((x) =>
                    x.id === selectedExam.id ? { ...x, subjectsCount: subjectCount } : x
                  )
                );
                setSelectedExam((prev) => (prev ? { ...prev, subjectsCount: subjectCount } : prev));
              }}
            />
          )}

          {/* TAB CONTENT: RELATED TESTS (links to central test records) */}
          {detailsTab === 'tests' && (
            <ExamRelatedTests key={selectedExam.id} examId={selectedExam.id} />
          )}

          <ExamSettingsTab qb={qb} selectedExam={selectedExam} />
        </div>
      )}
    </>
  );
}
