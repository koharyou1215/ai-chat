# 🚀 初心者向け Next.js + Vercel プロジェクト設定ガイド

## 📋 プロジェクト開始時の必須設定

### 1. プロジェクト構造の作成

```bash
# プロジェクト作成
npx create-next-app@latest my-project --typescript --tailwind --eslint
cd my-project

# 必須ファイルの作成
touch .gitignore .vercelignore README.md
```

### 2. 必須ファイルの設定

#### .gitignore
```gitignore
# Dependencies
node_modules/
**/node_modules/

# Next.js
.next/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# Runtime
pids
*.pid
*.seed

# Coverage
coverage/

# Temporary files
*.tmp
*.temp
```

#### .vercelignore
```vercelignore
# Large assets (use external storage)
public/videos/
public/images/large/
*.mp4
*.mov
*.zip
*.avi

# Development files
node_modules/
.env.local
.env.development.local

# Build artifacts
.next/
out/

# Test files
coverage/
*.test.js
*.spec.js
```

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 3. 環境変数の設定

#### .env.local（ローカル開発用）
```env
# API Keys
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=your_database_url

# External Services
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
```

#### Vercel 環境変数設定
1. Vercel ダッシュボード → プロジェクト → Settings → Environment Variables
2. 本番環境用の値を設定

## 🔧 開発ワークフロー

### 1. 開発開始時

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 別ターミナルで型チェック
npm run type-check
```

### 2. コミット前チェック

```bash
# 1. ファイルサイズ確認
Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum

# 2. リンター実行
npm run lint

# 3. 型チェック
npm run type-check

# 4. ビルドテスト
npm run build

# 5. コミット
git add .
git commit -m "feat: 機能説明"
git push
```

### 3. デプロイ前チェック

```bash
# 1. ローカルビルド
npm run build

# 2. Vercel CLI でテスト
npx vercel build --prod

# 3. デプロイ
npx vercel --prod
```

## 🚨 よくある問題と解決策

### 1. デプロイが始まらない

#### 原因
- リポジトリサイズが制限超過
- 設定ファイルエラー
- Git連携の問題

#### 解決策
```bash
# サイズ確認
Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum

# 大容量ファイルの特定
Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 10

# .vercelignore で除外
echo "public/large-files/" >> .vercelignore
```

### 2. ビルドエラー

#### 原因
- TypeScript エラー
- 依存関係の問題
- 環境変数の未設定

#### 解決策
```bash
# TypeScript エラー確認
npm run type-check

# 依存関係の更新
npm update

# 環境変数確認
echo $NODE_ENV
```

### 3. パフォーマンス問題

#### 原因
- 大容量画像・動画
- 不要な依存関係
- 非最適化コード

#### 解決策
```bash
# バンドルサイズ分析
npm run build
npx @next/bundle-analyzer

# 不要パッケージの削除
npm prune
```

## 📊 監視とメンテナンス

### 1. 定期的なチェック

#### 週次チェック
- [ ] 依存関係の更新確認
- [ ] セキュリティ脆弱性チェック
- [ ] パフォーマンス指標確認

#### 月次チェック
- [ ] リポジトリサイズ確認
- [ ] 不要ファイルの削除
- [ ] ドキュメントの更新

### 2. セキュリティチェック

```bash
# 脆弱性チェック
npm audit

# 依存関係の更新
npm update

# セキュリティ修正
npm audit fix
```

### 3. パフォーマンス監視

```bash
# Lighthouse スコア確認
npx lighthouse https://your-site.vercel.app

# バンドルサイズ確認
npm run build
npx @next/bundle-analyzer
```

## 🎯 ベストプラクティス

### 1. ファイル管理
- **大容量ファイル**は外部ストレージを使用
- **環境変数**で機密情報を管理
- **型安全性**を重視

### 2. コード品質
- **ESLint**と**Prettier**を使用
- **TypeScript**で型安全性を確保
- **テスト**を書く習慣をつける

### 3. デプロイ
- **段階的デプロイ**（staging → production）
- **ロールバック**計画を準備
- **監視**と**アラート**を設定

## 📚 参考リソース

### 公式ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### ツール
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [ESLint](https://eslint.org/)

---

**作成日**: 2024年12月
**対象**: Next.js + Vercel 初心者
**更新頻度**: 月次 