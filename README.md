# YouTube TikTok Viewer

特定のYouTubeチャンネルの動画をTikTok風に縦スワイプで閲覧できるWebアプリケーションです。

![Demo](https://via.placeholder.com/400x800/000000/FFFFFF?text=YouTube+TikTok+Viewer)

## 🎥 機能

- **縦スワイプナビゲーション**: 上下スワイプで動画を切り替え
- **自動再生制御**: アクティブな動画のみ自動再生
- **動画制御**: 再生/停止、ミュート/アンミュート操作
- **無限スクロール**: 自動的に次のページの動画を読み込み
- **レスポンシブデザイン**: スマートフォンからデスクトップまで対応
- **スムーズアニメーション**: 滑らかな画面遷移

## 🛠️ 技術スタック

- **フロントエンド**: Vue.js 3 (Composition API)
- **スライダー**: Swiper.js
- **動画プレイヤー**: YouTube IFrame Player API
- **API**: YouTube Data API v3
- **ビルドツール**: Vite
- **スタイル**: CSS3 + Flexbox/Grid

## 📁 プロジェクト構造

```
youtube-tiktok-app/
├── public/
│   └── index.html              # エントリーHTML
├── src/
│   ├── components/
│   │   └── VideoPlayer.vue     # YouTube動画プレイヤーコンポーネント
│   ├── services/
│   │   └── youtubeApi.js       # YouTube API統合サービス
│   ├── styles/
│   │   └── global.css          # グローバルスタイル
│   ├── App.vue                 # メインアプリケーションコンポーネント
│   └── main.js                 # アプリケーションエントリーポイント
├── .env.example                # 環境変数テンプレート
├── package.json                # 依存関係とスクリプト
├── vite.config.js              # Vite設定
└── README.md                   # プロジェクトドキュメント
```

## 🚀 セットアップ手順

### 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd youtube-tiktok-app

# 依存関係をインストール
npm install
```

### 2. YouTube Data API v3 キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. **API とサービス** → **ライブラリ** に移動
4. **YouTube Data API v3** を検索して有効化
5. **認証情報** → **認証情報を作成** → **API キー** を選択
6. 作成されたAPIキーを制限設定（推奨）:
   - **アプリケーションの制限**: HTTPリファラー
   - **API の制限**: YouTube Data API v3 のみ

### 3. 環境変数の設定

```bash
# .env.example を .env にコピー
cp .env.example .env

# .env ファイルを編集してAPIキーを設定
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_DEFAULT_CHANNEL_ID=UC0UpVHErGogCyEQFN_3xZAQ
```

### 4. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 を開く
```

### 5. プロダクションビルド

```bash
# プロダクション用にビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## 🎮 使用方法

### 基本操作

- **動画切り替え**: 画面を上下にスワイプ
- **再生/停止**: 動画エリアをタップ
- **ミュート切り替え**: 動画エリアをダブルタップ
- **手動制御**: 画面下部のコントロールボタンを使用

### カスタマイズ

チャンネルを変更したい場合は、`src/services/youtubeApi.js` の `DEFAULT_CHANNEL_CONFIG` を編集してください：

```javascript
export const DEFAULT_CHANNEL_CONFIG = {
  channelId: 'YOUR_CHANNEL_ID',
  channelName: 'チャンネル名',
  channelDescription: 'チャンネルの説明'
}
```

## 🔧 開発情報

### 主要コンポーネント

#### App.vue
- メインアプリケーションロジック
- Swiperの制御
- 動画データの管理
- 状態管理（再生状態、ミュート状態など）

#### VideoPlayer.vue
- YouTube IFrame Player APIの統合
- 動画の読み込み・再生制御
- エラーハンドリング
- タッチイベントの処理

#### youtubeApi.js
- YouTube Data API v3との通信
- 動画データの取得・整形
- エラーハンドリング
- ページネーション対応

### 設定可能な項目

```javascript
// API設定
const maxResults = 20;        // 一度に取得する動画数
const autoplay = true;        // 自動再生の有効/無効
const defaultMuted = true;    // デフォルトのミュート状態

// Swiper設定
const slideSpeed = 300;       // スライドアニメーション速度
const touchAngle = 45;        // タッチ認識角度
const threshold = 10;         // スワイプ閾値
```

## 🌐 ブラウザ対応

- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+
- iOS Safari 13+
- Android Chrome 80+

## 📱 PWA対応（将来の拡張予定）

このアプリは将来的にPWA（Progressive Web App）として動作するよう設計されています：

- オフライン対応
- ホーム画面への追加
- プッシュ通知

## 🚨 注意事項

### YouTube API利用制限

- YouTube Data API v3には1日あたりのクォータ制限があります
- デフォルトで10,000ユニット/日の制限があります
- 大量のアクセスが予想される場合は、Google Cloud Consoleでクォータの増加を申請してください

### 著作権について

- 表示される動画はすべてYouTubeの公式プレイヤーを使用しています
- 動画の著作権は各動画の投稿者に帰属します
- 商用利用時は各動画の利用規約を確認してください

### プライバシー

- このアプリはユーザーデータを収集・保存しません
- YouTubeプレイヤーのプライバシーポリシーが適用されます

## 🐛 トラブルシューティング

### よくある問題

**Q: 動画が読み込まれない**
A: YouTube API keyが正しく設定されているか確認してください

**Q: スワイプが動作しない**
A: タッチデバイスでアクセスしているか、ブラウザの開発者ツールでタッチエミュレーションを有効にしてください

**Q: 動画が自動再生されない**
A: 多くのブラウザは音声付き動画の自動再生を制限しています。ミュート状態での自動再生は有効です

**Q: APIエラーが発生する**
A: 以下を確認してください：
- APIキーが有効で正しく設定されている
- YouTube Data API v3が有効化されている
- APIクォータが残っている
- リファラー制限が正しく設定されている

### デバッグ方法

開発者ツールのコンソールでエラーメッセージを確認できます：

```bash
# エラーログの確認
# ブラウザの開発者ツール → Console タブを確認

# APIレスポンスの確認
# Network タブで youtube.com へのリクエストを確認
```

## 🤝 コントリビューション

バグ報告や機能提案は Issues でお知らせください。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🔗 関連リンク

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Vue.js Documentation](https://vuejs.org/)
- [Swiper.js Documentation](https://swiperjs.com/)
- [Vite Documentation](https://vitejs.dev/)

---

**作成者**: Claude Code Assistant  
**最終更新**: 2024年10月  
**バージョン**: 1.0.0