<template>
  <div class="video-player" :class="{ active: isActive }">
    <!-- 動画読み込み中のプレースホルダー -->
    <div v-if="isLoading" class="video-placeholder">
      <img 
        :src="video.thumbnail" 
        :alt="video.title"
        class="thumbnail"
        @load="onThumbnailLoad"
      />
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>動画を準備中...</p>
      </div>
    </div>

    <!-- YouTube埋め込みプレイヤー -->
    <div 
      v-show="!isLoading"
      :id="`youtube-player-${video.id}`"
      class="youtube-player"
    ></div>

    <!-- エラー表示 -->
    <div v-if="hasError" class="error-overlay">
      <div class="error-content">
        <svg viewBox="0 0 24 24" class="error-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <p>動画の読み込みに失敗しました</p>
        <button @click="retryLoad" class="retry-button">
          再試行
        </button>
      </div>
    </div>

    <!-- タッチ操作用の透明なオーバーレイ -->
    <div 
      class="touch-overlay"
      @click="handlePlayerClick"
      @dblclick="handleDoubleClick"
    ></div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

export default {
  name: 'VideoPlayer',
  props: {
    video: {
      type: Object,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: true
    }
  },
  emits: ['video-ready', 'video-error', 'play-state-change', 'mute-state-change'],
  setup(props, { emit }) {
    // リアクティブな状態
    const hasError = ref(false)
    const thumbnailLoaded = ref(false)
    const playerReady = ref(false)
    const isPlaying = ref(false)
    const isMuted = ref(true)
    
    // YouTube Player インスタンス
    let player = null
    let playerStateChangeTimeout = null

    /**
     * YouTube IFrame API の読み込み
     */
    const loadYouTubeAPI = () => {
      return new Promise((resolve, reject) => {
        console.log('YouTube API読み込み開始')
        
        // すでに読み込まれている場合
        if (window.YT && window.YT.Player) {
          console.log('YouTube API既に読み込み済み')
          resolve()
          return
        }

        // タイムアウト設定（10秒）
        const timeout = setTimeout(() => {
          console.error('YouTube API読み込みタイムアウト')
          reject(new Error('YouTube API読み込みタイムアウト'))
        }, 10000)

        // グローバルコールバック関数を設定
        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube API読み込み完了')
          clearTimeout(timeout)
          resolve()
        }

        // スクリプトが既に存在しない場合のみ追加
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          console.log('YouTube APIスクリプトを追加')
          const script = document.createElement('script')
          script.src = 'https://www.youtube.com/iframe_api'
          script.onerror = () => {
            console.error('YouTube APIスクリプト読み込みエラー')
            clearTimeout(timeout)
            reject(new Error('YouTube APIスクリプト読み込みエラー'))
          }
          document.head.appendChild(script)
        } else {
          console.log('YouTube APIスクリプト既に存在')
          // スクリプトは存在するが、まだ読み込まれていない場合の処理
          const checkReady = setInterval(() => {
            if (window.YT && window.YT.Player) {
              clearInterval(checkReady)
              clearTimeout(timeout)
              console.log('YouTube API遅延読み込み完了')
              resolve()
            }
          }, 100)
        }
      })
    }

    /**
     * YouTube プレイヤーの初期化
     */
    const initializePlayer = async () => {
      try {
        console.log('プレイヤー初期化開始:', props.video.id)
        await loadYouTubeAPI()
        await nextTick()

        const playerId = `youtube-player-${props.video.id}`
        const playerElement = document.getElementById(playerId)
        
        if (!playerElement) {
          console.warn('Player element not found:', playerId)
          hasError.value = true
          emit('video-error', props.video.id, 'Player element not found')
          return
        }

        console.log('Player element found:', playerId)

        // 既存のプレイヤーがある場合は破棄
        if (player) {
          console.log('既存プレイヤーを破棄')
          player.destroy()
          player = null
        }

        // 新しいプレイヤーを作成
        console.log('新しいプレイヤーを作成:', props.video.id)
        player = new window.YT.Player(playerId, {
          height: '100%',
          width: '100%',
          videoId: props.video.id,
          playerVars: {
            autoplay: props.isActive ? 1 : 0,
            mute: 1, // デフォルトはミュート
            controls: 0, // コントロールを非表示
            rel: 0, // 関連動画を非表示
            showinfo: 0, // 動画情報を非表示
            modestbranding: 1, // YouTubeロゴを最小化
            fs: 0, // 全画面ボタンを非表示
            cc_load_policy: 0, // キャプションを非表示
            iv_load_policy: 3, // アノテーションを非表示
            disablekb: 1, // キーボードコントロールを無効
            playsinline: 1, // iOS でインライン再生
            origin: window.location.origin
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
          }
        })

      } catch (error) {
        console.error('Player initialization error:', error)
        hasError.value = true
        emit('video-error', props.video.id, error.message)
      }
    }

    /**
     * プレイヤー準備完了時の処理
     */
    const onPlayerReady = (event) => {
      console.log('プレイヤー準備完了:', props.video.id)
      playerReady.value = true
      hasError.value = false
      
      // 初期設定
      if (player) {
        player.mute() // 初期はミュート
        isMuted.value = true
        
        // アクティブな動画の場合は再生開始
        if (props.isActive) {
          player.playVideo()
        }
      }
      
      emit('video-ready', props.video.id)
    }

    /**
     * プレイヤー状態変更時の処理
     */
    const onPlayerStateChange = (event) => {
      if (!player) return

      // 状態変更のデバウンス処理
      if (playerStateChangeTimeout) {
        clearTimeout(playerStateChangeTimeout)
      }

      playerStateChangeTimeout = setTimeout(() => {
        const state = event.data
        
        switch (state) {
          case window.YT.PlayerState.PLAYING:
            isPlaying.value = true
            break
          case window.YT.PlayerState.PAUSED:
          case window.YT.PlayerState.ENDED:
            isPlaying.value = false
            break
        }
        
        emit('play-state-change', props.video.id, isPlaying.value)
      }, 100)
    }

    /**
     * プレイヤーエラー時の処理
     */
    const onPlayerError = (event) => {
      const errorCodes = {
        2: 'リクエストに無効なパラメータが含まれています',
        5: 'HTML5プレイヤーでの再生が要求されたコンテンツが、HTML5プレイヤーで再生できません',
        100: '要求された動画が見つかりませんでした',
        101: '要求された動画の所有者が、埋め込みプレイヤーでの動画の再生を許可していません',
        150: '要求された動画の所有者が、埋め込みプレイヤーでの動画の再生を許可していません'
      }
      
      const errorMessage = errorCodes[event.data] || `不明なエラー (${event.data})`
      console.error(`YouTube Player Error [${props.video.id}]:`, errorMessage)
      hasError.value = true
      emit('video-error', props.video.id, errorMessage)
    }

    /**
     * サムネイル読み込み完了時の処理
     */
    const onThumbnailLoad = () => {
      thumbnailLoaded.value = true
    }

    /**
     * 動画の再生/停止切り替え
     */
    const togglePlayPause = () => {
      if (!player || !playerReady.value) return

      if (isPlaying.value) {
        player.pauseVideo()
      } else {
        player.playVideo()
      }
    }

    /**
     * ミュート/アンミュート切り替え
     */
    const toggleMute = () => {
      if (!player || !playerReady.value) return

      if (isMuted.value) {
        player.unMute()
        isMuted.value = false
        console.log('音声オン:', props.video.id)
      } else {
        player.mute()
        isMuted.value = true
        console.log('音声オフ:', props.video.id)
      }
      
      emit('mute-state-change', props.video.id, isMuted.value)
    }

    /**
     * プレイヤークリック時の処理
     */
    const handlePlayerClick = () => {
      togglePlayPause()
    }

    /**
     * ダブルクリック時の処理
     */
    const handleDoubleClick = () => {
      console.log('ダブルクリック検出:', props.video.id)
      toggleMute()
    }

    /**
     * 動画の再読み込み
     */
    const retryLoad = () => {
      hasError.value = false
      initializePlayer()
    }

    /**
     * アクティブ状態の監視
     */
    watch(() => props.isActive, (newValue, oldValue) => {
      if (!player || !playerReady.value) return

      if (newValue && !oldValue) {
        // アクティブになった場合
        player.playVideo()
      } else if (!newValue && oldValue) {
        // 非アクティブになった場合
        player.pauseVideo()
      }
    })

    /**
     * ローディング状態の監視
     */
    watch(() => props.isLoading, (newValue) => {
      if (!newValue && !player) {
        // ローディングが完了したらプレイヤーを初期化
        initializePlayer()
      }
    })

    // コンポーネントマウント時の処理
    onMounted(() => {
      if (!props.isLoading) {
        initializePlayer()
      }
    })

    // コンポーネントアンマウント時の処理
    onUnmounted(() => {
      if (player) {
        player.destroy()
        player = null
      }
      if (playerStateChangeTimeout) {
        clearTimeout(playerStateChangeTimeout)
      }
    })

    return {
      // データ
      hasError,
      thumbnailLoaded,
      playerReady,
      isPlaying,
      isMuted,
      
      // メソッド
      onThumbnailLoad,
      togglePlayPause,
      toggleMute,
      handlePlayerClick,
      handleDoubleClick,
      retryLoad
    }
  }
}
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* YouTube プレイヤー */
.youtube-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 動画プレースホルダー */
.video-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(2px);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* エラーオーバーレイ */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.error-content {
  text-align: center;
  max-width: 300px;
  padding: 20px;
}

.error-icon {
  width: 48px;
  height: 48px;
  fill: #ff4444;
  margin-bottom: 15px;
}

.error-content p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  line-height: 1.4;
}

.retry-button {
  background: #ff4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #cc3333;
}

/* タッチオーバーレイ */
.touch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  cursor: pointer;
}

/* アクティブ状態のスタイル */
.video-player.active {
  z-index: 1;
}

/* スマートフォン対応 */
@media (max-width: 768px) {
  .loading-overlay p,
  .error-content p {
    font-size: 13px;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border-width: 2px;
  }
  
  .error-icon {
    width: 40px;
    height: 40px;
  }
}
</style>