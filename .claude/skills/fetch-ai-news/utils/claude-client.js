/**
 * claude-client.js - Claude API 客户端
 */

const { log, error: logError } = require('./logger');

/**
 * 调用Claude API
 */
async function callClaude(params) {
  const {
    system = '你是一个专业的AI助手。',
    messages = [],
    maxTokens = 1000,
    temperature = 0.7,
    model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
  } = params;

  try {
    // 构建请求体
    const requestBody = {
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };

    // 发送请求
    const response = await fetch(
      process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_AUTH_TOKEN,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`API error! status: ${response.status}`);
    }

    const data = await response.json();

    // 提取内容
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    }

    throw new Error('Invalid response format');

  } catch (err) {
    logError('❌ Claude API 调用失败:', err.message);
    throw err;
  }
}

/**
 * 批量调用（带重试）
 */
async function callClaudeBatch(prompts, options = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];

    try {
      const result = await callClaude({
        system: prompt.system,
        messages: prompt.messages,
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      });

      results.push({ index: i, success: true, result });
    } catch (err) {
      logError(`❌ 批量调用失败 [${i}]:`, err.message);
      results.push({ index: i, success: false, error: err.message });
    }

    // 添加延迟，避免速率限制
    if (i < prompts.length - 1) {
      await sleep(1000);
    }
  }

  return { results, errors: errors.filter(e => e) };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { callClaude, callClaudeBatch };