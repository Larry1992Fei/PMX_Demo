// StepBind — 首次绑定支付方式（Merchant / NonPeriodic）
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PAYMENT_METHOD_CONFIG } from '@/types/subscription';

export const StepBind: React.FC = () => {
  const { subMode, integrationMode, paymentMethod } = useSubscription();
  const isCashier = integrationMode !== 'api';
  const pmLabel = PAYMENT_METHOD_CONFIG[paymentMethod].label;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-2">
          {isCashier ? '收银台绑定' : 'API 绑定'} — <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 text-xs">orderAndPay</code>
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          发起首次绑定支付方式请求，引导用户完成 {pmLabel} 绑定授权，获取 <code className="bg-amber-100 text-amber-700 px-1 rounded">paymentTokenID</code> 用于后续代扣。
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-500">
          <span>mitType:</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">
            {subMode === 'nonperiodic' ? 'UNSCHEDULED' : 'SCHEDULED'}
          </span>
        </div>
      </div>
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
        <div className="text-xs font-mono text-emerald-700">
          paymentTokenID: <strong>PMTOKEN177XXXXX1000551</strong>
        </div>
      </div>
    </div>
  );
};
