# AI资讯聚合站

![AI资讯聚合站](https://img.shields.io/badge/AI-资讯聚合站-blue?style=flat-square)
![Vue 3](https://img.shields.io/badge/Vue-3-green?style=flat-square)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-grey?style=flat-square)

🚀 每日自动获取全球AI前沿资讯，多源聚合，AI智能摘要分类。

## 功能特点

- 📡 **多源数据聚合**：整合 Serper、HackerNews、Reddit、ArXiv 等多个数据源
- 🤖 **AI智能处理**：自动生成摘要、去重、分类
- 🌐 **响应式设计**：支持桌面端和移动端
- ⚡ **静态部署**：Vue3构建，静态资源托管，快速加载
- 📱 **实时搜索**：支持标题、内容、标签搜索
- 🔍 **智能筛选**：按分类、来源筛选

## 技术栈

- **前端**：Vue 3 + Vite + Vue Router
- **数据获取**：Claude Code Skills + Node.js
- **AI处理**：Claude API
- **部署**：GitHub Pages

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 配置环境变量

1. 复制环境变量模板
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入必要的 API 密钥：
   - `SERPER_API_KEY`: Serper.dev API 密钥（用于Google新闻搜索）
   - `GITHUB_TOKEN`: GitHub Token（用于发布）
   - `CLAUDE_API_KEY`: Claude API密钥（可选，用于AI摘要）

### 获取资讯

```bash# 拉取最新资讯
npm run fetch-news

# 强制刷新缓存
npm run fetch-news:force
```

### 开发预览

```bash
npm run dev
```

### 构建部署

```bash
# 构建项目
npm run build

# 部署到GitHub Pages
npm run deploy
```

## 项目结构

```
ai-news-aggregator/
├── src/                    # Vue源码
│   ├── components/         # 组件
│   │   ├── NewsList.vue    # 资讯列表
│   │   ├── SearchBar.vue   # 搜索栏
│   │   ├── FilterPanel.vue # 筛选面板
│   │   └── SourceBadge.vue # 来源标识
│   ├── pages/              # 页面
│   │   └── Home.vue       # 首页
│   ├── composables/        # 组合式函数
│   │   └── useNewsData.js # 数据逻辑
│   └── App.vue            # 根组件
├── .claude/skills/         # Claude Skills
│   ├── fetch-ai-news/     # 数据获取技能
│   │   ├── sources/       # 数据源
│   │   ├── processors/    # 数据处理
│   │   └── utils/         # 工具函数
│   └── publish-to-github/ # 发布技能
└── public/                # 静态资源
    └── data/              # 资讯数据
```

## 数据源

### 第一优先级
- **Serper.dev**: Google新闻搜索（2500次免费查询）
- **HackerNews Algolia API**: 技术讨论与趋势
- **Reddit r/MachineLearning**: AI社区讨论

### 第二优先级
- **ArXiv API**: 学术论文
- **GitHub Trending**: 开源项目动态
- **Product Hunt**: 新产品发布

## API说明

### SERPER_API_KEY
获取方式：
1. 访问 [https://serper.dev](https://serper.dev)
2. 注册账号并创建API Key
3. 复制到 `.env` 文件

### GITHUB_TOKEN
获取方式：
1. GitHub Settings → Developer settings → Personal access tokens
2. 选择 "Generate new token"
3. 勾选 `repo` 权限
4. 复制 token

## 部署说明

项目会自动创建 GitHub 仓库并配置 Pages：

1. **自动创建仓库**：如果不存在则创建新仓库
2. **自动提交**：提交所有项目文件
3. **自动配置**：启用 GitHub Pages
4. **域名设置**：支持自定义域名（可选）

## 数据结构

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

## 许可证

[MIT](LICENSE)