<template>
  <div class="search">
    <div class="search-container">
      <!-- 検索ヘッダー -->
      <div class="search-header">
        <h1>🔍 検索</h1>
        <p>YouTubeチャンネルを検索してTikTok風で楽しもう</p>
      </div>

      <!-- 検索フォーム -->
      <div class="search-form">
        <div class="search-input-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="チャンネル名を入力してください（例：ジャルジャル）"
            class="search-input"
            @keyup.enter="performSearch"
          />
          <button @click="performSearch" class="search-button" :disabled="!searchQuery.trim()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 検索結果 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>検索中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>検索エラー</h3>
        <p>{{ error }}</p>
        <button @click="performSearch" class="retry-button">再試行</button>
      </div>

      <div v-else-if="searchResults.length > 0" class="search-results">
        <h2>検索結果 ({{ searchResults.length }}件)</h2>
        <div class="channel-grid">
          <div
            v-for="channel in searchResults"
            :key="channel.id"
            class="channel-card"
            @click="selectChannel(channel)"
          >
            <div class="channel-thumbnail">
              <img :src="channel.thumbnail" :alt="channel.title" />
            </div>
            <div class="channel-info">
              <h3 class="channel-title">{{ channel.title }}</h3>
              <p class="channel-description">{{ channel.description }}</p>
              <div class="channel-stats">
                <span class="subscriber-count">{{ formatSubscriberCount(channel.subscriberCount) }} 登録者</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="hasSearched" class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>検索結果がありません</h3>
        <p>別のキーワードで検索してみてください</p>
      </div>

      <!-- 人気チャンネル -->
      <div v-if="!hasSearched" class="popular-channels">
        <h2>🌟 人気チャンネル</h2>
        <div class="channel-grid">
          <div
            v-for="channel in popularChannels"
            :key="channel.id"
            class="channel-card"
            @click="selectChannel(channel)"
          >
            <div class="channel-thumbnail">
              <img :src="channel.thumbnail" :alt="channel.title" />
            </div>
            <div class="channel-info">
              <h3 class="channel-title">{{ channel.title }}</h3>
              <p class="channel-description">{{ channel.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import YouTubeApiService from '../services/youtubeApi.js'

export default {
  name: 'Search',
  setup() {
    const router = useRouter()
    const youtubeApi = new YouTubeApiService()
    
    // リアクティブデータ
    const searchQuery = ref('')
    const searchResults = ref([])
    const loading = ref(false)
    const error = ref('')
    const hasSearched = ref(false)
    
    // 人気チャンネルのサンプルデータ
    const popularChannels = ref([
      {
        id: 'UChwgNUWPM-ksOP3BbfQHS5Q',
        title: 'ジャルジャル',
        description: 'お笑いコンビ「ジャルジャル」の公式チャンネル',
        thumbnail: 'https://yt3.ggpht.com/ytc/AIf8zZQs8vE5OZZmJmqBVyRgJEI_tZgYJT7qQ_7yJQUh=s176-c-k-c0x00ffffff-no-rj'
      },
      {
        id: 'UCZf__ehlCEBPop-_sldpBUQ',
        title: 'HikakinTV',
        description: 'YouTuberヒカキンのメインチャンネル',
        thumbnail: 'https://yt3.ggpht.com/ytc/AIf8zZRtbTWk8TfjmQoPnhL2nP9qHPL8bQ7xGqVhDw=s176-c-k-c0x00ffffff-no-rj'
      },
      {
        id: 'UCbkejNKk6iS-tqEu_nI0C4Q',
        title: 'コムドット',
        description: '青春を切り取るYouTuberグループ',
        thumbnail: 'https://yt3.ggpht.com/ytc/AIf8zZSTQcPsIbhSHQZ2K9dV2YqfXQQoW6L9vJu6bA=s176-c-k-c0x00ffffff-no-rj'
      }
    ])

    // 検索実行
    const performSearch = async () => {
      if (!searchQuery.value.trim()) return
      
      loading.value = true
      error.value = ''
      hasSearched.value = true
      
      try {
        // YouTube API での検索（実装は簡略化）
        console.log('検索クエリ:', searchQuery.value)
        
        // デモ用の検索結果
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (searchQuery.value.toLowerCase().includes('ジャルジャル')) {
          searchResults.value = [popularChannels.value[0]]
        } else if (searchQuery.value.toLowerCase().includes('ヒカキン')) {
          searchResults.value = [popularChannels.value[1]]
        } else {
          searchResults.value = []
        }
        
      } catch (err) {
        error.value = '検索中にエラーが発生しました'
        console.error('Search error:', err)
      } finally {
        loading.value = false
      }
    }

    // チャンネル選択
    const selectChannel = (channel) => {
      console.log('選択されたチャンネル:', channel.title)
      // 実際の実装では、選択されたチャンネルの動画をホームで表示
      router.push({
        name: 'Home',
        query: { channelId: channel.id, channelName: channel.title }
      })
    }

    // 登録者数フォーマット
    const formatSubscriberCount = (count) => {
      if (!count) return '非公開'
      const num = parseInt(count)
      if (num >= 1000000) {
        return Math.floor(num / 100000) / 10 + 'M'
      } else if (num >= 1000) {
        return Math.floor(num / 100) / 10 + 'K'
      }
      return num.toLocaleString()
    }

    return {
      searchQuery,
      searchResults,
      loading,
      error,
      hasSearched,
      popularChannels,
      performSearch,
      selectChannel,
      formatSubscriberCount
    }
  }
}
</script>

<style scoped>
.search {
  width: 100%;
  height: 100vh;
  height: 100svh;
  background: #000;
  color: #fff;
  overflow-y: auto;
  padding-bottom: max(80px, env(safe-area-inset-bottom));
}

.search-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

/* 検索ヘッダー */
.search-header {
  text-align: center;
  margin-bottom: 30px;
}

.search-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.search-header p {
  color: #ccc;
  font-size: 14px;
}

/* 検索フォーム */
.search-form {
  margin-bottom: 30px;
}

.search-input-container {
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  padding: 8px;
  backdrop-filter: blur(10px);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  padding: 12px 16px;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ff4444;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.search-button:hover:not(:disabled) {
  background: #cc3333;
  transform: scale(1.05);
}

.search-button:disabled {
  background: rgba(255, 68, 68, 0.5);
  cursor: not-allowed;
}

.search-button svg {
  width: 24px;
  height: 24px;
}

/* ローディング・エラー状態 */
.loading-state, .error-state, .no-results {
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .no-results-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.retry-button {
  background: #ff4444;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 20px;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #cc3333;
}

/* 検索結果・人気チャンネル */
.search-results, .popular-channels {
  margin-bottom: 30px;
}

.search-results h2, .popular-channels h2 {
  margin-bottom: 20px;
  font-size: 20px;
}

.channel-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

.channel-card {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.channel-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.channel-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.channel-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.channel-info {
  flex: 1;
  min-width: 0;
}

.channel-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-description {
  color: #ccc;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.channel-stats {
  font-size: 12px;
  color: #999;
}

/* レスポンシブ */
@media (min-width: 480px) {
  .channel-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .search-container {
    max-width: 800px;
  }
  
  .channel-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
</style>