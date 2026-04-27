import React, { createContext, useContext, useState, useMemo } from 'react';
import { type ProductMode } from '@/components/shared/ModeSelector';
import { type PaymentIntegrationMode, PAYMENT_INTEGRATION_CONFIG } from '@/types/payment';
import { type PaymentMethod, PAYMENT_METHOD_CONFIG } from '@/types/subscription';
import { type LinkMode, LINK_MODE_CONFIG } from '@/types/link';

export const MODES_DESC: Record<ProductMode, string> = {
  STANDARD: '标准收单',
  SUBSCRIPTION: '订阅代扣',
  PAYMENT_LINK: '链接支付'
};

interface StepItem {
  id: string;
  label: string;
}

interface ApiData {
  endpoint?: { method: string; url: string };
  requestBody: string;
  responseBody?: string;
}

interface ProductContextType {
  // 核心产品状态
  productMode: ProductMode;
  setProductMode: (mode: ProductMode) => void;
  
  // 参数配置状态预留
  integrationMode: PaymentIntegrationMode;
  setIntegrationMode: (mode: PaymentIntegrationMode) => void;
  cashierMode: 'ALL' | 'SPECIFIC';
  setCashierMode: (mode: 'ALL' | 'SPECIFIC') => void;
  linkMode: LinkMode;
  setLinkMode: (mode: LinkMode) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cashierPaymentMethod: PaymentMethod;
  setCashierPaymentMethod: (method: PaymentMethod) => void;
  amount: string;
  currency: string;
  paymentMethods: string[];
  
  // 全局交互与流转引擎状态
  currentStep: string;
  triggerFlash: number;
  handleStepClick: (id: string) => void;
  toNextStep: () => void;
  steps: StepItem[];
  
  // 供沙盘使用的多维度报文数据
  mockApiData: ApiData;
  redirectUrl: string | null;
  isApiCalling: boolean;
  lastApiResponse: any;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productMode, setProductModeState] = useState<ProductMode>('STANDARD');
  const [integrationMode, setIntegrationModeState] = useState<PaymentIntegrationMode>('cashier');
  const [cashierMode, setCashierModeState] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [linkMode, setLinkModeState] = useState<LinkMode>('api');
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>('card');
  const [cashierPaymentMethod, setCashierPaymentMethodState] = useState<PaymentMethod>('card');
  const [amount] = useState("11.00");
  const [currency] = useState("USD");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isApiCalling, setIsApiCalling] = useState(false);
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState('s1');
  const [triggerFlash, setTriggerFlash] = useState(0);

  // 1. 定义受控的 Setter，确保切换配置时逻辑上“重置”沙盘
  const resetFlow = () => {
    setCurrentStep('s1');
    setRedirectUrl(null);
    setLastApiResponse(null);
    setCashierPaymentMethodState('card');
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

  const setLinkMode = (mode: LinkMode) => {
    setLinkModeState(mode);
    resetFlow();
  };

  const setPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethodState(method);
    resetFlow();
  };

  const setCashierPaymentMethod = (method: PaymentMethod) => {
    setCashierPaymentMethodState(method);
  };

  // 根据当前选择的单体支付方式，计算出传给 API 的数组格式
  const paymentMethods = useMemo(() => {
    // 如果是标准收单的收银台模式，且选择了“全量收银台”，则返回空数组代表全量
    if (productMode === 'STANDARD' && integrationMode === 'cashier' && cashierMode === 'ALL') {
      return [];
    }
    return [PAYMENT_METHOD_CONFIG[paymentMethod].apiType];
  }, [productMode, integrationMode, cashierMode, paymentMethod]);

  // 2. 根据不同模式演算不同的展示步骤逻辑集
  const steps = useMemo(() => {
    // 订阅代扣模式
    if (productMode === 'SUBSCRIPTION') {
      return [
        { id: 's1', label: '配置参数' },
        { id: 's2', label: '绑卡与授权' },
        { id: 's3', label: '纯后端代扣' },
        { id: 's4', label: '扣款结果' }
      ];
    }
    
    // 链接支付模式
    if (productMode === 'PAYMENT_LINK') {
      return [
        { id: 's1', label: '配置极简参数' },
        { id: 's2', label: '生成短链' },
        { id: 's3', label: '扫码/跳转体验' },
        { id: 's4', label: '结果' }
      ];
    }
    
    // ===== 标准收单模式（根据集成模式独立配置）=====
    
    // 收银台模式
    if (integrationMode === 'cashier') {
      // 指定支付方式模式添加自建收银台步骤
      if (cashierMode === 'SPECIFIC') {
        return [
          { id: 's1', label: '商品信息' },
          { id: 's2', label: '自建收银台' },
          { id: 's3', label: '下单展示' },
          { id: 's4', label: '支付成功' }
        ];
      }
      // 全量收银台模式保持原有步骤
      return [
        { id: 's1', label: '商品信息' },
        { id: 's2', label: '下单展示' },
        { id: 's3', label: '支付成功' }
      ];
    }
    
    // API 模式
    if (integrationMode === 'api') {
      return [
        { id: 's1', label: '商品信息' },
        { id: 's2', label: '唤起支付' },
        { id: 's3', label: '支付成功' }
      ];
    }
    
    // 前置组件模式
    if (integrationMode === 'component') {
      return [
        { id: 's1', label: '商品信息' },
        { id: 's2', label: '加载组件' },
        { id: 's3', label: '下单支付' },
        { id: 's4', label: '支付成功' }
      ];
    }
    
    return [];
  }, [productMode, integrationMode, cashierMode]);

  // 3. 点击切换步骤
  const handleStepClick = (id: string) => {
    setCurrentStep(id);
    setTriggerFlash(prev => prev + 1);
  };

  // 4. 自动化流转引擎：一键推射至下一阶段（支持异步真实调用）
  const toNextStep = async (selectedPaymentMethod?: PaymentMethod) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStepId = steps[currentIndex + 1].id;
      
      // 特殊逻辑：标准收单从 s1 到 s2 时
      if (productMode === 'STANDARD' && currentStep === 's1' && nextStepId === 's2') {
        // 全量收银台模式：直接发起API调用
        if (cashierMode === 'ALL') {
          setIsApiCalling(true);
          try {
            // 从mockApiData中获取请求体，确保与代码块展示的内容一致
            const apiData = mockApiData;
            if (apiData.requestBody) {
              const requestBody = JSON.parse(apiData.requestBody);
              // 添加frontCallbackUrl参数
              requestBody.frontCallbackUrl = "http://localhost:5173/callback";
              
              const response = await fetch('/api/standard/orderAndPay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
              });
              
              const rawText = await response.text();
              console.log('🛰️ API Raw Response:', rawText);
              
              if (!rawText) {
                throw new Error('服务器返回了空响应');
              }

              const result = JSON.parse(rawText);
              if (result.code === 'APPLY_SUCCESS' && result.data?.redirectUrl) {
                setRedirectUrl(result.data.redirectUrl);
                setLastApiResponse(result);
                setCurrentStep(nextStepId);
                setTriggerFlash(prev => prev + 1);
              } else {
                console.error('API Error:', result.msg);
                alert('下单失败: ' + (result.msg || '未知错误'));
              }
            } else {
              console.error('No request body available');
              alert('无法获取请求参数，请稍后重试');
            }
          } catch (error) {
            console.error('Network Error:', error);
            alert('网络请求失败，请确保本地后端服务已启动');
          } finally {
            setIsApiCalling(false);
          }
          return; // 异步逻辑完成后由于已经手动设置了 step，直接返回
        } else {
          // 指定支付方式模式：直接跳转到自建收银台步骤，不发起API调用
          setCurrentStep(nextStepId);
          setTriggerFlash(prev => prev + 1);
          return;
        }
      }
      
      // 特殊逻辑：标准收单从 s2 到 s3 时
      if (productMode === 'STANDARD' && currentStep === 's2' && nextStepId === 's3') {
        // 指定支付方式模式：自建收银台到下单展示，发起真实的 UAT 网关调用
        if (cashierMode === 'SPECIFIC') {
          setIsApiCalling(true);
          try {
            // 使用传入的支付方式或当前状态中的支付方式
            const paymentMethodToUse = selectedPaymentMethod || cashierPaymentMethod;
            
            // 构建请求体，确保使用最新的支付方式
            const requestBody = {
              subject: "diamond 700",
              totalAmount: 11,
              currency: "USD",
              userId: "USER_" + Date.now(),
              language: "en",
              integrate: "Hosted_Checkout",
              outTradeNo: "ORDER_" + Date.now(),
              notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl",
              frontCallbackUrl: "http://localhost:5173/callback",
              paymentDetail: {
                paymentMethodType: paymentMethodToUse.toUpperCase(),
                targetOrg: "",
                allowedCardOrg: []
              }
            };
            
            const response = await fetch('/api/standard/orderAndPay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });
            
            const rawText = await response.text();
            console.log('🛰️ API Raw Response:', rawText);
            
            if (!rawText) {
              throw new Error('服务器返回了空响应');
            }

            const result = JSON.parse(rawText);
            if (result.code === 'APPLY_SUCCESS' && result.data?.redirectUrl) {
              setRedirectUrl(result.data.redirectUrl);
              setLastApiResponse(result);
              setCurrentStep(nextStepId);
              setTriggerFlash(prev => prev + 1);
            } else {
              console.error('API Error:', result.msg);
              alert('下单失败: ' + (result.msg || '未知错误'));
            }
          } catch (error) {
            console.error('Network Error:', error);
            alert('网络请求失败，请确保本地后端服务已启动');
          } finally {
            setIsApiCalling(false);
          }
          return; // 异步逻辑完成后由于已经手动设置了 step，直接返回
        } else {
          // 全量收银台模式：下单展示到支付成功，直接跳转
          setCurrentStep(nextStepId);
          setTriggerFlash(prev => prev + 1);
          return;
        }
      }

      setCurrentStep(nextStepId);
      setTriggerFlash(prev => prev + 1);
    }
  };

  // 5. 数据核心重构：多态报文策略。
  const mockApiData = useMemo(() => {
    // 处理 requestTime: 符合 RFC3339 规范 (yyyy-MM-dd'T'HH:mm:ss.SSSXXX)
    const formatRFC3339 = (date: Date) => {
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      const tzo = -date.getTimezoneOffset();
      const dif = tzo >= 0 ? '+' : '-';
      const tzHours = pad(Math.floor(Math.abs(tzo) / 60));
      const tzMin = pad(Math.abs(tzo) % 60);
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000${dif}${tzHours}:${tzMin}`;
    };

    const futureTime = formatRFC3339(new Date());
    const randomOrder = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 标准收单模式
    if (productMode === 'STANDARD') {
      // 收银台模式
      if (integrationMode === 'cashier') {
        if (currentStep === 's1') {
          // 构建基本请求体
          const requestBody = {
            subject: "diamond 700",
            totalAmount: 11,
            currency: "USD",
            userId: "USER_" + Date.now(),
            language: "en",
            integrate: "Hosted_Checkout",
            outTradeNo: "ORDER_" + Date.now(),
            notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
          };
          
          // 如果是指定支付方式模式，添加paymentDetail参数
          if (cashierMode === 'SPECIFIC') {
            requestBody.paymentDetail = {
              paymentMethodType: cashierPaymentMethod.toUpperCase(),
              targetOrg: "",
              allowedCardOrg: []
            };
          }
          
          return {
            endpoint: { method: 'POST', url: '/api/standard/orderAndPay' },
            requestBody: JSON.stringify(requestBody, null, 2)
          };
        }
        // 自建收银台步骤（仅指定支付方式模式）
        if (currentStep === 's2' && cashierMode === 'SPECIFIC') {
          // 构建与商品信息步骤一致的请求体
          const requestBody = {
            subject: "diamond 700",
            totalAmount: 11,
            currency: "USD",
            userId: "USER_" + Date.now(),
            language: "en",
            integrate: "Hosted_Checkout",
            outTradeNo: "ORDER_" + Date.now(),
            notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
          };
          
          // 如果是指定支付方式模式，添加paymentDetail参数
          if (cashierMode === 'SPECIFIC') {
            requestBody.paymentDetail = {
              paymentMethodType: cashierPaymentMethod.toUpperCase(),
              targetOrg: "",
              allowedCardOrg: []
            };
          }
          
          return {
            endpoint: { method: 'POST', url: '/api/standard/orderAndPay' },
            requestBody: JSON.stringify(requestBody, null, 2)
          };
        }
        // 下单展示步骤
        if ((currentStep === 's2' && cashierMode === 'ALL') || (currentStep === 's3' && cashierMode === 'SPECIFIC')) {
          const displayResponse = lastApiResponse || {
            code: "APPLY_SUCCESS",
            msg: "Success.",
            data: {
              redirectUrl: "https://cashier-n-uat.payermax.com/v2/index.html#/payments?...",
              tradeToken: "T2026042004084086058527",
              outTradeNo: "ORDER_123456",
              status: "PENDING"
            }
          };

          // 构建与后端一致的请求体结构
          const requestData = {
            version: "1.5",
            keyVersion: "1",
            requestTime: futureTime,
            appId: "67eff2f3b29a4ecf9576321185dbf658",
            merchantNo: "SDP01010114048893",
            data: {
              subject: "diamond 700",
              totalAmount: 11,
              currency: "USD",
              userId: "USER_" + Date.now(),
              language: "en",
              frontCallbackUrl: "http://localhost:5173/callback",
              outTradeNo: "ORDER_" + Date.now(),
              integrate: "Hosted_Checkout",
              notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
            }
          };
          
          // 如果是指定支付方式模式，添加paymentDetail参数
          if (cashierMode === 'SPECIFIC') {
            requestData.data.paymentDetail = {
              paymentMethodType: paymentMethod.toUpperCase(),
              targetOrg: "",
              allowedCardOrg: []
            };
          }

          return {
            endpoint: { method: 'POST', url: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/orderAndPay' },
            requestBody: JSON.stringify(requestData, null, 2),
            responseBody: JSON.stringify(displayResponse, null, 2)
          };
        }
        // 支付成功步骤
        if ((currentStep === 's3' && cashierMode === 'ALL') || (currentStep === 's4' && cashierMode === 'SPECIFIC')) {
          const outTradeNo = lastApiResponse?.data?.outTradeNo || 'ORDER_1776748015915';
          return {
            endpoint: { method: 'POST', url: '/api/webhook' },
            requestBody: JSON.stringify({
              "appId": "67eff2f3b29a4ecf9576321185dbf658",
              "code": "APPLY_SUCCESS",
              "data": {
                "cashierCountry": "SG",
                "channelNo": "UPC406600177674813545901035698",
                "completeTime": "2026-04-21T05:08:55.523Z",
                "country": "SG",
                "currency": "USD",
                "outTradeNo": outTradeNo,
                "paymentDetails": [
                  {
                    "additionalData": {
                      "authCode": "88888888",
                      "rrn": "012345678910"
                    },
                    "billingInfo": {
                      "country": "US",
                      "email": "971877779@qq.com"
                    },
                    "cardInfo": {
                      "cardBinNo": "444433",
                      "cardExpirationMonth": "03",
                      "cardExpirationYear": "30",
                      "cardHolderName": "**mes",
                      "cardIdentifierName": "**mes",
                      "cardIdentifierNo": "444433******1111",
                      "cardNumber": "444433****1111",
                      "cardOrg": "VISA",
                      "cardType": "CREDIT",
                      "country": "US",
                      "source": "CARD",
                      "totalCardOrg": [
                        "VISA"
                      ],
                      "type": "PAN"
                    },
                    "exchangeRate": "1.32836220",
                    "payAmount": 14.61,
                    "payCurrency": "SGD",
                    "paymentMethodType": "CARD"
                  }
                ],
                "status": "SUCCESS",
                "thirdChannelNo": "25f1487840af4fba9deb5cb99491493a",
                "totalAmount": 11,
                "tradeToken": "T2026042105406686082195"
              },
              "keyVersion": "1",
              "merchantNo": "SDP01010114048893",
              "msg": "Success.",
              "notifyTime": "2026-04-21T05:08:55 +0000",
              "notifyType": "PAYMENT"
            }, null, 2),
            responseBody: JSON.stringify({
              "msg": "Success",
              "code": "SUCCESS"
            }, null, 2)
          };
        }
      }
      
      // API模式
      if (integrationMode === 'api') {
        if (currentStep === 's1') {
          return {
            endpoint: { method: 'POST', url: '/api/standard/orderAndPay' },
            requestBody: JSON.stringify({
              subject: "diamond 700",
              totalAmount: 11,
              currency: "USD",
              userId: "USER_" + Date.now(),
              language: "en",
              integrate: "API",
              outTradeNo: "ORDER_" + Date.now(),
              notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
            }, null, 2)
          };
        }
        if (currentStep === 's2') {
          const displayResponse = lastApiResponse || {
            code: "APPLY_SUCCESS",
            msg: "Success.",
            data: {
              tradeToken: "T2026042004084086058527",
              outTradeNo: "ORDER_123456",
              status: "PENDING"
            }
          };

          return {
            endpoint: { method: 'POST', url: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/orderAndPay' },
            requestBody: JSON.stringify({
              version: "1.5",
              keyVersion: "1",
              requestTime: futureTime,
              appId: "67eff2f3b29a4ecf9576321185dbf658",
              merchantNo: "SDP01010114048893",
              data: {
                subject: "diamond 700",
                totalAmount: 11,
                currency: "USD",
                userId: "USER_" + Date.now(),
                language: "en",
                frontCallbackUrl: "http://localhost:5173/callback",
                outTradeNo: "ORDER_" + Date.now(),
                integrate: "API",
                notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
              }
            }, null, 2),
            responseBody: JSON.stringify(displayResponse, null, 2)
          };
        }
        if (currentStep === 's3') {
          const outTradeNo = lastApiResponse?.data?.outTradeNo || 'ORDER_1776748015915';
          return {
            endpoint: { method: 'POST', url: '/api/webhook' },
            requestBody: JSON.stringify({
              "appId": "67eff2f3b29a4ecf9576321185dbf658",
              "code": "APPLY_SUCCESS",
              "data": {
                "cashierCountry": "SG",
                "channelNo": "UPC406600177674813545901035698",
                "completeTime": "2026-04-21T05:08:55.523Z",
                "country": "SG",
                "currency": "USD",
                "outTradeNo": outTradeNo,
                "paymentDetails": [
                  {
                    "additionalData": {
                      "authCode": "88888888",
                      "rrn": "012345678910"
                    },
                    "billingInfo": {
                      "country": "US",
                      "email": "971877779@qq.com"
                    },
                    "cardInfo": {
                      "cardBinNo": "444433",
                      "cardExpirationMonth": "03",
                      "cardExpirationYear": "30",
                      "cardHolderName": "**mes",
                      "cardIdentifierName": "**mes",
                      "cardIdentifierNo": "444433******1111",
                      "cardNumber": "444433****1111",
                      "cardOrg": "VISA",
                      "cardType": "CREDIT",
                      "country": "US",
                      "source": "CARD",
                      "totalCardOrg": [
                        "VISA"
                      ],
                      "type": "PAN"
                    },
                    "exchangeRate": "1.32836220",
                    "payAmount": 14.61,
                    "payCurrency": "SGD",
                    "paymentMethodType": "CARD"
                  }
                ],
                "status": "SUCCESS",
                "thirdChannelNo": "25f1487840af4fba9deb5cb99491493a",
                "totalAmount": 11,
                "tradeToken": "T2026042105406686082195"
              },
              "keyVersion": "1",
              "merchantNo": "SDP01010114048893",
              "msg": "Success.",
              "notifyTime": "2026-04-21T05:08:55 +0000",
              "notifyType": "PAYMENT"
            }, null, 2),
            responseBody: JSON.stringify({
              "msg": "Success",
              "code": "SUCCESS"
            }, null, 2)
          };
        }
      }
      
      // 前置组件模式
      if (integrationMode === 'component') {
        if (currentStep === 's1') {
          return {
            endpoint: { method: 'POST', url: '/api/standard/orderAndPay' },
            requestBody: JSON.stringify({
              subject: "diamond 700",
              totalAmount: 11,
              currency: "USD",
              userId: "USER_" + Date.now(),
              language: "en",
              integrate: "COMPONENT",
              outTradeNo: "ORDER_" + Date.now(),
              notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
            }, null, 2)
          };
        }
        if (currentStep === 's2') {
          return {
            endpoint: { method: 'POST', url: '/api/standard/loadComponent' },
            requestBody: JSON.stringify({
              tradeToken: "T2026042004084086058527",
              paymentMethod: paymentMethod.toUpperCase()
            }, null, 2),
            responseBody: JSON.stringify({
              code: "APPLY_SUCCESS",
              msg: "Success.",
              data: {
                componentUrl: "https://component-n-uat.payermax.com/v2/index.html#/payment"
              }
            }, null, 2)
          };
        }
        if (currentStep === 's3') {
          const displayResponse = lastApiResponse || {
            code: "APPLY_SUCCESS",
            msg: "Success.",
            data: {
              tradeToken: "T2026042004084086058527",
              outTradeNo: "ORDER_123456",
              status: "SUCCESS"
            }
          };

          return {
            endpoint: { method: 'POST', url: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/orderAndPay' },
            requestBody: JSON.stringify({
              version: "1.5",
              keyVersion: "1",
              requestTime: futureTime,
              appId: "67eff2f3b29a4ecf9576321185dbf658",
              merchantNo: "SDP01010114048893",
              data: {
                subject: "diamond 700",
                totalAmount: 11,
                currency: "USD",
                userId: "USER_" + Date.now(),
                language: "en",
                frontCallbackUrl: "http://localhost:5173/callback",
                outTradeNo: "ORDER_" + Date.now(),
                integrate: "COMPONENT",
                notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
              }
            }, null, 2),
            responseBody: JSON.stringify(displayResponse, null, 2)
          };
        }
        if (currentStep === 's4') {
          const outTradeNo = lastApiResponse?.data?.outTradeNo || 'ORDER_1776748015915';
          return {
            endpoint: { method: 'POST', url: '/api/webhook' },
            requestBody: JSON.stringify({
              "appId": "67eff2f3b29a4ecf9576321185dbf658",
              "code": "APPLY_SUCCESS",
              "data": {
                "cashierCountry": "SG",
                "channelNo": "UPC406600177674813545901035698",
                "completeTime": "2026-04-21T05:08:55.523Z",
                "country": "SG",
                "currency": "USD",
                "outTradeNo": outTradeNo,
                "paymentDetails": [
                  {
                    "additionalData": {
                      "authCode": "88888888",
                      "rrn": "012345678910"
                    },
                    "billingInfo": {
                      "country": "US",
                      "email": "971877779@qq.com"
                    },
                    "cardInfo": {
                      "cardBinNo": "444433",
                      "cardExpirationMonth": "03",
                      "cardExpirationYear": "30",
                      "cardHolderName": "**mes",
                      "cardIdentifierName": "**mes",
                      "cardIdentifierNo": "444433******1111",
                      "cardNumber": "444433****1111",
                      "cardOrg": "VISA",
                      "cardType": "CREDIT",
                      "country": "US",
                      "source": "CARD",
                      "totalCardOrg": [
                        "VISA"
                      ],
                      "type": "PAN"
                    },
                    "exchangeRate": "1.32836220",
                    "payAmount": 14.61,
                    "payCurrency": "SGD",
                    "paymentMethodType": "CARD"
                  }
                ],
                "status": "SUCCESS",
                "thirdChannelNo": "25f1487840af4fba9deb5cb99491493a",
                "totalAmount": 11,
                "tradeToken": "T2026042105406686082195"
              },
              "keyVersion": "1",
              "merchantNo": "SDP01010114048893",
              "msg": "Success.",
              "notifyTime": "2026-04-21T05:08:55 +0000",
              "notifyType": "PAYMENT"
            }, null, 2),
            responseBody: JSON.stringify({
              "msg": "Success",
              "code": "SUCCESS"
            }, null, 2)
          };
        }
      }
    }

    // 订阅代扣模式
    if (productMode === 'SUBSCRIPTION') {
      if (currentStep === 's1') {
        return {
          endpoint: { method: 'POST', url: '/api/subscription/config' },
          requestBody: JSON.stringify({
            subject: "Monthly Subscription",
            totalAmount: 9.99,
            currency: "USD",
            userId: "USER_" + Date.now(),
            language: "en",
            outTradeNo: "ORDER_" + Date.now(),
            notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
          }, null, 2)
        };
      }
      if (currentStep === 's2') {
        return {
          endpoint: { method: 'POST', url: '/api/subscription/bindCard' },
          requestBody: JSON.stringify({
            userId: "USER_" + Date.now(),
            cardNo: "444433******1111",
            cardExpiry: "03/30",
            cardHolder: "Test User"
          }, null, 2),
          responseBody: JSON.stringify({
            code: "APPLY_SUCCESS",
            msg: "Success.",
            data: {
              token: "TOKEN_123456",
              cardId: "CARD_123456"
            }
          }, null, 2)
        };
      }
      if (currentStep === 's3') {
        return {
          endpoint: { method: 'POST', url: '/api/subscription/charge' },
          requestBody: JSON.stringify({
            userId: "USER_" + Date.now(),
            cardId: "CARD_123456",
            amount: 9.99,
            currency: "USD",
            outTradeNo: "ORDER_" + Date.now()
          }, null, 2),
          responseBody: JSON.stringify({
            code: "APPLY_SUCCESS",
            msg: "Success.",
            data: {
              tradeNo: "TRADE_123456",
              status: "SUCCESS"
            }
          }, null, 2)
        };
      }
      if (currentStep === 's4') {
        return {
          endpoint: { method: 'POST', url: '/api/webhook' },
          requestBody: JSON.stringify({
            "appId": "67eff2f3b29a4ecf9576321185dbf658",
            "code": "APPLY_SUCCESS",
            "data": {
              "outTradeNo": "ORDER_" + Date.now(),
              "status": "SUCCESS",
              "totalAmount": 9.99,
              "currency": "USD"
            },
            "keyVersion": "1",
            "merchantNo": "SDP01010114048893",
            "msg": "Success.",
            "notifyTime": "2026-04-21T05:08:55 +0000",
            "notifyType": "PAYMENT"
          }, null, 2),
          responseBody: JSON.stringify({
            "msg": "Success",
            "code": "SUCCESS"
          }, null, 2)
        };
      }
    }

    // 链接支付模式
    if (productMode === 'PAYMENT_LINK') {
      if (currentStep === 's1') {
        return {
          endpoint: { method: 'POST', url: '/api/link/create' },
          requestBody: JSON.stringify({
            subject: "diamond 700",
            totalAmount: 11,
            currency: "USD",
            userId: "USER_" + Date.now(),
            language: "en",
            outTradeNo: "ORDER_" + Date.now(),
            notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl"
          }, null, 2)
        };
      }
      if (currentStep === 's2') {
        return {
          endpoint: { method: 'POST', url: '/api/link/generate' },
          requestBody: JSON.stringify({
            outTradeNo: "ORDER_" + Date.now()
          }, null, 2),
          responseBody: JSON.stringify({
            code: "APPLY_SUCCESS",
            msg: "Success.",
            data: {
              shortUrl: "https://pmx.link/abc123",
              qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"
            }
          }, null, 2)
        };
      }
      if (currentStep === 's3') {
        return {
          endpoint: { method: 'GET', url: '/api/link/status' },
          requestBody: JSON.stringify({
            outTradeNo: "ORDER_" + Date.now()
          }, null, 2),
          responseBody: JSON.stringify({
            code: "APPLY_SUCCESS",
            msg: "Success.",
            data: {
              status: "PENDING",
              payUrl: "https://cashier-n-uat.payermax.com/v2/index.html#/payments?..."
            }
          }, null, 2)
        };
      }
      if (currentStep === 's4') {
        return {
          endpoint: { method: 'POST', url: '/api/webhook' },
          requestBody: JSON.stringify({
            "appId": "67eff2f3b29a4ecf9576321185dbf658",
            "code": "APPLY_SUCCESS",
            "data": {
              "outTradeNo": "ORDER_" + Date.now(),
              "status": "SUCCESS",
              "totalAmount": 11,
              "currency": "USD"
            },
            "keyVersion": "1",
            "merchantNo": "SDP01010114048893",
            "msg": "Success.",
            "notifyTime": "2026-04-21T05:08:55 +0000",
            "notifyType": "PAYMENT"
          }, null, 2),
          responseBody: JSON.stringify({
            "msg": "Success",
            "code": "SUCCESS"
          }, null, 2)
        };
      }
    }

    // 默认回退（针对其他模式或步骤）
    return {
      requestBody: JSON.stringify({ comment: "Step logic pending implementation" }, null, 2)
    };
    
  }, [productMode, integrationMode, cashierMode, paymentMethod, cashierPaymentMethod, currentStep, lastApiResponse]);

  return (
    <ProductContext.Provider value={{
      productMode, setProductMode,
      integrationMode, setIntegrationMode,
      cashierMode, setCashierMode,
      linkMode, setLinkMode,
      paymentMethod, setPaymentMethod,
      cashierPaymentMethod, setCashierPaymentMethod,
      amount, currency, paymentMethods,
      currentStep, triggerFlash, handleStepClick, steps, toNextStep,
      mockApiData, redirectUrl, isApiCalling, lastApiResponse
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider. 架构层要求所有涉及该领域模型的组件都在 Provider 下运作。');
  }
  return context;
};
