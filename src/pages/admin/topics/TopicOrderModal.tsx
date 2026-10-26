import { ChevronDown, ChevronUp, X, GripVertical } from 'lucide-react';
import { TopicIconBadge } from './TopicIconBadge';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicOrderModalProps {
  tp: AdminTopicsState;
}

export function TopicOrderModal({ tp }: TopicOrderModalProps) {
  const {
    topicsList,
    subjectsList,
    isOrderModalOpen,
    setIsOrderModalOpen,
    isSubmitting,
    orderList,
    setOrderList,
    orderSubjectId,
    setOrderSubjectId,
    moveTopicOrder,
    handleSaveOrder,
  } = tp;
  return (
    <>
      {/* 6. TOPIC ORDER MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1024] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Topic Order</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Change the display sequence of topics for students
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Select subject to reorder */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Subject
                </label>
                <select
                  value={orderSubjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    setOrderSubjectId(subId);
                    const subTopics = topicsList
                      .filter((t) => t.subjectId === subId)
                      .sort((a, b) => a.orderIndex - b.orderIndex);
                    setOrderList(subTopics);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-700 dark:text-slate-200"
                >
                  {subjectsList.length === 0 && <option value="">No subjects</option>}
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
                {orderList.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="w-5 font-bold text-slate-400 text-center">{index + 1}</span>
                      <TopicIconBadge
                        name={item.name}
                        iconName={item.iconName}
                        className="w-6 h-6 shrink-0"
                      />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveTopicOrder(index, 'up')}
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        disabled={index === orderList.length - 1}
                        onClick={() => moveTopicOrder(index, 'down')}
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveOrder}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  Save Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
