#!/usr/bin/env node

/**
 * publisher.js - GitHub发布自动化
 */

const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');
const { log, error: logError } = require('../fetch-ai-news/utils/logger');

// 配置
const CONFIG = {
  DEFAULT_REPO_NAME: 'ai-news-aggregator',
  DEFAULT_BRANCH: 'main',
  PAGES_BRANCH: 'gh-pages',
  BUILD_DIR: 'dist'
};

/**
 * 主发布函数
 */
async function publishToGitHub(options = {}) {
  const {
    repo: repoName,
    isPrivate = false,
    customDomain,
    skipBuild = false
  } = options;

  try {
    log('🚀 开始发布到 GitHub...');

    // 步骤1: 验证环境
    await validateEnvironment();

    // 步骤2: 构建项目
    if (!skipBuild) {
      await buildProject();
    }

    // 步骤3: 初始化Git
    await initGit();

    // 步骤4: 创建GitHub仓库
    const repo = await createGitHubRepository(repoName, isPrivate);

    // 步骤5: 提交代码
    await commitAndPush(repo);

    // 步骤6: 配置GitHub Pages
    const pagesUrl = await configureGitHubPages(repo, customDomain);

    // 步骤7: 输出结果
    await outputResults(repo, pagesUrl, customDomain);

    log('✅ 发布完成！');
    return { success: true, repo, pagesUrl };

  } catch (err) {
    logError('❌ 发布失败:', err.message);
    throw err;
  }
}

/**
 * 验证环境
 */
async function validateEnvironment() {
  log('🔍 验证环境...');

  // 检查Git
  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch (err) {
    throw new Error('Git 未安装或不可用');
  }

  // 检查GitHub CLI
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (err) {
    logError('⚠️  GitHub CLI 未安装，将使用API方式');
  }

  // 检查GitHub Token
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN 环境变量未配置');
  }

  // 验证Token权限
  const octokit = new Octokit({ auth: token });
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    log(`✅ GitHub Token 验证成功 - 用户: ${user.login}`);
  } catch (err) {
    throw new Error('GitHub Token 验证失败，请检查权限');
  }
}

/**
 * 构建项目
 */
async function buildProject() {
  log('🔨 构建项目...');

  try {
    // 安装依赖（如果尚未安装）
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    if (!packageJson.dependencies && !packageJson.devDependencies) {
      log('⚠️  无依赖需要安装');
    } else {
      try {
        execSync('npm install', { stdio: 'inherit' });
      } catch (err) {
        logError('⚠️  npm install 失败，继续执行...');
      }
    }

    // 构建项目
    execSync('npm run build', { stdio: 'inherit' });

    log('✅ 构建完成');

    // 验证构建输出
    const buildDir = path.join(process.cwd(), CONFIG.BUILD_DIR);
    try {
      await fs.access(buildDir);
    } catch (err) {
      throw new Error(`构建目录 ${CONFIG.BUILD_DIR} 不存在，构建可能失败`);
    }
  } catch (err) {
    logError('❌ 构建失败:', err.message);
    throw err;
  }
}

/**
 * 初始化Git
 */
async function initGit() {
  log('📁 初始化 Git...');

  try {
    // 检查是否已初始化
    try {
      await fs.access('.git');
      log('✅ Git 已初始化');
      return;
    } catch (err) {
      // 未初始化，执行初始化
    }

    execSync('git init', { stdio: 'inherit' });
    execSync('git branch -M main', { stdio: 'inherit' });

    // 创建 .gitignore
    const gitignore = `node_modules/
dist/
.env
logs/
quota-tracker.json
*.log`;

    await fs.writeFile('.gitignore', gitignore);

    log('✅ Git 初始化完成');
  } catch (err) {
    logError('❌ Git 初始化失败:', err.message);
    throw err;
  }
}

/**
 * 创建GitHub仓库
 */
async function createGitHubRepository(repoName, isPrivate) {
  log('🏗️  创建 GitHub 仓库...');

  const token = process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  const name = repoName || CONFIG.DEFAULT_REPO_NAME;
  const owner = (await octokit.users.getAuthenticated()).data.login;

  try {
    // 检查仓库是否已存在
    try {
      const { data: existingRepo } = await octokit.repos.get({ owner, repo: name });
      log(`✅ 仓库已存在: ${existingRepo.html_url}`);
      return existingRepo;
    } catch (err) {
      // 仓库不存在，继续创建
    }

    // 创建新仓库
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name,
      private: isPrivate,
      description: 'AI资讯聚合站 - 每日获取全球AI前沿资讯',
      homepage: 'https://' + (isPrivate ? 'private' : owner + '.github.io/' + name),
      has_pages: true,
      auto_init: false
    });

    log(`✅ 仓库创建成功: ${repo.html_url}`);
    return repo;

  } catch (err) {
    logError('❌ 仓库创建失败:', err.message);
    throw err;
  }
}

/**
 * 提交并推送代码
 */
async function commitAndPush(repo) {
  log('📤 提交并推送代码...');

  try {
    // 配置Git用户
    const { data: user } = await new Octokit({ auth: process.env.GITHUB_TOKEN }).users.getAuthenticated();
    execSync(`git config user.name "${user.name || user.login}"`, { stdio: 'ignore' });
    execSync('git config user.email "noreply@github.com"', { stdio: 'ignore' });

    // 添加文件
    execSync('git add .', { stdio: 'inherit' });

    // 提交
    const commitMessage = `Initial commit\n\nCo-Authored-By: ${user.login} <${user.id}+${user.login}@users.noreply.github.com>`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

    // 添加远程仓库
    execSync(`git remote add origin ${repo.clone_url}`, { stdio: 'ignore' });

    // 推送
    execSync('git push -u origin main', { stdio: 'inherit' });

    log('✅ 代码推送成功');
  } catch (err) {
    logError('❌ 提交推送失败:', err.message);
    throw err;
  }
}

/**
 * 配置GitHub Pages
 */
async function configureGitHubPages(repo, customDomain) {
  log('🌐 配置 GitHub Pages...');

  const token = process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  try {
    // 启用GitHub Pages
    await octokit.repos.createPagesSite({
      owner: repo.owner.login,
      repo: repo.name,
      source: {
        branch: CONFIG.DEFAULT_BRANCH,
        path: '/' // 使用根目录
      }
    });

    log('✅ GitHub Pages 已启用');

    // 配置自定义域名（如果提供）
    if (customDomain) {
      try {
        await octokit.repos.update({
          owner: repo.owner.login,
          repo: repo.name,
          homepage: 'https://' + customDomain
        });

        // 创建CNAME文件
        const cnamePath = path.join(CONFIG.BUILD_DIR, 'CNAME');
        await fs.writeFile(cnamePath, customDomain + '\n');

        // 提交CNAME
        execSync('git add dist/CNAME', { stdio: 'ignore' });
        execSync('git commit -m "Add custom domain"', { stdio: 'ignore' });
        execSync('git push', { stdio: 'ignore' });

        log(`✅ 自定义域名配置完成: ${customDomain}`);
      } catch (err) {
        logError('⚠️  自定义域名配置失败:', err.message);
      }
    }

    // 获取Pages URL
    const { data: pages } = await octokit.repos.getPages({
      owner: repo.owner.login,
      repo: repo.name
    });

    return pages.html_url;

  } catch (err) {
    logError('❌ GitHub Pages 配置失败:', err.message);
    throw err;
  }
}

/**
 * 输出结果
 */
async function outputResults(repo, pagesUrl, customDomain) {
  log('📋 发布结果汇总:');
  log(`🔗 仓库 URL: ${repo.html_url}`);
  log(`🌐 Pages URL: ${pagesUrl}`);
  if (customDomain) {
    log(`🎯 自定义域名: ${customDomain}`);
  }

  // 创建README
  const readme = `# AI资讯聚合站

🚀 每日自动获取全球AI前沿资讯

## 项目地址
- **GitHub**: ${repo.html_url}
- **网站**: ${pagesUrl}

## 功能特点
- 📡 多源数据聚合（Serper、HackerNews、Reddit、ArXiv）
- 🤖 AI智能摘要与分类
- 🌍 每日自动更新
- 📱 响应式设计

## 技术栈
- Vue 3 + Vite
- Claude Code Skills
- GitHub Pages
`;

  await fs.writeFile('README.md', readme);

  // 更新README
  try {
    execSync('git add README.md', { stdio: 'ignore' });
    execSync('git commit -m "Update README"', { stdio: 'ignore' });
    execSync('git push', { stdio: 'ignore' });
  } catch (err) {
    logError('⚠️  README更新失败:', err.message);
  }
}

module.exports = { publishToGitHub };

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    repo: args.find(arg => arg.startsWith('--repo='))?.replace('--repo=', ''),
    isPrivate: args.includes('--private'),
    customDomain: args.find(arg => arg.startsWith('--domain='))?.replace('--domain=', ''),
    skipBuild: args.includes('--skip-build')
  };

  publishToGitHub(options).catch(err => {
    logError('❌ 发布流程失败:', err);
    process.exit(1);
  });
}