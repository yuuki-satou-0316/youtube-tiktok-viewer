<template>
  <div class="quiz">
    <div class="quiz-container">
      <!-- クイズヘッダー -->
      <div class="quiz-header">
        <h1>🧠 YouTubeクイズ</h1>
        <p>YouTuberや動画に関するクイズに挑戦しよう！</p>
      </div>

      <!-- メインコンテンツ -->
      <div v-if="!gameStarted" class="quiz-welcome">
        <!-- スタート画面 -->
        <div class="welcome-content">
          <div class="quiz-icon">🎯</div>
          <h2>クイズチャレンジ</h2>
          <p>YouTubeに関する問題が10問出題されます</p>
          
          <!-- 難易度選択 -->
          <div class="difficulty-selector">
            <h3>難易度を選択</h3>
            <div class="difficulty-options">
              <button
                v-for="level in difficultyLevels"
                :key="level.id"
                @click="selectedDifficulty = level.id"
                :class="['difficulty-btn', { active: selectedDifficulty === level.id }]"
              >
                <span class="level-icon">{{ level.icon }}</span>
                <span class="level-name">{{ level.name }}</span>
                <span class="level-desc">{{ level.description }}</span>
              </button>
            </div>
          </div>

          <button @click="startQuiz" class="start-button">
            クイズを開始
          </button>
        </div>
      </div>

      <div v-else-if="showResults" class="quiz-results">
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
              <div class="stat-item">
                <span class="stat-label">難易度</span>
                <span class="stat-value">{{ getCurrentDifficulty().name }}</span>
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

      <div v-else class="quiz-game">
        <!-- クイズゲーム画面 -->
        <div class="quiz-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (currentQuestion / totalQuestions) * 100 + '%' }"></div>
          </div>
          <span class="progress-text">{{ currentQuestion }} / {{ totalQuestions }}</span>
        </div>

        <div class="question-container">
          <div class="question-header">
            <span class="question-category">{{ getCurrentQuestion().category }}</span>
            <span class="question-difficulty">{{ getCurrentDifficulty().name }}</span>
          </div>
          
          <h2 class="question-text">{{ getCurrentQuestion().question }}</h2>
          
          <!-- 画像があれば表示 -->
          <div v-if="getCurrentQuestion().image" class="question-image">
            <img :src="getCurrentQuestion().image" :alt="getCurrentQuestion().question" />
          </div>

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

          <!-- 解説表示 -->
          <div v-if="showAnswer" class="answer-explanation">
            <div class="explanation-header">
              <span v-if="selectedAnswer === getCurrentQuestion().correct" class="result correct">🎉 正解！</span>
              <span v-else class="result incorrect">❌ 不正解</span>
            </div>
            <p class="explanation-text">{{ getCurrentQuestion().explanation }}</p>
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
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'Quiz',
  setup() {
    // リアクティブデータ
    const gameStarted = ref(false)
    const showResults = ref(false)
    const showAnswer = ref(false)
    const currentQuestion = ref(1)
    const selectedAnswer = ref(null)
    const score = ref(0)
    const selectedDifficulty = ref('easy')
    const startTime = ref(null)
    const elapsedTime = ref(0)
    
    const totalQuestions = 10

    // 難易度レベル
    const difficultyLevels = ref([
      {
        id: 'easy',
        name: '初級',
        icon: '🌟',
        description: '基本的な問題'
      },
      {
        id: 'medium',
        name: '中級',
        icon: '🔥',
        description: 'やや難しい問題'
      },
      {
        id: 'hard',
        name: '上級',
        icon: '💎',
        description: 'マニア向け問題'
      }
    ])

    // サンプルクイズデータ
    const quizData = ref({
      easy: [
        {
          category: '基本知識',
          question: 'YouTubeが設立されたのは何年？',
          options: ['2003年', '2005年', '2007年', '2009年'],
          correct: 1,
          explanation: 'YouTubeは2005年2月に設立されました。'
        },
        {
          category: 'YouTuber',
          question: 'HIKAKINさんの本名は？',
          options: ['田中太郎', '開發光', '佐藤陽子', '鈴木一郎'],
          correct: 1,
          explanation: 'HIKAKINさんの本名は開發光（かいはつ ひかる）です。'
        },
        {
          category: '機能',
          question: 'YouTube動画の最大長は？',
          options: ['10分', '15分', '12時間', '制限なし'],
          correct: 2,
          explanation: '一般ユーザーは15分、認証済みアカウントは12時間まで投稿可能です。'
        }
      ],
      medium: [
        {
          category: '歴史',
          question: 'YouTubeで最初にアップロードされた動画は？',
          options: ['猫の動画', 'ゲーム実況', '動物園での象', '音楽動画'],
          correct: 2,
          explanation: '2005年4月23日にアップロードされた「Me at the zoo」が最初の動画です。'
        },
        {
          category: 'ビジネス',
          question: 'YouTubeを買収した企業は？',
          options: ['Microsoft', 'Apple', 'Google', 'Meta'],
          correct: 2,
          explanation: 'Googleが2006年に16.5億ドルでYouTubeを買収しました。'
        }
      ],
      hard: [
        {
          category: 'テクニカル',
          question: 'YouTubeの動画IDの文字数は？',
          options: ['8文字', '10文字', '11文字', '12文字'],
          correct: 2,
          explanation: 'YouTube動画IDは11文字のランダムな文字列です。'
        }
      ]
    })

    // 現在の問題を取得
    const getCurrentQuestion = () => {
      const questions = quizData.value[selectedDifficulty.value]
      const index = (currentQuestion.value - 1) % questions.length
      return questions[index]
    }

    // 現在の難易度を取得
    const getCurrentDifficulty = () => {
      return difficultyLevels.value.find(level => level.id === selectedDifficulty.value)
    }

    // クイズ開始
    const startQuiz = () => {
      gameStarted.value = true
      showResults.value = false
      currentQuestion.value = 1
      score.value = 0
      startTime.value = Date.now()
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
        gameStarted.value = false
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
      const text = `YouTubeクイズに挑戦！${totalQuestions}問中${score.value}問正解（${percentage}%）でした！`
      
      if (navigator.share) {
        navigator.share({
          title: 'YouTubeクイズ結果',
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
      const percentage = (score.value / totalQuestions) * 100
      if (percentage >= 90) return '🏆 素晴らしい！'
      if (percentage >= 70) return '🎉 よくできました！'
      if (percentage >= 50) return '👍 まあまあです'
      return '💪 もう一度挑戦！'
    }

    // スコア説明
    const getScoreDescription = () => {
      const percentage = (score.value / totalQuestions) * 100
      if (percentage >= 90) return 'YouTubeマスターです！'
      if (percentage >= 70) return 'YouTubeをよく知っていますね'
      if (percentage >= 50) return 'もう少し勉強してみましょう'
      return '基本から学び直してみましょう'
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
      selectedDifficulty,
      elapsedTime,
      totalQuestions,
      difficultyLevels,
      getCurrentQuestion,
      getCurrentDifficulty,
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

.start-button:hover {
  background: #cc3333;
  transform: translateY(-2px);
}

/* クイズゲーム */
.quiz-game {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
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

.question-container {
  flex: 1;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.question-text {
  font-size: 22px;
  line-height: 1.4;
  margin-bottom: 30px;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.answer-option {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 15px 20px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 16px;
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

/* 解説 */
.answer-explanation {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.explanation-header {
  margin-bottom: 10px;
}

.result.correct {
  color: #22c55e;
  font-weight: 600;
}

.result.incorrect {
  color: #ef4444;
  font-weight: 600;
}

.explanation-text {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.quiz-actions {
  margin-top: 20px;
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
}
</style>