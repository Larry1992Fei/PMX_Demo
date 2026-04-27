// StepActivate — Step 3 (PayerMax, cashier/api): 激活订阅计划
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const StepActivate: React.FC = () => {
  const { integrationMode } = useSubscription();
  const isCashier = integrationMode !== 'api';
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-3">
      <h4 className="text-sm font-bold text-slate-700">激活订阅计划 — <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 text-xs">orderAndPay</code></h4>
      <div className={`text-xs rounded-lg p-3 border font-semibold leading-relaxed ${isCashier ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-purple-50 border-purple-200 text-purple-800'}`}>
        {isCashier ? (
          <>• <strong>integrate</strong>：Hosted_Checkout（跳转收银台）<br/>• 用户将跳转到 PayerMax 收银台完成支付<br/>• 支持 CARD、ApplePay、GooglePay、APM 多种支付方式</>
        ) : (
          <>• <strong>integrate</strong>：Direct_Payment（API 直接支付）<br/>• 后端直接调用 API 进行支付绑定<br/>• 不需要用户跳转页面</>
        )}
      </div>
    </div>
  );
};
