/**
 * Subscription Payload Templates
 * 各步骤的 JSON 报文生成器
 * 对标原型: app.js → updateDynamic() 的映射逻辑
 */

import type {
  SubMode, IntegrationMode, PaymentMethod, SubscriptionType, SubscriptionFormParams
} from '@/types/subscription';
import {
  calculateActivateAmount, getComponentList, PAYMENT_METHOD_CONFIG
} from '@/types/subscription';

interface PayloadArgs {
  subMode: SubMode;
  integration: IntegrationMode;
  payment: PaymentMethod;
  subscriptionType: SubscriptionType;
  params: SubscriptionFormParams;
  stepId: string;
}

/**
 * 根据当前步骤 ID 和业务状态，生成对应的 JSON 报文字符串（格式化）
 */
export function getPayloadForStep(args: PayloadArgs): string {
  const { subMode, integration, payment, subscriptionType, params, stepId } = args;

  // ── PayerMax 托管 ──────────────────────────────────────────────────────────
  if (subMode === 'payermax') {

    if (stepId === 'pm-1') {
      return buildJson({
        comment: 'Step 1: 配置订阅参数 — 前端参数组装',
        subscriptionType,
        subscriptionPlan: buildSubscriptionPlan(subscriptionType, params),
        integration,
        payment: PAYMENT_METHOD_CONFIG[payment].apiType,
      });
    }

    if (stepId === 'pm-2') {
      return buildJson({
        comment: 'Step 2: 调用 subscriptionCreate API',
        endpoint: '/api/v1/subscriptionCreate',
        requestBody: {
          version: '1.5', keyVersion: '1',
          requestTime: new Date().toISOString(),
          merchantNo: 'SDP0XXXXX93',
          data: {
            subscriptionRequestId: `sub_req_${Date.now()}`,
            userId: 'test10001',
            callbackUrl: 'https://your.server/callback',
            subscriptionPlan: buildSubscriptionPlan(subscriptionType, params),
          }
        },
        response: { subscriptionNo: 'SUB260318XXXXXXX9847003', status: 'INACTIVE' }
      });
    }

    if (stepId === 'pm-component') {
      const activateAmount = calculateActivateAmount(subscriptionType, params.amount, params.trialAmountCombo);
      return buildJson({
        comment: 'Step 3 (Component): 获取 Session Key 并加载前置组件',
        endpoint: '/api/v1/applyDropinSession',
        requestBody: {
          data: {
            country: 'MY', totalAmount: parseFloat(activateAmount),
            currency: params.currency, mitType: 'SCHEDULED',
            userId: 'test10001', componentList: [getComponentList(payment)],
          }
        }
      });
    }

    if (stepId === 'pm-activate') {
      const activateAmount = calculateActivateAmount(subscriptionType, params.amount, params.trialAmountCombo);
      return buildJson({
        comment: `Step 3 (${integration === 'api' ? 'API' : '收银台'}): 激活订阅 — orderAndPay`,
        endpoint: '/api/v1/orderAndPay',
        requestBody: {
          data: {
            outTradeNo: `ORD_${Date.now()}`,
            subject: 'PayerMax订阅计划',
            totalAmount: parseFloat(activateAmount),
            currency: params.currency,
            integrate: integration === 'api' ? 'Direct_Payment' : 'Hosted_Checkout',
            subscriptionPlan: { subscriptionNo: 'SUB2026XXXxxxxxx2112' },
            paymentDetail: {
              paymentMethodType: PAYMENT_METHOD_CONFIG[payment].apiType,
              mitType: 'SCHEDULED', tokenForFutureUse: true,
            }
          }
        }
      });
    }

    if (stepId === 'pm-complete') {
      return buildJson({
        comment: 'Step 4: Webhook 回调 — 订阅激活完成',
        notifyType: 'SUBSCRIPTION_PAYMENT',
        data: {
          status: 'TRADE_SUCCESS',
          amount: parseFloat(params.amount), currency: params.currency,
          subscriptionNo: 'SUB2026XXXxxxxxx2112',
          paymentTokenID: 'PMTOKEN177XXXXX1000551',
        }
      });
    }
  }

  // ── 商户自管 ───────────────────────────────────────────────────────────────
  if (subMode === 'merchant') {

    if (stepId === 'm-1') {
      return buildJson({
        comment: 'Step 1: 配置绑定参数',
        bindType: params.bindType,
        amount: params.bindType === 'zero' ? 0 : parseFloat(params.merchantAmount),
        currency: params.merchantCurrency,
        subject: params.merchantSubject,
        userId: params.merchantUserId,
      });
    }

    if (stepId === 'm-component') {
      return buildJson({
        comment: 'Step 2 (Component): 商户自管 — 加载前置组件',
        endpoint: '/api/v1/applyDropinSession',
        requestBody: {
          data: {
            totalAmount: parseFloat(params.merchantAmount),
            currency: params.merchantCurrency,
            mitType: 'SCHEDULED', userId: params.merchantUserId,
            componentList: [getComponentList(payment)],
          }
        }
      });
    }

    if (stepId === 'm-bind') {
      return buildJson({
        comment: `Step 2 (${integration === 'api' ? 'API' : '收银台'}): 首次绑定支付方式`,
        endpoint: '/api/v1/orderAndPay',
        requestBody: {
          data: {
            outTradeNo: `ORD_${Date.now()}`,
            subject: params.merchantSubject,
            totalAmount: params.bindType === 'zero' ? 0 : parseFloat(params.merchantAmount),
            currency: params.merchantCurrency,
            integrate: integration === 'api' ? 'Direct_Payment' : 'Hosted_Checkout',
            paymentDetail: {
              paymentMethodType: PAYMENT_METHOD_CONFIG[payment].apiType,
              mitType: 'SCHEDULED', tokenForFutureUse: true,
            }
          }
        }
      });
    }

    if (stepId === 'm-deduct') {
      return buildJson({
        comment: 'Step 3: 商户后端 — 发起后续代扣',
        endpoint: '/api/v1/orderAndPay',
        requestBody: {
          data: {
            outTradeNo: `ORD_DEDUCT_${Date.now()}`,
            totalAmount: parseFloat(params.merchantAmount),
            currency: params.merchantCurrency,
            paymentDetail: {
              paymentTokenID: 'PMTOKEN177XXXXX1000551',
              mitType: 'SCHEDULED', merchantInitiated: true,
            }
          }
        },
        response: { status: 'TRADE_SUCCESS', paymentTokenID: 'PMTOKEN177XXXXX1000551' }
      });
    }
  }

  // ── 非周期性 ───────────────────────────────────────────────────────────────
  if (subMode === 'nonperiodic') {

    if (stepId === 'np-1') {
      return buildJson({
        comment: 'Step 1: 收集业务数据 — 非周期性绑定',
        amount: parseFloat(params.npAmount),
        currency: params.npCurrency,
        mitType: 'UNSCHEDULED',
      });
    }

    if (stepId === 'np-component') {
      return buildJson({
        comment: 'Step 2 (Component): 非周期性 — 加载前置组件',
        endpoint: '/api/v1/applyDropinSession',
        requestBody: {
          data: {
            totalAmount: parseFloat(params.npAmount),
            currency: params.npCurrency,
            mitType: 'UNSCHEDULED', componentList: [getComponentList(payment)],
          }
        }
      });
    }

    if (stepId === 'np-bind') {
      return buildJson({
        comment: `Step 2 (${integration === 'api' ? 'API' : '收银台'}): 非周期性首次绑定`,
        endpoint: '/api/v1/orderAndPay',
        requestBody: {
          data: {
            outTradeNo: `ORD_NP_${Date.now()}`,
            totalAmount: parseFloat(params.npAmount),
            currency: params.npCurrency,
            paymentDetail: {
              paymentMethodType: PAYMENT_METHOD_CONFIG[payment].apiType,
              mitType: 'UNSCHEDULED', tokenForFutureUse: true,
            }
          }
        }
      });
    }

    if (stepId === 'np-deduct') {
      return buildJson({
        comment: 'Step 3: 非周期性 — 商户按需发起扣款',
        endpoint: '/api/v1/orderAndPay',
        requestBody: {
          data: {
            outTradeNo: `ORD_NP_DEDUCT_${Date.now()}`,
            totalAmount: parseFloat(params.npAmount),
            currency: params.npCurrency,
            paymentDetail: {
              paymentTokenID: 'PMTOKEN177XXXXX1000551',
              mitType: 'UNSCHEDULED', merchantInitiated: true,
            }
          }
        }
      });
    }
  }

  return buildJson({ comment: '加载中...' });
}

// ── 私有辅助 ──────────────────────────────────────────────────────────────────

function buildJson(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, null, 2);
}

function buildSubscriptionPlan(type: SubscriptionType, p: SubscriptionFormParams) {
  const base = {
    subject: 'PayerMax订阅计划',
    totalPeriods: parseInt(p.totalPeriods),
    periodRule: { periodUnit: p.periodUnit, periodCount: parseInt(p.periodCount) },
    periodAmount: { amount: parseFloat(p.amount), currency: p.currency },
  };
  if (type === 'trial') {
    return { ...base, trialConfig: { trialAmount: { amount: 0, currency: p.currency }, trialDays: parseInt(p.trialDays) } };
  }
  if (type === 'discount') {
    return { ...base, trialPeriodConfig: { trialPeriodCount: parseInt(p.trialPeriodCount), trialPeriodAmount: { amount: parseFloat(p.trialPeriodAmount), currency: p.currency } } };
  }
  if (type === 'trial_discount') {
    return {
      ...base,
      trialConfig: { trialAmount: { amount: parseFloat(p.trialAmountCombo), currency: p.currency }, trialDays: parseInt(p.trialDays) },
      trialPeriodConfig: { trialPeriodCount: parseInt(p.trialPeriodCountCombo), trialPeriodAmount: { amount: parseFloat(p.trialPeriodAmountCombo), currency: p.currency } }
    };
  }
  return base;
}
