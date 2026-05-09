import React from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { StandardProductPreview } from './ProductPreview';
import { StepSpecificCashier } from './StepSpecificCashier';
import { StepCheckout } from './StepCheckout';
import { StepSuccess } from './StepSuccess';
import { StepComponentPayment } from './StepComponentPayment';
import { StepComponentCashier } from './StepComponentCashier';

/**
 * 标准收单模式的步骤路由中心
 * 根据 ProductContext 中的 currentStep 渲染对应的仿真手机内容
 */
export const StandardStepRouter: React.FC = () => {
  const { currentStep, integrationMode, cashierMode } = useProduct();

  // 1. 商品信息步骤 (所有模式共用第一步)
  if (currentStep === 's1') {
    return <StandardProductPreview />;
  }

  // 2. 收银台模式 (cashier)
  if (integrationMode === 'cashier') {
    if (cashierMode === 'SPECIFIC') {
      if (currentStep === 's2') return <StepSpecificCashier />;
      if (currentStep === 's3') return <StepCheckout />;
      if (currentStep === 's4') return <StepSuccess />;
    } else {
      // 全量收银台：s2-下单展示, s3-成功
      if (currentStep === 's2') return <StepCheckout />;
      if (currentStep === 's3') return <StepSuccess />;
    }
  }

  // 3. API 模式 (api): s1-商品, s2-自建收银台, s3-成功
  if (integrationMode === 'api') {
    if (currentStep === 's2') return <StepSpecificCashier />;
    if (currentStep === 's3') return <StepSuccess />;
  }

  // 4. 前置组件模式 (component): s1-商品, s2-自建收银台+组件, s3-处理中/下单, s4-成功
  if (integrationMode === 'component') {
    if (currentStep === 's2') return <StepComponentCashier />;
    if (currentStep === 's3') return <StepComponentPayment />;  // ✅ 处理中转场
    if (currentStep === 's4') return <StepSuccess />;
  }

  // 兜底显示
  return (
    <div className="flex items-center justify-center h-full text-slate-300 text-sm font-bold">
      <div className="text-center space-y-2">
        <div className="text-3xl">📱</div>
        <div>Step {currentStep} 建设中...</div>
      </div>
    </div>
  );
};
