import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { PaymentIntegrationMode } from '@/types/payment';
import type { PaymentMethod } from '@/types/subscription';
import type { LinkMode } from '@/types/link';
import { getStandardSteps } from '@/config/standardSteps';
import { getStandardPayloads } from '@/config/standardPayloads';

// ── 类型定义 ──────────────────────────────────────────────────────────────────
export type ProductMode = 'STANDARD' | 'SUBSCRIPTION' | 'PAYMENT_LINK' | 'DISBURSEMENT';

export const MODES_DESC: Record<ProductMode, string> = {
  STANDARD: '标准收单',
  SUBSCRIPTION: '订阅代扣',
  PAYMENT_LINK: '支付链接',
  DISBURSEMENT: '出款业务'
};

interface ProductContextType {
  productMode: ProductMode;
  setProductMode: (mode: ProductMode) => void;
  integrationMode: PaymentIntegrationMode;
  setIntegrationMode: (mode: PaymentIntegrationMode) => void;
  cashierMode: 'ALL' | 'SPECIFIC';
  setCashierMode: (mode: 'ALL' | 'SPECIFIC') => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cashierPaymentMethod: PaymentMethod;
  setCashierPaymentMethod: (method: PaymentMethod) => void;
  linkMode: LinkMode;
  setLinkMode: (mode: LinkMode) => void;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  steps: { id: string; label: string }[];
  amount: string;
  currency: string;
  country: string;
  userId: string;
  redirectUrl: string | null;
  lastApiResponse: any;
  setLastApiResponse: (data: any) => void;
  isApiCalling: boolean;
  triggerFlash: number;
  toNextStep: (selectedPaymentMethod?: PaymentMethod) => Promise<void>;
  handleStepClick: (stepId: string) => void;
  resetFlow: () => void;
  mockApiData: any;
  sessionData: { sessionKey: string; clientKey: string } | null;
  sessionError: string | null;
  paymentToken: string | null;
  setPaymentToken: (token: string | null) => void;
  applySession: () => Promise<void>;
  submitComponentOrder: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── 持久化与初始化 ────────────────────────────────────────────────────────────
  const storedProductMode = sessionStorage.getItem('productMode') as ProductMode;
  const storedIntegrationMode = sessionStorage.getItem('integrationMode') as PaymentIntegrationMode;
  const storedCashierMode = sessionStorage.getItem('cashierMode') as 'ALL' | 'SPECIFIC';
  const storedCurrentStep = sessionStorage.getItem('currentStep');
  const storedPaymentMethod = sessionStorage.getItem('paymentMethod') as PaymentMethod;

  const [productMode, setProductModeState] = useState<ProductMode>(storedProductMode || 'STANDARD');
  const [integrationMode, setIntegrationModeState] = useState<PaymentIntegrationMode>(storedIntegrationMode || 'cashier');
  const [cashierMode, setCashierModeState] = useState<'ALL' | 'SPECIFIC'>(storedCashierMode || 'ALL');
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>(storedPaymentMethod || 'card');
  const [cashierPaymentMethod, setCashierPaymentMethod] = useState<PaymentMethod>('card');
  const [linkMode, setLinkMode] = useState<LinkMode>('MERCHANT_DASHBOARD');
  const [currentStep, setCurrentStep] = useState(storedCurrentStep || 's1');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(sessionStorage.getItem('redirectUrl'));
  const [lastApiResponse, setLastApiResponse] = useState<any>(JSON.parse(sessionStorage.getItem('lastApiResponse') || 'null'));
  const [isApiCalling, setIsApiCalling] = useState(false);
  const [triggerFlash, setTriggerFlash] = useState(0);
  const [sessionData, setSessionData] = useState<{ sessionKey: string; clientKey: string } | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  const amount = "11.00";
  const currency = "USD";
  const country = "ID";
  const subject = "diamond 700";
  const [userId] = useState(`USER_${Date.now()}`); 

  // ── 持久化同步 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    sessionStorage.setItem('productMode', productMode);
    sessionStorage.setItem('integrationMode', integrationMode);
    sessionStorage.setItem('cashierMode', cashierMode);
    sessionStorage.setItem('currentStep', currentStep);
    sessionStorage.setItem('paymentMethod', paymentMethod);
    if (redirectUrl) sessionStorage.setItem('redirectUrl', redirectUrl);
    else sessionStorage.removeItem('redirectUrl');
    if (lastApiResponse) sessionStorage.setItem('lastApiResponse', JSON.stringify(lastApiResponse));
    else sessionStorage.removeItem('lastApiResponse');
  }, [productMode, integrationMode, cashierMode, currentStep, paymentMethod, redirectUrl, lastApiResponse]);

  // ── 性能优化：组件模式后台预加载 ──────────────────────────────────────────────
  useEffect(() => {
    if (integrationMode === 'component' && currentStep === 's1' && !sessionData && !isApiCalling) {
      console.log('🚀 [Background] Pre-fetching PayerMax Session...');
      applySession();
    }
  }, [integrationMode, currentStep, sessionData]);

  // ── 流程定义 ──────────────────────────────────────────────────────────────────
  const steps = useMemo(() => {
    if (productMode === 'STANDARD') {
      return getStandardSteps(integrationMode, cashierMode);
    }
    // 其他模式占位
    if (productMode === 'PAYMENT_LINK') {
      return [{ id: 'l1', label: '配置链接' }, { id: 'l2', label: '支付页面' }, { id: 'l3', label: '完成' }];
    }
    return [{ id: 's1', label: '默认步骤' }];
  }, [productMode, integrationMode, cashierMode]);

  const resetFlow = () => {
    setCurrentStep('s1');
    setRedirectUrl(null);
    setLastApiResponse(null);
    setSessionData(null);
    setSessionError(null);
    setTriggerFlash(prev => prev + 1);
  };

  const setProductMode = (mode: ProductMode) => {
    setProductModeState(mode);
    resetFlow();
  };

  const setIntegrationMode = (mode: PaymentIntegrationMode) => {
    setIntegrationModeState(mode);
    resetFlow();
  };

  const setCashierMode = (mode: 'ALL' | 'SPECIFIC') => {
    setCashierModeState(mode);
    resetFlow();
  };

  const setPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethodState(method);
    // 注意：不在此处 resetFlow，避免在支付 UI 操作期间（如 s2 确认支付）
    // 破坏当前步骤状态。流程重置应由用户显式操作（如切换集成模式）完成。
  };

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
    setTriggerFlash(prev => prev + 1);
  };

  // ── 流程引擎核心 ──────────────────────────────────────────────────────────────
  const toNextStep = async (selectedPaymentMethod?: PaymentMethod) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex >= steps.length - 1) return;

    const nextStepId = steps[currentIndex + 1].id;

    if (productMode === 'STANDARD') {
      // 1. 收银台模式逻辑
      if (integrationMode === 'cashier') {
        if (cashierMode === 'ALL' && currentStep === 's1') {
          await callOrderAndPay(nextStepId);
        } else if (cashierMode === 'SPECIFIC') {
          if (currentStep === 's1') {
            setCurrentStep(nextStepId); // 到 s2 (自建收银台)
          } else if (currentStep === 's2') {
            await callOrderAndPay(nextStepId, selectedPaymentMethod); // 从 s2 到 s3 (下单展示)
          } else {
            setCurrentStep(nextStepId);
          }
        } else {
          setCurrentStep(nextStepId);
        }
      } 
      // 2. API 模式逻辑 (s1→s2 导航, s2→s3 直接调用 orderAndPay)
      else if (integrationMode === 'api') {
        if (currentStep === 's1') {
          setCurrentStep(nextStepId); // 到 s2 (自建收银台选择)
        } else if (currentStep === 's2') {
          // 把用户选择的支付方式直接传入，绕过可能有延迟的 paymentMethod 状态
          await callOrderAndPay(nextStepId, selectedPaymentMethod);
        } else {
          setCurrentStep(nextStepId);
        }
      }
      // 3. 组件模式逻辑
      else if (integrationMode === 'component') {
        // 组件模式主要在组件内部控制状态流转，此处仅处理跳转到成功页
        setCurrentStep(nextStepId);
      }
    } else {
      setCurrentStep(nextStepId);
    }
    setTriggerFlash(prev => prev + 1);
  };

  const applySession = async () => {
    if (sessionData || sessionError || isApiCalling) return;

    setIsApiCalling(true);
    setSessionError(null);
    try {
      const response = await fetch('/api/applySession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          country: "ID",
          userId: userId,
          mitType: "RECURRING",
          componentList: ["CARD", "APPLEPAY", "GOOGLEPAY"]
        })
      });
      const result = await response.json();
      setLastApiResponse(result);
      
      if (result.code === 'APPLY_SUCCESS' && result.data) {
        setSessionData({
          sessionKey: result.data.sessionKey,
          clientKey: result.data.clientKey
        });
      } else {
        setSessionError(result.msg || '会话获取失败');
      }
    } catch (err) {
      const errorMsg = '网络请求失败，请检查服务状态';
      setSessionError(errorMsg);
      console.error('Apply Session Error:', err);
    } finally {
      setIsApiCalling(false);
      setTriggerFlash(prev => prev + 1);
    }
  };

  const submitComponentOrder = async () => {
    if (!paymentToken) {
      logger.warn('paymentToken 缺失，无法下单');
      return;
    }
    
    setIsApiCalling(true);
    try {
      const response = await fetch('/api/orderAndPay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount || '11.00',
          currency: currency || 'USD',
          integrationMode: 'component',
          paymentToken: paymentToken,
          sessionKey: sessionData?.sessionKey,
          // 下面是可选项，透传给后端
          country: "ID",
          userId: userId,
          subject: "Demo Drop-in Payment"
        })
      });
      const result = await response.json();
      
      // 注意：统一网关返回的是 PayerMax 的完整 response
      if (result.code === 'PAY_SUCCESS' || result.code === 'APPLY_SUCCESS') {
        setLastApiResponse(result);
        // 下单成功，流转到成功步骤
        const currentIndex = steps.findIndex(s => s.id === currentStep);
        if (currentIndex < steps.length - 1) {
          setCurrentStep(steps[currentIndex + 1].id);
        }
      } else {
        alert('支付失败: ' + (result.msg || '未知错误'));
      }
    } catch (err) {
      console.error('Order Error:', err);
      alert('请求后端接口失败');
    } finally {
      setIsApiCalling(false);
      setTriggerFlash(prev => prev + 1);
    }
  };

  // 通用 API 调用方法
  const callOrderAndPay = async (nextStepId: string, overridePaymentMethod?: PaymentMethod) => {
    setIsApiCalling(true);
    try {
      // 优先使用 override 参数（来自 UI 实时选择），并更新状态以保持一致
      const effectivePaymentMethod = overridePaymentMethod || paymentMethod;
      if (overridePaymentMethod) {
        setPaymentMethodState(overridePaymentMethod);
        setCashierPaymentMethod(overridePaymentMethod);
      }

      const requestBody: any = {
        amount: 11, // 注意在真实场景中应使用状态中的 amount
        currency: "USD",
        integrationMode: integrationMode,
        cashierMode: cashierMode,
        paymentMethod: effectivePaymentMethod,
        // 透传非必选业务字段
        subject: "diamond 700",
        userId: "USER_" + Date.now(),
        country: "ID"
      };

      const response = await fetch('/api/orderAndPay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      if (result.code === 'APPLY_SUCCESS') {
        setRedirectUrl(result.data?.redirectUrl || null);
        setLastApiResponse(result);
        setCurrentStep(nextStepId);
      } else {
        alert('下单失败: ' + (result.msg || '未知错误'));
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('网络请求失败，请确保后端服务已启动');
    } finally {
      setIsApiCalling(false);
    }
  };

  // ── 报文模板核心 ──────────────────────────────────────────────────────────────
  const mockApiData = useMemo(() => {
    if (productMode === 'STANDARD') {
      return getStandardPayloads(
        currentStep,
        integrationMode,
        cashierMode,
        paymentMethod,
        cashierPaymentMethod,
        lastApiResponse,
        amount,
        currency,
        country,
        userId,
        subject,
        sessionData,
        paymentToken,
        country
      );
    }
    // 其他模式占位...
    return { requestBody: "{}" };
  }, [productMode, integrationMode, cashierMode, paymentMethod, cashierPaymentMethod, currentStep, lastApiResponse, userId, amount, currency, sessionData, paymentToken, country]);

  return (
    <ProductContext.Provider value={{
      productMode, setProductMode,
      integrationMode, setIntegrationMode,
      cashierMode, setCashierMode,
      paymentMethod, setPaymentMethod,
      cashierPaymentMethod, setCashierPaymentMethod,
      linkMode, setLinkMode,
      currentStep, setCurrentStep,
      steps, amount, currency, country, userId, redirectUrl, lastApiResponse, setLastApiResponse,
      isApiCalling, triggerFlash, toNextStep, handleStepClick, resetFlow,
      mockApiData,
      sessionData, sessionError, paymentToken, setPaymentToken, applySession, submitComponentOrder
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};
