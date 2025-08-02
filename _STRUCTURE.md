# AI Chat プロジェクト構造 - 最新版

## 📁 ディレクトリ構造

```
ai-chat/
├── components/                    # Reactコンポーネント
│   ├── settings/                  # 設定関連コンポーネント
│   │   ├── ApiSettings.tsx       # API設定（LoRA設定統合済み）
│   │   ├── ChatSettings.tsx      # チャット設定
│   │   ├── ModelSettings.tsx     # モデル設定
│   │   ├── PromptSettings.tsx    # プロンプト設定
│   │   ├── UISettings.tsx        # UI設定
│   │   └── VoiceSettings.tsx     # 音声設定
│   ├── CharacterModal.tsx        # キャラクター編集（フラット構造対応）
│   ├── CharacterGallery.tsx      # キャラクター一覧
│   ├── CharacterSelector.tsx     # キャラクター選択
│   ├── CharacterTracker.tsx      # トラッカー表示（4型対応）
│   ├── LoRASettings.tsx          # LoRA個別重み設定UI
│   ├── TrackerEditor.tsx         # トラッカー編集UI
│   ├── SettingsModal.tsx         # 設定モーダル
│   └── [その他UIコンポーネント]
│
├── src/app/                       # Next.js App Router
│   ├── api/                       # API Routes
│   │   ├── simple-chat/route.ts  # メインチャットAPI
│   │   ├── generate-image/route.ts # 画像生成（LoRA個別重み対応）
│   │   ├── enhance-text/route.ts  # 文章強化
│   │   ├── save-background/route.ts # 背景保存（Vercel対応）
│   │   └── [その他API]
│   ├── page.tsx                   # メインチャット画面
│   ├── characters/page.tsx       # キャラクター管理画面
│   ├── settings/page.tsx         # 設定画面
│   └── history/page.tsx          # 履歴画面
│
├── lib/                          # ユーティリティライブラリ
│   ├── characterLoader.ts        # キャラクター管理（フラット構造）
│   ├── backgroundManager.ts      # 背景管理（ローカルストレージ）
│   ├── runwareApi.ts            # Runware API（個別LoRA対応）
│   ├── openRouter.ts            # OpenRouter API
│   ├── voiceManager.ts          # 音声管理
│   └── [その他ライブラリ]
│
├── stores/                       # 状態管理
│   └── chatStore.ts             # Zustand（永続化、トラッカー管理）
│
├── types/                        # TypeScript型定義
│   ├── character.ts             # Character型（フラット構造）
│   │                            # CharacterTracker, TrackerValue型
│   └── app.ts                   # AppSettings, LoRASetting型
│
├── public/characters/            # キャラクターデータ
│   ├── nami.json               # デフォルトナミ（最新フォーマット）
│   └── [その他キャラクター].json
│
└── [設定ファイル等]
```

## 🔧 主要コンポーネント詳細

### 📊 CharacterTracker.tsx
**機能**: 4つのトラッカー型表示・操作
- **numeric**: プログレスバー、増減ボタン
- **state**: 状態表示、選択肢
- **boolean**: はい/いいえ表示
- **text**: テキスト表示
- **永続化**: persistentフラグで制御

### 🎛️ LoRASettings.tsx  
**機能**: 個別LoRA重み設定
- ID・名前・重み・有効無効の管理
- 重みスライダー（0.0〜2.0）
- バリデーション機能
- リアルタイム有効無効切り替え

### 📝 CharacterModal.tsx
**機能**: キャラクター編集（フラット構造完全対応）
- 全フィールド直接編集可能
- トラッカー定義・編集
- 新旧フォーマット対応

## 💾 データ構造

### Character型（最新フラット構造）
```typescript
interface Character {
  // 基本情報
  name: string;
  age?: string;
  occupation?: string;
  tags: string[];
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  
  // キャラクター詳細（フラット）
  personality?: string;
  appearance?: string;
  speaking_style?: string;
  scenario?: string;
  background?: string;
  nsfw_profile?: string;
  
  // 新機能
  systemPrompt?: string;
  appearancePrompt?: string;
  appearanceNegativePrompt?: string;
  
  // 拡張機能
  trackers?: CharacterTracker[];
  first_message: string[];
}
```

### TrackerValue型
```typescript
interface TrackerValue {
  type: 'numeric' | 'state' | 'boolean' | 'text';
  value: number | string | boolean;
  lastUpdate?: number;
}
```

### LoRASetting型
```typescript
interface LoRASetting {
  id: string;
  name: string;
  weight: number;
  enabled: boolean;
}
```

## 🔄 データフロー

### キャラクター選択フロー
1. `CharacterSelector.tsx` → キャラクター選択
2. `src/app/page.tsx:onSelectCharacter` → 初期化処理
3. `initializeTrackersForSession()` → トラッカー初期化
4. 初回メッセージランダム選択（1726-1729行）

### トラッカー更新フロー  
1. `CharacterTracker.tsx` → 値変更
2. `updateTrackerValue()` → Zustand更新
3. `analyzeMessageForTrackerUpdates()` → AI応答で自動更新
4. 永続化: persistent=trueなら永続保存

### LoRA設定フロー
1. `LoRASettings.tsx` → 設定変更
2. `runwareLoraSettings` → Zustand保存
3. `generate-image/route.ts` → API呼び出し時に適用

## 🗃️ 永続化システム

### Zustand Persist
**保存対象**:
- `settings`: 全設定（LoRA設定含む）
- `trackerValues`: セッション用トラッカー値
- `persistentTrackerValues`: 永続トラッカー値
- `sessions`: チャット履歴
- `memos`: メモデータ

### ローカルストレージ
**BackgroundManager**:
- キャラクター別背景設定
- Vercel読み取り専用対応

## ⚙️ API構造

### `/api/simple-chat`
- メインチャット処理
- systemPrompt自動適用
- トラッカー分析統合

### `/api/generate-image`  
- 画像生成API
- appearancePrompt自動使用
- 個別LoRA重み適用
- Runware/StableDiffusion対応

### `/api/save-background`
- 背景保存API
- Vercel対応（ログ目的のみ）

## 🔍 重要な実装済み機能

1. **エラー解決**: React Error #31完全修正
2. **フォーマット統一**: フラット構造で編集画面完全対応
3. **永続化**: Vercel環境対応
4. **拡張トラッカー**: 4つの型完全サポート
5. **個別LoRA**: 重み付け独立制御
6. **ランダム選択**: 初回メッセージ正常動作

---
**更新**: 2025年1月 | **対応フォーマット**: フラット構造v2.0