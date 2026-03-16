/**
 * serper.js - Serper.dev Google新闻搜索客户端
 */

const axios = require('axios');
const { log, error: logError } = require('../utils/logger');

const SERPER_API_URL = 'https://google.serper.dev/news';
const AI_NEWS_QUERIES = [
  'artificial intelligence latest news',
  'machine learning breakthrough',
  'LLM research',
  'OpenAI news',
  'Google AI',
  'Anthropic Claude',
  'AI startup funding'
];

/**
 * 从Serper.dev获取AI新闻
 */
async function fetchSerper(options = {}) {
  const { date, verbose = false } = options;

  try {
    // 检查API密钥
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      throw new Error('SERPER_API_KEY 未配置');
    }

    const allResults = [];
    let totalQueries = 0;

    // 并行搜索多个查询
    const searchPromises = AI_NEWS_QUERIES.map(async (query) => {
      try {
        if (verbose) {
          log(`🔍 搜索: "${query}"`);
        }

        const response = await axios.post(SERPER_API_URL, {
          q: query,
          num: 10 // 每个查询获取10条结果
        }, {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        });

        totalQueries++;

        if (response.data && response.data.news) {
          const items = response.data.news.map(item => ({
            id: generateId(item.title),
            title: item.title,
            snippet: item.snippet,
            url: item.link,
            source: item.source,
            publishedAt: item.date,
            category: 'news',
            tags: extractTags(query),
            queriesUsed: 1
          }));

          return items;
        }

        return [];

      } catch (err) {
        logError(`❌ 搜索失败 "${query}":`, err.message);
        return []; // 返回空数组，不影响整体流程
      }
    });

    const results = await Promise.allSettled(searchPromises);

    // 合并结果
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allResults.push(...result.value);
      }
    });

    // 去重（基于URL）
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex((t) => t.url === item.url)
    );

    if (verbose) {
      log(`✅ Serper: 获取 ${uniqueResults.length} 条新闻 (使用 ${totalQueries} 次查询)`);
    }

    return {
      items: uniqueResults,
      queriesUsed: totalQueries,
      source: 'serper'
    };

  } catch (err) {
    logError('❌ Serper 客户端失败:', err.message);
    throw err;
  }
}

/**
 * 生成唯一ID
 */
function generateId(title) {
  return Buffer.from(title).toString('base64').substring(0, 16);
}

/**
 * 从查询中提取标签
 */
function extractTags(query) {
  const tags = [];
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('llm')) tags.push('llm');
  if (lowerQuery.includes('openai')) tags.push('openai');
  if (lowerQuery.includes('google')) tags.push('google');
  if (lowerQuery.includes('anthropic')) tags.push('claude');
  if (lowerQuery.includes('startup')) tags.push('startup');
  if (lowerQuery.includes('funding')) tags.push('funding');

  return tags;
}

module.exports = { fetchSerper };