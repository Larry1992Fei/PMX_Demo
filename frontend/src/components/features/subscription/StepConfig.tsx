/**
 * Step 1: 配置参数
 * 包含：订阅类型选择（仅 PayerMax 托管模式）+ 通用表单
 */
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SUBSCRIPTION_TYPE_CONFIG, type SubscriptionType } from '@/types/subscription';
import { cn } from '@/lib/utils';

export const StepConfig: React.FC = () => {
  const { subMode, subscriptionType, setSubscriptionType, formParams, updateFormParam } = useSubscription();

  return (
    <div className="space-y-6">
      
      {/* 订阅类型（仅 PayerMax 托管模式显示） */}
      {subMode === 'payermax' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-700 mb-4">订阅类型</h4>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SUBSCRIPTION_TYPE_CONFIG) as SubscriptionType[]).map((type) => {
              const conf = SUBSCRIPTION_TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setSubscriptionType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all",
                    subscriptionType === type
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {conf.label}
                  <span className="ml-1 opacity-60 text-[10px]">({conf.desc})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 商户自管模式说明 */}
      {subMode === 'merchant' && (
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
          <p className="text-xs font-semibold text-blue-800 leading-relaxed">
            • 商户自主管理订阅计划，<strong>无需调用 subscriptionCreate API</strong><br/>
            • 只区分<strong>绑定类型</strong>：0元绑定（只授权）或 &gt;0元绑定支付（绑定+支付）<br/>
            • 商户自主决定后续扣款时机和金额<br/>
            • 绑定成功后通过 Webhook 获取 <code className="bg-blue-100 px-1 rounded text-blue-700">paymentTokenID</code>
          </p>
        </div>
      )}

      {/* 主参数表单 */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-4">参数配置</h4>
        
        {subMode === 'payermax' && (
          <div className="space-y-4">
            <FormRow>
              <FormField label="总期数" id="totalPeriods">
                <input type="number" min="1" value={formParams.totalPeriods}
                  onChange={e => updateFormParam('totalPeriods', e.target.value)}
                  className={inputCls} />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="扣款频率" id="periodCount">
                <input type="number" min="1" value={formParams.periodCount}
                  onChange={e => updateFormParam('periodCount', e.target.value)}
                  className={inputCls} />
              </FormField>
              <FormField label="扣款周期" id="periodUnit">
                <select value={formParams.periodUnit}
                  onChange={e => updateFormParam('periodUnit', e.target.value as 'D' | 'W' | 'M' | 'Y')}
                  className={inputCls}>
                  <option value="D">日</option>
                  <option value="W">周</option>
                  <option value="M">月</option>
                  <option value="Y">年</option>
                </select>
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="每期金额" id="amount">
                <input type="number" step="0.01" min="0" value={formParams.amount}
                  onChange={e => updateFormParam('amount', e.target.value)}
                  className={inputCls} />
              </FormField>
              <FormField label="币种" id="currency">
                <input type="text" value={formParams.currency}
                  onChange={e => updateFormParam('currency', e.target.value)}
                  className={inputCls} />
              </FormField>
            </FormRow>
            {/* 条件字段：试用天数 */}
            {(subscriptionType === 'trial' || subscriptionType === 'trial_discount') && (
              <FormField label="试用天数" id="trialDays">
                <input type="number" min="1" value={formParams.trialDays}
                  onChange={e => updateFormParam('trialDays', e.target.value)}
                  className={inputCls} />
              </FormField>
            )}
            {/* 条件字段：优惠期 */}
            {(subscriptionType === 'discount' || subscriptionType === 'trial_discount') && (
              <FormRow>
                <FormField label="优惠期数" id="trialPeriodCount">
                  <input type="number" min="1" value={formParams.trialPeriodCount}
                    onChange={e => updateFormParam('trialPeriodCount', e.target.value)}
                    className={inputCls} />
                </FormField>
                <FormField label="优惠期金额" id="trialPeriodAmount">
                  <input type="number" step="0.01" value={formParams.trialPeriodAmount}
                    onChange={e => updateFormParam('trialPeriodAmount', e.target.value)}
                    className={inputCls} />
                </FormField>
              </FormRow>
            )}
          </div>
        )}

        {(subMode === 'merchant') && (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">绑定类型</p>
              <div className="flex gap-3">
                {(['zero', 'paid'] as const).map(bt => (
                  <button key={bt} onClick={() => updateFormParam('bindType', bt)}
                    className={cn("flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all",
                      formParams.bindType === bt ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500")}>
                    {bt === 'zero' ? '0元绑定（只授权）' : '>0元绑定支付'}
                  </button>
                ))}
              </div>
            </div>
            <FormRow>
              <FormField label="首次订单金额" id="merchantAmount">
                <input type="number" step="0.01" min="0" value={formParams.merchantAmount}
                  readOnly={formParams.bindType === 'zero'}
                  onChange={e => updateFormParam('merchantAmount', e.target.value)}
                  className={cn(inputCls, formParams.bindType === 'zero' && 'bg-slate-100 cursor-not-allowed')} />
              </FormField>
              <FormField label="币种" id="merchantCurrency">
                <input type="text" value={formParams.merchantCurrency}
                  onChange={e => updateFormParam('merchantCurrency', e.target.value)}
                  className={inputCls} />
              </FormField>
            </FormRow>
            <FormField label="订单标题" id="merchantSubject">
              <input type="text" value={formParams.merchantSubject}
                onChange={e => updateFormParam('merchantSubject', e.target.value)}
                className={inputCls} />
            </FormField>
            <FormField label="用户ID" id="merchantUserId">
              <input type="text" value={formParams.merchantUserId}
                onChange={e => updateFormParam('merchantUserId', e.target.value)}
                className={inputCls} />
            </FormField>
          </div>
        )}

        {subMode === 'nonperiodic' && (
          <div className="space-y-4">
            <FormRow>
              <FormField label="支付金额" id="npAmount">
                <input type="number" step="0.01" min="0" value={formParams.npAmount}
                  onChange={e => updateFormParam('npAmount', e.target.value)}
                  className={inputCls} />
              </FormField>
              <FormField label="币种" id="npCurrency">
                <input type="text" value={formParams.npCurrency}
                  onChange={e => updateFormParam('npCurrency', e.target.value)}
                  className={inputCls} />
              </FormField>
            </FormRow>
          </div>
        )}
      </div>
    </div>
  );
};

// ── 共享子组件 ─────────────────────────────────────────────────────────────────
const inputCls = "w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors";

const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3">{children}</div>
);

const FormField: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({ label, id, children }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);
