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

    // 构建请求数据
    const requestData = {
      version: '1.4',
      keyVersion: '1',
      requestTime: new Date().toISOString(),
      appId: config.appId,
      merchantNo: config.merchantNo,
      data: {
        country,
        currency,
        totalAmount: amount,
        userId,
        componentList: componentList || ['CARD', 'APPLEPAY', 'GOOGLEPAY']
      }
    };

    // RSA 加签：使用商户私钥对请求参数加签
    const signature = sign(requestData);
    requestData.sign = signature;

    // 调用 PayerMax applyDropinSession 接口
    logger.info('📤 applySession 请求：', JSON.stringify(requestData));
    const payerMaxResponse = await sendRequest(config.payerMax.applySessionUrl, requestData);
    logger.info('📥 applySession 响应：', JSON.stringify(payerMaxResponse));

    if (payerMaxResponse.code === 'APPLY_SUCCESS') {
      res.json({
        success: true,
        sessionKey: payerMaxResponse.data.sessionKey,
        clientKey: payerMaxResponse.data.clientKey
      });
    } else {
      logger.error('applySession 失败：', payerMaxResponse.msg);
      res.status(500).json({ success: false, message: payerMaxResponse.msg || '会话获取失败' });
    }
  } catch (err) {
    logger.error('❌ applySession 异常：', err);
    res.status(500).json({ success: false, message: '服务调用失败' });
  }
});

// ========================
// 接口 2：orderAndPay（支付提交）
// ========================
app.post('/api/orderAndPay', async (req, res) => {
  try {
    const { paymentToken, amount } = req.body;

    if (!paymentToken) {
      logger.warn('orderAndPay paymentToken 不能为空');
      return res.status(400).json({ success: false, message: 'paymentToken 不能为空' });
    }

    // 构建请求数据
    const requestData = {
      version: '1.4',
      keyVersion: '1',
      requestTime: new Date().toISOString(),
      appId: config.appId,
      merchantNo: config.merchantNo,
      data: {
        paymentToken,
        totalAmount: amount || '0'
      }
    };

    // RSA 加签
    const signature = sign(requestData);
    requestData.sign = signature;

    // 调用 PayerMax orderAndPay 接口
    logger.info('💳 orderAndPay 请求：', JSON.stringify(requestData));
    const payResult = await sendRequest(config.payerMax.orderAndPayUrl, requestData);
    logger.info('✅ 支付结果：', JSON.stringify(payResult));

    // 保存订单
    const orders = getOrders();
    const orderNo = payResult.data?.orderNo || `ORDER_${Date.now()}`;
    orders.push({
      orderNo,
      paymentToken,
      amount: amount || 0,
      payStatus: payResult.code === 'PAY_SUCCESS' ? 'SUCCESS' : 'FAILED',
      createTime: new Date().toLocaleString(),
      signature: signature,
      payResult: payResult
    });
    saveOrders(orders);

    if (payResult.code === 'PAY_SUCCESS') {
      res.json({
        success: true,
        orderNo: payResult.data.orderNo,
        payStatus: 'SUCCESS',
        message: '支付成功'
      });
    } else {
      res.json({
        success: false,
        orderNo: orderNo,
        payStatus: 'FAILED',
        message: payResult.msg || '支付失败'
      });
    }
  } catch (err) {
    logger.error('❌ orderAndPay 异常：', err);
    res.status(500).json({ success: false, message: '支付处理失败' });
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
// 接口 2.5：Standard orderAndPay Proxy (全量收银台代理)
// ========================
app.get('/api/standard/orderAndPay', (req, res) => res.status(405).json({ message: 'Only POST supported' }));
app.post('/api/standard/orderAndPay', async (req, res) => {
  try {
    const data = req.body;
    
    // 1. 构建符合 RFC3339 的请求时间 (yyyy-MM-dd'T'HH:mm:ss.SSSXXX)
    const requestTime = formatRFC3339(new Date());

    // 2. 构建基础请求体 (不含 sign)
    const requestData = {
      version: '1.5',
      keyVersion: '1',
      requestTime: requestTime,
      appId: config.appId,
      merchantNo: config.merchantNo,
      data: {
        ...data,
        integrate: 'Hosted_Checkout'
      }
    };

    // 3. 序列化为原始紧凑 JSON 字符串（禁止格式化，加签基准）
    const rawBodyStr = JSON.stringify(requestData);

    // 4. 对原始字符串执行 RSA-SHA256 加签
    const signature = signRawBody(rawBodyStr);

    // 5. 调用网关：仅在 Header 中携带签名，Body 保持原始加签字符串
    logger.info('🛰️ Standard Proxy (v1.5) Body: ' + rawBodyStr);
    logger.info('🔑 Header sign: ' + signature);

    const payerMaxResponse = await sendRequest(config.payerMax.orderAndPayUrl, rawBodyStr, signature);
    logger.info('📥 PayerMax Response: ' + JSON.stringify(payerMaxResponse));

    res.json(payerMaxResponse);
  } catch (err) {
    logger.error('❌ Standard Proxy 异常：', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || '代理请求失败'
    });
  }
});

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
