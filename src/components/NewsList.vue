<script setup>
import { computed } from 'vue'
import SourceBadge from './SourceBadge.vue'

const props = defineProps({
  news: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  },
  selectedCategory: {
    type: String,
    default: 'all'
  },
  selectedSource: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['item-click'])

// 过滤逻辑
const filteredNews = computed(() => {
  let filtered = [...props.news]

  // 搜索过滤
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 分类过滤
  if (props.selectedCategory !== 'all') {
    filtered = filtered.filter(item => item.category === props.selectedCategory)
  }

  // 来源过滤
  if (props.selectedSource !== 'all') {
    filtered = filtered.filter(item =>
      item.source.toLowerCase().includes(props.selectedSource.toLowerCase())
    )
  }

  return filtered
})

// 排序（按发布时间倒序）
const sortedNews = computed(() => {
  return [...filteredNews.value].sort((a, b) =>
    new Date(b.publishedAt) - new Date(a.publishedAt)
  )
})

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return '刚刚'
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffHours < 48) return '昨天'

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 处理点击
function handleItemClick(item) {
  emit('item-click', item)
  // 增加浏览计数
  item.views = (item.views || 0) + 1
}

// 获取高亮文本
function getHighlightedText(text, query) {
  if (!query) return text

  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
</script>

<template>
  <div class="news-list-container">
    <div class="news-header">
      <h2>AI资讯列表</h2>
      <div class="news-stats">
        共 {{ sortedNews.length }} 条资讯
        <span v-if="searchQuery || selectedCategory !== 'all' || selectedSource !== 'all'">
          (已过滤)
        </span>
      </div>
    </div>

    <div v-if="sortedNews.length === 0" class="empty-state">
      <p>暂无资讯数据</p>
      <p v-if="searchQuery">请尝试其他搜索关键词</p>
    </div>

    <div v-else class="news-grid">
      <article
        v-for="item in sortedNews"
        :key="item.id"
        class="news-card"
        @click="handleItemClick(item)"
      >
        <div class="card-header">
          <SourceBadge :source="item.source" />
          <span class="news-date">{{ formatDate(item.publishedAt) }}</span>
        </div>

        <h3 class="news-title" v-html="getHighlightedText(item.title, searchQuery)"></h3>

        <p class="news-summary" v-html="getHighlightedText(item.summary, searchQuery)"></p>

        <div class="card-footer">
          <div class="news-tags">
            <span
              v-for="tag in item.tags.slice(0, 3)"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>

          <div class="news-stats">
            <span v-if="item.views" class="stat views">
              👁️ {{ item.views }}
            </span>
            <span v-if="item.score" class="stat score">
              ⭐ {{ item.score }}
            </span>
            <span v-if="item.commentCount" class="stat comments">
              💬 {{ item.commentCount }}
            </span>
          </div>
        </div>

        <div class="card-actions">
          <a :href="item.sourceUrl" target="_blank" rel="noopener" class="read-more">
            阅读原文 →
          </a>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.news-list-container {
  padding: 1.5rem;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.news-header h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
}

.news-stats {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.news-grid {
  display: grid;
  gap: 1.5rem;
}

.news-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.news-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
  border-color: var(--primary-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.news-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.news-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.news-title mark {
  background-color: #ffeb3b;
  padding: 0 2px;
  border-radius: 2px;
}

.news-summary {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-summary mark {
  background-color: #ffeb3b;
  padding: 0 2px;
  border-radius: 2px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.news-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.news-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.card-actions {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.read-more {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.read-more:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .news-list-container {
    padding: 1rem;
  }

  .news-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .news-card {
    padding: 1rem;
  }

  .card-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>