import React from 'react';
import { CreditCard } from 'lucide-react';

// Payment Method Logo helper
export const MethodIcon: React.FC<{ method: string }> = ({ method }) => {
  if (method === 'Razorpay') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#0C2340] text-blue-400 rounded flex items-center justify-center font-black text-[9px]">
          P
        </div>
        <span className="text-xs text-slate-700 font-medium">Razorpay</span>
      </div>
    );
  }
  if (method === 'UPI') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#0F766E] text-white rounded flex items-center justify-center font-bold text-[8px]">
          ▲
        </div>
        <span className="text-xs text-slate-700 font-medium">UPI</span>
      </div>
    );
  }
  if (method === 'PhonePe') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#6739B7] text-white rounded-full flex items-center justify-center font-bold text-[9px]">
          पे
        </div>
        <span className="text-xs text-slate-700 font-medium">PhonePe</span>
      </div>
    );
  }
  if (method === 'Credit Card') {
    return (
      <div className="flex items-center gap-1.5">
        <CreditCard className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-700 font-medium">Credit Card</span>
      </div>
    );
  }
  return <span className="text-xs text-slate-400 font-medium">—</span>;
};
