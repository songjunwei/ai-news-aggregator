/**
 * quota-tracker.js - API配额监控
 */

const fs = require('fs').promises;
const path = require('path');
const { log, error: logError } = require('./logger');

const QUOTA_FILE = path.join(__dirname, '../../quota-tracker.json');

// 默认配额配置
const DEFAULT_QUOTAS = {
  serper: {
    total: 2500,           # 总配额
    used: 0,               # 已使用
    lastReset: new Date().toISOString(),
    resetPeriod: 'once'    # 一次性配额
  },
  reddit: {
    total: 1000,           # 每日请求限制
    used: 0,
    lastReset: new Date().toISOString(),
    resetPeriod: 'daily'
  },
  hackernews: {
    total: 10000,          # 实际无限制，设置安全上限
    used: 0,
    lastReset: new Date().toISOString(),
    resetPeriod: 'daily'
  }
};

/**
 * 初始化配额文件
 */
async function initQuotaFile() {
  try {
    await fs.mkdir(path.dirname(QUOTA_FILE), { recursive: true });

    try {
      await fs.access(QUOTA_FILE);
      // 文件已存在
    } catch {
      // 文件不存在，创建默认配置
      await fs.writeFile(QUOTA_FILE, JSON.stringify(DEFAULT_QUOTAS, null, 2));
      log('💾 配额文件初始化完成');
    }
  } catch (err) {
    logError('❌ 配额文件初始化失败:', err.message);
  }
}

/**
 * 检查配额状态
 */
async function checkQuota() {
  try {
    await initQuotaFile();

    const data = await fs.readFile(QUOTA_FILE, 'utf8');
    const quotas = JSON.parse(data);

    // 清理和验证配额数据
    const now = new Date();
    let needsSave = false;

    for (const [service, quota] of Object.entries(quotas)) {
      // 检查是否需要重置
      if (quota.resetPeriod === 'daily') {
        const lastReset = new Date(quota.lastReset);
        const daysDiff = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

        if (daysDiff >= 1) {
          quota.used = 0;
          quota.lastReset = now.toISOString();
          needsSave = true;
        }
      }

      // 确保数值类型
      quota.total = Number(quota.total) || 0;
      quota.used = Number(quota.used) || 0;
    }

    if (needsSave) {
      await fs.writeFile(QUOTA_FILE, JSON.stringify(quotas, null, 2));
    }

    // 计算剩余配额
    const status = {};
    for (const [service, quota] of Object.entries(quotas)) {
      status[service] = {
        total: quota.total,
        used: quota.used,
        remaining: Math.max(0, quota.total - quota.used),
        percentage: quota.total > 0 ? ((quota.total - quota.used) / quota.total * 100).toFixed(1) : '∞'
      };
    }

    log(`📊 配额状态: ${JSON.stringify(status, null, 2)}`);
    return status;

  } catch (err) {
    logError('❌ 检查配额失败:', err.message);
    return DEFAULT_QUOTAS;
  }
}

/**
 * 更新配额使用
 */
async function updateQuota(service, used) {
  try {
    await initQuotaFile();

    const data = await fs.readFile(QUOTA_FILE, 'utf8');
    const quotas = JSON.parse(data);

    if (!quotas[service]) {
      quotas[service] = {
        total: 999999,
        used: 0,
        lastReset: new Date().toISOString(),
        resetPeriod: 'daily'
      };
    }

    quotas[service].used += used;
    await fs.writeFile(QUOTA_FILE, JSON.stringify(quotas, null, 2));

    log(`💾 配额更新 - ${service}: +${used}, 总计: ${quotas[service].used}`);

  } catch (err) {
    logError('❌ 更新配额失败:', err.message);
  }
}

/**
 * 检查配额是否充足
 */
async function isQuotaSufficient(service, required = 1) {
  try {
    const status = await checkQuota();
    return status[service] && status[service].remaining >= required;
  } catch (err) {
    logError('❌ 检查配额充足性失败:', err.message);
    return false;
  }
}

/**
 * 获取配额使用率
 */
async function getQuotaUsage(service) {
  try {
    const status = await checkQuota();
    if (status[service]) {
      return {
        used: status[service].used,
        total: status[service].total,
        percentage: status[service].percentage
      };
    }
    return { used: 0, total: 0, percentage: '0' };
  } catch (err) {
    logError('❌ 获取配额使用率失败:', err.message);
    return { used: 0, total: 0, percentage: '0' };
  }
}

/**
 * 重置配额
 */
async function resetQuota(service) {
  try {
    await initQuotaFile();

    const data = await fs.readFile(QUOTA_FILE, 'utf8');
    const quotas = JSON.parse(data);

    if (quotas[service]) {
      quotas[service].used = 0;
      quotas[service].lastReset = new Date().toISOString();
      await fs.writeFile(QUOTA_FILE, JSON.stringify(quotas, null, 2));

      log(`🔄 配额重置 - ${service}`);
      return true;
    }

    return false;

  } catch (err) {
    logError('❌ 重置配额失败:', err.message);
    return false;
  }
}

/**
 * 导出配额报告
 */
async function exportQuotaReport() {
  try {
    const status = await checkQuota();

    const report = {
      generatedAt: new Date().toISOString(),
      services: {},
      summary: {
        totalServices: Object.keys(status).length,
        servicesWithQuota: 0,
        totalQuotaRemaining: 0
      }
    };

    for (const [service, quota] of Object.entries(status)) {
      report.services[service] = {
        total: quota.total,
        used: quota.used,
        remaining: quota.remaining,
        usagePercentage: ((quota.used / quota.total) * 100).toFixed(1) + '%'
      };

      if (quota.total > 0) {
        report.summary.servicesWithQuota++;
        report.summary.totalQuotaRemaining += quota.remaining;
      }
    }

    const reportFile = path.join(path.dirname(QUOTA_FILE), 'quota-report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    log(`📋 配额报告已生成`);
    return report;

  } catch (err) {
    logError('❌ 生成配额报告失败:', err.message);
    return null;
  }
}

module.exports = {
  checkQuota,
  updateQuota,
  isQuotaSufficient,
  getQuotaUsage,
  resetQuota,
  exportQuotaReport,
  initQuotaFile
};