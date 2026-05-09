const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config');
const { sign, signRawBody, verifySign } = require('./utils/sign');
const logger = require('./utils/logger');

const app = express();
// 跨域配置
app.use(cors());
// 解析请求体
app.use(express.json());
// 服务端现已作为纯粹的 API 接口 BFF 服务分离，不再承担静态资产（页面）的映射派发。

// 新增：创建secret文件夹（用于存放RSA密钥，预留密钥放置目录）
const secretDir = path.join(__dirname, 'secret');
if (!fs.existsSync(secretDir)) {
  fs.mkdirSync(secretDir);
  logger.info('✅ 已自动创建 secret 目录，请放入 RSA 密钥文件：merchant_private_key.pem、payermax_public_key.pem');
}

// 订单数据临时存储（开发阶段）
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const orderFilePath = path.join(dataDir, 'orders.json');

// 初始化订单文件
if (!fs.existsSync(orderFilePath)) {
  fs.writeFileSync(orderFilePath, JSON.stringify([], null, 2));
}

// 读取订单
const getOrders = () => {
  try {
    return JSON.parse(fs.readFileSync(orderFilePath, 'utf8'));
  } catch (e) {
    logger.error('读取订单文件失败：', e);
    return [];
  }
};

// 保存订单
const saveOrders = (orders) => {
  try {
    fs.writeFileSync(orderFilePath, JSON.stringify(orders, null, 2));
  } catch (e) {
    logger.error('保存订单文件失败：', e);
  }
};

// 发送HTTP请求到PayerMax
const sendRequest = (url, data, headerSign) => {
  return new Promise((resolve, reject) => {
    const postData = typeof data === 'string' ? data : JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // 如果传入了 Header 签名，则添加到请求头中
    if (headerSign) {
      options.headers['sign'] = headerSign;
    }

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (!responseData) {
          logger.warn(`PayerMax 返回空响应 (HTTP ${res.statusCode})`);
          // 即使是空响也返回一个结构化对象，防止前端解析失败
          return resolve({ code: 'EMPTY_RESPONSE', msg: 'PayerMax returned empty body', httpStatus: res.statusCode });
        }
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          logger.error('解析 PayerMax 响应失败，原始内容：' + responseData);
          // 如果解析失败，可能是 HTML 报错，将其封装为 JSON 返回
          resolve({
            code: 'PARSE_ERROR',
            msg: '解析响应失败',
            raw: responseData.substring(0, 200),
            httpStatus: res.statusCode
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

// ========================
// 接口 1：applySession（获取会话）
// ========================
app.post('/api/applySession', async (req, res) => {
  try {
    const { amount, currency, country, userId, mitType, tokenForFutureUse, componentList } = req.body;

    // 参数校验
    if (!amount || !currency || !country || !userId || !mitType) {
      logger.warn('applySession 缺少必传参数');
      return res.status(400).json({ success: false, message: '缺少必传参数' });
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      logger.warn('applySession 金额必须为正数');
      return res.status(400).json({ success: false, message: '金额必须为正数' });
    }

    // 1. 构建标准的单层请求对象 (无 sign 字段)
    const currentRFC3339 = formatRFC3339(new Date());

    const requestData = {
      version: '1.4',
      keyVersion: '1',
      requestTime: currentRFC3339,
      appId: config.appId,
      merchantNo: config.merchantNo,
      data: {
        country,
        currency,
        totalAmount: amount,
        userId: userId || `USER_${Date.now()}`,
        componentList: componentList || ['CARD', 'APPLEPAY', 'GOOGLEPAY']
      }
    };

    // 2. 强制序列化为字符串
    const bodyString = JSON.stringify(requestData);

    // 3. 加签
    const headerSign = signRawBody(bodyString);

    // 4. 发送请求
    logger.info('🚀 [FORCE_UPDATE] applySession Body: ' + bodyString);
    try {
      const payerMaxResponse = await sendRequest(config.payerMax.applySessionUrl, bodyString, headerSign);
      logger.info('📥 applySession 响应：', JSON.stringify(payerMaxResponse));

      // 直接返回 PayerMax 原始报文
      res.json(payerMaxResponse);
    } catch (err) {
      logger.error('❌ applySession 核心异常：', err);
      res.status(500).json({ code: 'ERROR', msg: '内部服务错误' });
    }
  } catch (outerErr) {
    logger.error('❌ applySession 路由级别异常：', outerErr);
    res.status(500).json({ success: false, message: '请求处理失败' });
  }
});

// ========================
// 接口 2：orderAndPay（支付大一统总线）
// ========================
app.post('/api/orderAndPay', async (req, res) => {
  try {
    const {
      amount, currency, country, userId, subject, reference,
      integrationMode, cashierMode, paymentMethod,
      paymentToken, sessionKey
    } = req.body;

    const currentRFC3339 = formatRFC3339(new Date());
    const outTradeNo = `ORDER_${Date.now()}`;

    // 基础业务数据拼装
    const dataPayload = {
      outTradeNo: outTradeNo,
      totalAmount: amount || '11.00',
      currency: currency || "USD",
      country: country || "ID",
      subject: subject || "Demo Payment",
      userId: userId || "USER_123456",
      reference: reference || "CustomRef",
      frontCallbackUrl: `http://localhost:5173`,
      notifyUrl: `http://localhost:${config.port}/api/webhook`,
      language: "en"
    };

    // 智能路由核心：根据前端透传的集成模式，自动分支
    if (integrationMode === 'cashier') {
      dataPayload.integrate = "Hosted_Checkout";
      if (cashierMode === 'SPECIFIC' && paymentMethod) {
        dataPayload.paymentDetail = {
          paymentMethodType: paymentMethod.toUpperCase() === 'APM' ? 'WALLET' : paymentMethod.toUpperCase()
        };
      }
    } else if (integrationMode === 'api') {
      dataPayload.integrate = "Direct_Payment";
      dataPayload.terminalType = "WEB";
      dataPayload.reference = reference || "2476598332645";
      
      const resolvedMethod = paymentMethod || 'CARD';
      if (!paymentMethod) {
        logger.warn('⚠️ API 模式未传 paymentMethod，降级使用 CARD');
      }

      dataPayload.paymentDetail = {
        paymentMethodType: resolvedMethod.toUpperCase()
      };

      // 如果是 API 模式下的 CARD 支付，按照用户要求补齐参考字段
      if (resolvedMethod.toUpperCase() === 'CARD') {
        dataPayload.paymentDetail.cardInfo = {
          cardIdentifierNo: "4444333322221111",
          cardHolderFullName: "James Smith",
          cardExpirationMonth: "03",
          cardExpirationYear: "30",
          cvv: "123"
        };
        dataPayload.paymentDetail.buyerInfo = {
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
        };
        dataPayload.goodsDetails = [
          {
            goodsId: "49373",
            goodsName: "Women's Long Skirts",
            quantity: "2",
            price: "38",
            goodsCategory: "skirt",
            showUrl: "https://your.com/product/womens-skirts/"
          }
        ];
        dataPayload.shippingInfo = {
          firstName: "test",
          lastName: "test",
          email: "test@gmail.com",
          phoneNo: "0609 031 114",
          address1: "Test Address",
          city: "Holden Hill",
          region: "SA",
          state: "SA",
          country: country || "ID",
          zipCode: "5088"
        };
        dataPayload.billingInfo = dataPayload.shippingInfo;
        dataPayload.envInfo = {
          deviceLanguage: "en-AU",
          screenHeight: "1180",
          screenWidth: "820"
        };
      } else if (resolvedMethod.toUpperCase() === 'APPLEPAY' || resolvedMethod.toUpperCase() === 'GOOGLEPAY') {
        const isGoogle = resolvedMethod.toUpperCase() === 'GOOGLEPAY';
        dataPayload.terminalType = "WAP";
        dataPayload.expireTime = "1800";
        dataPayload.subject = "this is subject";
        dataPayload.currency = "AED";
        dataPayload.country = "AE";
        dataPayload.userId = "userId001";
        dataPayload.reference = "020213827524152";
        dataPayload.frontCallbackUrl = "https://xxx.com";
        dataPayload.notifyUrl = "https://yyy.com";

        dataPayload.paymentDetail.buyerInfo = {
          firstName: "James",
          lastName: "Smith",
          phoneNo: "903124360628",
          email: "james@google.com",
          clientIp: "124.156.108.193",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
        };

        if (isGoogle) {
          dataPayload.paymentDetail.googlePayDetails = {
            authMethod: "CRYPTOGRAM_3DS",
            cryptogram: "cryptogram",
            cardHolderFullName: "cryptogram googlePayDetails cardHolderFullName",
            cardNetwork: "VISA",
            expirationMonth: "01",
            expirationYear: "2029",
            pan: "3604241234569621",
            description: "cryptogram"
          };
        } else {
          dataPayload.paymentDetail.applePayPaymentData = {
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
          };
        }

        dataPayload.goodsDetails = [
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
        dataPayload.shippingInfo = {
          firstName: "James",
          lastName: "Smith",
          phoneNo: "903124360628",
          email: "james@google.com",
          address1: isGoogle ? "GOLGELI SOKAK NO.34, 06700" : "address1",
          city: "GAZIOSMANPASA/ANKAR",
          country: "TR",
          zipCode: "06700"
        };
        dataPayload.billingInfo = dataPayload.shippingInfo;
        dataPayload.riskParams = {
          registerName: "lily",
          regTime: "2023-07-01 12:08:34",
          liveCountry: "VN",
          payerAccount: "987654XXX",
          payerName: "lily",
          taxId: "1234567890"
        };
      }
    } else if (integrationMode === 'component') {
      dataPayload.integrate = "Direct_Payment";
      dataPayload.expireTime = "3600";
      dataPayload.terminalType = "WEB";
      if (paymentToken && sessionKey) {
        dataPayload.paymentDetail = {
          paymentToken: paymentToken,
          sessionKey: sessionKey,
          buyerInfo: {
            clientIp: "176.16.34.144",
            userAgent: "Chrome"
          }
        };
      } else {
        logger.warn('orderAndPay 组件模式缺少 Token 或 SessionKey');
        return res.status(400).json({ success: false, msg: '前置组件模式必须提供 paymentToken 和 sessionKey' });
      }
    } else {
      dataPayload.integrate = "Hosted_Checkout"; // 降级兜底
    }

    const requestData = {
      version: '1.5',
      keyVersion: '1',
      requestTime: currentRFC3339,
      appId: config.appId,
      merchantNo: config.merchantNo,
      data: dataPayload
    };

    // 序列化与严格加签
    const bodyString = JSON.stringify(requestData);
    const headerSign = signRawBody(bodyString);

    logger.info(`🚀 [Order Bus] Mode: ${integrationMode} | Integrate: ${dataPayload.integrate}`);
    logger.info('📦 Body: ' + bodyString);

    const payResult = await sendRequest(config.payerMax.orderAndPayUrl, bodyString, headerSign);
    logger.info('✅ 支付响应：', JSON.stringify(payResult));

    // 保存订单用于对账和展示
    const orders = getOrders();
    orders.push({
      orderNo: payResult.data?.orderNo || outTradeNo,
      paymentToken: paymentToken || '',
      amount: amount || 0,
      payStatus: payResult.code === 'PAY_SUCCESS' ? 'SUCCESS' : 'FAILED',
      createTime: new Date().toLocaleString(),
      signature: headerSign,
      payResult: payResult
    });
    saveOrders(orders);

    // 直接返回 PayerMax 完整的 JSON，前端自己判断成功与否并取 redirectUrl
    res.json(payResult);

  } catch (err) {
    logger.error('❌ orderAndPay 内部异常：', err);
    res.status(500).json({ code: 'ERROR', msg: '本地代理处理失败' });
  }
});

// 工具函数：格式化 RFC3339 时间 (yyyy-MM-dd'T'HH:mm:ss.SSSXXX)
const formatRFC3339 = (date) => {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const padMs = (n) => (n < 10 ? '00' + n : n < 100 ? '0' + n : n);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ms = padMs(date.getMilliseconds());

  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const tzHours = pad(Math.floor(Math.abs(tzo) / 60));
  const tzMin = pad(Math.abs(tzo) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${dif}${tzHours}:${tzMin}`;
};



// ========================
// 接口 3：webhook（异步通知）
// ========================
app.post('/api/webhook', async (req, res) => {
  try {
    const notifyData = req.body;
    logger.info('📥 WebHook 通知数据：', JSON.stringify(notifyData));

    // 1. RSA 验签：验证通知数据的真实性（核心安全校验）
    const isSignValid = verifySign(notifyData);
    if (!isSignValid) {
      logger.error('❌ WebHook 验签失败，数据可能被篡改');
      return res.status(403).send('FAIL'); // 验签失败返回FAIL，PayerMax会重试
    }

    // 2. 防重处理：检查该通知是否已处理过
    const orders = getOrders();
    const existingOrder = orders.find(order => order.orderNo === notifyData.orderNo);
    if (existingOrder && existingOrder.notifyProcessed) {
      logger.warn(`⚠️ 该通知已处理，orderNo：${notifyData.orderNo}`);
      return res.send('SUCCESS'); // 已处理直接返回SUCCESS
    }

    // 3. 数据校验：核对订单金额、状态等信息
    if (existingOrder && Number(existingOrder.amount) !== Number(notifyData.amount)) {
      logger.error(`❌ 订单金额不匹配，orderNo：${notifyData.orderNo}`);
      return res.status(400).send('FAIL');
    }

    // 4. 更新订单状态
    if (existingOrder) {
      existingOrder.payStatus = notifyData.payStatus;
      existingOrder.notifyProcessed = true;
      existingOrder.notifyTime = new Date().toLocaleString();
      existingOrder.notifyData = notifyData;
      saveOrders(orders);
      logger.info(`✅ 订单状态更新成功，orderNo：${notifyData.orderNo}，新状态：${notifyData.payStatus}`);
    } else {
      // 处理未找到的订单（可能是前端支付未同步到本地，临时创建订单记录）
      orders.push({
        orderNo: notifyData.orderNo,
        amount: Number(notifyData.amount),
        payStatus: notifyData.payStatus,
        createTime: new Date().toLocaleString(),
        notifyProcessed: true,
        notifyTime: new Date().toLocaleString(),
        notifyData: notifyData
      });
      saveOrders(orders);
      logger.info(`✅ 新增订单记录（WebHook触发），orderNo：${notifyData.orderNo}`);
    }

    // 5. 按PayerMax要求，必须返回SUCCESS字符串（大小写敏感）
    res.send('SUCCESS');
  } catch (err) {
    logger.error('❌ WebHook 处理异常：', err);
    // 异常时返回FAIL，PayerMax会重试通知
    res.status(500).send('FAIL');
  }
});

// ========================
// 服务启动
// ========================
const port = config.port || 3000;
app.listen(port, () => {
  logger.info(`🚀 Node.js 支付服务已启动，端口：${port}`);
  logger.info(`🌐 前端访问地址：http://localhost:${port}`);
  logger.info(`🔧 后端接口地址：http://localhost:${port}/api`);
  logger.info(`⚠️  注意：请确保 secret 目录已放入 RSA 密钥文件，否则加签验签会失败`);

  // 获取局域网IP地址
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let lanAddress = '0.0.0.0';

  // 遍历所有网络接口，找到非本地回环的IPv4地址
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lanAddress = iface.address;
        break;
      }
    }
    if (lanAddress !== '0.0.0.0') break;
  }

  logger.info(`📡 局域网访问地址：http://${lanAddress}:${port}`);
});

// 错误处理中间件（全局捕获异常）
app.use((err, req, res, next) => {
  logger.error('💥 全局异常：', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});
