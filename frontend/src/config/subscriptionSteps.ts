/**
 * Subscription Step Configuration
 * 订阅代扣业务 — 步骤动态计算层
 * 对标原型: config/steps.js → getStepsForMode()
 */

import type { SubMode, IntegrationMode, StepConfig } from '@/types/subscription';

/**
 * 核心函数：根据业务模式 + 集成方式，动态计算步骤数组
 * 前置组件集成时 PayerMax 为 4 步，Merchant/NonPeriodic 为 3 步（含组件步骤替换绑定步骤）
 */
export function getStepsForSubMode(
  subMode: SubMode,
  integration: IntegrationMode
): StepConfig[] {
  
  if (subMode === 'payermax') {
    if (integration === 'component') {
      return [
        { id: 'pm-1',           label: 'Step 1', title: '配置订阅参数',   hint: '配置订阅计划的基本参数' },
        { id: 'pm-2',           label: 'Step 2', title: '创建订阅计划',   hint: '调用 subscriptionCreate API 创建订阅计划' },
        { id: 'pm-component',   label: 'Step 3', title: '加载前置组件',   hint: '使用前置组件完成支付方式绑定' },
        { id: 'pm-complete',    label: 'Step 4', title: '完成订阅激活',   hint: '✅ 订阅激活成功，PayerMax 将按周期自动扣款' },
      ];
    }
    return [
      { id: 'pm-1',         label: 'Step 1', title: '配置订阅参数', hint: '配置订阅计划的基本参数' },
      { id: 'pm-2',         label: 'Step 2', title: '创建订阅计划', hint: '调用 subscriptionCreate API 创建订阅计划' },
      { id: 'pm-activate',  label: 'Step 3', title: '激活订阅',     hint: '调用 orderAndPay API 激活订阅' },
      { id: 'pm-complete',  label: 'Step 4', title: '完成订阅激活', hint: '✅ 订阅激活成功，PayerMax 将按周期自动扣款' },
    ];
  }

  if (subMode === 'merchant') {
    if (integration === 'component') {
      return [
        { id: 'm-1',          label: 'Step 1', title: '配置绑定参数',   hint: '配置首次绑定的订单参数' },
        { id: 'm-component',  label: 'Step 2', title: '加载前置组件',   hint: '使用前置组件完成支付方式绑定' },
        { id: 'm-deduct',     label: 'Step 3', title: '后续发起扣款',   hint: '商户自主决定扣款时机和金额' },
      ];
    }
    return [
      { id: 'm-1',      label: 'Step 1', title: '配置绑定参数',   hint: '配置首次绑定的订单参数' },
      { id: 'm-bind',   label: 'Step 2', title: '首次绑定支付方式', hint: '调用 orderAndPay API 完成首次绑定' },
      { id: 'm-deduct', label: 'Step 3', title: '后续发起扣款',   hint: '商户自主决定扣款时机和金额' },
    ];
  }

  // nonperiodic
  if (integration === 'component') {
    return [
      { id: 'np-1',         label: 'Step 1', title: '收集业务数据',   hint: '收集本次绑定/支付的订单参数' },
      { id: 'np-component', label: 'Step 2', title: '加载前置组件',   hint: '使用前置组件完成支付方式绑定' },
      { id: 'np-deduct',    label: 'Step 3', title: '后续发起扣款',   hint: '商户按业务需求灵活发起扣款' },
    ];
  }
  return [
    { id: 'np-1',     label: 'Step 1', title: '收集业务数据',   hint: '收集本次绑定/支付的订单参数' },
    { id: 'np-bind',  label: 'Step 2', title: '首次绑定支付方式', hint: '调用 orderAndPay API 完成首次绑定' },
    { id: 'np-deduct',label: 'Step 3', title: '后续发起扣款',   hint: '商户按业务需求灵活发起扣款' },
  ];
}
