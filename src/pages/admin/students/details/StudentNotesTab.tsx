import { Loader2, Trash2 } from 'lucide-react';
import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import type { AdminStudentsState } from '../useAdminStudents';

export interface StudentNotesTabProps {
  studentsState: AdminStudentsState;
}

export function StudentNotesTab({ studentsState }: StudentNotesTabProps) {
  const {
    activeTab,
    newNoteText,
    setNewNoteText,
    handleSaveNote,
    isWorking,
    isLoadingNotes,
    studentNotes,
    handleDeleteNote,
  } = studentsState;
  return (
    <>
      {activeTab === 'Notes' && (
        <div className="space-y-3 text-xs py-1">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Add Internal Staff Note
            </label>
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="e.g. Student reported difficulty in reasoning, guided to mock tests..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
            />
            <div className="flex justify-end mt-1.5">
              <button
                onClick={handleSaveNote}
                disabled={!newNoteText.trim() || isWorking}
                className="px-3 py-1.5 bg-[#026BFC] hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {isWorking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Note</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-800 block text-xs">Notes History:</span>
            {isLoadingNotes ? (
              <AdminSectionSkeleton label="Loading notes…" />
            ) : studentNotes.length === 0 ? (
              <p className="text-slate-400 text-[11px] py-2">
                No internal notes added for this student yet.
              </p>
            ) : (
              studentNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 text-[11px] leading-relaxed">{note.text}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      <span>By: {note.author}</span>
                      <span>{note.createdAt}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={isWorking}
                    title="Delete note"
                    className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
