# AI Chat - AIキャラクターと会話できるチャットアプリ

AIキャラクターと自然な会話を楽しめるチャットアプリです。様々なキャラクターと対話し、画像生成や音声機能も利用できます。

## 特徴

- 🤖 **AIキャラクター**: 様々なキャラクターと自然な会話
- 🎨 **画像生成**: AIの返信に合わせた画像を自動生成
- 🔊 **音声機能**: テキストを音声で再生
- 📱 **モバイル対応**: iPhone Safariでも快適に操作
- 🎭 **キャラクター管理**: 独自のキャラクターを作成・編集
- 💾 **クラウド同期**: データをクラウドに保存・同期
- 🌈 **テーマ機能**: 様々なテーマでカスタマイズ

## iPhone Safariでの使用方法

### 1. ホーム画面に追加
1. Safariでアプリにアクセス
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. アプリ名を確認して「追加」

### 2. タッチジェスチャー
- **左スワイプ**: サイドバーを開く
- **右スワイプ**: サイドバーを閉じる
- **タップ**: 通常のタップ操作

### 3. モバイル専用機能
- ステータスバー: ネットワーク状態とバッテリー残量を表示
- 安全エリア対応: iPhoneのノッチやホームインジケーターを考慮
- タッチ最適化: 44px以上のタッチターゲット

## 開発環境のセットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn

### インストール
```bash
npm install
# または
yarn install
```

### 開発サーバーの起動
```bash
npm run dev
# または
yarn dev
```

ブラウザで [http://localhost:3003](http://localhost:3003) を開いてアプリを確認できます。

## デプロイ

### Vercelでのデプロイ
1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubリポジトリを接続
3. 自動デプロイが開始されます

### 手動デプロイ
```bash
npm run build
npm run start
```

## 技術スタック

- **フレームワーク**: Next.js 15
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **AI API**: Google Gemini API
- **画像生成**: Replicate API
- **音声**: ElevenLabs API / Web Speech API
- **デプロイ**: Vercel

## 設定

### 環境変数
`.env.local`ファイルを作成して以下の設定を追加：

```env
GEMINI_API_KEY=your_gemini_api_key
REPLICATE_API_KEY=your_replicate_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## 📚 プロジェクトドキュメント

### 開発者向けドキュメント
- [📋 プロジェクト参照ファイル](./PROJECT_REFERENCE.md) - プロジェクト概要、機能、ファイル構造
- [🎯 プロジェクトルール](./PROJECT_RULES.md) - 開発ルール、コーディング規約
- [📝 変更履歴](./CHANGELOG.md) - バージョン履歴、変更内容
- [🚀 クイックスタートガイド](./QUICK_START.md) - 開発開始時の手順

### ユーザー向けドキュメント
- [📖 セットアップガイド](./SETUP_GUIDE.md) - 初期設定手順
- [🎮 コマンドガイド](./COMMANDS_GUIDE.md) - 操作方法
- [👶 初心者ガイド](./BEGINNER_GUIDE.md) - 初回利用者向け

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します！

---

**最終更新**: 2025年7月24日
**バージョン**: 1.0.0