<script setup>
import { ref, onMounted } from 'vue'
import NewsList from '../components/NewsList.vue'
import SearchBar from '../components/SearchBar.vue'
import FilterPanel from '../components/FilterPanel.vue'
import { useNewsData } from '../composables/useNewsData'

const { news, loading, error, loadNews } = useNewsData()
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedSource = ref('all')

onMounted(() => {
  loadNews()
})
</script>

<template>
  <div class="main-content">
    <div class="container">
      <div class="sidebar">
        <FilterPanel
          v-model:category="selectedCategory"
          v-model:source="selectedSource"
        />
      </div>

      <div class="content-area">
        <div class="search-section">
          <SearchBar v-model="searchQuery" />
        </div>

        <div class="news-section">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>正在加载资讯...</p>
          </div>

          <div v-else-if="error" class="error-state">
            <p>❌ 加载失败: {{ error }}</p>
            <button @click="loadNews">重试</button>
          </div>

          <div v-else class="news-content">
            <NewsList
              :news="news"
              :search-query="searchQuery"
              :selected-category="selectedCategory"
              :selected-source="selectedSource"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.sidebar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  height: fit-content;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-section {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: var(--shadow);
}

.news-section {
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-height: 400px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .sidebar {
    order: 2;
  }

  .content-area {
    order: 1;
  }
}
</style>