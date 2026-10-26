import { Button } from '@/components/common/Button';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectOrderModalProps {
  sb: AdminSubjectsState;
}

export function SubjectOrderModal({ sb }: SubjectOrderModalProps) {
  const {
    subjectsList,
    isSaving,
    isUploadingIcon,
    isOrderModalOpen,
    setIsOrderModalOpen,
    orderDraft,
    setOrderDraft,
    orderError,
    saveOrder,
  } = sb;
  return (
    <>
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Subject Order"
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-bold">Subject Order</h2>
            <p className="text-xs text-slate-500">
              Lower numeric values display first. All subjects are shown. Changes save per record;
              failures are reported without claiming the whole batch succeeded.
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {subjectsList.map((sub) => (
                <label key={sub.id} className="flex items-center justify-between text-xs gap-3">
                  <span>{sub.name}</span>
                  <input
                    aria-label={`Order for ${sub.name}`}
                    className="border rounded p-2 w-24"
                    type="number"
                    min="0"
                    max="2147483647"
                    disabled={isSaving || isUploadingIcon}
                    value={orderDraft[sub.id] || ''}
                    onChange={(e) =>
                      setOrderDraft((prev) => ({ ...prev, [sub.id]: e.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
            {orderError && (
              <p role="alert" className="text-xs text-red-700">
                {orderError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                disabled={isSaving || isUploadingIcon}
                onClick={() => setIsOrderModalOpen(false)}
              >
                Close
              </Button>
              <Button disabled={isSaving || !subjectsList.length} onClick={() => void saveOrder()}>
                {isSaving ? 'Saving…' : 'Save Order'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
