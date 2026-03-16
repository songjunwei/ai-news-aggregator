/**
 * arxiv.js - ArXiv API 客户端
 */

const axios = require('axios');
const { log, error: logError } = require('../utils/logger');

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';
const AI_CATEGORIES = [
  'cs.AI',      # Artificial Intelligence
  'cs.LG',      # Machine Learning
  'cs.CL',      # Computation and Language (NLP)
  'cs.CV',      # Computer Vision
  'cs.RO',      # Robotics
  'stat.ML'     # Machine Learning (Statistics)
];

/**
 * 从ArXiv获取AI相关论文
 */
async function fetchArxiv(options = {}) {
  const { date, verbose = false } = options;

  try {
    const allResults = [];

    // 搜索AI相关论文
    const searchPromises = AI_CATEGORIES.map(async (category) => {
      try {
        if (verbose) {
          log(`🔍 搜索 ArXiv: ${category}`);
        }

        const response = await axios.get(ARXIV_API_URL, {
          params: {
            search_query: `cat:${category}`,
            start: 0,
            max_results: 5,
            sortBy: 'submittedDate',
            sortOrder: 'descending'
          },
          timeout: 8000
        });

        if (response.data) {
          const items = parseArxivResponse(response.data, category);
          return items;
        }

        return [];

      } catch (err) {
        logError(`❌ ArXiv 搜索失败 ${category}:`, err.message);
        return [];
      }
    });

    const results = await Promise.allSettled(searchPromises);

    // 合并结果
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allResults.push(...result.value);
      }
    });

    // 去重（基于ID）
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );

    if (verbose) {
      log(`✅ ArXiv: 获取 ${uniqueResults.length} 篇论文`);
    }

    return {
      items: uniqueResults,
      source: 'arxiv'
    };

  } catch (err) {
    logError('❌ ArXiv 客户端失败:', err.message);
    throw err;
  }
}

/**
 * 解析ArXiv XML响应
 */
function parseArxivResponse(xmlData, category) {
  // 简化的XML解析（实际应使用xml2js等库）
  const items = [];

  try {
    // 这里使用正则表达式简化解析
    // 实际项目中建议使用 xml2js 库
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries = xmlData.match(entryRegex) || [];

    entries.forEach(entry => {
      try {
        const id = extractField(entry, 'id');
        const title = extractField(entry, 'title');
        const summary = extractField(entry, 'summary');
        const published = extractField(entry, 'published');
        const authors = extractAuthors(entry);

        if (id && title) {
          items.push({
            id: id.replace(/\//g, '_'),
            title: title.replace(/\s+/g, ' ').trim(),
            snippet: summary ? summary.substring(0, 300) + '...' : 'No summary',
            url: id.replace('http://arxiv.org/abs/', 'https://arxiv.org/abs/'),
            source: 'ArXiv',
            publishedAt: published,
            category: 'research',
            tags: [category.toLowerCase(), 'paper', 'research'],
            author: authors.join(', '),
            commentCount: 0
          });
        }
      } catch (err) {
        logError('❌ 解析ArXiv条目失败:', err.message);
      }
    });

  } catch (err) {
    logError('❌ 解析ArXiv响应失败:', err.message);
  }

  return items;
}

/**
 * 从XML中提取字段
 */
function extractField(xml, field) {
  const regex = new RegExp(`<${field}>([\\s\\S]*?)</${field}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * 提取作者信息
 */
function extractAuthors(entry) {
  const authorRegex = /<author>([\s\S]*?)<\/author>/g;
  const authors = [];
  let match;

  while ((match = authorRegex.exec(entry)) !== null) {
    const name = extractField(match[1], 'name');
    if (name) {
      authors.push(name);
    }
  }

  return authors.length > 0 ? authors : ['Unknown'];
}

module.exports = { fetchArxiv };