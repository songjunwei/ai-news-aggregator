/**
 * classifier.js - 新闻分类和标签生成
 */

const { log } = require('../utils/logger');
const { callClaude } = require('../utils/claude-client');

const CATEGORIES = [
  'llm',           # 大语言模型
  'ml_research',   # 机器学习研究
  'nlp',           # 自然语言处理
  'computer_vision', # 计算机视觉
  'robotics',      # 机器人
  'ai_ethics',     # AI伦理
  'ai_tools',      # AI工具
  'startup',       # 创业公司
  'funding',       # 融资
  'product',       # 产品发布
  'trends'         # 趋势
];

/**
 * 分类和标签生成
 */
async function classify(items, stats) {
  try {
    log(`🏷️ 开始分类处理 - 输入: ${items.length} 条`);

    const classifiedItems = [];
    const batchSize = 10; // 批量处理

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const classifiedBatch = await classifyBatch(batch);
      classifiedItems.push(...classifiedBatch);

      log(`📊 分类进度: ${Math.min(i + batchSize, items.length)}/${items.length}`);
    }

    stats.processing.categories_assigned = classifiedItems.length;
    log(`✅ 分类完成 - ${classifiedItems.length} 条`);

    return classifiedItems;

  } catch (err) {
    log(`❌ 分类处理失败:`, err.message);
    // 失败时返回原始数据，不中断流程
    return items;
  }
}

/**
 * 批量分类处理
 */
async function classifyBatch(items) {
  try {
    const prompts = items.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary || item.snippet
    }));

    // 调用Claude API进行批量分类
    const classification = await callClaude({
      system: `你是一个AI新闻分类专家。请为每条新闻分配一个主要类别和3-5个相关标签。

可用类别：${CATEGORIES.join(', ')}

要求：
1. 从可用类别中选择最匹配的主要类别
2. 生成3-5个相关标签
3. 返回JSON格式：[{"id": "...", "category": "...", "tags": [...]}, ...]`,
      messages: [{
        role: 'user',
        content: `请对以下 ${items.length} 条AI新闻进行分类：

${JSON.stringify(prompts, null, 2)}`
      }],
      maxTokens: 2000,
      temperature: 0.2
    });

    // 解析响应
    return parseClassificationResponse(classification, items);

  } catch (err) {
    log(`❌ 批量分类失败:`, err.message);
    return items.map(item => ({
      ...item,
      category: 'uncategorized',
      tags: item.tags || []
    }));
  }
}

/**
 * 解析分类响应
 */
function parseClassificationResponse(response, originalItems) {
  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    const classifications = JSON.parse(cleanedResponse);

    if (Array.isArray(classifications)) {
      return originalItems.map(item => {
        const classification = classifications.find(c => c.id === item.id);

        if (classification) {
          return {
            ...item,
            category: classification.category || 'uncategorized',
            tags: [...new Set([
              ...(item.tags || []),
              ...(classification.tags || [])
            ])]
          };
        }

        return {
          ...item,
          category: 'uncategorized'
        };
      });
    }

    return originalItems.map(item => ({
      ...item,
      category: 'uncategorized'
    }));

  } catch (err) {
    log(`❌ 解析分类响应失败:`, err.message);
    return originalItems.map(item => ({
      ...item,
      category: 'uncategorized'
    }));
  }
}

/**
 * 基于规则的快速分类（Claude失败时的备用方案）
 */
function ruleBasedClassify(item) {
  const title = item.title.toLowerCase();
  const content = (item.summary || item.snippet || '').toLowerCase();
  const combined = `${title} ${content}`;

  // 类别匹配规则
  const rules = {
    'llm': ['llm', 'gpt', 'claude', 'llama', 'mistral', 'large language model'],
    'ml_research': ['research', 'paper', 'arxiv', 'neural network', 'deep learning'],
    'nlp': ['nlp', 'natural language', 'translation', 'text generation'],
    'computer_vision': ['vision', 'image', 'computer vision', 'cv'],
    'robotics': ['robot', 'robotics', 'autonomous'],
    'ai_ethics': ['ethics', 'bias', 'fairness', 'regulation', 'policy'],
    'ai_tools': ['tool', 'framework', 'library', 'api', 'platform'],
    'startup': ['startup', 'company', 'founder', 'ceo'],
    'funding': ['funding', 'investment', 'raise', 'series', 'vc'],
    'product': ['launch', 'release', 'product', 'announce'],
    'trends': ['trend', 'market', 'industry', 'forecast']
  };

  // 找到匹配的类别
  for (const [category, keywords] of Object.entries(rules)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return {
        ...item,
        category: category,
        tags: [...new Set([...(item.tags || []), category])]
      };
    }
  }

  return {
    ...item,
    category: 'uncategorized',
    tags: item.tags || []
  };
}

module.exports = { classify };