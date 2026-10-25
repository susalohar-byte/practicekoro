import { Radio, Calendar, CheckCircle2, Users } from 'lucide-react';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestsStatCardsProps {
  live: AdminLiveTestsState;
}

export function LiveTestsStatCards({ live }: LiveTestsStatCardsProps) {
  const { statsError, stats } = live;
  return (
    <>
      {/* Top 4 KPI Cards Matching Reference Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Now */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Live Now</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.liveCount}</h3>
            <p className="text-xs text-slate-400 mt-1">test is currently live</p>
          </div>
        </div>

        {/* Card 2: Scheduled */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Scheduled</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.upcomingCount}</h3>
            <p className="text-xs text-slate-400 mt-1">upcoming live tests</p>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.endedCount}</h3>
            <p className="text-xs text-slate-400 mt-1">live tests finished</p>
          </div>
        </div>

        {/* Card 4: Total Participants */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-500 border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Total Participants</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {statsError ? '—' : stats.totalParticipants.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {statsError ? 'stats unavailable' : 'students who sat a live test'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
