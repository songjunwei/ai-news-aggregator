---
name: publish-to-github
description: 自动发布项目到GitHub并部署GitHub Pages
---

# publish-to-github 技能

## 功能描述
自动将当前项目发布到GitHub仓库，并配置GitHub Pages进行静态网站托管。

## 使用方法
```bash
# 在项目根目录执行
/publish-to-github

# 带参数执行
/publish-to-github --repo="username/repo-name"
/publish-to-github --public  # 发布为公共仓库
/publish-to-github --private # 发布为私有仓库
```

## 参数说明
- `--repo` (可选)：指定仓库名称，格式 username/repo-name
- `--public` (可选)：创建公共仓库（默认）
- `--private` (可选)：创建私有仓库
- `--domain` (可选)：自定义域名
- `--skip-build` (可选)：跳过构建步骤

## 执行流程
1. **Git初始化**：检查并初始化Git仓库
2. **仓库创建**：在GitHub上创建新仓库
3. **文件提交**：提交所有项目文件
4. **推送代码**：推送到GitHub
5. **Pages配置**：启用GitHub Pages
6. **域名设置**：配置自定义域名（如果提供）

## 前置条件
- 已配置GitHub Token环境变量
- 项目已完成构建
- 本地Git已安装

## 输出结果
- 创建GitHub仓库
- 启用GitHub Pages
- 输出仓库URL和Pages URL
- 配置自定义域名（如果提供）

## 错误处理
- GitHub Token权限验证
- 仓库名称冲突处理
- 网络连接问题重试
- 构建失败中断流程