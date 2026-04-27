// StepDeduct — 后续代扣步骤（Merchant / NonPeriodic）
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const StepDeduct: React.FC = () => {
  const { subMode, formParams } = useSubscription();
  const amount = subMode === 'nonperiodic' ? formParams.npAmount : formParams.merchantAmount;
  const currency = subMode === 'nonperiodic' ? formParams.npCurrency : formParams.merchantCurrency;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-2">后续发起扣款</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          商户使用前序步骤获取的 <code className="bg-amber-100 text-amber-700 px-1 rounded">paymentTokenID</code> 自主发起服务端代扣请求，
          无需用户参与。<strong>mitType</strong> 固定为 <code className="bg-slate-100 px-1 text-slate-700">
            {subMode === 'nonperiodic' ? 'UNSCHEDULED' : 'SCHEDULED'}
          </code>。
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">代扣结果</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '扣款金额', value: `${currency} ${amount}` },
            { label: 'Token', value: 'PMTOKEN177XX...551' },
            { label: '状态', value: 'TRADE_SUCCESS' },
            { label: '周期类型', value: subMode === 'nonperiodic' ? 'UNSCHEDULED' : 'SCHEDULED' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
              <div className="text-xs font-mono text-slate-800 mt-0.5 font-bold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
