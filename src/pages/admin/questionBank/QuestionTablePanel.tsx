import { cn } from '@/lib/utils';
import { questionBankType } from './questionBankUtils';
import {
  MoreVertical,
  Edit2,
  Copy,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { requireSuccess } from '@/services/domains/admin.mutations';
import { getPageNumbers } from '@/utils/pagination';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionTablePanelProps {
  qb: AdminQuestionBankState;
}

export function QuestionTablePanel({ qb }: QuestionTablePanelProps) {
  const {
    liveTestTitleFor,
    activeQuestion,
    handleSelectAll,
    paginatedQuestions,
    selectedRowIds,
    filteredTotal,
    currentPage,
    pageSize,
    setActiveQuestion,
    handleToggleSelectRow,
    setActiveActionMenuId,
    activeActionMenuId,
    setQuestions,
    showToast,
    setSelectedRowIds,
    setCurrentPage,
    totalPages,
    setPageSize,
  } = qb;
  return (
    <>
      {/* LEFT COLUMN: QUESTION DATA TABLE */}
      <div
        className={cn(
          'transition-all duration-300',
          activeQuestion ? 'lg:col-span-8' : 'lg:col-span-12'
        )}
      >
        <div className="bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#070D1E] border-b border-slate-200/80 dark:border-slate-800">
                <tr className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedQuestions.length > 0 &&
                        paginatedQuestions.every((q) => selectedRowIds.has(q.id))
                      }
                      title={`Select All (${filteredTotal} Questions)`}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-12 text-center">#</th>
                  <th className="py-3 px-4">Question (Preview)</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Exam / Subject</th>
                  <th className="py-3 px-3">Topic</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Year</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {paginatedQuestions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-12 text-center text-slate-400 dark:text-slate-500"
                    >
                      No questions found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedQuestions.map((q, idx) => {
                    const isSelected = selectedRowIds.has(q.id);
                    const isActive = activeQuestion?.id === q.id;
                    const isLiveMode = Boolean(q.isLiveOnly);
                    const isExamMode =
                      !isLiveMode && (q.uploadMode === 'exam' || Boolean(q.sourceExam));
                    const questionNumber = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={q.id}
                        onClick={() => setActiveQuestion(q)}
                        className={cn(
                          'hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer',
                          isActive && 'bg-blue-50/50 dark:bg-blue-950/40 font-semibold'
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectRow(q.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                          />
                        </td>

                        {/* Sequential Question Number */}
                        <td
                          className="py-3 px-2 text-slate-500 dark:text-slate-400 font-bold text-center"
                          title={`Database ID: ${q.id}`}
                        >
                          {questionNumber}
                        </td>

                        {/* Question Bengali / English Preview */}
                        <td className="py-3 px-4 max-w-[240px]">
                          <p className="truncate text-slate-900 dark:text-slate-100 font-medium">
                            {q.questionBengaliText || q.questionText}
                          </p>
                        </td>

                        {/* Mode Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight',
                              isLiveMode
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : isExamMode
                                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            )}
                          >
                            {isLiveMode ? 'Live Test' : isExamMode ? 'Exam' : 'Subject'}
                          </span>
                        </td>

                        {/* Exam / Subject */}
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {isLiveMode
                            ? liveTestTitleFor(q.id)
                            : isExamMode
                              ? q.sourceExam || '—'
                              : q.subjectName || '—'}
                        </td>

                        {/* Topic */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {q.topicName || q.chapterName || '—'}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-2">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold',
                              isLiveMode
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : questionBankType(q) === 'PYQ'
                                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                  : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                            )}
                          >
                            {isLiveMode ? 'Live Test' : questionBankType(q)}
                          </span>
                        </td>

                        {/* Year */}
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400">
                          {q.sourceYear ? q.sourceYear : '-'}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {q.sourceType === 'pyq' ? 'Official PYQ' : 'Original'}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold inline-block',
                              (q.status === 'published' || q.status === 'active') &&
                                'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
                              q.status === 'under_review' &&
                                'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
                              q.status === 'draft' &&
                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {q.status === 'published' || q.status === 'active'
                              ? 'Published'
                              : q.status === 'under_review'
                                ? 'Under Review'
                                : q.status === 'archived'
                                  ? 'Archived'
                                  : 'Draft'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(activeActionMenuId === q.id ? null : q.id);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeActionMenuId === q.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1 text-left animate-in fade-in"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveQuestion(q);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3 text-blue-500" />
                                  <span>Edit Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const saved = await api.createQuestion({
                                        ...q,
                                        status: 'draft',
                                        isActive: false,
                                      });
                                      setQuestions((prev) => [saved, ...prev]);
                                      setActiveActionMenuId(null);
                                      showToast('Duplicate draft saved.');
                                    } catch (err) {
                                      showToast(getErrorMessage(err, 'Duplicate failed'));
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3 text-purple-500" />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      q.questionBengaliText || q.questionText
                                    );
                                    setActiveActionMenuId(null);
                                    showToast('Question text copied to clipboard.');
                                  }}
                                  className="w-full px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span>Copy Text</span>
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        'Delete this question? Linked records are protected.'
                                      )
                                    )
                                      return;
                                    try {
                                      requireSuccess(await api.deleteQuestion(q.id));
                                      setQuestions((prev) =>
                                        prev.filter((item) => item.id !== q.id)
                                      );
                                      if (activeQuestion?.id === q.id) setActiveQuestion(null);
                                      setSelectedRowIds(
                                        (prev) => new Set([...prev].filter((id) => id !== q.id))
                                      );
                                      setActiveActionMenuId(null);
                                      showToast('Question deleted.');
                                    } catch (err) {
                                      showToast(getErrorMessage(err, 'Delete failed'));
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200/80 dark:border-slate-800 text-xs gap-3">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Showing {filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(filteredTotal, currentPage * pageSize)} of{' '}
              {filteredTotal.toLocaleString('en-IN')} questions
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="text-slate-400 dark:text-slate-500 px-1">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={cn(
                      'min-w-7 h-7 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer',
                      currentPage === item
                        ? 'bg-[#026BFC] text-white shadow-2xs'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {item.toLocaleString('en-IN')}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Page Size Select */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-2 bg-[#F8FAFC] dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
