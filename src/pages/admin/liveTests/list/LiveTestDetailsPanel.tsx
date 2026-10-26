import { Radio, ExternalLink, X, Edit, Monitor, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveTestOverviewTab } from './LiveTestOverviewTab';
import { LiveTestDetailsTabs } from './LiveTestDetailsTabs';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestDetailsPanelProps {
  live: AdminLiveTestsState;
}

export function LiveTestDetailsPanel({ live }: LiveTestDetailsPanelProps) {
  const {
    setSelectedTestId,
    isDrawerOpen,
    setIsDrawerOpen,
    drawerTab,
    setDrawerTab,
    setIsCreateModalOpen,
    setEditingTest,
    setIsMonitorModalOpen,
    selectedLiveTest,
    selectedPaperQuestions,
    openPaperQuestions,
  } = live;
  return (
    <>
      {/* Right Column: Live Test Details Panel (Sticky side-by-side like Mock Tests & Question Bank) */}
      {isDrawerOpen && selectedLiveTest && (
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col max-h-[calc(100vh-5rem)] self-start sticky top-4 animate-in fade-in-50 duration-200 overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Test Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview, candidate leaderboard & controls
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedTestId(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Close details"
              title="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Top Identity Card */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white shrink-0 p-1 flex items-center justify-center shadow-xs">
                  <img
                    src={
                      selectedLiveTest.logo ||
                      selectedLiveTest.examLogo ||
                      '/images/exams/logo_wbp.png'
                    }
                    alt={selectedLiveTest.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {selectedLiveTest.title}
                    </h3>
                    {/* Dynamic Live Status Badge */}
                    {selectedLiveTest.status === 'live' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span>Live Now</span>
                      </span>
                    )}
                    {(selectedLiveTest.status === 'upcoming' ||
                      selectedLiveTest.status === 'scheduled') && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                        Scheduled
                      </span>
                    )}
                    {selectedLiveTest.status === 'draft' && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                        Draft
                      </span>
                    )}
                    {(selectedLiveTest.status === 'ended' ||
                      selectedLiveTest.status === 'completed') && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                        Completed
                      </span>
                    )}
                    {selectedLiveTest.status === 'cancelled' && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        Cancelled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedLiveTest.examTitle || selectedLiveTest.test?.examTitle || '—'} • Full
                    Mock Test
                  </p>
                </div>
              </div>

              {/* Top Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => openPaperQuestions(selectedLiveTest)}
                  className="col-span-2 inline-flex items-center justify-center gap-2 py-2 px-3.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {selectedLiveTest.status === 'draft' ? 'Upload Questions' : 'View Questions'} (
                    {selectedPaperQuestions})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonitorModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Monitor className="w-3.5 h-3.5 shrink-0" />
                  <span>Live Monitor</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTest(selectedLiveTest);
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>

            {/* Drawer Tabs Navigation */}
            <div className="border-b border-slate-200">
              <div className="flex items-center gap-6 text-xs font-medium">
                {(['overview', 'participants', 'settings', 'analytics'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDrawerTab(tab)}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2 capitalize font-semibold cursor-pointer text-xs',
                      drawerTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <LiveTestOverviewTab live={live} />

            <LiveTestDetailsTabs live={live} />
          </div>
        </div>
      )}
    </>
  );
}
