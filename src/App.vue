<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import NewsList from './components/NewsList.vue'
import SearchBar from './components/SearchBar.vue'
import FilterPanel from './components/FilterPanel.vue'
import { useNewsData } from './composables/useNewsData'

const { news, loading, error, loadNews } = useNewsData()
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedSource = ref('all')

onMounted(() => {
  loadNews()
})
</script>

<template>
  <header>
    <div class="header-content">
      <h1 class="site-title">
        <RouterLink to="/">AI资讯聚合站</RouterLink>
      </h1>
      <p class="site-subtitle">每日获取全球AI前沿资讯</p>
    </div>
  </header>

  <main class="main-content">
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
  </main>

  <footer class="site-footer">
    <p>&copy; 2026 AI资讯聚合站 | 每日更新全球AI前沿资讯</p>
  </footer>
</template>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --danger-color: #e74c3c;
  --warning-color: #f39c12;
  --dark-bg: #1a1a1a;
  --light-bg: #f5f5f5;
  --text-primary: #333;
  --text-secondary: #666;
  --border-color: #ddd;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  background-color: var(--light-bg);
  color: var(--text-primary);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, var(--primary-color), #2980b9);
  color: white;
  padding: 2rem 0;
  box-shadow: var(--shadow);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
}

.site-title a {
  color: white;
  text-decoration: none;
  font-size: 2rem;
  font-weight: bold;
}

.site-subtitle {
  opacity: 0.9;
  margin-top: 0.5rem;
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}

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

.site-footer {
  background: var(--dark-bg);
  color: white;
  text-align: center;
  padding: 1.5rem 0;
  margin-top: auto;
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
