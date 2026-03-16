---
name: fetch-ai-news
description: 每日拉取全球AI资讯数据，多源聚合，AI处理生成静态JSON文件
---

# fetch-ai-news 技能

## 功能描述
每日自动拉取全球AI前沿资讯，支持多源数据聚合、AI去重摘要、静态JSON生成。

## 使用方法
```bash
# 在项目根目录执行
/fetch-ai-news

# 带参数执行（指定日期）
/fetch-ai-news 2026-03-16

# 强制刷新缓存
/fetch-ai-news --force
```

## 参数说明
- `date` (可选)：指定拉取日期，格式 YYYY-MM-DD，默认当天
- `--force` (可选)：强制刷新，忽略缓存
- `--verbose` (可选)：详细日志输出

## 数据源配置
1. **Serper.dev**：Google新闻搜索（需配置 SERPER_API_KEY）
2. **HackerNews Algolia**：技术讨论（无需API）
3. **Reddit ML**：社区热点（无需API）
4. **ArXiv**：学术论文（无需API）

## 输出结果
- 生成 `public/data/news-YYYY-MM-DD.json` 文件
- 更新 `public/data/latest.json` 指针
- 控制台输出处理统计信息

## 错误处理
- 单个源失败不影响整体流程
- 部分成功即继续执行
- 详细错误日志记录

## 配额管理
- Serper.dev 2500次免费查询额度监控
- 智能缓存机制（24小时更新周期）
- 失败降级策略

## 示例输出
```json
{
  "date": "2026-03-16",
  "total": 45,
  "sources": {
    "serper": 20,
    "hackernews": 15,
    "reddit": 8,
    "arxiv": 2
  },
  "processing": {
    "duplicates_removed": 5,
    "summaries_generated": 40,
    "categories_assigned": 45
  }
}
```