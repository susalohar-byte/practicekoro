import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamLogoEmblem } from './ExamLogoEmblem';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffTablePanelProps {
  co: AdminCutoffState;
}

export function CutoffTablePanel({ co }: CutoffTablePanelProps) {
  const {
    cutoffsList,
    setFilterExam,
    setFilterYear,
    setAppliedFilters,
    selectedRowId,
    setSelectedRowId,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    setDetailsItem,
    setDeleteConfirmItem,
    setViewAllRecentOpen,
    filteredRows,
    handleOpenEditModal,
    handleDuplicate,
  } = co;
  return (
    <>
      {/* LEFT COLUMN: Main Table + Recent Cutoff Updates Sub-table */}
      <div className="lg:col-span-8 space-y-6">
        {/* 4A. MAIN CUTOFF TABLE */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">Exam</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Cutoff Marks</th>
                  <th className="py-3 px-4">Total Posts</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-xs">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No cutoff records found
                    </td>
                  </tr>
                ) : (
                  filteredRows
                    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                    .map((row, idx) => {
                      const isSelected = selectedRowId === row.id;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedRowId(row.id)}
                          className={cn(
                            'transition-colors cursor-pointer group',
                            isSelected
                              ? 'bg-blue-50/50 hover:bg-blue-50/70'
                              : 'hover:bg-slate-50/60'
                          )}
                        >
                          {/* # */}
                          <td className="py-3 px-4 text-center font-normal text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Exam */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <ExamLogoEmblem examName={row.exam} />
                              <span className="font-semibold text-slate-800">{row.exam}</span>
                            </div>
                          </td>

                          {/* Year */}
                          <td className="py-3 px-4 text-slate-600 font-normal">{row.year}</td>

                          {/* Stage */}
                          <td className="py-3 px-4 text-slate-600 font-normal">{row.stage}</td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide',
                                row.categoryBadgeClass
                              )}
                            >
                              {row.category}
                            </span>
                          </td>

                          {/* Cutoff Marks */}
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {row.cutoffMarks.toFixed(2)}
                          </td>

                          {/* Total Posts */}
                          <td className="py-3 px-4 text-slate-600 font-normal">{row.totalPosts}</td>

                          {/* Actions */}
                          <td
                            className="py-3 px-4 text-center relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                aria-label="More actions"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === row.id ? null : row.id);
                                }}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {activeMenuId === row.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    onClick={() => {
                                      setDetailsItem(row);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleOpenEditModal(row);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Edit Cutoff</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDuplicate(row);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Duplicate Record</span>
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={() => {
                                      setDeleteConfirmItem(row);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete Cutoff</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
              {Math.min(filteredRows.length, currentPage * rowsPerPage)} of {filteredRows.length}{' '}
              records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2563EB] text-white font-medium shadow-2xs"
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                2
              </button>
              <button
                onClick={() => setCurrentPage(3)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                3
              </button>
              <button
                onClick={() => setCurrentPage(4)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                4
              </button>
              <button
                onClick={() => setCurrentPage(5)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                5
              </button>
              <span className="px-1 text-slate-400">...</span>

              <button
                aria-label="Next page"
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="relative ml-2">
                <select
                  aria-label="Rows per page"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="appearance-none border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 bg-white pr-6 cursor-pointer focus:outline-none"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 4B. RECENT CUTOFF UPDATES SUB-TABLE */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Recent Cutoff Updates</h2>
            <button
              onClick={() => setViewAllRecentOpen(true)}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Exam</th>
                  <th className="py-2.5 px-3">Year</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Added On</th>
                  <th className="py-2.5 px-3">Added By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-xs">
                {cutoffsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No recent cutoff updates recorded
                    </td>
                  </tr>
                ) : (
                  cutoffsList.slice(0, 5).map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setFilterExam(item.exam);
                        setFilterYear(String(item.year));
                        setAppliedFilters((prev) => ({
                          ...prev,
                          exam: item.exam,
                          year: String(item.year),
                        }));
                      }}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 text-center text-slate-500 font-normal">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <ExamLogoEmblem examName={item.exam} />
                          <span className="font-semibold text-slate-800">{item.exam}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-normal">{item.year}</td>
                      <td className="py-3 px-3 text-slate-600 font-normal">{item.stage}</td>
                      <td className="py-3 px-3 text-slate-600 font-normal">{item.addedOn}</td>
                      <td className="py-3 px-3 text-slate-600 font-normal">{item.addedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
