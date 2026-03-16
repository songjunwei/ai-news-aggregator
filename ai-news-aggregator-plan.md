# AI资讯聚合站 MVP 实现方案

## 背景与目标

构建个人AI资讯学习站点，实现：
- 每日自动拉取全球AI前沿资讯
- 多源数据聚合（主流媒体、社交媒体、学术资源）
- 前端Vue3静态展示，无需后端
- 一键部署到GitHub Pages
- 完全基于Claude Code生态实现

## 技术架构

### 核心组件
1. **数据层**：Claude Code Skills + MCP工具
2. **处理层**：Node.js脚本 + AI处理
3. **展示层**：Vue3 + Vite + GitHub Pages
4. **发布层**：GitHub CLI + Actions

### 数据源策略（丰富多元）

### MVP 优先级（国际源优先）
#### 第一优先级（核心数据源）
- **Serper.dev**：Google新闻搜索（2500免费查询）- 新闻发现
- **HackerNews Algolia API**：技术讨论与趋势 - 社区热点
- **Reddit r/MachineLearning**：AI社区讨论 - 实时话题

#### 第二优先级（补充数据源）
- **ArXiv API**：学术论文 - 研究前沿
- **GitHub Trending**：开源项目动态 - 技术趋势
- **Product Hunt**：新产品发布 - 创新动态

#### 第三优先级（中文源扩展）
- **机器之心**：RSS + 网页抓取
- **量子位**：RSS + 社交媒体
- **36kr AI频道**：商业视角
- **AIbase**：聚合资讯

#### 搜索增强
- **Serper.dev**：Google新闻搜索（2500免费查询）
- **Firecrawl MCP**：网页内容抓取

## 实现流程

### 阶段1：项目初始化
```bash
# 创建Vue3项目
npm create vue@latest ai-news-aggregator
cd ai-news-aggregator
npm install

# 添加Claude Skills目录
mkdir -p .claude/skills
```

### 阶段2：数据拉取技能
创建 `.claude/skills/fetch-ai-news/` 目录结构：
- `SKILL.md`：技能定义
- `fetch-sources.js`：数据获取脚本
- `process-news.js`：AI处理逻辑

**数据拉取流程**：
1. 并行调用多个API源
2. 统一数据格式
3. AI去重与摘要
4. 生成静态JSON

### 阶段3：前端展示
**页面结构**：
- 首页：资讯列表（时间倒序）
- 分类页：按来源/类型筛选
- 详情页：内容展示
- 关于页：项目说明

**核心功能**：
- 实时搜索
- 分类筛选
- 阅读历史
- 收藏功能（localStorage）

### 阶段4：自动化发布
**一键发布脚本**：
```bash
#!/bin/bash
# publish.sh
npm run fetch-news && npm run build && git add . && git commit -m "更新资讯 $(date)" && git push
```

**GitHub Pages配置**：
- 启用GitHub Pages
- 设置自定义域名（可选）
- 自动部署Action

## MVP版本功能清单

### 必需功能
- [ ] 每日数据自动拉取（多源聚合）
- [ ] AI摘要与去重
- [ ] 静态JSON生成
- [ ] Vue3前端展示
- [ ] 搜索与筛选
- [ ] 响应式设计
- [ ] GitHub Pages部署

### 增强功能（V1.1）
- [ ] 邮件订阅功能
- [ ] 数据可视化（趋势图表）
- [ ] 离线缓存
- [ ] 深色模式
- [ ] 国际化支持

## 数据结构设计

### 资讯条目格式
```json
{
  "id": "unique-id",
  "title": "标题",
  "summary": "AI摘要",
  "content": "完整内容",
  "source": "来源名称",
  "sourceUrl": "原文链接",
  "publishedAt": "2026-03-16T08:00:00Z",
  "category": "ai/ml/nlp/cv",
  "tags": ["llm", "openai"],
  "author": "作者",
  "views": 0,
  "isFeatured": false
}
```

### 每日数据文件
- `public/data/news-2026-03-16.json`：当日数据
- `public/data/latest.json`：最新数据（软链接）

## 开发时间规划

### 第1周：基础框架
- Vue3项目搭建（Vite + Vue3 + JS）
- Claude Skills环境配置
- Serper.dev API 密钥配置
- 核心数据源对接（Serper + HN Algolia）

### 第2周：数据处理
- 多源数据拉取（Reddit + ArXiv + GitHub）
- AI处理逻辑（摘要、去重、分类）
- 静态JSON生成（日期化存储）

### 第3周：前端开发
- 页面组件开发（列表、详情、搜索）
- 交互功能实现（筛选、收藏、历史）
- 响应式适配（移动端优化）

### 第4周：发布优化
- 发布技能开发
- GitHub Pages部署
- 性能优化与测试

## 风险与对策

### 技术风险与卡点分析

#### 1. API限制与配额管理
**卡点**：
- Serper.dev 2500次免费查询（一次性，非每月）
- Reddit 请求频率限制（IP级别）
- HN Algolia 虽无限制但可能被滥用检测

**对策**：
- 实现查询配额监控（`/claude/skills/quota-monitor`）
- 智能缓存机制（24小时更新周期）
- 失败降级策略（主源失败时备用源）

#### 2. 源失败容错机制
**卡点**：
- 单个源失败导致整体流程中断
- 网络超时或连接错误
- API 服务临时不可用

**对策**：
- **独立错误隔离**：每个源独立 try-catch 包裹
- **熔断机制**：连续失败 3 次暂时跳过该源
- **降级策略**：主源失败自动切换到备用源
- **部分成功**：至少一个源成功即继续流程
- **错误报告**：记录失败详情但不中断整体流程

**容错流程示例**：
```javascript
// fetch-sources.js 容错实现
async function fetchAllSources() {
  const sources = [
    { name: 'serper', fetcher: fetchSerper, priority: 1 },
    { name: 'hackernews', fetcher: fetchHN, priority: 2 },
    { name: 'reddit', fetcher: fetchReddit, priority: 2 },
    { name: 'arxiv', fetcher: fetchArxiv, priority: 3 }
  ];

  const results = [];
  const errors = [];

  for (const source of sources) {
    try {
      console.log(`Fetching from ${source.name}...`);
      const data = await source.fetcher();
      results.push(...data);
      console.log(`✅ ${source.name}: ${data.length} items`);
    } catch (error) {
      console.error(`❌ ${source.name} failed:`, error.message);
      errors.push({ source: source.name, error: error.message });
      // 继续执行，不中断整体流程
    }
  }

  // 检查是否有任何成功结果
  if (results.length === 0) {
    throw new Error('All sources failed, aborting');
  }

  // 记录错误但不中断流程
  if (errors.length > 0) {
    console.warn('Partial failures:', errors);
    // 可以发送通知，但不中断流程
  }

  return results;
}
```

#### 2. 数据源稳定性
**卡点**：
- Reddit 可能封禁默认 User-Agent
- 中文网站反爬机制（机器之心、量子位）
- RSS Feed 更新频率不稳定

**对策**：
- 自定义 User-Agent 头
- Firecrawl MCP 作为抓取后备
- 多源验证（同一新闻从多个源验证）

#### 3. 数据处理复杂性
**卡点**：
- 多源数据格式统一
- AI 摘要 Token 消耗控制
- 去重算法准确性

**对策**：
- 标准化数据转换管道
- 批量处理 + 智能分块
- 多层去重（标题相似度 + 内容指纹）

#### 4. 发布流程问题
**卡点**：
- GitHub Token 权限配置错误
- 仓库不存在或访问受限
- GitHub Pages 构建失败
- 自定义域名 DNS 配置

**对策**：
- 发布前权限验证
- 自动仓库初始化
- 构建日志监控
- 域名配置向导

#### 5. 前端性能
**卡点**：
- 大量数据加载缓慢
- 搜索筛选性能
- 移动端适配

**对策**：
- 分页加载 + 虚拟滚动
- Web Worker 处理搜索
- 响应式设计 + 触摸优化

### 内容风险

#### 1. 重复内容
**卡点**：不同源报道同一事件
**对策**：AI去重 + 相似度阈值 + 人工标记

#### 2. 低质量内容
**卡点**：SEO垃圾内容、营销软文
**对策**：质量评分算法 + 源可信度权重

#### 3. 版权问题
**卡点**：内容聚合的版权边界
**对策**：只聚合元数据 + 摘要 + 原文链接 + 遵守 robots.txt

### 运维风险

#### 1. 技能依赖管理
**卡点**：Node.js 依赖版本冲突
**对策**：技能独立 package.json + 依赖锁定

#### 2. 错误处理
**卡点**：部分源失败导致整体流程中断
**对策**：熔断机制 + 错误隔离 + 部分成功

#### 3. 数据备份
**卡点**：本地数据丢失
**对策**：Git 版本控制 + 定期备份 + 数据恢复脚本

## 完整实施流程

### 阶段0：环境准备（已完成）
- [x] GitHub Token 配置
- [ ] Serper.dev API 密钥获取（见下方详细指南）
- [ ] Node.js 环境确认（v18+）
- [ ] Claude Code 最新版本

---

## Serper.dev API 获取与配置指南

### 1. 注册账号
- 访问 https://serper.dev/
- 点击 "Get Started" 或 "Sign Up"
- 使用 Google 账号或邮箱注册（推荐 Google 账号）

### 2. 获取 API 密钥
- 登录后进入 Dashboard
- 点击 "API Keys" → "Create API Key"
- 选择 "Free Plan"（2500次免费查询）
- 复制生成的 API 密钥

### 3. 配置环境变量
```bash
# 项目根目录创建 .env 文件
echo "SERPER_API_KEY=your_api_key_here" > .env

# 添加到 Claude Code 环境变量
claude config set environmentVariables.SERPER_API_KEY "your_api_key_here"
```

### 4. 测试 API 连接
```bash
# 使用 curl 测试
curl -X POST "https://google.serper.dev/news" \
  -H "X-API-KEY: ${SERPER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"q": "artificial intelligence", "num": 5}'
```

### 5. API 使用限制
- **免费额度**：2500次查询（一次性，非每月）
- **查询建议**：每次查询获取 10-20 条结果
- **成本控制**：约可获取 50,000-50,000 条新闻
- **使用策略**：优先搜索热点，避免重复查询

### 6. 备用方案（API 耗尽后）
- **Firecrawl MCP**：网页抓取（免费 tier 有限）
- **直接 RSS**：使用 RSSHub 聚合
- **手动补充**：关键新闻手动添加

### 阶段1：项目初始化
```bash
# 1. 创建项目
mkdir ai-news-aggregator && cd ai-news-aggregator
npm create vue@latest . -- --typescript=false --jsx=false
npm install

# 2. 创建 Claude Skills 目录结构
mkdir -p .claude/skills/{fetch-ai-news,publish-to-github}
mkdir -p public/data

# 3. 环境变量配置
echo "SERPER_API_KEY=your_key_here" > .env
echo "GITHUB_TOKEN=your_token_here" >> .env
```

### 阶段2：核心技能开发
#### fetch-ai-news 技能
```bash
# 技能结构
.claude/skills/fetch-ai-news/
├── SKILL.md                    # 技能定义文档
├── fetch-sources.js            # 数据获取主逻辑
├── sources/
│   ├── serper.js               # Serper.dev 客户端
│   ├── hackernews.js           # HN Algolia 客户端
│   ├── reddit.js               # Reddit API 客户端
│   └── arxiv.js                # ArXiv API 客户端
├── processors/
│   ├── deduplicator.js         # 去重算法
│   ├── summarizer.js           # AI 摘要
│   └── classifier.js           # 分类器
└── utils/
    ├── logger.js               # 日志工具
    ├── quota-tracker.js        # 配额监控
    └── data-formatter.js       # 数据格式化
```

#### publish-to-github 技能
```bash
# 技能结构
.claude/skills/publish-to-github/
├── SKILL.md                    # 技能定义
├── publisher.js                # 发布逻辑
├── git-ops.js                  # Git 操作
└── github-api.js               # GitHub API 客户端
```

### 阶段3：前端开发
#### 页面组件
```bash
src/
├── components/
│   ├── NewsList.vue            # 资讯列表
│   ├── NewsDetail.vue          # 资讯详情
│   ├── SearchBar.vue           # 搜索栏
│   ├── FilterPanel.vue         # 筛选面板
│   └── SourceBadge.vue         # 来源标识
├── pages/
│   ├── Home.vue                # 首页
│   ├── Category.vue            # 分类页
│   └── About.vue               # 关于页
├── composables/
│   ├── useNewsData.js          # 数据逻辑
│   ├── useSearch.js            # 搜索逻辑
│   └── useFilters.js           # 筛选逻辑
└── utils/
    └── api.js                  # API 客户端
```

### 阶段4：测试与部署
```bash
# 测试流程
npm run test:unit              # 单元测试
npm run test:integration       # 集成测试
npm run test:e2e              # E2E 测试

# 部署流程
npm run fetch-news            # 获取数据
npm run build                 # 构建项目
npm run deploy:github         # 部署到 GitHub Pages
```

---

## 完整流程卡点分析

### 1. 环境配置卡点
**可能的问题**：
- Node.js 版本不兼容
- Claude Code 版本过旧
- API 密钥权限不足

**解决方案**：
- 版本检查脚本
- 自动升级机制
- 权限验证工具

### 2. 数据获取卡点
**可能的问题**：
- 网络连接问题
- API 服务不可用
- 数据格式变化

**解决方案**：
- 重试机制（指数退避）
- 服务健康检查
- 数据格式版本控制

### 3. AI 处理卡点
**可能的问题**：
- Token 消耗过多
- 响应时间过长
- 处理结果质量差

**解决方案**：
- Token 预算管理
- 超时中断机制
- 结果质量评估

### 4. 发布流程卡点
**可能的问题**：
- Git 冲突
- 构建失败
- 部署超时

**解决方案**：
- 冲突自动解决
- 构建日志分析
- 部署进度监控

### 5. 前端性能卡点
**可能的问题**：
- 大数据量渲染慢
- 搜索性能差
- 移动端体验不佳

**解决方案**：
- 虚拟滚动优化
- Web Worker 并行处理
- 响应式图片优化

---

## 监控与维护

### 健康检查
```bash
# 每日健康检查脚本
/claude/skills/health-check/
├── check-apis.js              # API 健康检查
├── check-storage.js           # 存储空间检查
└── check-quota.js             # 配额使用情况
```

### 错误告警
- API 失败通知
- 配额不足提醒
- 构建失败报警

### 数据备份
- 本地 Git 版本控制
- 云存储备份
- 定期数据归档

---

## 下一步行动

1. **立即开始**：创建项目结构和第一个技能
2. **API准备**：获取 Serper.dev API 密钥
3. **技能开发**：实现 fetch-ai-news 核心功能
4. **前端同步**：Vue3 组件开发

---

**当前状态**：方案完善完成，准备开始实施

**建议行动**：我现在可以开始创建项目结构和核心技能，你需要我立即开始吗？