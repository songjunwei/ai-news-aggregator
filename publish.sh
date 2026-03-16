#!/bin/bash

# AI资讯聚合站发布脚本

set -e

echo "🚀 开始发布到 GitHub..."

# 1. 配置 Git 用户
git config user.name "song_jw"
git config user.email "noreply@github.com"

# 2. 添加文件
git add .

# 3. 创建提交
git commit -m "Initial commit - AI资讯聚合站

- 实现多源AI资讯聚合
- Vue3前端展示
- Claude Code Skills集成
- 自动化发布流程

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# 4. 创建 GitHub 仓库（使用 API）
echo "🏗️  创建 GitHub 仓库..."

# 检查 GitHub Token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 错误：GITHUB_TOKEN 环境变量未设置"
    echo "请设置 GITHUB_TOKEN："
    echo "export GITHUB_TOKEN='your_token_here'"
    exit 1
fi

# 创建仓库
RESPONSE=$(curl -s -X POST https://api.github.com/user/repos \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ai-news-aggregator",
    "private": false,
    "description": "AI资讯聚合站 - 每日获取全球AI前沿资讯",
    "has_pages": true,
    "auto_init": false
  }')

# 检查是否创建成功
if echo "$RESPONSE" | grep -q '"name": "ai-news-aggregator"'; then
    echo "✅ 仓库创建成功"
    REPO_URL=$(echo "$RESPONSE" | grep '"clone_url"' | sed 's/.*"clone_url": "\([^"]*\)".*/\1/')
    echo "📦 仓库地址: $REPO_URL"
else
    # 检查是否已存在
    if echo "$RESPONSE" | grep -q '"message": "name already exists"'; then
        echo "⚠️  仓库已存在，使用现有仓库"
        REPO_URL="https://github.com/$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep '"login"' | sed 's/.*"login": "\([^"]*\)".*/\1/')/ai-news-aggregator.git"
    else
        echo "❌ 仓库创建失败: $RESPONSE"
        exit 1
    fi
fi

# 5. 添加远程仓库
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

# 6. 推送代码
echo "📤 推送代码到 GitHub..."
git push -u origin master

# 7. 启用 GitHub Pages
echo "🌐 配置 GitHub Pages..."
USERNAME=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep '"login"' | sed 's/.*"login": "\([^"]*\)".*/\1/')

curl -s -X POST "https://api.github.com/repos/$USERNAME/ai-news-aggregator/pages" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": {
      "branch": "master",
      "path": "/"
    }
  }'

# 8. 输出结果
echo "🎉 发布完成！"
echo "📦 仓库 URL: https://github.com/$USERNAME/ai-news-aggregator"
echo "🌐 Pages URL: https://$USERNAME.github.io/ai-news-aggregator"
echo ""
echo "💡 后续步骤："
echo "1. 等待几分钟让 GitHub Pages 生效"
echo "2. 访问 Pages URL 查看网站"
echo "3. 配置自定义域名（可选）"
echo ""
echo "🔧 日常使用："
echo "- 获取新数据: /fetch-ai-news"
echo "- 重新发布: ./publish.sh"