import { Edit2, Trash2, Search, X, ChevronDown, RotateCcw, Download } from 'lucide-react';
import { csvCell } from '@/utils/csvExport';
import { Button } from '@/components/common/Button';
import { inputCls } from './topicManageUtils';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface TopicManageFilterBarProps {
  tm: AdminTopicManageState;
}

export function TopicManageFilterBar({ tm }: TopicManageFilterBarProps) {
  const {
    subjects,
    chapters,
    search,
    setSearch,
    filterSubjectId,
    setFilterSubjectId,
    filterStatus,
    setFilterStatus,
    isSubjectDropdownOpen,
    setIsSubjectDropdownOpen,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    subjectDropdownRef,
    statusDropdownRef,
    subjectMap,
    questionCountsByTopic,
    filteredTopics,
    openEditSubjectModal,
    handleDeleteSubject,
  } = tm;
  return (
    <>
      {/* ── Filters Bar ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics by name…"
            className={`${inputCls} pl-10 text-xs`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subject Dropdown */}
        <div ref={subjectDropdownRef} className="relative min-w-[240px] sm:min-w-[260px]">
          <button
            type="button"
            onClick={() => {
              setIsSubjectDropdownOpen((v) => !v);
              setIsStatusDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <span className="truncate">
              {filterSubjectId === 'all'
                ? 'All Subjects'
                : subjectMap[filterSubjectId]?.name || 'All Subjects'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 ml-2 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isSubjectDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-full min-w-[260px] sm:min-w-[280px] rounded-xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 shadow-lg z-30 py-1.5 max-h-72 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setFilterSubjectId('all');
                  setIsSubjectDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  filterSubjectId === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                All Subjects ({chapters.length})
              </button>
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-3.5 py-2 transition-colors ${
                    filterSubjectId === s.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <button
                    type="button"
                    title={s.name}
                    onClick={() => {
                      setFilterSubjectId(s.id);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className="flex-1 text-left text-xs font-medium truncate cursor-pointer"
                  >
                    {s.name} ({chapters.filter((c) => c.subjectId === s.id).length})
                  </button>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      title={`Edit ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSubjectDropdownOpen(false);
                        openEditSubjectModal(s);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      title={`Delete ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSubjectDropdownOpen(false);
                        handleDeleteSubject(s);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div ref={statusDropdownRef} className="relative min-w-[130px]">
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen((v) => !v);
              setIsSubjectDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <span className="capitalize">
              {filterStatus === 'all' ? 'All Status' : filterStatus}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 ml-2 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isStatusDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-full rounded-xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 shadow-lg z-30 py-1">
              {(['all', 'active', 'inactive'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setFilterStatus(st);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {st === 'all' ? 'All Status' : st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Reset & Export */}
        <div className="flex items-center gap-2 ml-auto">
          {(search || filterSubjectId !== 'all' || filterStatus !== 'all') && (
            <Button
              onClick={() => {
                setSearch('');
                setFilterSubjectId('all');
                setFilterStatus('all');
              }}
              variant="outline"
              className="text-xs text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}

          <Button
            onClick={() => {
              const headers = [
                'ID',
                'Topic Name',
                'Subject',
                'Questions Count',
                'Status',
                'Updated At',
              ];
              const rows = filteredTopics.map((t, idx) => [
                idx + 1,
                t.name,
                subjectMap[t.subjectId]?.name || '',
                questionCountsByTopic[t.id] || 0,
                t.isActive ? 'Active' : 'Inactive',
                t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
              ]);
              const csv = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join(
                '\n'
              );
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'topics-export.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            className="text-xs text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>
    </>
  );
}
