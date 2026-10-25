import { Trash2, X, FolderKanban } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AdminExamsState } from './useAdminExams';

export interface ExamCategoriesModalProps {
  qb: AdminExamsState;
}

export function ExamCategoriesModal({ qb }: ExamCategoriesModalProps) {
  const {
    exams,
    categories,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    newCategoryInput,
    setNewCategoryInput,
    handleAddCategory,
    handleDeleteCategory,
  } = qb;
  return (
    <>
      {/* MODAL: Categories Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#026BFC]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Manage Exam Categories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Manage examination categories for grouping target exams across the platform.
            </p>

            {/* Add Category Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      {
                        exams.filter((e) => e.category.toLowerCase().includes(cat.toLowerCase()))
                          .length
                      }{' '}
                      exams
                    </span>
                    <button
                      type="button"
                      title="Delete category"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
