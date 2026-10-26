import { Filter, LayoutGrid, List, Save, Search, SlidersHorizontal, Wand2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperToolbarProps {
  ws: LiveTestWorkspaceState;
}

export function PaperToolbar({ ws }: PaperToolbarProps) {
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    subjectFilter,
    setSubjectFilter,
    pageSize,
    setPageSize,
    uniqueSubjects,
    assignedQuestions,
    handleApplyDefaultsToAll,
    handleSaveAssigned,
    isSaving,
    isSectionalOpen,
    isTestLocked,
    setIsSectionalOpen,
  } = ws;
  return (
    <>
      {/* 5. QUESTION PAPER TOOLBAR (WHEN QUESTIONS EXIST) */}
      {assignedQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Count, Search, Subject Filter */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold">
                Paper Questions ({assignedQuestions.length})
              </span>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions in paper..."
                  className="pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-60 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 text-xs absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Subject filter dropdown */}
              {uniqueSubjects.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Subjects ({assignedQuestions.length})</option>
                    {uniqueSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right: View toggle & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Switcher: Table View vs Cards View */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                  title="Question Bank Style Table"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'cards'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                  title="Expanded Detailed Cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Page size dropdown (for table view) */}
              {viewMode === 'table' && (
                <select
                  value={pageSize}
                  onChange={(e) =>
                    setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="py-1.5 px-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none shadow-2xs cursor-pointer"
                  title="Questions per page"
                >
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value="all">Show All</option>
                </select>
              )}

              <Button
                size="sm"
                variant="outline"
                className={cn(
                  'text-xs font-bold shadow-2xs',
                  isSectionalOpen
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                )}
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />}
                onClick={() => setIsSectionalOpen((v) => !v)}
              >
                Sectional Marking
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={isTestLocked}
                className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs"
                leftIcon={<Wand2 className="w-3.5 h-3.5 text-amber-500" />}
                onClick={handleApplyDefaultsToAll}
                title="Auto-fill uniform standard scoring across all questions"
              >
                Auto Standard Marks
              </Button>

              <Button
                size="sm"
                disabled={isSaving || isTestLocked}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                leftIcon={<Save className="w-3.5 h-3.5" />}
                onClick={handleSaveAssigned}
              >
                {isSaving ? 'Saving…' : 'Save Order & Marks'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
