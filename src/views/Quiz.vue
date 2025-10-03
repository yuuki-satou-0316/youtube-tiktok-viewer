<template>
  <div class="quiz">
    <div class="quiz-container">
      <!-- クイズヘッダー -->
      <div class="quiz-header">
        <h1>🎭 ジャルジャルクイズ</h1>
        <p>動画を見てタイトルを当てよう！</p>
      </div>

      <!-- メインコンテンツ -->
      <div v-if="!gameStarted" class="quiz-welcome">
        <!-- スタート画面 -->
        <div class="welcome-content">
          <div class="quiz-icon">🎯</div>
          <h2>ジャルジャル動画タイトル当てクイズ</h2>
          <p>動画を見てタイトルを4択から選ぼう！</p>
          <div class="quiz-info">
            <div class="info-item">
              <span class="info-icon">📹</span>
              <span>全5問の動画クイズ</span>
            </div>
            <div class="info-item">
              <span class="info-icon">🎭</span>
              <span>ジャルジャルの人気動画</span>
            </div>
            <div class="info-item">
              <span class="info-icon">🏆</span>
              <span>正解数で称号が変わる</span>
            </div>
          </div>

          <button @click="startQuiz" class="start-button" :disabled="loading">
            <span v-if="loading">⏳</span>
            <span v-else>🎬</span>
            {{ loading ? '動画を読み込み中...' : 'クイズをはじめる' }}
          </button>
        </div>
      </div>

      <div v-else-if="gameStarted && showResults" class="quiz-results">
        <!-- 結果画面 -->
        <div class="results-content">
          <div class="score-display">
            <div class="score-circle">
              <span class="score-number">{{ score }}</span>
              <span class="score-total">/ {{ totalQuestions }}</span>
            </div>
            <h2>{{ getScoreMessage() }}</h2>
            <p>{{ getScoreDescription() }}</p>
          </div>

          <!-- 詳細結果 -->
          <div class="detailed-results">
            <h3>結果詳細</h3>
            <div class="result-stats">
              <div class="stat-item">
                <span class="stat-label">正解率</span>
                <span class="stat-value">{{ Math.round((score / totalQuestions) * 100) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">所要時間</span>
                <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
              </div>
            </div>
          </div>

          <!-- アクションボタン -->
          <div class="result-actions">
            <button @click="restartQuiz" class="action-button primary">
              もう一度挑戦
            </button>
            <button @click="shareResult" class="action-button secondary">
              結果をシェア
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="gameStarted && !showResults" class="quiz-game">
        <!-- クイズゲーム画面 -->
        <div class="quiz-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (currentQuestion / totalQuestions) * 100 + '%' }"></div>
          </div>
          <span class="progress-text">{{ currentQuestion }} / {{ totalQuestions }}</span>
        </div>

        <!-- 動画表示エリア（上半分） -->
        <div class="video-area">
          <div class="video-container">
            <iframe
              :src="getYouTubeEmbedUrl(getCurrentQuestion().videoId)"
              frameborder="0"
              allowfullscreen
              class="video-player"
            ></iframe>
          </div>
        </div>

        <!-- 4択クイズエリア（下半分） -->
        <div class="quiz-area">
          <h2 class="question-text">この動画のタイトルは？</h2>
          
          <div class="answer-options">
            <button
              v-for="(option, index) in getCurrentQuestion().options"
              :key="index"
              @click="selectAnswer(index)"
              :class="['answer-option', { 
                selected: selectedAnswer === index,
                correct: showAnswer && index === getCurrentQuestion().correct,
                incorrect: showAnswer && selectedAnswer === index && index !== getCurrentQuestion().correct
              }]"
              :disabled="showAnswer"
            >
              {{ option }}
            </button>
          </div>

          <!-- 結果表示 -->
          <div v-if="showAnswer" class="answer-result">
            <div class="result-header">
              <span v-if="selectedAnswer === getCurrentQuestion().correct" class="result correct">🎉 正解！</span>
              <span v-else class="result incorrect">❌ 不正解</span>
            </div>
          </div>

          <!-- 次へボタン -->
          <div v-if="showAnswer" class="quiz-actions">
            <button @click="nextQuestion" class="next-button">
              {{ currentQuestion === totalQuestions ? '結果を見る' : '次の問題' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import YouTubeApiService from '../services/youtubeApi.js'

export default {
  name: 'Quiz',
  setup() {
    // YouTube API サービス
    const youtubeApi = new YouTubeApiService()
    
    // リアクティブデータ
    const gameStarted = ref(false)
    const showResults = ref(false)
    const showAnswer = ref(false)
    const currentQuestion = ref(1)
    const selectedAnswer = ref(null)
    const score = ref(0)
    const startTime = ref(null)
    const elapsedTime = ref(0)
    const loading = ref(false)
    
    const totalQuestions = 5

    // ジャルジャルのチャンネルID
    const JARUJARU_CHANNEL_ID = 'UChwgNUWPM-ksOP3BbfQHS5Q'
    
    // タイトルをもじった選択肢を生成する関数
    const generateModifiedTitles = (originalTitle) => {
      console.log('元のタイトル:', originalTitle) // デバッグ用
      
      const modifiedTitles = []
      
      // シンプルな間違い選択肢を生成
      const simpleModifications = [
        originalTitle + '前編',
        originalTitle + '後編',
        originalTitle.replace('ジャルジャル', 'ジャルジャル×'),
        originalTitle + ' 完全版',
        originalTitle + ' 特別編',
        originalTitle.replace('【', '【完全版'),
        originalTitle + ' リマスター版'
      ]
      
      // ランダムに3つ選択
      const shuffled = [...simpleModifications].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, 3)
      
      console.log('生成された間違い選択肢:', selected) // デバッグ用
      return selected
    }
    
    // API経由で1つのジャルジャル動画を取得
    const fetchRandomJarujaruVideo = async () => {
      try {
        console.log('ジャルジャル動画を取得中...', JARUJARU_CHANNEL_ID)
        const response = await youtubeApi.getChannelVideos(JARUJARU_CHANNEL_ID, 50)
        console.log('API レスポンス:', response)
        
        // YouTubeApiServiceは response.videos で動画を返す
        if (response.videos && response.videos.length > 0) {
          // ランダムに1つ選択
          const randomIndex = Math.floor(Math.random() * response.videos.length)
          const video = response.videos[randomIndex]
          console.log('選択された動画:', video)
          
          // YouTubeApiServiceの形式に合わせてvideoIdとtitleを取得
          const videoId = video.id
          const title = video.title
          console.log('動画ID:', videoId, 'タイトル:', title)
          
          return {
            videoId: videoId,
            correctTitle: title
          }
        }
        throw new Error('動画が見つかりませんでした')
      } catch (error) {
        console.error('YouTube API エラー:', error)
        console.log('フォールバックのデモデータを使用します')
        // フォールバック: デモデータ
        return {
          videoId: 'dQw4w9WgXcQ',
          correctTitle: 'ジャルジャル コント「デモ動画」'
        }
      }
    }
    
    // クイズデータを生成（API経由で取得）
    const generateQuizData = async () => {
      const quizQuestions = []
      
      for (let i = 0; i < totalQuestions; i++) {
        loading.value = true
        const video = await fetchRandomJarujaruVideo()
        
        // タイトルをもじった間違い選択肢を生成
        const incorrectOptions = generateModifiedTitles(video.correctTitle)
        
        // 正解+間違い3つで4択を作成
        const allOptions = [video.correctTitle, ...incorrectOptions].sort(() => Math.random() - 0.5)
        
        quizQuestions.push({
          videoId: video.videoId,
          options: allOptions,
          correct: allOptions.indexOf(video.correctTitle)
        })
      }
      
      loading.value = false
      return quizQuestions
    }

    const quizData = ref([])

    // 現在の問題を取得
    const getCurrentQuestion = () => {
      const index = currentQuestion.value - 1
      const question = quizData.value[index] || {}
      console.log('Current Question:', question) // デバッグ用
      return question
    }

    // YouTube埋め込みURL生成
    const getYouTubeEmbedUrl = (videoId) => {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}&start=0`
    }


    // クイズ開始
    const startQuiz = async () => {
      try {
        loading.value = true
        quizData.value = await generateQuizData()
        gameStarted.value = true
        showResults.value = false
        currentQuestion.value = 1
        score.value = 0
        startTime.value = Date.now()
        loading.value = false
      } catch (error) {
        console.error('クイズデータの生成に失敗:', error)
        loading.value = false
      }
    }

    // 答えを選択
    const selectAnswer = (answerIndex) => {
      if (showAnswer.value) return
      
      selectedAnswer.value = answerIndex
      showAnswer.value = true
      
      if (answerIndex === getCurrentQuestion().correct) {
        score.value++
      }
    }

    // 次の問題へ
    const nextQuestion = () => {
      if (currentQuestion.value === totalQuestions) {
        // クイズ終了
        elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
        showResults.value = true
        gameStarted.value = true // gameStartedをtrueのままにする
        showAnswer.value = false
      } else {
        currentQuestion.value++
        selectedAnswer.value = null
        showAnswer.value = false
      }
    }

    // クイズ再開始
    const restartQuiz = () => {
      gameStarted.value = false
      showResults.value = false
      showAnswer.value = false
      currentQuestion.value = 1
      selectedAnswer.value = null
      score.value = 0
    }

    // 結果をシェア
    const shareResult = () => {
      const percentage = Math.round((score.value / totalQuestions) * 100)
      const text = `ジャルジャルクイズに挑戦！${totalQuestions}問中${score.value}問正解（${percentage}%）でした！${getScoreMessage()}`
      
      if (navigator.share) {
        navigator.share({
          title: 'ジャルジャルクイズ結果',
          text: text,
          url: window.location.href
        })
      } else {
        // フォールバック：クリップボードにコピー
        navigator.clipboard.writeText(text).then(() => {
          alert('結果をクリップボードにコピーしました！')
        })
      }
    }

    // スコアメッセージ
    const getScoreMessage = () => {
      if (score.value === 5) return '🏆 ジャルジャルマスター！'
      if (score.value === 4) return '🎉 ジャルジャル上級者！'
      if (score.value === 3) return '👍 ジャルジャルファン！'
      if (score.value === 2) return '😊 もう少し！'
      if (score.value === 1) return '😅 出直してこい！'
      return '😱 出直してこい！'
    }

    // スコア説明
    const getScoreDescription = () => {
      if (score.value === 5) return 'パーフェクト！あなたは真のジャルジャルファンです！'
      if (score.value === 4) return 'すごい！ジャルジャルをよく知ってますね！'
      if (score.value === 3) return 'なかなかやりますね！ジャルジャルファンですね！'
      if (score.value === 2) return 'もう少し！ジャルジャルをもっと見てみよう！'
      if (score.value === 1) return 'まだまだ！ジャルジャルの動画をたくさん見よう！'
      return '全然ダメ！ジャルジャルの勉強をし直そう！'
    }

    // 時間フォーマット
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return {
      gameStarted,
      showResults,
      showAnswer,
      currentQuestion,
      selectedAnswer,
      score,
      elapsedTime,
      loading,
      totalQuestions,
      getCurrentQuestion,
      getYouTubeEmbedUrl,
      startQuiz,
      selectAnswer,
      nextQuestion,
      restartQuiz,
      shareResult,
      getScoreMessage,
      getScoreDescription,
      formatTime
    }
  }
}
</script>

<style scoped>
.quiz {
  width: 100%;
  height: 100vh;
  height: 100svh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  overflow-y: auto;
  padding-bottom: max(80px, env(safe-area-inset-bottom));
}

.quiz-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* ヘッダー */
.quiz-header {
  text-align: center;
  margin-bottom: 30px;
}

.quiz-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.quiz-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* スタート画面 */
.quiz-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.quiz-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.welcome-content h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.welcome-content p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
}

/* 難易度選択 */
.difficulty-selector {
  margin-bottom: 30px;
}

.difficulty-selector h3 {
  margin-bottom: 15px;
  font-size: 18px;
}

.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.difficulty-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 15px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.difficulty-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.difficulty-btn.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: #fff;
}

.level-icon {
  font-size: 20px;
}

.level-name {
  font-weight: 600;
  font-size: 16px;
}

.level-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.start-button {
  background: #ff4444;
  color: #fff;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-button:hover:not(:disabled) {
  background: #cc3333;
  transform: translateY(-2px);
}

.start-button:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
}

/* クイズゲーム */
.quiz-game {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  white-space: nowrap;
}

/* 動画エリア（上半分） */
.video-area {
  flex: 0 0 45%;
  min-height: 200px;
  max-height: 300px;
  padding: 5px 0;
}

.video-container {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.video-player {
  width: 100%;
  height: 100%;
  min-height: 180px;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  z-index: 20;
}

.video-overlay:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: scale(0.98);
}

.play-button {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  color: #667eea;
}

.play-button svg {
  width: 32px;
  height: 32px;
  margin-left: 4px;
}

.video-overlay:hover .play-button {
  background: #fff;
  transform: scale(1.1);
}

.video-hint {
  color: rgba(255, 255, 255, 0.95);
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 0;
  z-index: 10;
  position: relative;
}

/* 動作確認済みのオーバーレイスタイル */
.working-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  cursor: pointer;
  border-radius: 12px;
}

.overlay-content {
  text-align: center;
  color: white;
}

.play-btn {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  color: #667eea;
  font-size: 20px;
}

.overlay-text {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

/* クイズエリア（下半分） */
.quiz-area {
  flex: 0 0 55%;
  display: flex;
  flex-direction: column;
  padding: 10px 0 0 0;
  min-height: 0;
}


.question-text {
  font-size: 18px;
  line-height: 1.3;
  margin-bottom: 15px;
  text-align: center;
  font-weight: 600;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
  flex: 1;
}

.answer-option {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.answer-option:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.answer-option.selected {
  background: rgba(255, 255, 255, 0.2);
  border-color: #fff;
}

.answer-option.correct {
  background: rgba(34, 197, 94, 0.3);
  border-color: #22c55e;
}

.answer-option.incorrect {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

.answer-option:disabled {
  cursor: not-allowed;
}

/* 結果表示 */
.answer-result {
  text-align: center;
  padding: 10px;
  margin-bottom: 10px;
}

.result-header {
  margin-bottom: 5px;
}

.result.correct {
  color: #22c55e;
  font-weight: 600;
  font-size: 16px;
}

.result.incorrect {
  color: #ef4444;
  font-weight: 600;
  font-size: 16px;
}

.quiz-actions {
  margin-top: auto;
  padding-top: 5px;
}

.next-button {
  width: 100%;
  background: #fff;
  color: #667eea;
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.next-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 結果画面 */
.quiz-results {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.results-content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.score-display {
  margin-bottom: 30px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border: 4px solid #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.1);
}

.score-number {
  font-size: 36px;
  font-weight: 700;
}

.score-total {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.detailed-results {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.detailed-results h3 {
  margin-bottom: 15px;
}

.result-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-weight: 600;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  padding: 15px 20px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-button.primary {
  background: #fff;
  color: #667eea;
}

.action-button.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.action-button:hover {
  transform: translateY(-2px);
}

/* レスポンシブ */
@media (min-width: 480px) {
  .difficulty-options {
    flex-direction: row;
  }
  
  .result-actions {
    flex-direction: row;
  }
  
  .video-player {
    min-height: 300px;
  }
  
  .answer-option {
    font-size: 16px;
    padding: 15px 20px;
  }
}

@media (max-width: 480px) {
  .quiz-game {
    gap: 5px;
  }
  
  .video-area {
    flex: 0 0 40%;
    min-height: 160px;
    max-height: 220px;
    padding: 5px 0;
  }
  
  .video-player {
    min-height: 150px;
  }
  
  .play-button {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }
  
  .play-button svg {
    width: 24px;
    height: 24px;
  }
  
  .video-hint {
    font-size: 14px;
  }
  
  .quiz-area {
    flex: 0 0 60%;
    padding: 5px 0 0 0;
  }
  
  .question-text {
    font-size: 16px;
    margin-bottom: 10px;
  }
  
  .answer-options {
    gap: 6px;
    margin-bottom: 10px;
  }
  
  .answer-option {
    font-size: 13px;
    padding: 8px 10px;
    min-height: 38px;
  }
  
  .quiz-progress {
    margin-bottom: 10px;
  }
  
  .answer-result {
    padding: 8px;
    margin-bottom: 8px;
  }
}
</style>