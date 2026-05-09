import type { PaymentIntegrationMode } from '@/types/payment';

export interface StepItem {
  id: string;
  label: string;
}

/**
 * 根据集成模式和收银台模式计算标准收单的步骤
 */
export const getStandardSteps = (
  integrationMode: PaymentIntegrationMode,
  cashierMode: 'ALL' | 'SPECIFIC'
): StepItem[] => {
  // 1. 收银台模式
  if (integrationMode === 'cashier') {
    if (cashierMode === 'SPECIFIC') {
      return [
        { id: 's1', label: '商品信息' },
        { id: 's2', label: '自建收银台' },
        { id: 's3', label: '下单展示' },
        { id: 's4', label: '支付成功' }
      ];
    }
    return [
      { id: 's1', label: '商品信息' },
      { id: 's2', label: '下单展示' },
      { id: 's3', label: '支付成功' }
    ];
  }

  // 2. API 模式 (3步：商品 → 自建收银台 → 成功)
  if (integrationMode === 'api') {
    return [
      { id: 's1', label: '商品信息' },
      { id: 's2', label: '自建收银台' },
      { id: 's3', label: '支付成功' }
    ];
  }

  // 3. 前置组件模式
  if (integrationMode === 'component') {
    return [
      { id: 's1', label: '商品信息' },
      { id: 's2', label: '自建收银台' },
      { id: 's3', label: '下单支付' },
      { id: 's4', label: '支付成功' }
    ];
  }

  return [];
};
