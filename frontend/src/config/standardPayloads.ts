import type { PaymentIntegrationMode } from '@/types/payment';
import type { PaymentMethod } from '@/types/subscription';

interface ApiData {
  endpoint?: { method: string; url: string };
  requestBody: string;
  responseBody?: string;
}

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

export const getStandardPayloads = (
  currentStep: string,
  integrationMode: PaymentIntegrationMode,
  cashierMode: 'ALL' | 'SPECIFIC',
  paymentMethod: PaymentMethod,
  cashierPaymentMethod: PaymentMethod,
  lastApiResponse: any,
  amount: string,
  currency: string,
  userId: string,
  subject: string,
  sessionData: any,
  paymentToken: string,
  country: string
): ApiData | null => {
  const futureTime = formatRFC3339(new Date());

  // 1. 收银台模式
  if (integrationMode === 'cashier') {
    if (currentStep === 's1') {
      const requestBody: any = {
        amount: amount || "11.00",
        currency: currency || "USD",
        country: "ID",
        subject: "diamond 700",
        userId: "USER_" + Date.now(),
        integrationMode: 'cashier'
      };
      if (cashierMode === 'SPECIFIC') {
        requestBody.cashierMode = 'SPECIFIC';
      }
      return { endpoint: { method: 'POST', url: '/api/orderAndPay' }, requestBody: JSON.stringify(requestBody, null, 2) };
    }
    if (currentStep === 's2' && cashierMode === 'SPECIFIC') {
      return {
        endpoint: { method: 'POST', url: '/api/orderAndPay' },
        requestBody: JSON.stringify({
          amount: amount || "11.00",
          currency: currency || "USD",
          country: "ID",
          subject: "diamond 700",
          userId: "USER_" + Date.now(),
          integrationMode: "cashier",
          cashierMode: "SPECIFIC",
          paymentMethod: cashierPaymentMethod.toUpperCase()
        }, null, 2)
      };
    }
    if ((currentStep === 's2' && cashierMode === 'ALL') || (currentStep === 's3' && cashierMode === 'SPECIFIC')) {
      const displayResponse = lastApiResponse || { code: "APPLY_SUCCESS", msg: "Success.", data: { redirectUrl: "https://cashier-n-uat.payermax.com/...", tradeToken: "T2026...", outTradeNo: "ORDER_123", status: "PENDING" } };
      return {
        endpoint: { method: 'POST', url: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/orderAndPay' },
        requestBody: JSON.stringify({
          version: "1.5", keyVersion: "1", requestTime: futureTime, appId: "67eff2f3b29a4ecf9576321185dbf658", merchantNo: "SDP01010114048893",
          data: {
            subject: "diamond 700", totalAmount: 11, currency: "USD", userId: "USER_" + Date.now(),
            language: "en", frontCallbackUrl: "http://localhost:5173/callback", outTradeNo: "ORDER_" + Date.now(),
            integrate: "Hosted_Checkout", notifyUrl: "http://47.93.174.44:5000/collectResultNotifyUrl",
            paymentDetail: cashierMode === 'SPECIFIC' ? { paymentMethodType: paymentMethod.toUpperCase() === 'APM' ? 'WALLET' : paymentMethod.toUpperCase(), targetOrg: "", allowedCardOrg: [] } : undefined
          }
        }, null, 2),
        responseBody: JSON.stringify(displayResponse, null, 2)
      };
    }
  }

  // 2. API 模式 (3步: s1→s2→s3成功)
  if (integrationMode === 'api') {
    if (currentStep === 's1') {
      return {
        endpoint: { method: 'POST', url: '/api/orderAndPay' },
        requestBody: JSON.stringify({
          amount: amount || "11.00",
          currency: currency || "USD",
          country: "ID",
          subject: "diamond 700",
          userId: "USER_" + Date.now(),
          integrationMode: "api"
        }, null, 2)
      };
    }
    // s2: 用户在自建收银台选择支付方式后，展示带 paymentDetail 的完整 Gateway 请求及响应
    if (currentStep === 's2') {
      const displayResponse = lastApiResponse || {
        code: "APPLY_SUCCESS", msg: "Success.",
        data: { tradeToken: "T2026...", outTradeNo: "ORDER_123", status: "PENDING" }
      };

      let paymentDetail: any = {};
      if (paymentMethod === 'card') {
        paymentDetail = {
          paymentMethodType: "CARD",
          cardInfo: {
            cardIdentifierNo: "4444333322221111",
            cardHolderFullName: "James Smith",
            cardExpirationMonth: "03",
            cardExpirationYear: "30",
            cvv: "123"
          },
          buyerInfo: {
            firstName: "Deborah",
            lastName: "Swinstead",
            email: "your@gmail.com",
            phoneNo: "0609 031 114",
            address: "Test Address",
            city: "Holden Hill",
            region: "SA",
            zipCode: "5088",
            clientIp: "211.52.321.225",
            userAgent: "Mozilla/5.0 (iPad; CPU OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22E252"
          }
        };
      } else if (paymentMethod === 'applepay') {
        paymentDetail = {
          paymentMethodType: "APPLEPAY",
          buyerInfo: {
            firstName: "James",
            lastName: "Smith",
            phoneNo: "903124360628",
            email: "james@google.com",
            clientIp: "124.156.108.193",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110"
          },
          applePayPaymentData: {
            applicationExpirationDate: "2312",
            applicationPrimaryAccountNumber: "4111111111111111",
            currencyCode: "USD",
            deviceManufacturerIdentifier: "A1B2C3D4",
            paymentDataType: "3DSecure",
            transactionAmount: "100.00",
            paymentData: {
              onlinePaymentCryptogram: "Aa0KZXFURkhF...",
              eciIndicator: "07"
            },
            network: "VISA",
            type: "credit",
            displayName: "Visa 0492"
          }
        };
      } else if (paymentMethod === 'googlepay') {
        paymentDetail = {
          paymentMethodType: "GOOGLEPAY",
          buyerInfo: {
            firstName: "James",
            lastName: "Smith",
            phoneNo: "903124360628",
            email: "james@google.com",
            clientIp: "124.156.108.193",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110"
          },
          googlePayDetails: {
            authMethod: "CRYPTOGRAM_3DS",
            cryptogram: "cryptogram",
            cardHolderFullName: "cryptogram googlePayDetails cardHolderFullName",
            cardNetwork: "VISA",
            expirationMonth: "01",
            expirationYear: "2029",
            pan: "3604241234569621",
            description: "cryptogram"
          }
        };
      }

      const isMobilePay = paymentMethod === 'applepay' || paymentMethod === 'googlepay';

      // 根据用户要求，展示 data 内的代码块，包含动态参数
      const requestDataBlock: any = {
        requestTime: futureTime,
        merchantNo: "SDP01010114048893",
        appId: "67eff2f3b29a4ecf9576321185dbf658",
        outTradeNo: "ORDER_" + Date.now(),
        subject: isMobilePay ? "this is subject" : (subject || "diamond 700"),
        totalAmount: amount || "11.00",
        currency: isMobilePay ? "AED" : (currency || "USD"),
        country: isMobilePay ? "AE" : "ID",
        userId: userId || (isMobilePay ? "userId001" : "84645"),
        language: "en",
        reference: isMobilePay ? "020213827524152" : "2476598332645",
        frontCallbackUrl: isMobilePay ? "https://xxx.com" : "http://localhost:5173",
        notifyUrl: isMobilePay ? "https://yyy.com" : "http://47.93.174.44:5000/collectResultNotifyUrl",
        terminalType: isMobilePay ? "WAP" : "WEB",
        paymentDetail: paymentDetail
      };

      if (isMobilePay) {
        requestDataBlock.expireTime = "1800";
        requestDataBlock.riskParams = {
          registerName: "lily",
          regTime: "2023-07-01 12:08:34",
          liveCountry: "VN",
          payerAccount: "987654XXX",
          payerName: "lily",
          taxId: "1234567890"
        };
        requestDataBlock.goodsDetails = [
          {
            goodsId: "D002",
            goodsName: "Key buckle",
            quantity: "2",
            price: "0.5",
            goodsCurrency: "AED",
            showUrl: "http://ttt.com",
            goodsCategory: "电脑"
          }
        ];
        requestDataBlock.shippingInfo = {
          firstName: "James",
          lastName: "Smith",
          phoneNo: "903124360628",
          email: "james@google.com",
          address1: "address1",
          city: "GAZIOSMANPASA/ANKAR",
          country: "TR",
          zipCode: "06700"
        };
        requestDataBlock.billingInfo = requestDataBlock.shippingInfo;
      }

      // 如果是 CARD 支付，补齐更多参考字段
      if (paymentMethod === 'card') {
        requestDataBlock.goodsDetails = [
          {
            goodsId: "49373",
            goodsName: "Women's Long Skirts",
            quantity: "2",
            price: "38",
            goodsCategory: "skirt",
            showUrl: "https://your.com/product/womens-skirts/"
          }
        ];
        requestDataBlock.shippingInfo = {
          firstName: "test",
          lastName: "test",
          email: "test@gmail.com",
          phoneNo: "0609 031 114",
          address1: "Test Address",
          city: "Holden Hill",
          region: "SA",
          state: "SA",
          country: "ID",
          zipCode: "5088"
        };
        requestDataBlock.billingInfo = requestDataBlock.shippingInfo;
        requestDataBlock.envInfo = {
          deviceLanguage: "en-AU",
          screenHeight: "1180",
          screenWidth: "820"
        };
      }

      return {
        endpoint: { method: 'POST', url: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/orderAndPay' },
        requestBody: JSON.stringify(requestDataBlock, null, 2),
        responseBody: JSON.stringify(displayResponse, null, 2)
      };
    }
  }

  // 3. 前置组件模式 (5步: s1商品 -> s2自建收银台 -> s3加载组件 -> s4下单支付 -> s5成功)
  if (integrationMode === 'component') {
    // s1: 前端向后端发起初始化请求
    if (currentStep === 's1') {
      return {
        endpoint: { method: 'POST', url: '/api/applySession' },
        requestBody: JSON.stringify({
          amount: amount,
          currency: currency,
          country: "ID",
          userId: userId,
          mitType: "RECURRING",
          componentList: ["CARD", "APPLEPAY", "GOOGLEPAY"]
        }, null, 2)
      };
    }
    // s2: 自建收银台 (整合版)
    if (currentStep === 's2') {
      if (sessionData) {
        return {
          endpoint: { method: 'POST', url: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/applyDropinSession' },
          requestBody: JSON.stringify({
            country: country || "ID",
            currency: currency,
            totalAmount: amount,
            userId: userId,
            componentList: ["CARD", "APPLEPAY", "GOOGLEPAY"]
          }, null, 2),
          responseBody: JSON.stringify(lastApiResponse || {
            "msg": "Success",
            "code": "APPLY_SUCCESS",
            "data": { 
              "sessionKey": sessionData.sessionKey, 
              "clientKey": sessionData.clientKey 
            }
          }, null, 2)
        };
      }
      return {
        endpoint: { method: 'UI_ACTION', url: 'Merchant_Checkout_Page' },
        requestBody: JSON.stringify({
          action: "SELECT_PAYMENT_METHOD",
          selected: (paymentMethod || 'none').toUpperCase(),
          context: "Merchant self-built cashier flow"
        }, null, 2)
      };
    }
    // s3: 下单支付 (整合版)
    if (currentStep === 's3') {
      return {
        endpoint: { method: 'POST', url: '/api/orderAndPay' },
        requestBody: JSON.stringify({
          amount: amount,
          currency: currency,
          userId: userId,
          paymentToken: paymentToken || "tok_pm_XXXXXXXX",
          sessionKey: sessionData?.sessionKey || "sess_XXXXXXXX",
          integrationMode: "component"
        }, null, 2),
        responseBody: lastApiResponse ? JSON.stringify(lastApiResponse, null, 2) : undefined
      };
    }
  }

  // 成功页面 (通用)
  if (currentStep.match(/s[3-4]/) && (integrationMode === 'api' || integrationMode === 'component' || integrationMode === 'cashier')) {
      const isSuccessStep = (integrationMode === 'component' && currentStep === 's4') || 
                            (integrationMode === 'api' && currentStep === 's3') ||
                            (integrationMode === 'cashier' && ((cashierMode === 'SPECIFIC' && currentStep === 's4') || (cashierMode === 'ALL' && currentStep === 's3')));
      
      if (isSuccessStep) {
        const outTradeNo = lastApiResponse?.data?.outTradeNo || 'ORDER_SUCCESS_123';
        return {
          endpoint: { method: 'POST', url: '/api/webhook' },
          requestBody: JSON.stringify({
            "appId": "67eff2f3b29a4ecf9576321185dbf658", "code": "APPLY_SUCCESS",
            "data": { "outTradeNo": outTradeNo, "status": "SUCCESS", "totalAmount": amount, "currency": currency, "paymentMethodType": paymentMethod.toUpperCase() },
            "keyVersion": "1", "merchantNo": "SDP01010114048893", "msg": "Success.", "notifyTime": futureTime, "notifyType": "PAYMENT"
          }, null, 2),
          responseBody: JSON.stringify({ "msg": "Success", "code": "SUCCESS" }, null, 2)
        };
      }
  }

  return null;
};
