// StepComplete — 最终完成（含 Webhook 确认）
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CheckCircle2 } from 'lucide-react';
import { getPeriodUnitText } from '@/types/subscription';

export const StepComplete: React.FC = () => {
  const { subMode, formParams, subscriptionType } = useSubscription();
  return (
    <div className="text-center py-4 space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-lg shadow-emerald-100">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-slate-800">订阅激活成功</h3>
        <p className="text-sm text-slate-500 mt-1">PayerMax 将按照订阅计划自动周期扣款</p>
      </div>
      {subMode === 'payermax' && (
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { label: '扣款周期', value: `每 ${formParams.periodCount} ${getPeriodUnitText(formParams.periodUnit)} · 共 ${formParams.totalPeriods} 期` },
            { label: '每期金额', value: `${formParams.currency} ${formParams.amount}` },
            { label: '订阅类型', value: subscriptionType },
            { label: 'Webhook', value: 'TRADE_SUCCESS' },
          ].map(item => (
            <div key={item.label} className="bg-emerald-50 rounded-xl border border-emerald-100 p-3">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">{item.label}</div>
              <div className="text-xs font-mono text-slate-800 mt-0.5 font-bold">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
