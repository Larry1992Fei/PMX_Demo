import React from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StepCheckout: React.FC = () => {
  const { redirectUrl, cashierMode, paymentMethod, toNextStep } = useProduct();

  React.useEffect(() => {
    if (!redirectUrl) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes('payermax.com')) {
        const data = event.data;
        if (data.payStatus === 'SUCCESS' || data.status === 'SUCCESS') toNextStep();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toNextStep, redirectUrl]);

  if (redirectUrl) {
    return (
      <div className="h-full bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-500">
        <div className="h-10 bg-slate-50 flex items-center px-4 gap-2 border-b border-slate-100 flex-none">
          <div className="flex gap-1">
            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />)}
          </div>
          <div className="flex-1 bg-white h-6 rounded-md border border-slate-100 flex items-center px-3 text-[9px] text-slate-400 truncate">
            <span className="text-emerald-500 mr-1 font-bold">https://</span>{redirectUrl.split('//')[1]}
          </div>
        </div>
        <div className="flex-1 bg-slate-50 relative overflow-hidden">
          <iframe src={redirectUrl} className="w-full h-full border-none" title="PayerMax Cashier" allow="payment" sandbox="allow-scripts allow-popups allow-same-origin allow-top-navigation" />
        </div>
        <div className="h-8 bg-slate-50 border-t border-slate-100 flex items-center justify-around flex-none">
          <ArrowRight className="w-3 h-3 text-slate-300 rotate-180" /><ArrowRight className="w-3 h-3 text-slate-300" /><div className="w-3.5 h-3.5 rounded-sm border border-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-inner", cashierMode === 'SPECIFIC' ? "bg-blue-50" : "bg-indigo-50")}>
        <Loader2 className={cn("w-8 h-8 animate-spin", cashierMode === 'SPECIFIC' ? "text-blue-600" : "text-indigo-600")} />
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-slate-800">{cashierMode === 'SPECIFIC' ? '下单展示' : '全量收银台'}</h3>
        <p className="text-xs font-medium text-slate-400 mt-2 px-4 leading-relaxed">
          {cashierMode === 'SPECIFIC' ? `正在处理 ${paymentMethod.toUpperCase()} 支付请求，请稍候。` : "PayerMax 会话正在初始化，将为您提供多种支付方式选择。"}
        </p>
      </div>
      <div className="w-full pt-10 border-t border-slate-100 mt-auto opacity-40 hover:opacity-100 transition-opacity">
        <button onClick={() => toNextStep()} className="text-xs text-indigo-600 font-bold flex items-center justify-center w-full gap-1">Skip / Force Process <ArrowRight className="w-3 h-3" /></button>
      </div>
    </div>
  );
};
