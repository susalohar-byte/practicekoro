import { Upload, Edit2, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { renderRowIcon } from './testRowIcon';
import { TestOverviewTab } from './TestOverviewTab';
import { TestSettingsForm } from './TestSettingsForm';
import type { AdminTestsState } from './useAdminTests';

export interface TestDetailsPanelProps {
  testsState: AdminTestsState;
}

export function TestDetailsPanel({ testsState }: TestDetailsPanelProps) {
  const {
    showDetailsPanel,
    selectedTest,
    setSelectedTest,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    setIsAddQuestionsModalOpen,
    isUploadingDrawerIcon,
    handleQuickIconUpload,
  } = testsState;
  if (!showDetailsPanel || !selectedTest) return null;
  return (
    <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5 animate-in fade-in-50 duration-200">
      {/* Header: Test Details & Close X */}
      <div className="flex items-center justify-between pb-0.5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Test Details</h2>
        <button
          type="button"
          onClick={() => {
            setShowDetailsPanel(false);
            setSelectedTest(null);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Test Summary Banner: Shield/Icon + Title + Badges + Edit */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="relative group shrink-0">
            {renderRowIcon(selectedTest, 'w-11 h-11')}
            <label
              className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#026BFC] hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-transform hover:scale-110"
              title="Upload or change test icon"
            >
              <Upload className="w-2.5 h-2.5" />
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingDrawerIcon}
                className="hidden"
                onChange={async (ev) => {
                  const file = ev.target.files?.[0];
                  if (!file || !selectedTest) return;
                  await handleQuickIconUpload(file, selectedTest);
                }}
              />
            </label>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {selectedTest.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300">
                {selectedTest.testType === 'full_mock'
                  ? 'Full Mock'
                  : selectedTest.testType === 'topic'
                    ? 'Topic Test'
                    : 'Official PYQ'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300">
                {selectedTest.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => setDetailsTab('settings')}
          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-50 shrink-0"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
      </div>

      {/* Horizontal Tabs: Overview, Questions, Settings, Analytics */}
      <div className="flex items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
        {(
          [
            { key: 'overview', label: 'Overview' },
            { key: 'questions', label: 'Questions' },
            { key: 'settings', label: 'Settings' },
            { key: 'analytics', label: 'Analytics' },
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

      {/* TAB CONTENT */}
      {detailsTab === 'overview' && (
        <TestOverviewTab testsState={testsState} selectedTest={selectedTest} />
      )}

      {/* TAB: QUESTIONS */}
      {detailsTab === 'questions' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Questions ({selectedTest.totalQuestions ?? 0})
            </span>
            <Button
              size="sm"
              onClick={() => setIsAddQuestionsModalOpen(true)}
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Add Questions
            </Button>
          </div>
          <p className="text-slate-500 text-[11px]">
            Questions are linked directly from the Central Question Bank without duplication.
          </p>
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddQuestionsModalOpen(true)}
              className="text-xs"
            >
              Manage Assigned Questions
            </Button>
          </div>
        </div>
      )}

      {/* TAB: SETTINGS */}
      {detailsTab === 'settings' && (
        <TestSettingsForm testsState={testsState} selectedTest={selectedTest} />
      )}

      {/* TAB: ANALYTICS */}
      {detailsTab === 'analytics' && (
        <div className="space-y-3 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            Live Analytics & Attempt Data
          </span>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Attempts:</span>
              <span className="font-bold">
                {Number((selectedTest as any).attemptsCount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Average Score:</span>
              <span className="font-bold text-blue-600">
                {(selectedTest as any).avgScore
                  ? `${Math.round((selectedTest as any).avgScore)}%`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
