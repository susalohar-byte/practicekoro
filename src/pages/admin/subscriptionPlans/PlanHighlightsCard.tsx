import { Smartphone, FileText, BookOpen, BarChart2, Headphones } from 'lucide-react';

export function PlanHighlightsCard() {
  return (
    <>
      {/* COL 2 (3 COLS): PLAN HIGHLIGHTS */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Plan Highlights</h3>

        <div className="space-y-3.5 text-xs">
          {/* Highlight 1 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 text-sm mt-0.5">
              ₹
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Affordable Plans</h4>
              <p className="text-[11px] text-slate-500">Quality education at low cost</p>
            </div>
          </div>

          {/* Highlight 2 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Access Everywhere</h4>
              <p className="text-[11px] text-slate-500">Study on web & mobile</p>
            </div>
          </div>

          {/* Highlight 3 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Real Exam Pattern</h4>
              <p className="text-[11px] text-slate-500">Updated content regularly</p>
            </div>
          </div>

          {/* Highlight 4 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Detailed Explanations</h4>
              <p className="text-[11px] text-slate-500">Short notes for every question</p>
            </div>
          </div>

          {/* Highlight 5 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Rank Tracking</h4>
              <p className="text-[11px] text-slate-500">Compare with other students</p>
            </div>
          </div>

          {/* Highlight 6 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">24/7 Support</h4>
              <p className="text-[11px] text-slate-500">Get help anytime</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
