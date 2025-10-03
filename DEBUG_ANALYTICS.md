# 📊 Google Analytics データ送信確認ガイド

## 🔍 1. ブラウザのデベロッパーツールで確認

### 手順:
1. アプリを開く（https://your-vercel-app.vercel.app）
2. **F12** または **右クリック→検証** でデベロッパーツールを開く
3. **Network** タブをクリック
4. フィルターに `google-analytics` または `collect` と入力
5. ページをリロードして動画を操作

### 確認すべきリクエスト:
- `https://www.google-analytics.com/g/collect` へのリクエスト
- `https://www.googletagmanager.com/gtag/js` の読み込み

### 正常な場合:
- ページ読み込み時に初期リクエストが送信される
- 動画操作（再生、スワイプ、音量変更）でリクエストが追加送信される
- ステータスコードが **200 OK**

## 🔍 2. Google Analytics リアルタイムレポート

### 手順:
1. https://analytics.google.com にアクセス
2. 該当プロパティを選択
3. 左メニューの **レポート** → **リアルタイム** をクリック
4. アプリで操作しながら数値の変化を確認

### 確認項目:
- **過去30分間のユーザー数** が増加するか
- **イベント数** が動画操作に応じて増加するか
- **ページビュー** が記録されているか

## 🔍 3. Google Analytics DebugView（推奨）

### 有効化手順:
1. ブラウザの拡張機能 **Google Analytics Debugger** をインストール
2. 拡張機能を有効化
3. アプリをリロード
4. Google Analytics の **設定** → **DebugView** で確認

### 表示される情報:
- 送信されたすべてのイベント
- イベントパラメータの詳細
- エラーやデバッグ情報

## 🔍 4. コンソールログでの確認

アプリのコンソールで以下のコマンドを実行:

```javascript
// Google Analytics が正しく読み込まれているか確認
console.log('gtag function available:', typeof gtag !== 'undefined');

// 手動でテストイベントを送信
if (typeof gtag !== 'undefined') {
  gtag('event', 'test_event', {
    event_category: 'debug',
    event_label: 'manual_test'
  });
  console.log('Test event sent');
}

// 現在の測定IDを確認
console.log('Measurement ID:', import.meta.env.VITE_GA_MEASUREMENT_ID);
```

## 🔍 5. ネットワークリクエストの詳細分析

### 正常なリクエスト例:
```
URL: https://www.google-analytics.com/g/collect?v=2&tid=G-KX0H1ZCV15&...
Method: POST
Status: 200 OK
```

### パラメータの確認:
- `tid`: 測定ID (G-KX0H1ZCV15)
- `en`: イベント名 (video_play, video_swipe等)
- `ep.video_title`: カスタムパラメータ

## ⚠️ トラブルシューティング

### データが送信されない場合:

1. **環境変数の確認**
   ```bash
   # .env ファイルに正しい測定IDが設定されているか
   VITE_GA_MEASUREMENT_ID=G-KX0H1ZCV15
   ```

2. **ビルド後の確認**
   ```bash
   npm run build
   npm run preview
   ```

3. **ブラウザのプライバシー設定**
   - 広告ブロッカーを一時的に無効化
   - Cookieが有効になっているか確認

4. **Google Analytics設定**
   - プロパティが正しく設定されているか
   - データストリームが有効か

## 📈 データが表示されるまでの時間

- **リアルタイムレポート**: 数秒〜1分
- **標準レポート**: 24-48時間
- **カスタムイベント**: 数分〜数時間

## 🎯 効果的な確認手順

1. デベロッパーツールのNetworkタブを開く
2. アプリで以下の操作を実行:
   - ページリロード → `session_start` イベント確認
   - 動画再生 → `video_play` イベント確認  
   - 動画スワイプ → `video_swipe` イベント確認
   - 音量変更 → `volume_change` イベント確認
3. Google Analytics のリアルタイムレポートで数値変化を確認