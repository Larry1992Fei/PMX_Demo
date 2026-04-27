/**
 * PayerMax 支付接入配置文件
 * 说明：开发环境使用测试地址，生产环境替换为PayerMax正式接口地址
 * 密钥信息建议通过环境变量注入，避免明文写在代码中（生产环境必做）
 */
const path = require('path');

module.exports = {
  // 服务端口（与server.js中端口一致，可通过环境变量覆盖）
  port: process.env.PORT || 3000,
  // PayerMax 相关配置
  payerMax: {
    // 测试环境接口地址（开发阶段使用）
    applySessionUrl: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/applyDropinSession',
    orderAndPayUrl: 'https://pay-gate-uat.payermax.com/aggregate-pay/api/gateway/orderAndPay',
    // 正式环境接口地址（生产环境替换，需从PayerMax商户后台获取）
    // applySessionUrl: 'https://pay-gate.payermax.com/aggregate-pay/api/gateway/applyDropinSession',
    // orderAndPayUrl: 'https://pay-gate.payermax.com/aggregate-pay/api/gateway/orderAndPay'
  },
  // 商户号（从PayerMax商户后台获取，替换为自己的商户号）
  merchantNo: process.env.MERCHANT_NO || 'SDP01010114048893',
  // AppID（从PayerMax商户后台获取）
  appId: process.env.APP_ID || '67eff2f3b29a4ecf9576321185dbf658',
  // 可选：密钥配置（生产环境建议通过环境变量注入，此处仅为预留）
  secret: {
    // 商户私钥（实际从secret目录读取，此处仅做配置说明）
    merchantPrivateKey: process.env.MERCHANT_PRIVATE_KEY || '',
    // PayerMax公钥（实际从secret目录读取，此处仅做配置说明）
    payerMaxPublicKey: process.env.PAYERMAX_PUBLIC_KEY || ''
  },
  // 日志配置（可选，集成winston时使用）
  logger: {
    level: 'info', // 日志级别：info/warn/error
    logPath: path.join(__dirname, 'logs') // 日志存储目录
  }
};
