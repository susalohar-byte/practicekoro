import { AdminRefundModal } from '@/components/admin/AdminRefundModal';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentsRefundModalProps {
  pay: AdminPaymentsState;
}

export function PaymentsRefundModal({ pay }: PaymentsRefundModalProps) {
  const {
    setPaymentsList,
    refundModalPayment,
    isRefundModalOpen,
    setIsRefundModalOpen,
    showToast,
  } = pay;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6. ADMIN REFUND MODAL INTEGRATION                                    */}
      {/* ==================================================================== */}
      {isRefundModalOpen && (
        <AdminRefundModal
          payment={refundModalPayment}
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          onRefundSuccess={(updated) => {
            setPaymentsList((prev) =>
              prev.map((p) =>
                String(p.id) === String(updated.id) || p.id === Number(updated.id)
                  ? {
                      ...p,
                      status: 'Refunded',
                      statusBadgeClass: 'bg-[#FEF3C7] text-[#D97706]',
                      subscriptionActive: false,
                      // Totals and charts read sourcePayment, so keep it in sync too.
                      sourcePayment: updated,
                    }
                  : p
              )
            );
            setIsRefundModalOpen(false);
            showToast(`Refund processed for ${updated.studentName}`);
          }}
        />
      )}
    </>
  );
}
