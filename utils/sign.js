const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 密钥路径配置（对应secret目录，与server.js中密钥目录一致）
const privateKeyPath = path.join(__dirname, '../secret/merchant_private_key.pem');
const publicKeyPath = path.join(__dirname, '../secret/payermax_public_key.pem');

// 读取商户私钥（PKCS8 格式，2048 位，必须与PayerMax要求一致）
const getPrivateKey = () => {
  try {
    return fs.readFileSync(privateKeyPath, 'utf8');
  } catch (e) {
    throw new Error('⚠️ 未找到商户私钥：secret/merchant_private_key.pem，请检查密钥文件是否放置正确');
  }
};

// 读取 PayerMax 公钥（用于验签，由PayerMax提供）
const getPublicKey = () => {
  try {
    return fs.readFileSync(publicKeyPath, 'utf8');
  } catch (e) {
    throw new Error('⚠️ 未找到平台公钥：secret/payermax_public_key.pem，请检查密钥文件是否放置正确');
  }
};

/**
 * RSA 加签（商户端）
 * 算法：SHA256WithRSA（与PayerMax官方要求一致）
 * Key格式：PKCS8（私钥）
 * 密钥长度：2048位
 * @param {Object} params - 待加签的参数对象
 * @returns {string} 加签后的base64字符串
 */
function sign(params) {
  const privateKey = getPrivateKey();

  // 按PayerMax官方要求排序参数（必须与验签端排序规则一致，否则验签失败）
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  // 执行加签，返回base64格式签名
  return crypto
    .createSign('RSA-SHA256')
    .update(sorted, 'utf8')
    .sign(privateKey, 'base64');
}

/**
 * RSA 验签（验证PayerMax通知数据）
 * 算法：SHA256WithRSA
 * Key格式：X509（公钥，由PayerMax提供）
 * @param {Object} notifyData - PayerMax发送的通知数据（包含signature字段）
 * @returns {boolean} 验签结果（true：验签通过，false：验签失败）
 */
function verifySign(notifyData) {
  const publicKey = getPublicKey();
  // 分离签名和其他业务参数
  const { signature, ...rest } = notifyData;

  // 按PayerMax官方要求排序参数（与加签时排序规则一致）
  const sorted = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('&');

  // 执行验签
  return crypto
    .createVerify('RSA-SHA256')
    .update(sorted, 'utf8')
    .verify(publicKey, signature, 'base64');
}

/**
 * 对原始请求体字符串直接加签（支持 PayerMax 1.5+ 规范）
 * 核心要求：加签字符串必须与 HTTP Body 字节流完全一致
 * @param {string} bodyString - 即将发送的原始 JSON 字符串
 * @returns {string} Base64 格式签名
 */
function signRawBody(bodyString) {
  const privateKey = getPrivateKey();
  return crypto
    .createSign('RSA-SHA256')
    .update(bodyString, 'utf8')
    .sign(privateKey, 'base64');
}

// 导出加签、验签方法，供server.js调用
module.exports = { sign, signRawBody, verifySign };
