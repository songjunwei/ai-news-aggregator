<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div id="app">
    <header>
      <div class="header-content">
        <h1 class="site-title">
          <RouterLink to="/">AI资讯聚合站</RouterLink>
        </h1>
        <p class="site-subtitle">每日获取全球AI前沿资讯</p>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>

    <footer class="site-footer">
      <p>&copy; 2026 AI资讯聚合站 | 每日更新全球AI前沿资讯</p>
    </footer>
  </div>
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

.site-footer {
  background: var(--dark-bg);
  color: white;
  text-align: center;
  padding: 1.5rem 0;
  margin-top: auto;
}
</style>