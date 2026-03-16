/**
 * summarizer.js - AI摘要生成（使用Claude API）
 */

const { log, error: logError } = require('../utils/logger');
const { callClaude } = require('../utils/claude-client');

/**
 * 生成AI摘要
 */
async function summarize(items, stats) {
  try {
    log(`📝 开始AI摘要生成 - 输入: ${items.length} 条`);

    const summarizedItems = [];
    const batchSize = 5; // 批量处理，减少API调用

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const summarizedBatch = await processBatch(batch);
      summarizedItems.push(...summarizedBatch);

      log(`📊 摘要进度: ${Math.min(i + batchSize, items.length)}/${items.length}`);
    }

    stats.processing.summaries_generated = summarizedItems.length;
    log(`✅ 摘要生成完成 - ${summarizedItems.length} 条`);

    return summarizedItems;

  } catch (err) {
    logError('❌ 摘要生成失败:', err.message);
    // 失败时返回原始数据，不中断流程
    return items;
  }
}

/**
 * 批量处理摘要
 */
async function processBatch(items) {
  const prompts = items.map((item, index) => ({
    id: item.id,
    title: item.title,
    content: item.snippet,
    prompt: generatePrompt(item.title, item.snippet)
  }));

  try {
    // 调用Claude API进行批量摘要
    const summaries = await callClaude({
      system: '你是一个专业的AI新闻摘要助手。请为以下新闻内容生成简洁、准确的摘要。',
      messages: [{
        role: 'user',
        content: `请为以下 ${items.length} 条AI新闻生成摘要，每条摘要不超过100字，格式为JSON数组：

${JSON.stringify(prompts.map(p => ({ id: p.id, title: p.title, content: p.content })), null, 2)}`
      }],
      maxTokens: 2000,
      temperature: 0.3
    });

    // 解析响应
    const parsedSummaries = parseSummaryResponse(summaries, items);

    return parsedSummaries;

  } catch (err) {
    logError('❌ 批量摘要失败:', err.message);
    // 失败时返回原始项
    return items;
  }
}

/**
 * 生成摘要提示词
 */
function generatePrompt(title, content) {
  return `请为以下新闻生成简洁摘要（不超过100字）：

标题：${title}
内容：${content}

要求：
1. 提取核心信息
2. 保持客观中立
3. 突出AI/ML相关要点
4. 字数控制在50-100字之间`;
}

/**
 * 解析摘要响应
 */
function parseSummaryResponse(response, originalItems) {
  try {
    // 尝试解析JSON响应
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    const summaries = JSON.parse(cleanedResponse);

    if (Array.isArray(summaries)) {
      return originalItems.map(item => {
        const summary = summaries.find(s => s.id === item.id);
        if (summary && summary.summary) {
          return {
            ...item,
            summary: summary.summary,
            content: summary.summary
          };
        }
        return item;
      });
    }

    return originalItems;

  } catch (err) {
    logError('❌ 解析摘要响应失败:', err.message);
    return originalItems;
  }
}

/**
 * 单条摘要生成（备用方法）
 */
async function summarizeSingle(item) {
  try {
    const prompt = generatePrompt(item.title, item.snippet);

    const summary = await callClaude({
      system: '你是一个专业的AI新闻摘要助手。',
      messages: [{
        role: 'user',
        content: prompt
      }],
      maxTokens: 300,
      temperature: 0.3
    });

    return {
      ...item,
      summary: summary.trim(),
      content: summary.trim()
    };

  } catch (err) {
    logError(`❌ 单条摘要失败 [${item.id}]:`, err.message);
    return item;
  }
}

module.exports = { summarize };