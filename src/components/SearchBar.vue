<template>
  <div class="search-bar-container">
    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索AI资讯..."
        @keyup.enter="handleSearch"
      />
      <button class="search-button" @click="handleSearch">
        🔍
      </button>
    </div>

    <div v-if="searchQuery" class="search-actions">
      <button class="clear-button" @click="clearSearch">
        ✕ 清除
      </button>
      <span class="search-info">
        找到 {{ filteredCount }} 条结果
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  filteredCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

const searchQuery = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function handleSearch() {
  emit('search', searchQuery.value)
}

function clearSearch() {
  searchQuery.value = ''
  emit('clear')
}
</script>

<style scoped>
.search-bar-container {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-button {
  position: absolute;
  right: 0.5rem;
  background: var(--primary-color);
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.search-button:hover {
  background: #2980b9;
  transform: scale(1.05);
}

.search-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.clear-button {
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: #c0392b;
}

.search-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .search-input {
    padding: 0.6rem 2.5rem 0.6rem 0.8rem;
  }

  .search-button {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }

  .search-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>