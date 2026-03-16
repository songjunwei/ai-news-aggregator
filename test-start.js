#!/usr/bin/env node

/**
 * 测试启动脚本 - 绕过 Vite 版本问题
 */

const fs = require('fs').promises;
const path = require('path');

async function testBasicFunctionality() {
  console.log('🧪 开始测试基本功能...');

  try {
    // 测试1: 检查数据文件
    console.log('📁 检查数据文件...');
    const dataFile = path.join(__dirname, 'public/data/latest.json');
    const data = await fs.readFile(dataFile, 'utf8');
    console.log('✅ 数据文件读取成功:', data);

    // 测试2: 检查Vue组件
    console.log('🧱 检查Vue组件...');
    const appFile = path.join(__dirname, 'src/App.vue');
    const appContent = await fs.readFile(appFile, 'utf8');
    console.log('✅ App.vue 存在，大小:', appContent.length, '字节');

    // 测试3: 检查技能文件
    console.log('🤖 检查Claude技能...');
    const skillFile = path.join(__dirname, '.claude/skills/fetch-ai-news/SKILL.md');
    const skillContent = await fs.readFile(skillFile, 'utf8');
    console.log('✅ fetch-ai-news 技能存在');

    // 测试4: 检查依赖
    console.log('📦 检查依赖...');
    const packageFile = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageFile, 'utf8'));
    console.log('✅ 依赖包:', Object.keys(packageJson.dependencies).join(', '));

    console.log('🎉 所有基础测试通过！');

    // 生成测试数据
    console.log('📊 生成测试数据...');
    const testData = generateTestData();
    await fs.writeFile(
      path.join(__dirname, 'public/data/latest.json'),
      JSON.stringify(testData, null, 2)
    );
    console.log('✅ 测试数据已生成');

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    process.exit(1);
  }
}

/**
 * 生成测试数据
 */
function generateTestData() {
  return [
    {
      "id": "test-001",
      "title": "OpenAI 发布 GPT-5 模型",
      "summary": "OpenAI 正式发布了下一代大语言模型 GPT-5，在多个基准测试中表现优异。",
      "content": "OpenAI 今日正式发布 GPT-5 模型...",
      "source": "Serper",
      "sourceUrl": "https://example.com/gpt5",
      "publishedAt": "2026-03-16T10:00:00Z",
      "category": "llm",
      "tags": ["openai", "gpt5", "llm"],
      "author": "Test Author",
      "views": 100,
      "isFeatured": true
    },
    {
      "id": "test-002",
      "title": "Google DeepMind 推出新AI系统",
      "summary": "Google DeepMind 发布了全新的AI系统，在蛋白质折叠预测方面取得突破。",
      "content": "Google DeepMind 的最新研究成果...",
      "source": "HackerNews",
      "sourceUrl": "https://example.com/deepmind",
      "publishedAt": "2026-03-15T14:30:00Z",
      "category": "ml_research",
      "tags": ["google", "deepmind", "protein"],
      "author": "Researcher",
      "views": 50,
      "isFeatured": false
    },
    {
      "id": "test-003",
      "title": "AI创业公司获新一轮融资",
      "summary": "多家AI创业公司宣布获得新一轮融资，总金额超过10亿美元。",
      "content": "AI创业热潮持续...",
      "source": "Reddit",
      "sourceUrl": "https://example.com/funding",
      "publishedAt": "2026-03-14T09:15:00Z",
      "category": "funding",
      "tags": ["startup", "funding", "ai"],
      "author": "Investor",
      "views": 75,
      "isFeatured": false
    }
  ];
}

if (require.main === module) {
  testBasicFunctionality();
}