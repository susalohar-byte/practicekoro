import { isMathematicsQuestion } from '@/utils/shortNotes';
import {
  Plus,
  CheckCircle2,
  Search,
  FileQuestion,
  Layers,
  X,
  Shuffle,
  CheckSquare,
  Upload,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { MathText } from '@/components/common/MathText';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import type { MockTest } from '@/types';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface QuestionSelectorTabProps {
  testQuestionsState: AdminTestQuestionsState;
  test: MockTest;
  currentRandomTarget: number;
}

export function QuestionSelectorTab({
  testQuestionsState,
  test,
  currentRandomTarget,
}: QuestionSelectorTabProps) {
  const {
    activeTab,
    assignedQuestionIds,
    bankLoading,
    countPreset,
    currentPage,
    customCount,
    eligibleBankQuestions,
    handleAddSelectedQuestions,
    handleClearSelection,
    handleSelectAll,
    handleSelectRandom,
    handleSelectRange,
    handleToggleSelectQuestion,
    isSaving,
    isTestLocked,
    pageSize,
    paginatedQuestions,
    quickRangeBatches,
    rangeFrom,
    rangeTo,
    searchQuery,
    selectedQuestionIds,
    setCountPreset,
    setCurrentPage,
    setCustomCount,
    setIsBulkModalOpen,
    setRangeFrom,
    setRangeTo,
    setSearchQuery,
    testSubject,
    totalPages,
    unassignedEligibleQuestions,
  } = testQuestionsState;
  return (
    <>
      {/* ===================================================================== */}
      {/* 3. TAB CONTENT A: QUESTION SELECTOR (PRIMARY ENHANCED WORKFLOW)       */}
      {/* ===================================================================== */}
      {activeTab === 'select' && (
        <div className="space-y-4">
          {/* Question Selector Controls Toolbar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] shadow-xl space-y-4">
            {/* Search + Range Selection Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search within topic questions */}
              <div className="relative w-full lg:max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search questions in ${testSubject?.name || 'this topic'}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Range Selection Controls (From - To) */}
              <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 dark:bg-[#070d1d] p-1.5 rounded-2xl border border-slate-200 dark:border-[#172852]">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-[#0075FF] dark:text-[#38bdf8] flex items-center gap-1.5 px-2 py-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Select Range:
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-1">
                    From:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={eligibleBankQuestions.length || 100}
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-2 py-1 rounded-xl bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-black text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    To:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={eligibleBankQuestions.length || 100}
                    value={rangeTo}
                    onChange={(e) => setRangeTo(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-2 py-1 rounded-xl bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-black text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    placeholder="10"
                  />
                </div>

                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md shadow-[#0075FF]/25 border border-[#0075FF]/40"
                  onClick={() => handleSelectRange(rangeFrom, rangeTo)}
                  disabled={eligibleBankQuestions.length === 0}
                  title={`Select questions from #${rangeFrom} to #${rangeTo}`}
                >
                  Select Range ({rangeFrom} - {rangeTo})
                </Button>
              </div>
            </div>

            {/* Quick Range Batches Chips (e.g. 1-10, 11-20, 21-30, 31-40...) */}
            {quickRangeBatches.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-[#152347]">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Layers className="w-3 h-3 text-[#0075FF]" />
                  Quick Batches:
                </span>
                {quickRangeBatches.map((batch) => {
                  const isCurrentRange = rangeFrom === batch.from && rangeTo === batch.to;
                  return (
                    <button
                      key={batch.label}
                      type="button"
                      onClick={() => {
                        setRangeFrom(batch.from);
                        setRangeTo(batch.to);
                        handleSelectRange(batch.from, batch.to);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isCurrentRange
                          ? 'bg-[#0075FF] text-white shadow-md shadow-[#0075FF]/30 scale-105'
                          : 'bg-slate-100 dark:bg-[#070d1d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132042] border border-slate-200/80 dark:border-[#192b57]'
                      }`}
                      title={`Click to select questions #${batch.from} to #${batch.to}`}
                    >
                      {batch.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Actions Row: Random Picker, Select All, Clear */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#152347]">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Random Selection Control */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070d1d] p-1 rounded-xl border border-slate-200 dark:border-[#192b57]">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1.5 flex items-center gap-1">
                    <Shuffle className="w-3 h-3 text-indigo-400" />
                    Random:
                  </span>
                  <select
                    value={countPreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCountPreset(val === 'custom' ? 'custom' : parseInt(val));
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  >
                    <option value={5}>5 Qs</option>
                    <option value={10}>10 Qs</option>
                    <option value={15}>15 Qs</option>
                    <option value={20}>20 Qs</option>
                    <option value={25}>25 Qs</option>
                    <option value={30}>30 Qs</option>
                    <option value="custom">Custom</option>
                  </select>

                  {countPreset === 'custom' && (
                    <input
                      type="number"
                      min={1}
                      max={unassignedEligibleQuestions.length || 100}
                      value={customCount}
                      onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    />
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-white hover:bg-[#0075FF] px-2.5 py-1"
                    leftIcon={<Shuffle className="w-3.5 h-3.5" />}
                    onClick={handleSelectRandom}
                    disabled={unassignedEligibleQuestions.length === 0}
                    title={`Randomly pick ${currentRandomTarget} unassigned questions`}
                  >
                    Pick
                  </Button>
                </div>

                <button
                  onClick={handleSelectAll}
                  disabled={unassignedEligibleQuestions.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#070d1d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132042] text-xs font-bold transition-colors disabled:opacity-50 border border-slate-200 dark:border-[#192b57]"
                >
                  Select All Unassigned ({unassignedEligibleQuestions.length})
                </button>

                {selectedQuestionIds.length > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition-colors border border-rose-200 dark:border-rose-900/50"
                  >
                    Clear ({selectedQuestionIds.length})
                  </button>
                )}
              </div>

              {/* Status summary */}
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Showing{' '}
                <strong className="text-slate-900 dark:text-white">
                  {eligibleBankQuestions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                  {Math.min(eligibleBankQuestions.length, currentPage * pageSize)}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900 dark:text-white">
                  {eligibleBankQuestions.length}
                </strong>{' '}
                questions
              </div>
            </div>
          </div>

          {/* Questions List (Paginated with Individual Checkboxes & Already-Added Badges) */}
          <div className="space-y-3">
            {bankLoading && eligibleBankQuestions.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] text-xs text-slate-500 shadow-md">
                Loading questions from Question Bank...
              </div>
            ) : eligibleBankQuestions.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] space-y-3 shadow-md">
                <FileQuestion className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No Questions Found for this Topic / Context
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  There are no questions in Question Bank tagged under &quot;
                  {testSubject?.name || 'this test'}&quot; matching your filter.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white text-xs font-bold"
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => setIsBulkModalOpen(true)}
                  >
                    Bulk Add via TXT
                  </Button>
                </div>
              </div>
            ) : (
              paginatedQuestions.map((q, idx) => {
                const isAlreadyInTest = assignedQuestionIds.has(q.id);
                const isSelected = selectedQuestionIds.includes(q.id);
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      if (!isAlreadyInTest) handleToggleSelectQuestion(q.id);
                    }}
                    className={`p-5 rounded-2xl border transition-all duration-150 select-none ${
                      isAlreadyInTest
                        ? 'bg-slate-50/70 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] opacity-75 cursor-default'
                        : isSelected
                          ? 'bg-blue-50/90 dark:bg-[#0c1f44] border-2 border-[#0075FF] shadow-lg shadow-[#0075FF]/10 ring-2 ring-[#0075FF]/20 cursor-pointer'
                          : 'bg-white dark:bg-[#0a1226] border-slate-200 dark:border-[#152347] hover:border-[#0075FF]/50 cursor-pointer shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox Indicator */}
                      <div className="pt-0.5 shrink-0">
                        {isAlreadyInTest ? (
                          <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : isSelected ? (
                          <div className="w-5 h-5 rounded-lg bg-[#0075FF] text-white flex items-center justify-center shadow-xs shadow-[#0075FF]/40">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-[#0075FF] transition-colors" />
                        )}
                      </div>

                      {/* Question Text & Badges */}
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#070d1d] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#152347]">
                            #{globalIndex}
                          </span>

                          {isAlreadyInTest ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Already in Test
                            </span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#0075FF]/15 text-[#0075FF] dark:text-[#38bdf8] border border-[#0075FF]/30">
                              <CheckSquare className="w-3 h-3" />
                              Selected
                            </span>
                          ) : null}

                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Marks: {q.defaultMarks || 1.0}
                          </span>
                        </div>

                        {/* English Question */}
                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                          <MathText>{q.questionText}</MathText>
                        </p>

                        {/* Bengali Question (if provided) */}
                        {q.questionBengaliText && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                            <MathText>{q.questionBengaliText}</MathText>
                          </p>
                        )}

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'A'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              A
                            </span>
                            <span>
                              <MathText>{q.optionA}</MathText>
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'B'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              B
                            </span>
                            <span>
                              <MathText>{q.optionB}</MathText>
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'C'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              C
                            </span>
                            <span>
                              <MathText>{q.optionC}</MathText>
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'D'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              D
                            </span>
                            <span>
                              <MathText>{q.optionD}</MathText>
                            </span>
                          </div>
                        </div>

                        {/* Short Notes (non-Math) / Explanation (Math) */}
                        {(q.explanationBengali || q.explanation) && (
                          <div className="pt-2">
                            <ShortNotesBox
                              explanation={q.explanationBengali || q.explanation}
                              isMathematics={isMathematicsQuestion(q)}
                              defaultExpanded={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {eligibleBankQuestions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] text-xs font-semibold shadow-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
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
                          ? 'bg-[#0075FF] text-white shadow-2xs'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Action Dock when questions are selected */}
          {selectedQuestionIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#070d1d]/95 backdrop-blur-md border border-[#0075FF]/60 shadow-2xl shadow-[#0075FF]/30 flex items-center gap-4 text-white admin-dark-card animate-slide-up">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0075FF] to-[#0052E0] flex items-center justify-center font-black text-xs shadow-md shadow-[#0075FF]/40">
                  {selectedQuestionIds.length}
                </div>
                <div>
                  <h4
                    className="text-xs font-black text-white leading-tight"
                    style={{ color: '#ffffff' }}
                  >
                    {selectedQuestionIds.length} Questions Selected
                  </h4>
                  <p className="text-[10px] text-slate-400" style={{ color: '#94a3b8' }}>
                    Ready to attach to {test.title}
                  </p>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-700" />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  style={{ color: '#cbd5e1' }}
                >
                  Clear
                </button>

                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-black shadow-lg shadow-[#0075FF]/40 border border-[#0075FF]/60 px-4 py-1.5 rounded-full hover:scale-105 transition-transform"
                  onClick={handleAddSelectedQuestions}
                  disabled={isSaving || isTestLocked}
                  title={isTestLocked ? 'Questions locked for active Live Test' : undefined}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {isSaving ? 'Attaching...' : `Add Selected (${selectedQuestionIds.length})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
