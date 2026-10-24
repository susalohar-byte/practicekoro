import {
  RefreshCw,
  Upload,
  Download,
  ChevronDown,
  Shield,
  BookOpen,
  Plus,
  Radio,
} from 'lucide-react';
import { downloadSampleTxt } from '@/utils/txtQuestionParser';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionBankHeaderProps {
  qb: AdminQuestionBankState;
}

export function QuestionBankHeader({ qb }: QuestionBankHeaderProps) {
  const {
    isLoading,
    setImportPreviewStats,
    setImportFile,
    setParsedImportQuestions,
    setIsImportModalOpen,
    setIsTemplateMenuOpen,
    isTemplateMenuOpen,
    downloadTemplate,
    setIsAddMenuOpen,
    isAddMenuOpen,
    setModalUploadMode,
    setIsLiveUploadOpen,
    setIsAddModalOpen,
  } = qb;
  return (
    <>
      {/* 1. PAGE HEADER (Pixel-matched to media_1791132993733.jpg) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-[#026BFC]" />}
          </div>
          <p className="text-xs font-normal text-slate-500 mt-1">
            Manage all questions. Add, edit, review and organize questions.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Import Questions */}
          <button
            type="button"
            onClick={() => {
              setImportPreviewStats(null);
              setImportFile(null);
              setParsedImportQuestions([]);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Questions</span>
          </button>

          {/* Download Template Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTemplateMenuOpen(!isTemplateMenuOpen);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Template</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isTemplateMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 animate-in fade-in"
              >
                <button
                  type="button"
                  onClick={() => {
                    downloadTemplate('exam');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-[#026BFC] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>By Exam Template (.csv)</span>
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadTemplate('subject');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>By Subject Template (.csv)</span>
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadSampleTxt('live_test_questions_template.txt');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Live Test Template (.txt)</span>
                  <Radio className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            )}
          </div>

          {/* + Add Question Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddMenuOpen(!isAddMenuOpen);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isAddMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 animate-in fade-in"
              >
                <button
                  type="button"
                  onClick={() => {
                    setModalUploadMode('exam');
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-[#026BFC] rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>+ Add by Exam</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalUploadMode('subject');
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>+ Add by Subject</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLiveUploadOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-rose-500" />
                  <span>+ Add to Live Test</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
