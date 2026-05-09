import React, { useEffect } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { ShieldCheck, Loader2, Lock, Cpu, Globe } from 'lucide-react';

export const StepComponentPayment: React.FC = () => {
  const { submitComponentOrder, isApiCalling, paymentToken, sessionData } = useProduct();

  // 进入该步骤时，自动触发后端下单逻辑
  useEffect(() => {
    const timer = setTimeout(() => {
      submitComponentOrder();
    }, 1500); // 预留 1.5 秒展示“处理中”状态，增加演示真实感
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 font-sans">
      {/* 顶部状态条 */}
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">PayerMax System</span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Processing</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
        {/* 背景微光装饰 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* 核心动态加载区 */}
          <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 border-4 border-indigo-50 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <Cpu className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
          </div>

          <h2 className="text-[18px] font-black text-slate-900 mb-3 tracking-tight">Securing Transaction</h2>
          
          <div className="space-y-4">
            <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-[240px]">
              Processing your payment through PayerMax encrypted gateway...
            </p>
            
            {/* 您的特定说明文字 */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
              <p className="text-[11px] text-indigo-600 font-bold leading-relaxed">
                将获取的 paymentToken 与 sessionKey 传递到后端调用 orderAndPay 接口下单，成功后直接跳转到最后一步展示。
              </p>
            </div>
          </div>
        </div>

        {/* 底部运行状态 */}
        <div className="absolute bottom-10 left-0 right-0 px-10">
           <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between opacity-40">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Token State</span>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600 w-2/3 animate-progress-flow" />
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center gap-2 border-t border-slate-50 opacity-50">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Bank-Grade Encryption</span>
        </div>
      </div>
      
      <style>{`
        @keyframes progress-flow {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-progress-flow {
          animation: progress-flow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
