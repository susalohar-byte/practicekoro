import { ArrowUpDown, X, MoveUp, MoveDown } from 'lucide-react';
import { BannerVisual } from './BannerVisual';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerOrderModalProps {
  bn: AdminBannersState;
}

export function BannerOrderModal({ bn }: BannerOrderModalProps) {
  const {
    isOrderModalOpen,
    setIsOrderModalOpen,
    reorderedList,
    handleMoveUp,
    handleMoveDown,
    handleSaveOrder,
  } = bn;
  return (
    <>
      {/* =================================================================== */}
      {/* MODAL 1: BANNER ORDER MODAL (Reorder)                                */}
      {/* =================================================================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#026BFC]" />
                  <span>Banner Display Order</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reorder banners to change their carousel priority on website and app.
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-2 flex-1">
              {reorderedList.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-14 h-8 rounded overflow-hidden border border-slate-200 shrink-0">
                      <BannerVisual banner={item} />
                    </div>

                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-slate-800 block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {item.bannerType} • {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === reorderedList.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
