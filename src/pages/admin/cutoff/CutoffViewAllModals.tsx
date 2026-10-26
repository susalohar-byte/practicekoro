import { X } from 'lucide-react';
import { RECENT_UPDATES, GENERAL_TREND_DATA, YEAR_WISE_COMPARISON } from './demoCutoffs';
import { ExamLogoEmblem } from './ExamLogoEmblem';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffViewAllModalsProps {
  co: AdminCutoffState;
}

export function CutoffViewAllModals({ co }: CutoffViewAllModalsProps) {
  const {
    viewAllTrendOpen,
    setViewAllTrendOpen,
    viewAllRecentOpen,
    setViewAllRecentOpen,
    viewAllComparisonOpen,
    setViewAllComparisonOpen,
  } = co;
  return (
    <>
      {/* ==================================================================== */}
      {/* 8. VIEW ALL MODALS (Trend, Recent, Comparison)                       */}
      {/* ==================================================================== */}
      {viewAllTrendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Historical Cutoff Trend — WBP Constable
              </h3>
              <button
                onClick={() => setViewAllTrendOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-2.5 text-xs">
                {GENERAL_TREND_DATA.map((t, i) => (
                  <div
                    key={t.year}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="font-semibold text-slate-800">{t.year}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">Threshold:</span>
                      <span className="font-bold text-blue-600">{t.value.toFixed(2)}</span>
                      {i > 0 && (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{(t.value - GENERAL_TREND_DATA[i - 1].value).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewAllRecentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">All Recent Cutoff Updates</h3>
              <button
                onClick={() => setViewAllRecentOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="divide-y divide-slate-100 text-xs">
                {RECENT_UPDATES.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <ExamLogoEmblem examName={item.exam} />
                      <div>
                        <div className="font-semibold text-slate-800">{item.exam}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.year} • {item.stage}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-600 font-medium">{item.addedOn}</div>
                      <div className="text-[10px] text-slate-400">By {item.addedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewAllComparisonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Comprehensive Year-wise Cutoff Comparison
              </h3>
              <button
                onClick={() => setViewAllComparisonOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2">Year</th>
                    {['General', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS'].map((c) => (
                      <th key={c} className="py-2 text-right">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {['2019', '2020', '2021', '2022', '2023', '2024'].map((yr) => (
                    <tr key={yr} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{yr}</td>
                      {['General', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS'].map((cat) => {
                        const val =
                          YEAR_WISE_COMPARISON[cat]?.find((d) => d.year === yr)?.value || 0;
                        return (
                          <td key={cat} className="py-2.5 text-right font-semibold">
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
