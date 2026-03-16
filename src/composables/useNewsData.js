import { ref, onMounted } from 'vue'

export function useNewsData() {
  const news = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastUpdate = ref(null)

  // 加载新闻数据
  async function loadNews() {
    loading.value = true
    error.value = null

    try {
      // 尝试从latest.json加载
      const response = await fetch('/data/latest.json')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // 验证数据格式
      if (Array.isArray(data)) {
        news.value = data
        lastUpdate.value = new Date().toISOString()
      } else {
        throw new Error('Invalid data format: expected array')
      }
    } catch (err) {
      console.error('❌ 加载新闻数据失败:', err)
      error.value = err.message

      // 尝试加载空数据
      news.value = []
    } finally {
      loading.value = false
    }
  }

  // 刷新新闻数据
  async function refreshNews() {
    await loadNews()
  }

  // 获取单条新闻
  function getNewsById(id) {
    return news.value.find(item => item.id === id)
  }

  // 获取相关建议
  function getRelatedNews(currentItem, limit = 3) {
    if (!currentItem || !currentItem.tags || currentItem.tags.length === 0) {
      return []
    }

    return news.value
      .filter(item => item.id !== currentItem.id)
      .filter(item => {
        if (!item.tags || item.tags.length === 0) return false

        // 检查是否有共同标签
        const commonTags = item.tags.filter(tag => currentItem.tags.includes(tag))
        return commonTags.length > 0
      })
      .sort((a, b) => {
        // 按共同标签数量排序
        const aCommon = a.tags.filter(tag => currentItem.tags.includes(tag)).length
        const bCommon = b.tags.filter(tag => currentItem.tags.includes(tag)).length
        return bCommon - aCommon
      })
      .slice(0, limit)
  }

  // 获取统计数据
  function getStats() {
    const sourceCount = new Set(news.value.map(item => item.source)).size
    const categoryCount = new Set(news.value.map(item => item.category)).size
    const tagCount = new Set(news.value.flatMap(item => item.tags)).size

    return {
      totalNews: news.value.length,
      uniqueSources: sourceCount,
      uniqueCategories: categoryCount,
      uniqueTags: tagCount,
      lastUpdate: lastUpdate.value
    }
  }

  // 初始化加载
  onMounted(() => {
    loadNews()
  })

  return {
    news,
    loading,
    error,
    lastUpdate,
    loadNews,
    refreshNews,
    getNewsById,
    getRelatedNews,
    getStats
  }
}