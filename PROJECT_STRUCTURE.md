# AI Chat プロジェクト設計図

## 技術スタック・依存関係
- Next.js 15.3.4（App Router）
- React 19 / TypeScript 5
- TailwindCSS
- Zustand（状態管理）
- lucide-react（アイコン）
- @google/generative-ai, replicate, @supabase/supabase-js（AI/外部API）
- ESLint, autoprefixer

## ディレクトリ構成
```
ai-chat/
├─ package.json
├─ public/                # 静的ファイル・画像・キャラクターjson
├─ src/
│  ├─ app/                # Next.jsページ/ルート
│  │  ├─ page.tsx         # メインUI（分割済み）
│  │  ├─ layout.tsx       # ルートレイアウト
│  │  ├─ api/             # APIルート（AI, Persona, 画像等）
│  │  └─ ...              # その他ページ
│  ├─ components/         # UIコンポーネント群
│  │  ├─ chat/            # チャット関連
│  │  ├─ settings/        # 設定関連
│  │  └─ ...              # 汎用UI
│  ├─ stores/             # Zustandストア
│  ├─ lib/                # ユーティリティ（themes, imageProcessor等）
│  ├─ hooks/              # カスタムフック（useChatState等）
│  ├─ config/             # モデル設定
│  └─ types/              # 型定義（character, message等）
├─ node_modules/
└─ ...（各種設定・ドキュメント）
```

## 機能・主要コンポーネント
- ChatPage（page.tsx）
  - ChatHeader（ヘッダーUI）
  - ChatMessageList（メッセージ表示）
  - ChatControlsWrapper（入力・送信UI）
  - ChatModals（設定・キャラクター・インスピレーション・トラッカー等のモーダル群）
- APIルート
  - /api/characters/list・/api/personas/list（キャラクター・ペルソナ取得）
  - /api/save-character-image・/api/save-persona-image（画像アップロード）
  - /api/simple-chat（AI応答生成）
  - /api/test-gemini（Gemini APIテスト）
- 状態管理
  - src/stores/chatStore.ts（チャット・トラッカー・セッション管理）
- テーマ管理
  - src/lib/themes.ts（ダーク/ライトテーマ、ThemeManager）
- 画像処理
  - src/lib/imageProcessor.ts（リサイズ・圧縮・フォーマット変換）
- モデル設定
  - src/config/model-config.ts（OpenRouter/Gemini/Claude等のAIモデル切替）
- カスタムフック
  - useChatState（チャット状態管理）
  - useChatLogic（送信・AI応答ロジック）
  - useInspirationState（インスピレーション・文章強化）
  - useUIState（UI制御）

## 依存関係・連携図
```
[Next.js App Router]
   │
   ├─ src/app/page.tsx
   │    ├─ ChatHeader
   │    ├─ ChatMessageList
   │    ├─ ChatControlsWrapper
   │    └─ ChatModals
   │
   ├─ Zustand Store（chatStore.ts）
   │
   ├─ APIルート（/api/characters, /api/personas, /api/simple-chat, ...）
   │
   ├─ lib/themes.ts（Theme管理）
   ├─ lib/imageProcessor.ts（画像処理）
   ├─ config/model-config.ts（AIモデル設定）
   └─ hooks/（状態・ロジック管理）
```

## データフロー
- ユーザー操作 → UIコンポーネント → Zustandストア/カスタムフック → API呼び出し → AI応答/データ取得 → UI更新
- 画像・テーマ・モデル設定はlib/config経由で一元管理

## 補足
- public/配下にキャラクター・ペルソナjson, 画像, アイコン等を格納
- src/components/は機能ごとに細分化・分割済み
- 不要・重複ファイルは削除済み

---

この設計図で「依存関係・機能・構造・連携」が一目で把握できます。
さらに詳細な図やドキュメント化も可能です。ご要望があればご指示ください。
