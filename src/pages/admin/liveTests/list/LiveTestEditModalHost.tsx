import { toast, type AdminLiveTestsState } from './useAdminLiveTests';
import { CreateEditLiveTestModal } from './CreateEditLiveTestModal';

export interface LiveTestEditModalHostProps {
  live: AdminLiveTestsState;
}

export function LiveTestEditModalHost({ live }: LiveTestEditModalHostProps) {
  const {
    setLiveTests,
    exams,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingTest,
    setEditingTest,
    navigate,
  } = live;
  return (
    <>
      {/* CREATE / EDIT LIVE TEST MODAL */}
      {isCreateModalOpen && (
        <CreateEditLiveTestModal
          isOpen={isCreateModalOpen}
          initialData={editingTest}
          exams={exams}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTest(null);
          }}
          onSave={async (saved) => {
            if (editingTest) {
              setLiveTests((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
              toast.success('Live Test updated successfully');
              setIsCreateModalOpen(false);
              setEditingTest(null);
            } else {
              // Next step of a new Live Test: upload its paper's questions.
              setIsCreateModalOpen(false);
              navigate(`/admin/live-tests/${saved.id}/questions`);
            }
          }}
        />
      )}
    </>
  );
}
