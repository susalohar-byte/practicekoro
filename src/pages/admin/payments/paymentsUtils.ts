import type { AdminPaymentRow } from '@/types';
import type { AdminPaymentDisplayStatus } from '@/utils/adminFinancialDisplay';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface PaymentItem {
  id: number | string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  plan: string;
  planDuration: string;
  planBadgeClass: string;
  amount: number;
  paymentMethod: 'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card' | '—';
  transactionId: string;
  date: string;
  time: string;
  status: AdminPaymentDisplayStatus;
  sourcePayment: AdminPaymentRow;
  statusBadgeClass: string;
  gatewayOrderId?: string;
  paymentId?: string;
  bankReference?: string;
  subscriptionValidTill?: string;
  subscriptionDaysLeft?: number;
  subscriptionActive?: boolean;
}

// Payment Receipt Document Generator
export function downloadReceiptDocument(payment: PaymentItem) {
  const escapeHtml = (str: string | undefined | null) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${escapeHtml(payment.transactionId)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.5; }
    .header { border-bottom: 2px solid #026bfc; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-refunded { background: #fee2e2; color: #b91c1c; }
    .badge-other { background: #f1f5f9; color: #475569; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
    .table { width: 100%; border-collapse: collapse; }
    .table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table td.label { color: #64748b; width: 40%; }
    .table td.value { font-weight: 500; text-align: right; }
    .amount-row td { font-size: 18px; font-weight: bold; color: #026bfc; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 14px; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">PracticeKoro</div>
      <div style="font-size: 13px; color: #64748b;">Payment Receipt &amp; Transaction Summary</div>
    </div>
    <span class="badge ${payment.status === 'Success' ? 'badge-success' : payment.status === 'Refunded' ? 'badge-refunded' : 'badge-other'}">
      ${escapeHtml(payment.status)}
    </span>
  </div>
  <div class="section">
    <div class="section-title">Student Information</div>
    <table class="table">
      <tr><td class="label">Student Name</td><td class="value">${escapeHtml(payment.studentName)}</td></tr>
      <tr><td class="label">Email Address</td><td class="value">${escapeHtml(payment.studentEmail)}</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Transaction Details</div>
    <table class="table">
      <tr><td class="label">Transaction ID</td><td class="value" style="font-family: monospace;">${escapeHtml(payment.transactionId)}</td></tr>
      ${payment.gatewayOrderId ? `<tr><td class="label">Order ID</td><td class="value" style="font-family: monospace;">${escapeHtml(payment.gatewayOrderId)}</td></tr>` : ''}
      <tr><td class="label">Payment Date</td><td class="value">${escapeHtml(payment.date)} ${escapeHtml(payment.time)}</td></tr>
      <tr><td class="label">Payment Gateway</td><td class="value">${escapeHtml(payment.paymentMethod)}</td></tr>
      <tr><td class="label">Subscription Plan</td><td class="value">${escapeHtml(payment.plan)}</td></tr>
      ${payment.subscriptionValidTill ? `<tr><td class="label">Valid Till</td><td class="value">${escapeHtml(payment.subscriptionValidTill)}</td></tr>` : ''}
      <tr class="amount-row"><td class="label">Total Amount</td><td class="value">₹${payment.amount} INR</td></tr>
    </table>
  </div>
  <div class="footer">
    This document serves as an administrative payment confirmation and transaction summary for PracticeKoro services.
  </div>
</body>
</html>`;

  const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt_${payment.transactionId || 'payment'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
