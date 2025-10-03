<template>
  <div class="home">
    <!-- 現在のApp.vueの内容をそのまま移植 -->
    <!-- ローディング画面 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>動画を読み込み中...</p>
    </div>

    <!-- エラー画面 -->
    <div v-else-if="error" class="error-screen">
      <div class="error-content">
        <h2>エラーが発生しました</h2>
        <p>{{ error }}</p>
        <button @click="loadVideos" class="retry-button">
          再試行
        </button>
      </div>
    </div>

    <!-- メイン動画表示 -->
    <div v-else class="video-container">
      <!-- Swiperコンテナ -->
      <swiper
        ref="swiperRef"
        :modules="modules"
        direction="vertical"
        :slides-per-view="1"
        :space-between="0"
        :speed="300"
        :touch-angle="45"
        :threshold="10"
        :allow-touch-move="true"
        @slide-change="onSlideChange"
        @swiper="onSwiper"
        class="swiper-container"
      >
        <swiper-slide
          v-for="(video, index) in videos"
          :key="video.id"
          class="video-slide"
        >
          <!-- 動画プレイヤーコンポーネント -->
          <VideoPlayer
            :ref="el => videoPlayerRefs[index] = el"
            :video="video"
            :is-active="currentIndex === index"
            :is-loading="videoLoading[video.id]"
            @video-ready="onVideoReady"
            @video-error="onVideoError"
            @play-state-change="onPlayStateChange"
            @mute-state-change="onMuteStateChange"
          />
          
          <!-- 動画情報オーバーレイ -->
          <div class="video-info">
            <div class="video-meta">
              <h3 class="video-title">{{ video.title }}</h3>
              <p class="video-channel">{{ video.channelTitle }}</p>
              <div class="video-stats">
                <span class="view-count">{{ formatViewCount(video.viewCount) }} 回視聴</span>
                <span class="publish-date">{{ formatDate(video.publishedAt) }}</span>
              </div>
            </div>
            
            <!-- 動画制御ボタン -->
            <div class="video-controls">
              <button
                @click="togglePlayPause"
                class="control-button play-pause-btn"
                :class="{ playing: isPlaying }"
              >
                <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              </button>
              
              <button
                @click="toggleMute"
                class="control-button mute-btn"
                :class="{ muted: isMuted }"
              >
                <svg v-if="!isMuted" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 9v6h4l5 5V4l-5 5H7zm11.5 3c0 .94-.2 1.82-.54 2.64l1.51 1.51C19.81 15.35 20 14.19 20 13c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-2.5 0c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- ページインジケーター -->
          <div class="page-indicator">
            <div class="indicator-track">
              <div 
                class="indicator-progress"
                :style="{ height: ((index + 1) / videos.length) * 100 + '%' }"
              ></div>
            </div>
            <span class="page-info">{{ index + 1 }} / {{ videos.length }}</span>
          </div>
        </swiper-slide>
      </swiper>

      <!-- 次のページ読み込み時のローディング -->
      <div v-if="loadingMore" class="loading-more">
        <div class="loading-spinner small"></div>
        <p>さらに動画を読み込み中...</p>
      </div>
    </div>
  </div>
</template>

<script>
// App.vueからロジックをそのまま移植
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { EffectFade } from 'swiper/modules'
import VideoPlayer from '../components/VideoPlayer.vue'
import YouTubeApiService, { DEFAULT_CHANNEL_CONFIG } from '../services/youtubeApi.js'
import { 
  trackSessionStart, 
  trackVideoSwipe, 
  trackApiUsage, 
  trackError 
} from '../utils/analytics.js'

export default {
  name: 'Home',
  components: {
    Swiper,
    SwiperSlide,
    VideoPlayer
  },
  setup() {
    // Swiperモジュール
    const modules = [EffectFade]
    
    // リアクティブな状態管理
    const loading = ref(true)
    const error = ref('')
    const videos = ref([])
    const currentIndex = ref(0)
    const isPlaying = ref(false)
    const isMuted = ref(true)
    const loadingMore = ref(false)
    
    // 動画読み込み状態管理
    const videoLoading = reactive({})
    
    // API関連
    const youtubeApi = new YouTubeApiService()
    const nextPageToken = ref('')
    
    // Swiper参照
    const swiperRef = ref(null)
    let swiperInstance = null
    
    // VideoPlayer参照
    const videoPlayerRefs = ref({})

    // App.vueのメソッドをそのまま移植
    const loadVideos = async (append = false) => {
      try {
        console.log('動画読み込み開始:', append ? 'append' : 'initial')
        if (!append) {
          loading.value = true
          error.value = ''
        } else {
          loadingMore.value = true
        }

        const result = await youtubeApi.getChannelVideos(
          DEFAULT_CHANNEL_CONFIG.channelId,
          20,
          append ? nextPageToken.value : ''
        )

        console.log('動画データ取得完了:', result.videos.length, '件')

        if (append) {
          videos.value = [...videos.value, ...result.videos]
        } else {
          videos.value = result.videos
        }
        
        nextPageToken.value = result.nextPageToken
        
        // 各動画の読み込み状態を初期化（プレイヤー準備完了まではfalse）
        result.videos.forEach(video => {
          videoLoading[video.id] = false
        })
        
        console.log('動画リスト更新完了:', videos.value.length, '件')
        
        // アナリティクス: API使用状況追跡
        trackApiUsage(
          result.videos.length > 0 && result.videos[0].id === 'jNQXAC9IVRw' ? 'demo_data' : 'youtube_api',
          true,
          result.videos.length
        )
        
      } catch (err) {
        console.error('動画読み込みエラー:', err)
        error.value = err.message
        
        // アナリティクス: エラー追跡
        trackError('api_error', err.message)
        trackApiUsage('youtube_api', false, 0)
      } finally {
        loading.value = false
        loadingMore.value = false
      }
    }

    const onSlideChange = (swiper) => {
      const prevIndex = currentIndex.value
      currentIndex.value = swiper.activeIndex
      
      // アナリティクス: 動画スワイプ追跡
      if (videos.value[prevIndex] && videos.value[currentIndex.value]) {
        const direction = swiper.activeIndex > prevIndex ? 'down' : 'up'
        trackVideoSwipe(
          direction,
          videos.value[prevIndex].id,
          videos.value[currentIndex.value].id
        )
      }
      
      // 現在の動画のみ再生状態を管理
      isPlaying.value = false
      
      // 最後のスライドに近づいたら次のページを読み込み
      if (swiper.activeIndex >= videos.value.length - 3 && nextPageToken.value && !loadingMore.value) {
        loadVideos(true)
      }
    }

    const onSwiper = (swiper) => {
      swiperInstance = swiper
    }

    const togglePlayPause = () => {
      isPlaying.value = !isPlaying.value
    }

    const toggleMute = () => {
      const activePlayer = videoPlayerRefs.value[currentIndex.value]
      if (activePlayer && activePlayer.toggleMute) {
        console.log('App.vue: 音量ボタンクリック')
        activePlayer.toggleMute()
      } else {
        console.warn('アクティブなプレイヤーが見つかりません')
      }
    }

    const onVideoReady = (videoId) => {
      console.log('動画準備完了:', videoId)
      videoLoading[videoId] = false
    }

    const onVideoError = (videoId, error) => {
      videoLoading[videoId] = false
      console.error('Video loading error:', videoId, error)
    }

    const onPlayStateChange = (videoId, playing) => {
      isPlaying.value = playing
    }

    const onMuteStateChange = (videoId, muted) => {
      isMuted.value = muted
      console.log('App.vue: ミュート状態変更', muted)
    }

    const formatViewCount = (count) => {
      if (!count) return '0'
      const num = parseInt(count)
      if (num >= 1000000) {
        return Math.floor(num / 100000) / 10 + 'M'
      } else if (num >= 1000) {
        return Math.floor(num / 100) / 10 + 'K'
      }
      return num.toLocaleString()
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return '今日'
      if (diffDays === 1) return '昨日'
      if (diffDays < 7) return `${diffDays}日前`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
      return `${Math.floor(diffDays / 365)}年前`
    }

    // コンポーネントマウント時の処理
    onMounted(() => {
      // アナリティクス: セッション開始追跡
      trackSessionStart()
      loadVideos()
    })

    return {
      modules,
      loading,
      error,
      videos,
      currentIndex,
      isPlaying,
      isMuted,
      loadingMore,
      videoLoading,
      swiperRef,
      videoPlayerRefs,
      loadVideos,
      onSlideChange,
      onSwiper,
      togglePlayPause,
      toggleMute,
      onVideoReady,
      onVideoError,
      onPlayStateChange,
      onMuteStateChange,
      formatViewCount,
      formatDate
    }
  }
}
</script>

<style scoped>
/* App.vueのスタイルをそのまま移植 */
.home {
  width: 100%;
  height: 100%;
}

/* ローディング画面 */
.loading-screen, .error-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  height: 100svh;
  background: #000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* エラー画面 */
.error-content {
  text-align: center;
  max-width: 400px;
  padding: 20px;
}

.error-content h2 {
  margin-bottom: 10px;
  color: #ff4444;
}

.error-content p {
  margin-bottom: 20px;
  color: #ccc;
}

.retry-button {
  background: #ff4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #cc3333;
}

/* 動画コンテナ */
.video-container {
  width: 100%;
  height: 100vh;
  height: 100svh;
  position: relative;
}

.swiper-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  min-height: 100svh;
}

.video-slide {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 動画情報オーバーレイ */
.video-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 60px 20px 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  padding-left: max(20px, env(safe-area-inset-left));
  padding-right: max(20px, env(safe-area-inset-right));
  z-index: 10;
  pointer-events: none;
}

.video-meta {
  margin-bottom: 20px;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-channel {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 8px;
}

.video-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

/* 動画制御ボタン */
.video-controls {
  display: flex;
  gap: 15px;
  pointer-events: auto;
}

.control-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.control-button svg {
  width: 24px;
  height: 24px;
}

.control-button.playing {
  background: rgba(255, 255, 255, 0.9);
  color: #000;
}

.control-button.muted {
  background: rgba(255, 68, 68, 0.8);
}

/* ページインジケーター */
.page-indicator {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10;
}

.indicator-track {
  width: 3px;
  height: 100px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  position: relative;
}

.indicator-progress {
  width: 100%;
  background: #fff;
  border-radius: 2px;
  transition: height 0.3s ease;
}

.page-info {
  font-size: 12px;
  color: #ccc;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

/* さらに読み込み */
.loading-more {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 20px;
  border-radius: 20px;
  z-index: 20;
}

.loading-more p {
  font-size: 14px;
  color: #ccc;
  margin: 0;
}
</style>