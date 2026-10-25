import { Plus, FileText, Edit2, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopicIconBadge } from './TopicIconBadge';
import { TopicDetailsOverviewTab } from './TopicDetailsOverviewTab';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicDetailsPanelProps {
  tp: AdminTopicsState;
}

export function TopicDetailsPanel({ tp }: TopicDetailsPanelProps) {
  const {
    selectedTopic,
    setSelectedTopic,
    showDetailsPanel,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    handleOpenEditModal,
    handleToggleTopicStatus,
  } = tp;
  return (
    <>
      {showDetailsPanel && selectedTopic && (
        <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5 animate-in fade-in-50 duration-200">
          {/* Header: Topic Details & Close X */}
          <div className="flex items-center justify-between pb-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Topic Details</h2>
            <button
              type="button"
              onClick={() => {
                setShowDetailsPanel(false);
                setSelectedTopic(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Topic Summary Banner: Icon + Title + Subtitle + Badge + Edit */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <TopicIconBadge
                name={selectedTopic.name}
                iconName={selectedTopic.iconName}
                className="w-12 h-12 shrink-0 rounded-xl"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {selectedTopic.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleToggleTopicStatus(selectedTopic)}
                    title={`Click to switch to ${selectedTopic.statusLabel === 'Published' ? 'Draft' : 'Published'}`}
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95',
                      selectedTopic.statusLabel === 'Published'
                        ? 'bg-[#E8F8F0] text-[#10B981] border border-[#A7F3D0]/60 hover:bg-[#d5f5e3]'
                        : 'bg-[#FEF8E7] text-[#D97706] border border-[#FDE68A]/60 hover:bg-[#fef0cd]'
                    )}
                  >
                    {selectedTopic.statusLabel}
                  </button>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5">
                  {selectedTopic.subjectName}
                </p>
              </div>
            </div>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => handleOpenEditModal(selectedTopic)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shrink-0 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#026BFC]" />
              Edit
            </button>
          </div>

          {/* Horizontal Tabs: Overview, Topic Tests (8), Questions (240), Settings */}
          <div className="flex items-center gap-3.5 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
            {(
              [
                { key: 'overview', label: 'Overview' },
                { key: 'tests', label: `Topic Tests (${selectedTopic.totalTests})` },
                { key: 'questions', label: `Questions (${selectedTopic.totalQuestions})` },
                { key: 'settings', label: 'Settings' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDetailsTab(tab.key)}
                className={cn(
                  'pb-2.5 relative transition-colors whitespace-nowrap cursor-pointer',
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

          {/* TAB CONTENT: OVERVIEW */}
          {detailsTab === 'overview' && (
            <TopicDetailsOverviewTab tp={tp} selectedTopic={selectedTopic} />
          )}

          {/* TAB CONTENT: TOPIC TESTS */}
          {detailsTab === 'tests' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Tests ({selectedTopic.totalTests})
                </span>
                <a
                  href={`/admin/tests?topic=${selectedTopic.id}`}
                  className="text-xs font-semibold text-[#026BFC] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Test
                </a>
              </div>
              <div className="space-y-2">
                {Array.from({ length: selectedTopic.totalTests || 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {selectedTopic.name} - Test {i + 1}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        30 Questions • 30 Mins • 30 Marks
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8F0] text-[#10B981]">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: QUESTIONS */}
          {detailsTab === 'questions' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Questions ({selectedTopic.totalQuestions})
                </span>
                <a
                  href={`/admin/question-bank?topicId=${selectedTopic.id}&source=topic`}
                  className="text-xs font-semibold text-[#026BFC] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Bank
                </a>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
                <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedTopic.totalQuestions} Questions Registered
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Organized across multiple topic tests and practice sets.
                </p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SETTINGS */}
          {detailsTab === 'settings' && (
            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block">
                      Topic Visibility
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Status:{' '}
                      <strong
                        className={
                          selectedTopic.statusLabel === 'Published'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }
                      >
                        {selectedTopic.statusLabel}
                      </strong>{' '}
                      (Visible to students)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedTopic.statusLabel === 'Published'}
                    onChange={() => handleToggleTopicStatus(selectedTopic)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Show in Student Practice
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
