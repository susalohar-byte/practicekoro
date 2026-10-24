import { X, Edit2, Shuffle, Check, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadMode, withCurrentOption, QuestionBankStatus } from './questionBankUtils';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionDetailsDrawerProps {
  qb: AdminQuestionBankState;
}

export function QuestionDetailsDrawer({ qb }: QuestionDetailsDrawerProps) {
  const {
    activeQuestion,
    liveTestTitleFor,
    showToast,
    setActiveQuestion,
    setDrawerTab,
    drawerTab,
    drawerBengaliText,
    setDrawerBengaliText,
    drawerEnglishText,
    setDrawerEnglishText,
    handleShuffleDrawerOptions,
    drawerCorrectOption,
    setDrawerCorrectOption,
    drawerOptions,
    setDrawerOptions,
    drawerUploadMode,
    setDrawerUploadMode,
    drawerExam,
    setDrawerExam,
    exams,
    drawerSubject,
    setDrawerSubject,
    subjects,
    drawerTopic,
    setDrawerTopic,
    drawerTopicNames,
    drawerType,
    setDrawerType,
    drawerYear,
    setDrawerYear,
    drawerSource,
    setDrawerSource,
    drawerStatus,
    setDrawerStatus,
    drawerTags,
    handleRemoveDrawerTag,
    newTagInput,
    setNewTagInput,
    handleAddDrawerTag,
    handleDeleteActiveQuestion,
    isUpdatingDrawer,
    handleUpdateDrawer,
    editExplanationBengali,
    setEditExplanationBengali,
    editExplanation,
    setEditExplanation,
  } = qb;
  return (
    <>
      {/* RIGHT COLUMN: QUESTION DETAILS DRAWER (Matching media_1791132993733.jpg) */}
      {activeQuestion && (
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden animate-in slide-in-from-right-4">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Question Details</h3>
              <span
                className="text-[10px] font-mono text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                title={`Click to copy database ID: ${activeQuestion.id}`}
                onClick={() => {
                  navigator.clipboard.writeText(activeQuestion.id);
                  showToast('Question ID copied to clipboard');
                }}
              >
                #{activeQuestion.id.slice(0, 8)}…
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveQuestion(null);
              }}
              title="Close Details"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Tabs: Details, Explanation, History */}
          <div className="flex items-center border-b border-slate-100 px-4 text-xs font-bold text-slate-500">
            {(['details', 'explanation', 'history'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setDrawerTab(tab)}
                className={cn(
                  'py-2.5 px-3 border-b-2 transition-all capitalize whitespace-nowrap cursor-pointer',
                  drawerTab === tab
                    ? 'border-[#026BFC] text-[#026BFC]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* DRAWER TAB 1: DETAILS */}
          {drawerTab === 'details' && (
            <div className="p-4 space-y-4">
              {/* Question (Bengali) Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Question (Bengali)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('drawer-bengali-textarea');
                      el?.focus();
                      showToast('Focusing Bengali question field.');
                    }}
                    className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <textarea
                  id="drawer-bengali-textarea"
                  rows={2}
                  value={drawerBengaliText}
                  onChange={(e) => setDrawerBengaliText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              {/* Question (English) Box */}
              <div>
                <label
                  htmlFor="drawer-english-textarea"
                  className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                >
                  Question (English)
                </label>
                <textarea
                  id="drawer-english-textarea"
                  rows={2}
                  value={drawerEnglishText}
                  onChange={(e) => setDrawerEnglishText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              {/* Options Box with Shuffle & Add Option */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Options
                  </label>
                  <button
                    type="button"
                    onClick={handleShuffleDrawerOptions}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" /> Shuffle Options
                  </button>
                </div>

                <div className="space-y-2">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const isCorrect = drawerCorrectOption === optKey;
                    return (
                      <div
                        key={optKey}
                        onClick={() => setDrawerCorrectOption(optKey)}
                        className={cn(
                          'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer',
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-200'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                        )}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2 bg-transparent">
                          <span
                            className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            )}
                          >
                            {optKey}
                          </span>
                          <input
                            type="text"
                            value={drawerOptions[optKey] || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setDrawerOptions({
                                ...drawerOptions,
                                [optKey]: e.target.value,
                              })
                            }
                            autoComplete="off"
                            spellCheck={false}
                            className={cn(
                              'admin-drawer-option-input admin-transparent-input w-full bg-transparent border-0 outline-none shadow-none text-xs font-medium focus:outline-none focus:ring-0 p-0 m-0',
                              isCorrect
                                ? 'text-emerald-950 dark:text-emerald-100 font-semibold'
                                : 'text-slate-800 dark:text-slate-200'
                            )}
                            style={{
                              backgroundColor: 'transparent',
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              boxShadow: 'none',
                            }}
                          />
                        </div>

                        {isCorrect && (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    showToast('Option fields are fully editable above.');
                  }}
                  className="w-full mt-2 py-2 text-center text-xs font-bold text-[#026BFC] hover:underline cursor-pointer"
                >
                  + Add Option
                </button>
              </div>

              {/* 2-Column Metadata Grid matching reference image */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Upload Mode
                  </label>
                  {activeQuestion.isLiveOnly ? (
                    <div className="w-full p-2 bg-rose-50 border border-rose-200 rounded-xl font-semibold text-rose-700">
                      Live Test · {liveTestTitleFor(activeQuestion.id)}
                    </div>
                  ) : (
                    <select
                      value={drawerUploadMode}
                      onChange={(e) => setDrawerUploadMode(e.target.value as UploadMode)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="exam">By Exam</option>
                      <option value="subject">By Subject</option>
                    </select>
                  )}
                </div>

                {drawerUploadMode === 'exam' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Exam</label>
                    <select
                      value={drawerExam}
                      onChange={(e) => setDrawerExam(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="">—</option>
                      {withCurrentOption(
                        exams.map((ex) => ex.title),
                        drawerExam
                      ).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Subject
                    </label>
                    <select
                      value={drawerSubject}
                      onChange={(e) => setDrawerSubject(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="">—</option>
                      {withCurrentOption(
                        subjects.map((sub) => sub.name),
                        drawerSubject
                      ).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {drawerUploadMode === 'exam' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Subject
                    </label>
                    <select
                      value={drawerSubject}
                      onChange={(e) => setDrawerSubject(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="">—</option>
                      {withCurrentOption(
                        subjects.map((sub) => sub.name),
                        drawerSubject
                      ).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Topic</label>
                  <select
                    value={drawerTopic}
                    onChange={(e) => setDrawerTopic(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="">—</option>
                    {withCurrentOption(drawerTopicNames, drawerTopic).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Question Type
                  </label>
                  <select
                    value={drawerType}
                    onChange={(e) => setDrawerType(e.target.value as 'PYQ' | 'Topic' | 'Full Mock')}
                    className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="PYQ">PYQ</option>
                    <option value="Full Mock">Full Mock</option>
                    <option value="Topic">Topic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Year</label>
                  <select
                    value={drawerYear}
                    onChange={(e) => setDrawerYear(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="">—</option>
                    {withCurrentOption(
                      ['2026', '2025', '2024', '2023', '2022'],
                      drawerYear ? String(drawerYear) : ''
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Source</label>
                  <select
                    value={drawerSource}
                    onChange={(e) => setDrawerSource(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="Official PYQ">Official PYQ</option>
                    <option value="Original">Original</option>
                    <option value="Reference">Reference</option>
                    <option value="AI-assisted">AI-assisted</option>
                  </select>
                </div>
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
                <select
                  value={drawerStatus}
                  onChange={(e) => setDrawerStatus(e.target.value as QuestionBankStatus)}
                  className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs cursor-pointer"
                >
                  <option value="published">Published</option>
                  <option value="under_review">Under Review</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {drawerTags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveDrawerTag(t)}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDrawerTag();
                      }
                    }}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDrawerTag}
                    className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 shrink-0 hover:bg-slate-200 cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDeleteActiveQuestion}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdatingDrawer}
                  onClick={handleUpdateDrawer}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isUpdatingDrawer ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Update Question</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* DRAWER TAB 2: EXPLANATION */}
          {drawerTab === 'explanation' && (
            <div className="p-4 space-y-4 text-xs">
              <div>
                <label
                  htmlFor="drawer-explanation-bengali"
                  className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase"
                >
                  Explanation (Bengali)
                </label>
                <textarea
                  id="drawer-explanation-bengali"
                  rows={6}
                  value={editExplanationBengali}
                  onChange={(e) => setEditExplanationBengali(e.target.value)}
                  placeholder="Enter detailed explanation of why the correct option is right..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] font-medium text-slate-900 focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="drawer-explanation-english"
                  className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase"
                >
                  Explanation (English)
                </label>
                <textarea
                  id="drawer-explanation-english"
                  rows={6}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  placeholder="Enter detailed explanation of why the correct option is right..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] font-medium text-slate-900 focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdateDrawer}
                  className="px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer"
                >
                  Save Explanation
                </button>
              </div>
            </div>
          )}

          {/* DRAWER TAB 4: HISTORY */}
          {drawerTab === 'history' && (
            <div className="p-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <p className="font-bold text-slate-900">Author & Audit Trail</p>
                <p className="text-slate-500">
                  Created By: <span className="font-semibold text-slate-800">Super Admin</span>
                </p>
                <p className="text-slate-500">
                  Last Updated:{' '}
                  <span className="font-semibold text-slate-800">2026-09-15 11:05</span>
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Version History
                </h4>
                <div className="space-y-2.5">
                  {(
                    activeQuestion.versionHistory || [
                      {
                        version: 1,
                        editedBy: 'Super Admin',
                        editedAt: '2026-09-10 10:00',
                        changes: 'Initial question creation',
                      },
                    ]
                  ).map((vh) => (
                    <div
                      key={vh.version}
                      className="p-3 rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#026BFC]">Version {vh.version}</span>
                        <span className="text-[10px] text-slate-400">{vh.editedAt}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{vh.changes}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By {vh.editedBy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
