/**
 * logger.js - 日志工具
 */

const fs = require('fs').promises;
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'fetch-ai-news.log');

/**
 * 日志级别
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLevel = LOG_LEVELS.INFO;
let verboseMode = false;

/**
 * 初始化日志系统
 */
async function initLogger(options = {}) {
  verboseMode = options.verbose || false;

  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (err) {
    // 忽略目录已存在的错误
  }
}

/**
 * 日志基础函数
 */
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const levelStr = level.padEnd(5);
  const logMessage = `[${timestamp}] ${levelStr}: ${message}`;

  // 控制台输出
  if (verboseMode || level !== 'DEBUG') {
    console.log(logMessage, ...args);
  }

  // 写入文件
  writeToFile(logMessage, ...args).catch(err => {
    console.error('❌ 日志写入失败:', err.message);
  });
}

/**
 * 写入日志文件
 */
async function writeToFile(message, ...args) {
  try {
    const logLine = `${message} ${args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ')}\n`;

    await fs.appendFile(LOG_FILE, logLine, 'utf8');
  } catch (err) {
    console.error('❌ 日志文件写入失败:', err.message);
  }
}

/**
 * 不同级别的日志函数
 */
function debug(message, ...args) {
  if (verboseMode) {
    log('DEBUG', message, ...args);
  }
}

function info(message, ...args) {
  log('INFO', message, ...args);
}

function warn(message, ...args) {
  log('WARN', message, ...args);
}

function error(message, ...args) {
  log('ERROR', message, ...args);
}

/**
 * 获取日志文件内容
 */
async function getLogContent(lines = 100) {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf8');
    const allLines = content.trim().split('\n');

    return allLines.slice(-lines).join('\n');
  } catch (err) {
    return '暂无日志';
  }
}

/**
 * 清理旧日志
 */
async function cleanupLogs(days = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const content = await fs.readFile(LOG_FILE, 'utf8');
    const lines = content.trim().split('\n');

    const filteredLines = lines.filter(line => {
      const timestamp = line.match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      if (timestamp) {
        const lineDate = new Date(timestamp[1]);
        return lineDate >= cutoffDate;
      }
      return false;
    });

    await fs.writeFile(LOG_FILE, filteredLines.join('\n'), 'utf8');
    info(`🧹 日志清理完成 - 保留最近 ${days} 天`);
  } catch (err) {
    warn('⚠️ 日志清理失败:', err.message);
  }
}

module.exports = {
  initLogger,
  log: info,
  debug,
  info,
  warn,
  error,
  getLogContent,
  cleanupLogs,
  LOG_LEVELS
};