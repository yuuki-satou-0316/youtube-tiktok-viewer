import axios from 'axios'

/**
 * YouTube Data API v3を使用して動画データを取得するサービス
 * 
 * 使用前にYouTube API keyを設定する必要があります：
 * 1. Google Cloud Consoleでプロジェクトを作成
 * 2. YouTube Data API v3を有効化
 * 3. APIキーを作成し、YouTube Data API v3に制限
 * 4. 環境変数またはconfigファイルでAPIキーを設定
 */
class YouTubeApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || ''
    this.baseUrl = 'https://www.googleapis.com/youtube/v3'
    
    // APIキーが設定されていない場合の警告
    if (!this.apiKey) {
      console.warn('YouTube API Key が設定されていません。.env ファイルに VITE_YOUTUBE_API_KEY を設定してください。')
    } else {
      console.log('YouTube API Key が設定されています:', this.apiKey.substring(0, 10) + '...')
    }
  }

  /**
   * APIキーが有効かテストする
   * @returns {Promise<boolean>} APIキーが有効かどうか
   */
  async testApiKey() {
    if (!this.apiKey) {
      return false
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: 'test',
          type: 'video',
          maxResults: 1,
          key: this.apiKey
        }
      })
      return response.status === 200
    } catch (error) {
      console.error('API Key テストエラー:', error.response?.data || error.message)
      return false
    }
  }

  /**
   * 指定されたチャンネルIDから動画リストを取得
   * @param {string} channelId - YouTubeチャンネルID
   * @param {number} maxResults - 取得する動画数（デフォルト: 20）
   * @param {string} pageToken - ページネーション用トークン
   * @returns {Promise<Object>} 動画リストと次ページトークン
   */
  async getChannelVideos(channelId, maxResults = 20, pageToken = '') {
    try {
      // APIキーが設定されていない場合はデモデータを返す
      if (!this.apiKey) {
        console.warn('API Key未設定のため、デモデータを表示します')
        return this.getDemoVideos()
      }

      // まず基本的な検索を実行（contentDetailsを除く）
      const searchParams = {
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: maxResults,
        key: this.apiKey,
        ...(pageToken && { pageToken })
      }

      console.log('YouTube API リクエスト:', searchParams)
      const response = await axios.get(`${this.baseUrl}/search`, { params: searchParams })
      
      // 動画の詳細情報を取得（エラーハンドリング付き）
      const videoIds = response.data.items.map(item => item.id.videoId).join(',')
      let detailsResponse = null
      
      try {
        detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
          params: {
            part: 'contentDetails,statistics,snippet',
            id: videoIds,
            key: this.apiKey
          }
        })
      } catch (detailsError) {
        console.warn('詳細情報の取得に失敗、基本情報のみ使用:', detailsError.message)
        // 詳細情報が取得できない場合は基本情報のみで続行
        detailsResponse = { data: { items: [] } }
      }

      // 検索結果と詳細情報をマージ
      const enhancedVideos = response.data.items.map(item => {
        const details = detailsResponse?.data?.items?.find(detail => detail.id === item.id.videoId)
        return {
          id: item.id.videoId,
          title: item.snippet.title || 'タイトル不明',
          description: item.snippet.description || '',
          thumbnail: item.snippet.thumbnails?.high?.url || 
                     item.snippet.thumbnails?.medium?.url || 
                     item.snippet.thumbnails?.default?.url ||
                     'https://i.ytimg.com/vi/' + item.id.videoId + '/hqdefault.jpg',
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle || 'チャンネル不明',
          duration: details?.contentDetails?.duration || 'PT0S',
          viewCount: details?.statistics?.viewCount || '0',
          likeCount: details?.statistics?.likeCount || '0',
          embedUrl: `https://www.youtube.com/embed/${item.id.videoId}?enablejsapi=1&autoplay=1&mute=1&controls=1&rel=0&showinfo=0`
        }
      })

      return {
        videos: enhancedVideos,
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo.totalResults
      }

    } catch (error) {
      console.error('YouTube API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      
      // APIエラーの場合はデモデータを表示
      if (error.response?.status === 403) {
        console.warn('API制限エラーのため、デモデータを表示します')
        return this.getDemoVideos()
      }
      
      throw new Error(`動画の取得に失敗しました: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  /**
   * デモ用のサンプル動画データを返す
   * @returns {Promise<Object>} サンプル動画データ
   */
  async getDemoVideos() {
    const demoVideos = [
      {
        id: 'jNQXAC9IVRw',
        title: 'Me at the zoo',
        description: 'The first video on YouTube!',
        thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
        publishedAt: '2005-04-23T23:31:52Z',
        channelTitle: 'jawed',
        duration: 'PT19S',
        viewCount: '300000000',
        likeCount: '5000000',
        embedUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?enablejsapi=1&autoplay=1&mute=1&controls=1&rel=0&showinfo=0'
      },
      {
        id: 'L_jWHffIx5E',
        title: 'Smash Mouth - All Star (Official Music Video)',
        description: 'Official music video for Smash Mouth - All Star',
        thumbnail: 'https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg',
        publishedAt: '2010-06-16T23:15:40Z',
        channelTitle: 'Smash Mouth',
        duration: 'PT3M20S',
        viewCount: '500000000',
        likeCount: '5000000',
        embedUrl: 'https://www.youtube.com/embed/L_jWHffIx5E?enablejsapi=1&autoplay=1&mute=1&controls=1&rel=0&showinfo=0'
      },
      {
        id: 'ZZ5LpwO-An4',
        title: 'HEYYEYAAEYAAAEYAEYAA',
        description: 'He-Man sings',
        thumbnail: 'https://i.ytimg.com/vi/ZZ5LpwO-An4/hqdefault.jpg',
        publishedAt: '2005-04-19T07:14:26Z',
        channelTitle: 'slackcircus',
        duration: 'PT1M4S',
        viewCount: '50000000',
        likeCount: '800000',
        embedUrl: 'https://www.youtube.com/embed/ZZ5LpwO-An4?enablejsapi=1&autoplay=1&mute=1&controls=1&rel=0&showinfo=0'
      }
    ]

    return {
      videos: demoVideos,
      nextPageToken: null,
      totalResults: demoVideos.length
    }
  }

  /**
   * チャンネル名からチャンネルIDを検索
   * @param {string} channelName - チャンネル名（例: "ジャルジャル"）
   * @returns {Promise<string>} チャンネルID
   */
  async searchChannelId(channelName) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: channelName,
          type: 'channel',
          maxResults: 1,
          key: this.apiKey
        }
      })

      if (response.data.items.length > 0) {
        return response.data.items[0].id.channelId
      } else {
        throw new Error('チャンネルが見つかりませんでした')
      }
    } catch (error) {
      console.error('Channel Search Error:', error)
      throw new Error('チャンネル検索に失敗しました')
    }
  }

  /**
   * 動画の再生時間をパース（PT4M13S → 4:13）
   * @param {string} duration - ISO 8601形式の時間
   * @returns {string} フォーマットされた時間
   */
  parseDuration(duration) {
    if (!duration) return '不明'
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return '不明'

    const hours = (match[1] || '').replace('H', '')
    const minutes = (match[2] || '').replace('M', '')
    const seconds = (match[3] || '').replace('S', '')

    let result = ''
    if (hours) result += hours + ':'
    if (minutes || hours) result += (minutes || '0').padStart(hours ? 2 : 1, '0') + ':'
    result += (seconds || '0').padStart(2, '0')

    return result
  }
}

// デフォルトのチャンネル設定（ジャルジャル）
export const DEFAULT_CHANNEL_CONFIG = {
  channelId: 'UChwgNUWPM-ksOP3BbfQHS5Q', // ジャルジャルのチャンネルID
  channelName: 'ジャルジャル',
  channelDescription: 'お笑いコンビ「ジャルジャル」の公式チャンネル'
}

export default YouTubeApiService