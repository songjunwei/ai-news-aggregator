#!/usr/bin/env node

/**
 * fetch-sources.js - 多源AI资讯数据获取主逻辑
 * 支持容错机制，单个源失败不影响整体流程
 */

const fs = require('fs').promises;
const path = require('path');
const { fetchSerper } = require('./sources/serper');
const { fetchHackerNews } = require('./sources/hackernews');
const { fetchReddit } = require('./sources/reddit');
const { fetchArxiv } = require('./sources/arxiv');
const { processData } = require('./processors/pipeline');
const { log, error: logError } = require('./utils/logger');
const { checkQuota, updateQuota } = require('./utils/quota-tracker');

// 配置
const CONFIG = {
  CACHE_DIR: path.join(__dirname, '../../public/data'),
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2秒
};

/**
 * 主函数 - 获取所有源数据
 */
async function fetchAllNews(options = {}) {
  const { date = new Date().toISOString().split('T')[0], force = false, verbose = false } = options;

  log(`🚀 开始获取AI资讯数据 - 日期: ${date}`);
  log(`📊 参数: force=${force}, verbose=${verbose}`);

  // 检查缓存
  if (!force) {
    const cachedData = await checkCache(date);
    if (cachedData) {
      log(`✅ 使用缓存数据 - ${cachedData.length} 条记录`);
      return cachedData;
    }
  }

  // 检查配额
  const quotaStatus = await checkQuota();
  if (quotaStatus.serper.remaining <= 0) {
    logError('❌ Serper.dev 配额耗尽，请升级或等待补充');
    // 继续执行其他源
  }

  // 定义数据源（按优先级排序）
  const sources = [
    { name: 'serper', fetcher: fetchSerper, priority: 1, enabled: quotaStatus.serper.remaining > 0 },
    { name: 'hackernews', fetcher: fetchHackerNews, priority: 2, enabled: true },
    { name: 'reddit', fetcher: fetchReddit, priority: 2, enabled: true },
    { name: 'arxiv', fetcher: fetchArxiv, priority: 3, enabled: true }
  ];

  const results = [];
  const errors = [];
  const stats = {
    date,
    total: 0,
    sources: {},
    processing: {
      duplicates_removed: 0,
      summaries_generated: 0,
      categories_assigned: 0
    }
  };

  // 并行获取数据（带容错）
  log('📡 开始并行获取数据...');

  const fetchPromises = sources.map(async (source) => {
    if (!source.enabled) {
      log(`⏭️ 跳过 ${source.name} (配额不足或禁用)`);
      return;
    }

    for (let retry = 1; retry <= CONFIG.MAX_RETRIES; retry++) {
      try {
        log(`🔄 获取 ${source.name} (尝试 ${retry}/${CONFIG.MAX_RETRIES})...`);
        const data = await source.fetcher({ date, verbose });

        // 更新配额
        if (source.name === 'serper') {
          await updateQuota('serper', data.queriesUsed || 1);
        }

        results.push(...data.items);
        stats.sources[source.name] = data.items.length;
        log(`✅ ${source.name}: ${data.items.length} 条记录`);
        break; // 成功则退出重试循环

      } catch (err) {
        logError(`❌ ${source.name} 失败 (尝试 ${retry}/${CONFIG.MAX_RETRIES}):`, err.message);

        if (retry === CONFIG.MAX_RETRIES) {
          errors.push({ source: source.name, error: err.message });
        } else {
          await sleep(CONFIG.RETRY_DELAY * retry); // 指数退避
        }
      }
    }
  });

  await Promise.allSettled(fetchPromises);

  // 检查是否有任何成功结果
  if (results.length === 0) {
    throw new Error('所有数据源都失败，中止流程');
  }

  log(`📊 原始数据获取完成 - 总计: ${results.length} 条`);

  // 数据处理
  log('🔧 开始数据处理...');
  const processedData = await processData(results, stats);

  // 保存数据
  await saveData(processedData, date);

  // 生成统计报告
  if (errors.length > 0) {
    logError('⚠️  部分源失败:', errors);
  }

  log(`✅ 数据处理完成 - 最终: ${processedData.length} 条记录`);
  log(`📈 统计: ${JSON.stringify(stats, null, 2)}`);

  return processedData;
}

/**
 * 检查缓存
 */
async function checkCache(date) {
  try {
    const cacheFile = path.join(CONFIG.CACHE_DIR, `news-${date}.json`);
    const stats = await fs.stat(cacheFile);

    if (Date.now() - stats.mtime.getTime() < CONFIG.CACHE_DURATION) {
      const data = await fs.readFile(cacheFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // 缓存不存在或过期
  }
  return null;
}

/**
 * 保存数据
 */
async function saveData(data, date) {
  try {
    // 确保目录存在
    await fs.mkdir(CONFIG.CACHE_DIR, { recursive: true });

    // 保存日期化文件
    const dateFile = path.join(CONFIG.CACHE_DIR, `news-${date}.json`);
    await fs.writeFile(dateFile, JSON.stringify(data, null, 2));

    // 保存最新指针
    const latestFile = path.join(CONFIG.CACHE_DIR, 'latest.json');
    await fs.writeFile(latestFile, JSON.stringify(data, null, 2));

    log(`💾 数据已保存 - ${dateFile}`);
  } catch (err) {
    logError('❌ 保存数据失败:', err);
    throw err;
  }
}

/**
 * 睡眠工具函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchAllNews };

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    date: args[0] || new Date().toISOString().split('T')[0],
    force: args.includes('--force'),
    verbose: args.includes('--verbose')
  };

  fetchAllNews(options).catch(err => {
    logError('❌ 主流程失败:', err);
    process.exit(1);
  });
}