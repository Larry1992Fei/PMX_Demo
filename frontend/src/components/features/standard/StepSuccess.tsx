import React from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { Check } from 'lucide-react';

export const StepSuccess: React.FC = () => {
  const { paymentMethod, lastApiResponse, toNextStep } = useProduct();
  const orderNo = lastApiResponse?.data?.outTradeNo || `ORDER_${Date.now()}`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6 bg-emerald-500 text-white animate-in zoom-in-90 duration-500 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400 rounded-full blur-3xl opacity-50" />
      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative z-10"><Check className="w-10 h-10" /></div>
      <div className="relative z-10 space-y-2"><h3 className="text-2xl font-extrabold">Payment Successful</h3><p className="text-sm font-medium opacity-90 max-w-xs">Your transaction has been completed successfully. Thank you for your purchase!</p></div>
      <div className="w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-xl p-4 relative z-10">
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20"><span className="text-sm font-medium">Order Number</span><span className="text-sm font-bold truncate ml-4">{orderNo}</span></div>
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20"><span className="text-sm font-medium">Payment Method</span><span className="text-sm font-bold uppercase">{paymentMethod || 'N/A'}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm font-medium">Total Amount</span><span className="text-lg font-extrabold">$11.00</span></div>
      </div>
      <div className="w-full pt-10 border-t border-white/20 mt-auto relative z-10">
        <button onClick={() => toNextStep()} className="w-full h-12 bg-white text-emerald-600 font-bold rounded-xl shadow-lg active:scale-95 transition-transform">Continue</button>
      </div>
    </div>
  );
};
