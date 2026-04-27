// StepComponent — 前置组件加载步骤（PayerMax / Merchant / NonPeriodic 均可用）
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const StepComponent: React.FC = () => {
  const { paymentMethod } = useSubscription();
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-2">加载前置组件</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          使用 <strong>applyDropinSession</strong> 接口获取 Session Key，然后初始化前端组件完成支付绑定。
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Session Key 响应</h4>
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-3 flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
          <div className="text-xs font-mono text-emerald-700 leading-relaxed">
            sessionKey: <strong>02d764a032804ee5b47013795e25f07d</strong><br/>
            clientKey: <strong>67eff2f3b29a4ecf...f658</strong>
          </div>
        </div>
        <div className="mt-3 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 font-semibold">
          {paymentMethod.toUpperCase()} 组件挂载区域<br/>
          <span className="opacity-60">（真实环境中由 SDK 渲染）</span>
        </div>
      </div>
    </div>
  );
};
