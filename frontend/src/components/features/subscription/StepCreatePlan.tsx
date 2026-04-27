// StepCreatePlan — Step 2 (PayerMax): 创建订阅计划说明面板
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SUBSCRIPTION_TYPE_CONFIG } from '@/types/subscription';

export const StepCreatePlan: React.FC = () => {
  const { subscriptionType } = useSubscription();
  const conf = SUBSCRIPTION_TYPE_CONFIG[subscriptionType];
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-2">后端创建订阅计划 — <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 text-xs">subscriptionCreate</code></h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          使用第一步填写的参数，调用 <strong>subscriptionCreate</strong> API 创建订阅计划，获取 <code className="bg-amber-100 text-amber-700 px-1 rounded">subscriptionNo</code> 用于后续激活。
        </p>
        <div className="mt-3 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100 text-[12px] font-semibold text-indigo-700">
          当前订阅类型：{conf.label} — {conf.desc}
        </div>
      </div>
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
        <div>
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">创建成功 — 返回订阅计划号</div>
          <div className="text-xs font-mono text-emerald-700 mt-1">subscriptionNo: <strong>SUB2026XXXxxxxxx2112</strong></div>
        </div>
      </div>
    </div>
  );
};
