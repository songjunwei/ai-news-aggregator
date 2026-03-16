/**
 * pipeline.js - 数据处理流水线
 */

const { deduplicate } = require('./deduplicator');
const { summarize } = require('./summarizer');
const { classify } = require('./classifier');
const { log } = require('../utils/logger');

/**
 * 完整数据处理流水线
 */
async function processData(rawItems, stats) {
  try {
    log(`🔄 开始数据处理流水线 - 输入: ${rawItems.length} 条`);

    // 步骤1: 数据清洗和标准化
    const cleanedItems = cleanData(rawItems);
    log(`🧹 数据清洗完成 - ${cleanedItems.length} 条`);

    // 步骤2: 去重处理
    const deduplicatedItems = await deduplicate(cleanedItems, stats);
    log(`🔍 去重完成 - ${deduplicatedItems.length} 条`);

    // 步骤3: AI摘要生成
    const summarizedItems = await summarize(deduplicatedItems, stats);
    log(`📝 摘要生成完成 - ${summarizedItems.length} 条`);

    // 步骤4: 分类和标签
    const classifiedItems = await classify(summarizedItems, stats);
    log(`🏷️ 分类完成 - ${classifiedItems.length} 条`);

    // 步骤5: 最终格式化
    const finalItems = formatData(classifiedItems);
    log(`✨ 数据处理完成 - 最终: ${finalItems.length} 条`);

    return finalItems;

  } catch (err) {
    log(`❌ 数据处理流水线失败:`, err.message);
    throw err;
  }
}

/**
 * 数据清洗
 */
function cleanData(items) {
  return items.filter(item => {
    // 过滤无效数据
    return item.title &&
           item.url &&
           item.publishedAt &&
           item.title.length > 10;
  }).map(item => ({
    // 标准化字段
    id: item.id || generateId(item.title),
    title: item.title.trim(),
    snippet: (item.snippet || item.description || '').trim(),
    url: item.url,
    source: item.source || 'Unknown',
    publishedAt: item.publishedAt,
    category: item.category || 'uncategorized',
    tags: item.tags || [],
    author: item.author || 'Unknown',
    score: item.score || 0,
    commentCount: item.commentCount || 0,
    raw: item // 保留原始数据
  }));
}

/**
 * 数据格式化
 */
function formatData(items) {
  return items.map(item => ({
    id: item.id,
    title: item.title,
    summary: item.summary || item.snippet,
    content: item.content || item.snippet,
    source: item.source,
    sourceUrl: item.url,
    publishedAt: item.publishedAt,
    category: item.category,
    tags: item.tags,
    author: item.author,
    views: 0,
    isFeatured: item.score > 100 // 高分项目标记为特色
  }));
}

/**
 * 生成唯一ID
 */
function generateId(title) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(title).digest('hex').substring(0, 12);
}

module.exports = { processData };