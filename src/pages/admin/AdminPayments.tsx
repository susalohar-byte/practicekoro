import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminPayments } from './payments/useAdminPayments';
import { PaymentsHeader } from './payments/PaymentsHeader';
import { PaymentsSummaryCards } from './payments/PaymentsSummaryCards';
import { PaymentsRevenueTrendCard } from './payments/PaymentsRevenueTrendCard';
import { PaymentsGatewaysCard } from './payments/PaymentsGatewaysCard';
import { PaymentsFilterToolbar } from './payments/PaymentsFilterToolbar';
import { PaymentsTablePanel } from './payments/PaymentsTablePanel';
import { PaymentDetailsPanel } from './payments/PaymentDetailsPanel';
import { PaymentsRefundModal } from './payments/PaymentsRefundModal';
export type { PaymentItem } from './payments/paymentsUtils';

export const AdminPayments: React.FC = () => {
  const pay = useAdminPayments();
  const { recordsLoading, recordsError } = pay;
  return withAdminSkeleton(
    recordsLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <PaymentsHeader pay={pay} />

      {/* ==================================================================== */}
      {!recordsLoading && !recordsError && (
        <>
          <PaymentsSummaryCards pay={pay} />

          {/* ==================================================================== */}
          {/* 3. CHARTS ROW (Revenue Trend & Payment Gateways)                      */}
          {/* ==================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <PaymentsRevenueTrendCard pay={pay} />

            <PaymentsGatewaysCard pay={pay} />
          </div>

          {/* ==================================================================== */}
        </>
      )}
      <PaymentsFilterToolbar pay={pay} />

      {/* ==================================================================== */}
      {/* 5. SPLIT GRID LAYOUT (TABLE + RIGHT DETAILS PANEL)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <PaymentsTablePanel pay={pay} />

        <PaymentDetailsPanel pay={pay} />
      </div>

      <PaymentsRefundModal pay={pay} />
    </div>,
    { label: 'Loading payments…', variant: 'dashboard' }
  );
};
