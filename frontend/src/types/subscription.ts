/**
 * Subscription Domain Type Definitions
 * 订阅代扣业务领域的 TypeScript 类型系统
 */

// ─── 业务模式（订阅内三种子线路）───────────────────────────────────────────
export type SubMode = 'payermax' | 'merchant' | 'nonperiodic';

export const SUB_MODE_CONFIG: Record<SubMode, { name: string; desc: string }> = {
  payermax:    { name: 'PayerMax托管（周期性订阅）', desc: 'PayerMax管理订阅计划与扣款周期' },
  merchant:    { name: '商户自管（周期性订阅）',    desc: '商户自主管理订阅计划与扣款时机' },
  nonperiodic: { name: '非周期性订阅代扣',         desc: '商户按业务需求灵活发起扣款' },
};

// ─── 集成方式 ────────────────────────────────────────────────────────────────
export type IntegrationMode = 'cashier' | 'api' | 'component';

export const INTEGRATION_CONFIG: Record<IntegrationMode, { label: string }> = {
  cashier:   { label: '收银台绑定 / 激活' },
  api:       { label: 'API 绑定 / 激活' },
  component: { label: '前置组件绑定 / 激活' },
};

// ─── 支付方式 ────────────────────────────────────────────────────────────────
export type PaymentMethod = 'card' | 'applepay' | 'googlepay' | 'apm';

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; apiType: string }> = {
  card:      { label: 'CARD',      apiType: 'CARD' },
  applepay:  { label: 'APPLEPAY',  apiType: 'APPLEPAY' },
  googlepay: { label: 'GOOGLEPAY', apiType: 'GOOGLEPAY' },
  apm:       { label: 'APM',       apiType: 'ONE_TOUCH' },
};

// ─── 订阅类型（仅 PayerMax 托管模式使用）───────────────────────────────────
export type SubscriptionType = 'standard' | 'trial' | 'discount' | 'trial_discount';

export const SUBSCRIPTION_TYPE_CONFIG: Record<SubscriptionType, { label: string; desc: string }> = {
  standard:       { label: '普通订阅',      desc: '绑定金额 > 0' },
  trial:          { label: 'N天试用',       desc: '绑定金额 = 0' },
  discount:       { label: '前N期优惠',     desc: '绑定金额 > 0' },
  trial_discount: { label: 'N天试用+前N期优惠', desc: '组合优惠' },
};

// ─── 步骤定义 ────────────────────────────────────────────────────────────────
export interface StepConfig {
  id: string;       // panel 路由 key
  label: string;    // Step N
  title: string;    // 步骤描述
  hint: string;     // 底部提示
}

// ─── 表单参数（订阅参数配置区） ──────────────────────────────────────────────
export interface SubscriptionFormParams {
  // PayerMax 模式
  totalPeriods: string;
  periodCount: string;
  periodUnit: 'D' | 'W' | 'M' | 'Y';
  amount: string;
  currency: string;
  startDate: string;
  trialDays: string;
  trialPeriodCount: string;
  trialAmount: string;
  trialPeriodAmount: string;
  trialAmountCombo: string;
  trialPeriodCountCombo: string;
  trialPeriodAmountCombo: string;
  // Merchant / NonPeriodic 模式
  bindType: 'zero' | 'paid';
  merchantAmount: string;
  merchantCurrency: string;
  merchantSubject: string;
  merchantUserId: string;
  // NonPeriodic 模式
  npAmount: string;
  npCurrency: string;
}

export const DEFAULT_FORM_PARAMS: SubscriptionFormParams = {
  totalPeriods: '12', periodCount: '1', periodUnit: 'M',
  amount: '29.99', currency: 'USD', startDate: '',
  trialDays: '7', trialPeriodCount: '3', trialAmount: '0',
  trialPeriodAmount: '19.9', trialAmountCombo: '0',
  trialPeriodCountCombo: '3', trialPeriodAmountCombo: '19.9',
  bindType: 'zero', merchantAmount: '0', merchantCurrency: 'USD',
  merchantSubject: '代扣标题', merchantUserId: 'test1111111',
  npAmount: '9.99', npCurrency: 'USD',
};

// ─── 兼容性规则（APM 不支持前置组件）────────────────────────────────────────
export function isCompatible(payment: PaymentMethod, integration: IntegrationMode): boolean {
  return !(payment === 'apm' && integration === 'component');
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────
export function getComponentList(payment: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    card:      '"CARD"',
    applepay:  '"APPLEPAY"',
    googlepay: '"GOOGLEPAY"',
    apm:       '"CARD", "APPLEPAY", "GOOGLEPAY"',
  };
  return map[payment];
}

export function calculateActivateAmount(
  subType: SubscriptionType,
  amount: string,
  trialAmountCombo: string
): string {
  if (subType === 'trial') return '0';
  if (subType === 'trial_discount') return trialAmountCombo;
  return amount;
}

export function getPeriodUnitText(unit: string): string {
  const map: Record<string, string> = { D: '天', W: '周', M: '月', Y: '年' };
  return map[unit] ?? unit;
}
