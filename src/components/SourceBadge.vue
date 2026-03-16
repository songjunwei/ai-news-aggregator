<template>
  <span :class="['source-badge', sourceClass]">
    {{ sourceLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  source: {
    type: String,
    required: true
  }
})

const sourceClass = computed(() => {
  const sourceMap = {
    'Serper': 'serper',
    'HackerNews': 'hackernews',
    'Reddit': 'reddit',
    'ArXiv': 'arxiv',
    'Unknown': 'unknown'
  }

  return sourceMap[props.source] || 'unknown'
})

const sourceLabel = computed(() => {
  const labelMap = {
    'Serper': '🔍 Google新闻',
    'HackerNews': '📰 Hacker News',
    'Reddit': '💬 Reddit',
    'ArXiv': '📚 学术论文',
    'Unknown': '📡 其他'
  }

  return labelMap[props.source] || props.source
})
</script>

<style scoped>
.source-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.serper {
  background: #e3f2fd;
  color: #1976d2;
}

.hackernews {
  background: #fff3e0;
  color: #f57c00;
}

.reddit {
  background: #ffebee;
  color: #c62828;
}

.arxiv {
  background: #e8f5e9;
  color: #2e7d32;
}

.unknown {
  background: #f5f5f5;
  color: #616161;
}
</style>