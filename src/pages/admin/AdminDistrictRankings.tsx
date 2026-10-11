import { csvCell } from '@/utils/csvExport';
import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  MapPin,
  Users,
  FileText,
  Target,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Crown,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import {
  getAdminDistrictRankings,
  type AdminDistrictRankingRow,
} from '@/services/domains/admin.analytics';
import { getDateRangeBounds } from '@/services/domains/admin.dashboard';

// ============================================================================
// DATA MODEL
// ============================================================================

export interface DistrictRankData extends AdminDistrictRankingRow {
  /** Rank among districts with a computed average; null for unranked rows. */
  rank: number | null;
}

const NOT_SPECIFIED = 'Not specified';
const TIME_PERIODS = ['Last 30 Days', 'This Month', 'Last 7 Days', 'All Time'] as const;

const formatPercent = (value: number | null) =>
  value === null || !Number.isFinite(value) ? '—' : `${Math.round(value * 10) / 10}%`;

/** Ranks come only from real results: districts with a real average, best first. */
export function rankDistricts(rows: AdminDistrictRankingRow[]): DistrictRankData[] {
  const sorted = [...rows].sort((a, b) => {
    // The "Not specified" bucket is reported but never ranked as a district.
    const aRankable = a.district !== NOT_SPECIFIED && a.avgPercentage !== null;
    const bRankable = b.district !== NOT_SPECIFIED && b.avgPercentage !== null;
    if (aRankable !== bRankable) return aRankable ? -1 : 1;
    return (
      (b.avgPercentage ?? -1) - (a.avgPercentage ?? -1) ||
      b.attemptsCount - a.attemptsCount ||
      a.district.localeCompare(b.district)
    );
  });
  let next = 0;
  return sorted.map((row) => ({
    ...row,
    rank: row.district !== NOT_SPECIFIED && row.avgPercentage !== null ? ++next : null,
  }));
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminDistrictRankings: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters (exam and time period map to the server aggregation; district filters rows)
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All Districts');
  const [timePeriod, setTimePeriod] = useState<(typeof TIME_PERIODS)[number]>('Last 30 Days');

  const [districtsList, setDistrictsList] = useState<DistrictRankData[]>([]);

  useEffect(() => {
    let isMounted = true;
    api
      .getAllAdminExams()
      .then((list) => {
        if (isMounted)
          setExams((list || []).map((e: any) => ({ id: e.id, title: e.title || e.id })));
      })
      .catch((err) => {
        // The exam filter is optional; rankings still load for all exams.
        console.warn('Failed to load exams for district rankings filter:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    setLoadError(null);
    const bounds = timePeriod === 'All Time' ? null : getDateRangeBounds(timePeriod);
    getAdminDistrictRankings({
      examId: selectedExam || null,
      fromIso: bounds?.startIso ?? null,
      toIso: bounds?.endIso ?? null,
    })
      .then((rows) => {
        if (isMounted) setDistrictsList(rankDistricts(rows));
      })
      .catch((err) => {
        if (!isMounted) return;
        setDistrictsList([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load district rankings.');
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedExam, timePeriod, reloadKey]);

  // Pagination & View Mode
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);

  // Summary metrics computed from the real rows
  const totalStudentsCount = useMemo(
    () => districtsList.reduce((sum, d) => sum + d.studentCount, 0),
    [districtsList]
  );
  const totalAttempts = useMemo(
    () => districtsList.reduce((sum, d) => sum + d.attemptsCount, 0),
    [districtsList]
  );
  const overallAverage = useMemo(() => {
    // Attempt-weighted so each completed attempt counts once, like the per-district averages.
    const scored = districtsList.filter((d) => d.avgPercentage !== null && d.attemptsCount > 0);
    const weight = scored.reduce((sum, d) => sum + d.attemptsCount, 0);
    if (!weight) return null;
    return scored.reduce((sum, d) => sum + (d.avgPercentage as number) * d.attemptsCount, 0) / weight;
  }, [districtsList]);
  const rankedDistrictsCount = useMemo(
    () => districtsList.filter((d) => d.rank !== null).length,
    [districtsList]
  );

  // Filtered districts
  const filteredDistricts = useMemo(
    () =>
      districtsList.filter(
        (d) => selectedDistrictFilter === 'All Districts' || d.district === selectedDistrictFilter
      ),
    [districtsList, selectedDistrictFilter]
  );

  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? Math.max(1, filteredDistricts.length) : pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredDistricts.length / effectivePageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const startIndex =
    filteredDistricts.length === 0 ? 0 : isAll ? 0 : (currentPage - 1) * effectivePageSize;
  const endIndex = isAll
    ? filteredDistricts.length
    : Math.min(currentPage * effectivePageSize, filteredDistricts.length);

  const displayedDistricts = useMemo(() => {
    if (filteredDistricts.length === 0) return [];
    if (isAll) return filteredDistricts;
    return filteredDistricts.slice(startIndex, endIndex);
  }, [filteredDistricts, isAll, startIndex, endIndex]);

  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'District',
      'Students',
      'Completed Attempts',
      'Avg. Score %',
      'Top Student',
      'Top Student Avg. %',
    ];
    const rows = filteredDistricts.map((d) => [
      d.rank ?? '—',
      d.district,
      d.studentCount,
      d.attemptsCount,
      formatPercent(d.avgPercentage),
      d.topStudentName || '—',
      formatPercent(d.topStudentScore),
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join(
      '\n'
    );
    const examTitle = exams.find((e) => e.id === selectedExam)?.title || 'All_Exams';
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    link.setAttribute(
      'download',
      `practicekoro_district_rankings_${examTitle.replace(/\s+/g, '_')}_${timePeriod.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSelectedExam('');
    setSelectedDistrictFilter('All Districts');
    setTimePeriod('Last 30 Days');
    setCurrentPage(1);
  };

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const selectClass =
    'w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7';

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">District Rankings</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            District-wise performance of students from completed test attempts. Compare
            participation, scores and top performers.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredDistricts.length === 0}
          className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Export District Rankings</span>
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl p-4 border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between"
        >
          <div>
            <span className="font-bold mr-1">District rankings unavailable:</span> {loadError}
          </div>
          <button
            type="button"
            onClick={retry}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold inline-flex items-center gap-1 text-xs shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Ranked Districts</p>
            <span className="text-xl font-black text-[#0F172A] tracking-tight">
              {loadError ? '—' : rankedDistrictsCount}
            </span>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">with completed attempts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Students</p>
            <span className="text-xl font-black text-[#0F172A] tracking-tight">
              {loadError ? '—' : totalStudentsCount.toLocaleString('en-IN')}
            </span>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">with completed attempts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Completed Attempts</p>
            <span className="text-xl font-black text-[#0F172A] tracking-tight">
              {loadError ? '—' : totalAttempts.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Avg. Score</p>
            <span className="text-xl font-black text-[#0F172A] tracking-tight">
              {loadError ? '—' : formatPercent(overallAverage)}
            </span>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">score / total marks</p>
          </div>
        </div>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-end gap-3">
        <div className="w-[160px]">
          <label
            htmlFor="select-exam-filter"
            className="block text-[11px] font-semibold text-[#64748B] mb-1"
          >
            Select Exam
          </label>
          <div className="relative">
            <select
              id="select-exam-filter"
              value={selectedExam}
              onChange={(e) => {
                setSelectedExam(e.target.value);
                setCurrentPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="w-[150px]">
          <label
            htmlFor="select-district-filter"
            className="block text-[11px] font-semibold text-[#64748B] mb-1"
          >
            Select District
          </label>
          <div className="relative">
            <select
              id="select-district-filter"
              value={selectedDistrictFilter}
              onChange={(e) => {
                setSelectedDistrictFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectClass}
            >
              <option value="All Districts">All Districts</option>
              {districtsList.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="w-[130px]">
          <label
            htmlFor="select-time-period"
            className="block text-[11px] font-semibold text-[#64748B] mb-1"
          >
            Time Period
          </label>
          <div className="relative">
            <select
              id="select-time-period"
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value as (typeof TIME_PERIODS)[number]);
                setCurrentPage(1);
              }}
              className={selectClass}
            >
              {TIME_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2 py-2 cursor-pointer h-[34px] flex items-center"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT: TABLE (LEFT) + TOP DISTRICTS (RIGHT) */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        <div className="flex-1 w-full min-w-0 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] shadow-2xs">
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center bg-[#F8FAFC]">
                      #
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[170px] bg-[#F8FAFC]">
                      District
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px] bg-[#F8FAFC]">
                      Students
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px] bg-[#F8FAFC]">
                      Completed Attempts
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[80px] bg-[#F8FAFC]">
                      Avg. Score
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[150px] bg-[#F8FAFC]">
                      Top Student
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {displayedDistricts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        {loadError
                          ? 'District rankings could not be loaded.'
                          : 'No completed student attempts found for these filters.'}
                      </td>
                    </tr>
                  ) : (
                    displayedDistricts.map((district) => (
                      <tr
                        key={district.district}
                        className="hover:bg-[#F8FAFC] transition-colors text-xs"
                      >
                        <td className="py-3 px-3.5 text-center">
                          {district.rank === 1 && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-amber-300">
                              1
                            </div>
                          )}
                          {district.rank === 2 && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-300 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-slate-200">
                              2
                            </div>
                          )}
                          {district.rank === 3 && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-orange-300">
                              3
                            </div>
                          )}
                          {(district.rank === null || district.rank > 3) && (
                            <span className="font-bold text-[#64748B]">
                              {district.rank ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0" />
                            <span className="font-bold text-[#0F172A] leading-tight truncate">
                              {district.district}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                          {district.studentCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                          {district.attemptsCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {district.avgPercentage === null ? (
                            <span className="text-[#94A3B8]">—</span>
                          ) : (
                            <span
                              className={cn(
                                'text-[11px] font-bold px-2 py-0.5 rounded inline-block',
                                district.avgPercentage >= 75
                                  ? 'bg-[#DCFCE7] text-[#16A34A]'
                                  : district.avgPercentage >= 50
                                    ? 'bg-[#FEF3C7] text-[#D97706]'
                                    : 'bg-[#FFEDD5] text-[#EA580C]'
                              )}
                            >
                              {formatPercent(district.avgPercentage)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {district.topStudentName ? (
                            <div className="flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="font-semibold text-[#0F172A] truncate">
                                {district.topStudentName}
                              </span>
                              <span className="text-[#64748B]">
                                ({formatPercent(district.topStudentScore)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & List Summary Footer */}
            <div className="py-3 px-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#64748B] font-medium">
                {filteredDistricts.length === 0
                  ? 'Showing 0 of 0 districts'
                  : isAll
                    ? `Showing all ${filteredDistricts.length} districts`
                    : `Showing ${startIndex + 1}–${endIndex} of ${filteredDistricts.length} districts`}
              </span>

              {!isAll && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      aria-label={`Page ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                        currentPage === pageNum
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'text-[#64748B] hover:bg-slate-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="relative">
                <select
                  aria-label="Districts per page"
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value="all">All districts</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TOP 5 DISTRICTS (real ranked rows) */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-3">
              <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />
              <h3 className="text-xs font-bold text-[#0F172A]">Top 5 Districts</h3>
            </div>
            {districtsList.filter((d) => d.rank !== null).length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No ranked districts for these filters.
              </p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {districtsList
                  .filter((d) => d.rank !== null)
                  .slice(0, 5)
                  .map((d) => (
                    <div key={d.district} className="flex items-center gap-2">
                      <span className="w-3 text-center text-[11px] font-bold text-slate-500">
                        {d.rank}
                      </span>
                      <span className="w-28 text-[11px] font-semibold text-[#1E293B] truncate">
                        {d.district}
                      </span>
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2563EB]"
                          style={{
                            width: `${Math.min(100, Math.max(0, d.avgPercentage ?? 0))}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-[11px] font-bold text-[#0F172A]">
                        {formatPercent(d.avgPercentage)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    { label: 'Loading district rankings…', variant: 'dashboard' }
  );
};
