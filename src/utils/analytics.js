/**
 * Google Analytics 4 イベント追跡ユーティリティ
 * ユーザーの行動を詳細に監視するためのカスタムイベント
 */

/**
 * GAイベントを送信
 * @param {string} action - イベントアクション
 * @param {Object} parameters - 追加パラメータ
 */
export const trackEvent = (action, parameters = {}) => {
  console.log('📊 Analytics Event:', action, parameters);
  
  if (typeof gtag !== 'undefined') {
    const eventData = {
      ...parameters,
      app_name: 'YouTube TikTok Viewer',
      timestamp: new Date().toISOString()
    };
    
    gtag('event', action, eventData);
    console.log('✅ GA Event sent:', action, eventData);
  } else {
    console.warn('❌ gtag not available - event not sent:', action);
  }
}

/**
 * 動画再生イベント
 * @param {string} videoId - YouTube動画ID
 * @param {string} videoTitle - 動画タイトル
 * @param {string} channelName - チャンネル名
 */
export const trackVideoPlay = (videoId, videoTitle, channelName) => {
  trackEvent('video_play', {
    event_category: 'video',
    event_label: videoId,
    video_title: videoTitle,
    channel_name: channelName,
    content_type: 'youtube_video'
  })
}

/**
 * 動画停止イベント
 * @param {string} videoId - YouTube動画ID
 * @param {number} duration - 再生時間（秒）
 */
export const trackVideoPause = (videoId, duration) => {
  trackEvent('video_pause', {
    event_category: 'video',
    event_label: videoId,
    watch_duration: duration,
    content_type: 'youtube_video'
  })
}

/**
 * 動画スワイプイベント
 * @param {string} direction - スワイプ方向（up/down）
 * @param {string} fromVideoId - 前の動画ID
 * @param {string} toVideoId - 次の動画ID
 */
export const trackVideoSwipe = (direction, fromVideoId, toVideoId) => {
  trackEvent('video_swipe', {
    event_category: 'navigation',
    swipe_direction: direction,
    from_video: fromVideoId,
    to_video: toVideoId
  })
}

/**
 * 音量変更イベント
 * @param {boolean} isMuted - ミュート状態
 * @param {string} videoId - 動画ID
 */
export const trackVolumeChange = (isMuted, videoId) => {
  trackEvent('volume_change', {
    event_category: 'video_control',
    event_label: videoId,
    action: isMuted ? 'mute' : 'unmute'
  })
}

/**
 * エラーイベント
 * @param {string} errorType - エラータイプ
 * @param {string} errorMessage - エラーメッセージ
 * @param {string} videoId - 関連動画ID（オプション）
 */
export const trackError = (errorType, errorMessage, videoId = null) => {
  trackEvent('error', {
    event_category: 'error',
    error_type: errorType,
    error_message: errorMessage,
    video_id: videoId
  })
}

/**
 * API使用状況イベント
 * @param {string} apiType - API種別（youtube_api/demo_data）
 * @param {boolean} success - 成功/失敗
 * @param {number} videoCount - 取得動画数
 */
export const trackApiUsage = (apiType, success, videoCount = 0) => {
  trackEvent('api_usage', {
    event_category: 'api',
    api_type: apiType,
    success: success,
    video_count: videoCount
  })
}

/**
 * セッション開始イベント
 */
export const trackSessionStart = () => {
  trackEvent('session_start', {
    event_category: 'engagement',
    page_title: document.title,
    page_location: window.location.href
  })
}

/**
 * ページビューイベント（SPAの場合）
 * @param {string} pageName - ページ名
 */
export const trackPageView = (pageName) => {
  if (typeof gtag !== 'undefined') {
    gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_title: pageName,
      page_location: window.location.href
    })
  }
}