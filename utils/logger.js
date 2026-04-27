const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 创建日志存储目录
const logDir = config.logger.logPath;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  })
);

// 配置日志器
const logger = winston.createLogger({
  level: config.logger.level,
  format: logFormat,
  transports: [
    // 控制台输出（开发环境）
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 文件输出（生产环境）
    new winston.transports.File({
      filename: path.join(logDir, 'pay.log'),
      maxsize: 20 * 1024 * 1024, // 单个日志文件最大20MB
    }),
    // 错误日志单独输出
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 单个错误日志文件最大10MB
    })
  ]
});

// 导出日志器，供其他文件调用
module.exports = logger;
