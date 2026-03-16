/**
 * deduplicator.js - 新闻去重算法
 */

const { log } = require('../utils/logger');

/**
 * 去重处理 - 基于标题相似度和URL
 */
async function deduplicate(items, stats) {
  try {
    log(`🔍 开始去重处理 - 输入: ${items.length} 条`);

    // 步骤1: URL精确去重
    const urlDeduplicated = deduplicateByUrl(items);
    log(`🔗 URL去重: ${items.length} -> ${urlDeduplicated.length} 条`);

    // 步骤2: 标题相似度去重
    const titleDeduplicated = deduplicateByTitleSimilarity(urlDeduplicated);
    log(`📝 标题去重: ${urlDeduplicated.length} -> ${titleDeduplicated.length} 条`);

    // 步骤3: 内容指纹去重
    const fingerprintDeduplicated = deduplicateByFingerprint(titleDeduplicated);
    log(`🔬 指纹去重: ${titleDeduplicated.length} -> ${fingerprintDeduplicated.length} 条`);

    // 更新统计
    stats.processing.duplicates_removed = items.length - fingerprintDeduplicated.length;

    log(`✅ 去重完成 - 移除 ${stats.processing.duplicates_removed} 条重复记录`);
    return fingerprintDeduplicated;

  } catch (err) {
    log(`❌ 去重处理失败:`, err.message);
    throw err;
  }
}

/**
 * 基于URL的去重
 */
function deduplicateByUrl(items) {
  const seen = new Set();
  return items.filter(item => {
    const url = normalizeUrl(item.url);
    if (seen.has(url)) {
      return false;
    }
    seen.add(url);
    return true;
  });
}

/**
 * 基于标题相似度的去重
 */
function deduplicateByTitleSimilarity(items) {
  const result = [];
  const groups = [];

  // 按来源分组，减少计算量
  const sourceGroups = items.reduce((acc, item) => {
    if (!acc[item.source]) {
      acc[item.source] = [];
    }
    acc[item.source].push(item);
    return acc;
  }, {});

  // 在每个源内进行去重
  Object.values(sourceGroups).forEach(sourceItems => {
    for (let i = 0; i < sourceItems.length; i++) {
      const item = sourceItems[i];
      let isDuplicate = false;

      // 与已接受的项比较
      for (let j = 0; j < result.length; j++) {
        const existing = result[j];

        // 计算标题相似度
        const similarity = calculateSimilarity(item.title, existing.title);

        if (similarity > 0.8) { // 相似度阈值
          // 保留质量更高的项
          if (isBetterItem(item, existing)) {
            // 替换现有项
            result[j] = item;
            groups.push([existing, item]);
          } else {
            groups.push([item, existing]);
          }
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        result.push(item);
      }
    }
  });

  return result;
}

/**
 * 基于内容指纹的去重
 */
function deduplicateByFingerprint(items) {
  const fingerprints = new Set();
  const result = [];

  for (const item of items) {
    const fingerprint = generateFingerprint(item);

    if (!fingerprints.has(fingerprint)) {
      fingerprints.add(fingerprint);
      result.push(item);
    }
  }

  return result;
}

/**
 * URL标准化
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    // 移除跟踪参数
    const params = new URLSearchParams(parsed.search);
    const cleanParams = new URLSearchParams();

    // 保留重要参数
    for (const [key, value] of params) {
      if (!key.startsWith('utm_') && !key.startsWith('fbclid')) {
        cleanParams.append(key, value);
      }
    }

    parsed.search = cleanParams.toString();
    return parsed.toString();
  } catch (err) {
    return url;
  }
}

/**
 * 计算字符串相似度（Levenshtein距离）
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein距离算法
 */
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * 判断是否更好的项
 */
function isBetterItem(newItem, existingItem) {
  // 分数更高
  if (newItem.score > existingItem.score * 1.5) {
    return true;
  }

  // 评论数更多
  if (newItem.commentCount > existingItem.commentCount * 2) {
    return true;
  }

  // 标题更完整
  if (newItem.title.length > existingItem.title.length * 1.2) {
    return true;
  }

  return false;
}

/**
 * 生成内容指纹
 */
function generateFingerprint(item) {
  const content = `${item.title} ${item.snippet}`.toLowerCase();

  // 移除特殊字符和多余空格
  const cleanContent = content
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 取前100个字符作为指纹
  return cleanContent.substring(0, 100);
}

module.exports = { deduplicate };