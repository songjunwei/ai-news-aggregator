/**
 * reddit.js - Reddit API 客户端 (r/MachineLearning)
 */

const axios = require('axios');
const { log, error: logError } = require('../utils/logger');

const REDDIT_API_URL = 'https://www.reddit.com';
const USER_AGENT = 'AI-News-Aggregator/1.0 (by /u/yourusername)';
const SUBREDDITS = ['MachineLearning', 'artificial', 'OpenAI', 'ClaudeAI'];

/**
 * 从Reddit获取AI相关帖子
 */
async function fetchReddit(options = {}) {
  const { date, verbose = false } = options;

  try {
    const allResults = [];

    // 获取热门和新的帖子
    const subredditPromises = SUBREDDITS.map(async (subreddit) => {
      try {
        if (verbose) {
          log(`🔍 获取 r/${subreddit}`);
        }

        // 获取热门帖子
        const hotResponse = await axios.get(
          `${REDDIT_API_URL}/r/${subreddit}/hot.json`,
          {
            params: { limit: 10 },
            headers: { 'User-Agent': USER_AGENT },
            timeout: 8000
          }
        );

        // 获取新帖子
        const newResponse = await axios.get(
          `${REDDIT_API_URL}/r/${subreddit}/new.json`,
          {
            params: { limit: 10 },
            headers: { 'User-Agent': USER_AGENT },
            timeout: 8000
          }
        );

        const items = [];

        // 处理热门帖子
        if (hotResponse.data && hotResponse.data.data && hotResponse.data.data.children) {
          hotResponse.data.data.children.forEach(child => {
            const post = child.data;
            if (isRecentPost(post.created_utc) && isAIPost(post)) {
              items.push({
                id: `reddit_${post.id}`,
                title: post.title,
                snippet: post.selftext?.substring(0, 200) || 'No content',
                url: `https://reddit.com${post.permalink}`,
                source: `Reddit r/${subreddit}`,
                publishedAt: new Date(post.created_utc * 1000).toISOString(),
                category: 'community',
                tags: extractTagsFromPost(post, subreddit),
                author: post.author,
                score: post.score || 0,
                commentCount: post.num_comments || 0,
                subreddit: subreddit
              });
            }
          });
        }

        // 处理新帖子
        if (newResponse.data && newResponse.data.data && newResponse.data.data.children) {
          newResponse.data.data.children.forEach(child => {
            const post = child.data;
            if (isRecentPost(post.created_utc) && isAIPost(post)) {
              items.push({
                id: `reddit_${post.id}`,
                title: post.title,
                snippet: post.selftext?.substring(0, 200) || 'No content',
                url: `https://reddit.com${post.permalink}`,
                source: `Reddit r/${subreddit}`,
                publishedAt: new Date(post.created_utc * 1000).toISOString(),
                category: 'community',
                tags: extractTagsFromPost(post, subreddit),
                author: post.author,
                score: post.score || 0,
                commentCount: post.num_comments || 0,
                subreddit: subreddit
              });
            }
          });
        }

        return items;

      } catch (err) {
        logError(`❌ Reddit r/${subreddit} 失败:`, err.message);
        return [];
      }
    });

    const results = await Promise.allSettled(subredditPromises);

    // 合并结果
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allResults.push(...result.value);
      }
    });

    // 按分数排序并去重
    const uniqueResults = allResults
      .filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // 限制结果数量

    if (verbose) {
      log(`✅ Reddit: 获取 ${uniqueResults.length} 条记录`);
    }

    return {
      items: uniqueResults,
      source: 'reddit'
    };

  } catch (err) {
    logError('❌ Reddit 客户端失败:', err.message);
    throw err;
  }
}

/**
 * 检查是否为近期帖子（24小时内）
 */
function isRecentPost(created_utc) {
  const postDate = new Date(created_utc * 1000);
  const now = new Date();
  const diffHours = (now - postDate) / (1000 * 60 * 60);
  return diffHours <= 24;
}

/**
 * 检查是否为AI相关帖子
 */
function isAIPost(post) {
  const title = post.title.toLowerCase();
  const keywords = [
    'ai', 'ml', 'machine learning', 'deep learning', 'llm',
    'openai', 'claude', 'gpt', 'chatgpt', 'langchain'
  ];

  return keywords.some(keyword => title.includes(keyword));
}

/**
 * 从帖子中提取标签
 */
function extractTagsFromPost(post, subreddit) {
  const tags = [subreddit.toLowerCase()];

  const title = post.title.toLowerCase();

  if (title.includes('openai')) tags.push('openai');
  if (title.includes('claude')) tags.push('claude');
  if (title.includes('gpt')) tags.push('gpt');
  if (title.includes('llm')) tags.push('llm');
  if (title.includes('langchain')) tags.push('langchain');
  if (title.includes('research')) tags.push('research');
  if (title.includes('paper')) tags.push('paper');

  return tags;
}

module.exports = { fetchReddit };