import { BookOpen, FolderTree, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface TopicManageHeaderProps {
  tm: AdminTopicManageState;
}

export function TopicManageHeader({ tm }: TopicManageHeaderProps) {
  const {
    subjects,
    setIsManageSubjectsModalOpen,
    isAddTopicDropdownOpen,
    setIsAddTopicDropdownOpen,
    addTopicDropdownRef,
    openCreateSubjectModal,
    openCreateTopicModal,
  } = tm;
  return (
    <>
      {/* ── Page Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Topic Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage, filter, and organize academic topics across your subjects
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Topic dropdown */}
          <div ref={addTopicDropdownRef} className="relative">
            <Button
              onClick={() => setIsAddTopicDropdownOpen((v) => !v)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Topic
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isAddTopicDropdownOpen ? 'rotate-180' : ''}`}
              />
            </Button>
            {isAddTopicDropdownOpen && subjects.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 shadow-lg z-30 py-1 max-h-60 overflow-y-auto">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openCreateTopicModal(s.id)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Subject */}
          <Button
            onClick={openCreateSubjectModal}
            variant="outline"
            className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </Button>

          {/* Manage Subjects Modal Button */}
          <Button
            onClick={() => setIsManageSubjectsModalOpen(true)}
            variant="outline"
            className="border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Manage Subjects ({subjects.length})</span>
          </Button>
        </div>
      </div>
    </>
  );
}
