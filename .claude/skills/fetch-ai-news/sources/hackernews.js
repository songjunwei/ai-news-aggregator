/**
 * hackernews.js - HackerNews Algolia API client
 */

const axios = require('axios');
const { log, error: logError } = require('../utils/logger');

const HN_API_URL = 'https://hn.algolia.com/api/v1/search';
const AI_RELATED_TAGS = ['story', 'Ask HN', 'Show HN'];
const AI_KEYWORDS = [
  'artificial intelligence',
  'machine learning',
  'llm',
  'openai',
  'claude',
  'deep learning',
  'neural network',
  'gpt',
  'ai',
  'chatbot'
];

/**
 * 从HackerNews Algolia API获取AI相关故事
 */
async function fetchHackerNews(options = {}) {
  const { date, verbose = false } = options;

  try {
    const allResults = [];

    // 构建查询参数 - 搜索AI相关内容
    const queries = [
      { query: 'artificial intelligence OR machine learning OR "deep learning"', tags: 'story' },
      { query: 'llm OR openai OR claude', tags: 'story' },
      { query: 'neural network OR gpt OR chatbot', tags: 'story' },
      { query: '"Ask HN" AND (ai OR ml)', tags: 'ask_hn' },
      { query: '"Show HN" AND (ai OR ml)', tags: 'show_hn' }
    ];

    // 并行搜索多个查询
    const searchPromises = queries.map(async (q) => {
      try {
        if (verbose) {
          log(`🔍 HackerNews 搜索: "${q.query}" (tags: ${q.tags})`);
        }

        const response = await axios.get(HN_API_URL, {
          params: {
            query: q.query,
            tags: q.tags,
            numericFilters: 'points>5', // 只获取有意义的讨论
            hitsPerPage: 20,
            page: 0
          },
          timeout: 8000 // 8秒超时
        });

        if (response.data && response.data.hits) {
          const items = response.data.hits.map(item => ({
            id: item.objectID,
            title: item.title,
            snippet: item._snippetResult?.title?.value || item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
            source: 'HackerNews',
            publishedAt: new Date(item.created_at_i * 1000).toISOString(),
            category: q.tags === 'ask_hn' ? 'discussion' : q.tags === 'show_hn' ? 'showcase' : 'story',
            tags: extractTagsFromHNTags(item._tags),
            score: item.points || 0,
            author: item.author,
            commentCount: item.num_comments || 0,
            queriesUsed: 0 // HackerNews免费，不计配额
          }));

          return items;
        }

        return [];

      } catch (err) {
        logError(`❌ HackerNews 搜索失败 "${q.query}":`, err.message);
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

    // 去重（基于URL和标题）
    const uniqueResults = deduplicateResults(allResults);

    if (verbose) {
      log(`✅ HackerNews: 获取 ${uniqueResults.length} 条记录`);
    }

    return {
      items: uniqueResults,
      queriesUsed: 0,
      source: 'hackernews'
    };

  } catch (err) {
    logError('❌ HackerNews 客户端失败:', err.message);
    throw err;
  }
}

/**
 * 从HN标签中提取标签
 */
function extractTagsFromHNTags(tags) {
  const extracted = [];
  const tagMap = {
    'story': 'story',
    'ask_hn': 'discussion',
    'show_hn': 'showcase',
    'comment': 'comment',
    'poll': 'poll'
  };

  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (tagMap[tag]) {
        extracted.push(tagMap[tag]);
      }
    });
  }

  // 添加AI相关标签
  extracted.push('ai', 'tech', 'hackernews');

  return extracted;
}

/**
 * 去重结果
 */
function deduplicateResults(results) {
  const seen = new Set();
  return results.filter(item => {
    const key = item.url || item.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

module.exports = { fetchHackerNews };