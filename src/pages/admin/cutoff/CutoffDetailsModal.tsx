import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamLogoEmblem } from './ExamLogoEmblem';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffDetailsModalProps {
  co: AdminCutoffState;
}

export function CutoffDetailsModal({ co }: CutoffDetailsModalProps) {
  const { detailsItem, setDetailsItem } = co;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6. DETAILS MODAL                                                     */}
      {/* ==================================================================== */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <ExamLogoEmblem examName={detailsItem.exam} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {detailsItem.exam} ({detailsItem.year})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {detailsItem.stage} • {detailsItem.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailsItem(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Cutoff Marks</span>
                  <span className="text-xl font-bold text-slate-900">
                    {detailsItem.cutoffMarks.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Vacancies</span>
                  <span className="text-xl font-bold text-slate-900">{detailsItem.totalPosts}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Category</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium',
                      detailsItem.categoryBadgeClass
                    )}
                  >
                    {detailsItem.category}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Recruitment Stage</span>
                  <span className="font-medium text-slate-800">{detailsItem.stage}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Official Source</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">
                    {detailsItem.source || 'WBPRB Notice'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Added By</span>
                  <span className="font-medium text-slate-800">
                    {detailsItem.addedBy || 'Admin'}
                  </span>
                </div>
              </div>

              {detailsItem.notes && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-900 text-[11px] leading-relaxed">
                  <strong>Notes:</strong> {detailsItem.notes}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setDetailsItem(null)}
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
