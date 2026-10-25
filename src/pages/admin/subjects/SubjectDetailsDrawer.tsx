import { Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubjectIconBadge } from './SubjectIconBadge';
import { subjectTopics, isSubjectTopicTest, subjectTests } from '@/utils/adminSubjectModel';
import { SubjectOverviewTab } from './SubjectOverviewTab';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectDetailsDrawerProps {
  sb: AdminSubjectsState;
}

export function SubjectDetailsDrawer({ sb }: SubjectDetailsDrawerProps) {
  const {
    chapters,
    tests,
    report,
    selectedSubject,
    setSelectedSubject,
    showDetailsPanel,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    handleOpenEditModal,
  } = sb;
  return (
    <>
      {/* Right Column: Subject Details Card (Side-by-side with Table) */}
      {showDetailsPanel && selectedSubject && (
        <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5 animate-in fade-in-50 duration-200">
          {/* Header: Subject Details & Close X */}
          <div className="flex items-center justify-between pb-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Subject Details</h2>
            <button
              type="button"
              onClick={() => {
                setShowDetailsPanel(false);
                setSelectedSubject(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subject Summary Banner: Icon + Title + Badges + Edit */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <SubjectIconBadge
                name={selectedSubject.name}
                iconName={selectedSubject.iconName}
                className="w-12 h-12 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  {selectedSubject.name}
                </h3>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                    selectedSubject.statusLabel === 'Published'
                      ? 'bg-[#E8F8F0] text-[#10B981] border border-[#A7F3D0]/60'
                      : 'bg-[#FEF8E7] text-[#D97706] border border-[#FDE68A]/60'
                  )}
                >
                  {selectedSubject.statusLabel}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => handleOpenEditModal(selectedSubject)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shrink-0 shadow-2xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#026BFC]" />
              Edit
            </button>
          </div>

          {/* Horizontal Tabs: Overview, Topics (18), Topic Tests (42) */}
          <div className="flex items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
            {(
              [
                { key: 'overview', label: 'Overview' },
                { key: 'topics', label: `Topics (${selectedSubject.topicsCount})` },
                {
                  key: 'topic_tests',
                  label: `Topic Tests (${selectedSubject.topicTestsCount})`,
                },
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

          {/* TAB CONTENT: OVERVIEW */}
          {detailsTab === 'overview' && <SubjectOverviewTab sb={sb} />}

          {/* TAB CONTENT: TOPICS */}
          {detailsTab === 'topics' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  Topics ({selectedSubject.topicsCount})
                </span>
                <a
                  href={`/admin/topics?subject=${encodeURIComponent(selectedSubject.id)}`}
                  className="text-xs text-[#026BFC] hover:underline font-semibold"
                >
                  Manage Topics
                </a>
              </div>
              <p className="text-[11px] text-slate-500">
                Topics under {selectedSubject.name} used in Topic Practice & Chapter Tests:
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {subjectTopics(selectedSubject.id, chapters).map((topic) => (
                  <div
                    key={topic.id}
                    className="p-2 rounded-xl border flex items-center justify-between"
                  >
                    <span>{topic.name}</span>
                    <span className="text-xs text-slate-500">
                      {report.questions
                        ? report.questions.filter(
                            (q) => q.chapter_id === topic.id || q.topic_id === topic.id
                          ).length + ' questions'
                        : 'Question count unavailable'}
                    </span>
                  </div>
                ))}
                {!subjectTopics(selectedSubject.id, chapters).length && (
                  <p>No topics are linked to this subject.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: TOPIC TESTS */}
          {detailsTab === 'topic_tests' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  Topic Tests ({selectedSubject.topicTestsCount})
                </span>
                <a
                  href="/admin/mock-tests"
                  className="text-xs text-[#026BFC] hover:underline font-semibold"
                >
                  View in Mock Tests
                </a>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {subjectTests(selectedSubject.id, chapters, tests)
                  .filter(isSubjectTopicTest)
                  .map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl border space-y-1">
                      <strong>{t.title}</strong>
                      <p>
                        {t.totalQuestions} questions · {t.durationMinutes} min · {t.status}
                      </p>
                    </div>
                  ))}
                {!subjectTests(selectedSubject.id, chapters, tests).some(
                  (t) => t.testType === 'topic'
                ) && <p>No topic tests are linked to this subject.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
