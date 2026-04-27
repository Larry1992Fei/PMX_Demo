import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type {
  SubMode, IntegrationMode, PaymentMethod, SubscriptionType, SubscriptionFormParams, StepConfig
} from '@/types/subscription';
import { DEFAULT_FORM_PARAMS, isCompatible } from '@/types/subscription';
import { getStepsForSubMode } from '@/config/subscriptionSteps';
import { getPayloadForStep } from '@/config/payloadTemplates';

// ─── Context 接口 ─────────────────────────────────────────────────────────────
interface SubscriptionContextType {
  // 基础模式状态
  subMode: SubMode;
  integrationMode: IntegrationMode;
  paymentMethod: PaymentMethod;
  subscriptionType: SubscriptionType;
  formParams: SubscriptionFormParams;

  // Actions
  setSubMode: (m: SubMode) => void;
  setIntegrationMode: (m: IntegrationMode) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  setSubscriptionType: (t: SubscriptionType) => void;
  updateFormParam: <K extends keyof SubscriptionFormParams>(key: K, value: SubscriptionFormParams[K]) => void;

  // 动态计算产物（不允许外部修改）
  steps: StepConfig[];
  currentStepIndex: number;
  currentStep: StepConfig;
  isFinalStep: boolean;
  triggerFlash: number;
  payloadCode: string;

  // 流转动作
  goNext: () => void;
  goPrev: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subMode, setSubModeState] = useState<SubMode>('payermax');
  const [integrationMode, setIntegrationModeState] = useState<IntegrationMode>('cashier');
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>('card');
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('standard');
  const [formParams, setFormParams] = useState<SubscriptionFormParams>(DEFAULT_FORM_PARAMS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [triggerFlash, setTriggerFlash] = useState(0);

  const flash = useCallback(() => setTriggerFlash(n => n + 1), []);

  // ── 步骤数组（动态计算，前置组件时自动多一步）──────────────────────────────
  const steps = useMemo(
    () => getStepsForSubMode(subMode, integrationMode),
    [subMode, integrationMode]
  );

  const currentStep = steps[currentStepIndex] ?? steps[0];
  const isFinalStep = currentStepIndex >= steps.length - 1;

  // ── 实时报文（根据全量状态计算）──────────────────────────────────────────────
  const payloadCode = useMemo(() => getPayloadForStep({
    subMode, integration: integrationMode, payment: paymentMethod,
    subscriptionType, params: formParams, stepId: currentStep?.id ?? '',
  }), [subMode, integrationMode, paymentMethod, subscriptionType, formParams, currentStep]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const setSubMode = useCallback((m: SubMode) => {
    setSubModeState(m);
    setCurrentStepIndex(0);
    flash();
  }, [flash]);

  const setIntegrationMode = useCallback((m: IntegrationMode) => {
    // APM 与前置组件互斥校验
    if (!isCompatible(paymentMethod, m)) {
      alert('APM 支付方式暂不支持前置组件集成方式，已自动切换为收银台模式。');
      setIntegrationModeState('cashier');
    } else {
      setIntegrationModeState(m);
    }
    setCurrentStepIndex(0);
    flash();
  }, [paymentMethod, flash]);

  const setPaymentMethod = useCallback((m: PaymentMethod) => {
    // APM 与前置组件互斥校验
    if (!isCompatible(m, integrationMode)) {
      alert('APM 支付方式暂不支持前置组件集成方式，请选择其他支付方式或集成方式。');
      return;
    }
    setPaymentMethodState(m);
    flash();
  }, [integrationMode, flash]);

  const updateFormParam = useCallback(<K extends keyof SubscriptionFormParams>(
    key: K, value: SubscriptionFormParams[K]
  ) => {
    setFormParams(prev => ({ ...prev, [key]: value }));
    flash();
  }, [flash]);

  const goNext = useCallback(() => {
    if (!isFinalStep) { setCurrentStepIndex(i => i + 1); flash(); }
  }, [isFinalStep, flash]);

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) { setCurrentStepIndex(i => i - 1); flash(); }
  }, [currentStepIndex, flash]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) { setCurrentStepIndex(index); flash(); }
  }, [steps.length, flash]);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setFormParams(DEFAULT_FORM_PARAMS);
    flash();
  }, [flash]);

  return (
    <SubscriptionContext.Provider value={{
      subMode, integrationMode, paymentMethod, subscriptionType, formParams,
      setSubMode, setIntegrationMode, setPaymentMethod, setSubscriptionType, updateFormParam,
      steps, currentStepIndex, currentStep, isFinalStep, triggerFlash, payloadCode,
      goNext, goPrev, goToStep, reset,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within <SubscriptionProvider>');
  return ctx;
};
