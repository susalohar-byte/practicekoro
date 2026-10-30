import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { api } from '@/services/api';
import type { AdminExamsState } from './useAdminExams';

export interface ExamCategoryPillsProps {
  qb: AdminExamsState;
}

export function ExamCategoryPills({ qb }: ExamCategoryPillsProps) {
  const {
    exams,
    selectedCategory,
    setSelectedCategory,
    setAppliedFilters,
    setCurrentPage,
    setActionSuccessMessage,
    categories,
    setCategories,
    categoryIds,
    setFormError,
  } = qb;
  return (
    <>
      {/* Category Pills Bar */}
      {categories.length > 0 && (
        <div
          role="region"
          aria-label="Exam categories"
          tabIndex={0}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {categories.map((cat, idx) => (
            <div
              key={cat}
              draggable
              title={`Drag to reorder "${cat}"`}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={async (e) => {
                e.preventDefault();
                const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                if (isNaN(fromIdx) || fromIdx === idx) return;
                const previous = categories;
                const updated = [...categories];
                const [moved] = updated.splice(fromIdx, 1);
                updated.splice(idx, 0, moved);
                setCategories(updated);
                try {
                  await api.reorderExamCategories(
                    updated.map((c, i) => ({ id: categoryIds[c], name: c, orderIndex: i + 1 }))
                  );
                  setActionSuccessMessage('Categories reordered.');
                } catch (err) {
                  setCategories(previous);
                  setFormError(getErrorMessage(err, 'Category order could not be saved.'));
                }
              }}
              onClick={() => {
                const next = selectedCategory === cat ? 'all' : cat;
                setSelectedCategory(next);
                setAppliedFilters((prev) => ({ ...prev, category: next }));
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all border flex items-center gap-1.5 select-none',
                selectedCategory === cat
                  ? 'bg-[#026BFC] text-white border-[#026BFC] shadow-2xs'
                  : 'bg-white dark:bg-[#0A1024] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-blue-400'
              )}
            >
              <GripVertical className="w-3 h-3 opacity-60 shrink-0" />
              <span>{cat}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  selectedCategory === cat
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                )}
              >
                {
                  exams.filter(
                    (e) => (e.category || '').trim().toLowerCase() === cat.trim().toLowerCase()
                  ).length
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
