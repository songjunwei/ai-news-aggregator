<template>
  <div class="filter-panel">
    <h3 class="filter-title">筛选选项</h3>

    <div class="filter-section">
      <h4>分类</h4>
      <div class="filter-options">
        <label class="filter-option">
          <input
            type="radio"
            value="all"
            v-model="categoryModel"
          />
          <span>全部</span>
        </label>

        <label
          v-for="category in categories"
          :key="category.value"
          class="filter-option"
        >
          <input
            type="radio"
            :value="category.value"
            v-model="categoryModel"
          />
          <span>{{ category.label }}</span>
        </label>
      </div>
    </div>

    <div class="filter-section">
      <h4>来源</h4>
      <div class="filter-options">
        <label class="filter-option">
          <input
            type="radio"
            value="all"
            v-model="sourceModel"
          />
          <span>全部</span>
        </label>

        <label
          v-for="source in sources"
          :key="source"
          class="filter-option"
        >
          <input
            type="radio"
            :value="source"
            v-model="sourceModel"
          />
          <span>{{ formatSourceName(source) }}</span>
        </label>
      </div>
    </div>

    <div class="filter-actions">
      <button class="reset-button" @click="resetFilters">
        重置筛选
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: String,
    default: 'all'
  },
  source: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['update:category', 'update:source'])

const categoryModel = computed({
  get: () => props.category,
  set: (value) => emit('update:category', value)
})

const sourceModel = computed({
  get: () => props.source,
  set: (value) => emit('update:source', value)
})

// 分类选项
const categories = [
  { value: 'llm', label: '大语言模型' },
  { value: 'ml_research', label: '机器学习研究' },
  { value: 'nlp', label: '自然语言处理' },
  { value: 'computer_vision', label: '计算机视觉' },
  { value: 'robotics', label: '机器人' },
  { value: 'ai_ethics', label: 'AI伦理' },
  { value: 'ai_tools', label: 'AI工具' },
  { value: 'startup', label: '创业公司' },
  { value: 'funding', label: '融资' },
  { value: 'product', label: '产品发布' },
  { value: 'trends', label: '趋势' }
]

// 来源列表（实际应该从数据中动态生成）
const sources = [
  'Serper',
  'HackerNews',
  'Reddit',
  'ArXiv',
  'Unknown'
]

function formatSourceName(source) {
  const sourceMap = {
    'Serper': 'Google新闻',
    'HackerNews': 'Hacker News',
    'Reddit': 'Reddit社区',
    'ArXiv': '学术论文',
    'Unknown': '其他来源'
  }

  return sourceMap[source] || source
}

function resetFilters() {
  categoryModel.value = 'all'
  sourceModel.value = 'all'
}
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-section h4 {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.filter-option:hover {
  background: var(--light-bg);
}

.filter-option input[type="radio"] {
  margin: 0;
}

.filter-option span {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.filter-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.reset-button {
  width: 100%;
  padding: 0.6rem;
  background: var(--warning-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.reset-button:hover {
  background: #e67e22;
}
</style>