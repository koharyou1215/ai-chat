# AI Chat プロジェクト - 引き継ぎ命令書

## 🎯 現在の作業状況と進捗

### 完了済み作業
1. **キャラクター専用システムプロンプト機能** ✅
   - `Character` インターフェースに `systemPrompt` フィールド追加
   - API ルート（`/api/simple-chat`）でキャラクター専用プロンプトを最優先適用
   - UI（`CharacterModal.tsx`）に入力フィールド追加

2. **画像生成機能強化** ✅
   - `appearancePrompt` と `appearanceNegativePrompt` フィールド追加
   - 英文プロンプト対応による画像品質向上
   - 設定オプション（感情検出、シナリオ検出、品質タグ）追加

3. **UI問題修正** ✅
   - ヘッダータップでキャラ追加が開く問題を修正（`pointer-events-none`適用）
   - チャット入力フィールドの視認性向上（透明度調整、フォント色改善）

4. **API並列処理改善** ✅
   - `Promise.allSettled` を使用した並列リクエスト処理
   - 単一リクエスト失敗が全体をブロックしない仕組み

5. **トラッカーシステム** ✅
   - `CharacterTracker` インターフェース定義
   - 好感度、信頼度、機嫌などのパラメータ追加

6. **エラー修正** ✅
   - 重複import除去（`StableDiffusionService`）
   - 文字列リテラル未終了エラー修正
   - ESLintエラー対応

### 最新コミット状況
- 最後のコミット: "fix: remove duplicate import"
- 現在の変更: `.specstory` ファイルの更新と一時ファイル存在

## 🚨 次に実行すべき作業（優先順）

### 1. 即座に実行すべき作業
```bash
# 不要な一時ファイルを削除
git clean -fd stores/
# 変更をステージング
git add .
# コミット
git commit -m "docs: update project documentation"
# デプロイ
git push origin main
```

### 2. 確認・テストが必要な項目
1. **画像生成テスト**
   - Stable Diffusion設定の確認（URL: `https://your-sd.example.com:7860` が正しいか）
   - Runware APIでの画像生成動作確認
   - キャラクター専用 `appearancePrompt` の適用確認

2. **キラキラ機能（文章強化）テスト**
   - `enhancementPrompt` の動作確認
   - API応答の正常性確認

3. **トラッカーパラメータの動作確認**
   - 好感度・信頼度・機嫌の表示/更新確認

## 📋 キャラクターの最終フォーマット

### 基本構造（`types/character.ts`）
```typescript
export interface Character {
  "file-name"?: string;
  name: string;
  tags: string[];
  first_message: string[];
  character_definition?: CharacterDefinition;
  trackers?: CharacterTracker[];
  example_dialogue?: ExampleDialogue[];
  
  // 簡易フィールド
  personality?: string;
  appearance?: string;
  speaking_style?: string;
  scenario?: string;
  nsfw_profile?: string;
  age?: string;
  occupation?: string;
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  background?: string;
  
  // 新機能フィールド
  systemPrompt?: string;              // キャラクター専用システムプロンプト
  appearancePrompt?: string;          // 英文画像生成プロンプト
  appearanceNegativePrompt?: string;  // 英文ネガティブプロンプト
  
  // 画像設定
  avatar_url?: string;
  imageSeed?: number;
  imageWidth?: number;
  imageHeight?: number;
  imageSteps?: number;
  imageCfgScale?: number;
  imageSampler?: string;
  backgroundImageUrl?: string;
}
```

### トラッカー構造
```typescript
export interface CharacterTracker {
  name: string;           // 内部識別名（例: "affection"）
  display_name: string;   // 表示名（例: "好感度"）
  initial_value: number;  // 初期値
  max_value?: number;     // 最大値（デフォルト100）
}
```

### 実装例（nami.json より）
```json
{
  "systemPrompt": "あなたはナミとして行動してください。関西弁混じりの親しみやすい口調で話し、お金や宝に関する話題では特に興味を示してください。",
  "appearancePrompt": "1girl, slender build, athletic figure, tanned skin, vibrant orange long hair, sometimes ponytail, large brown expressive eyes, blue bikini top, short skirt, confident pose, beautiful detailed face",
  "appearanceNegativePrompt": "overweight, pale skin, short hair, small eyes, formal clothing, multiple people, bad anatomy, blurry, low quality",
  "trackers": [
    {
      "name": "affection",
      "display_name": "好感度",
      "initial_value": 50,
      "max_value": 100
    },
    {
      "name": "trust",
      "display_name": "信頼度", 
      "initial_value": 30,
      "max_value": 100
    },
    {
      "name": "mood",
      "display_name": "機嫌",
      "initial_value": 70,
      "max_value": 100
    }
  ]
}
```

## 🔧 重要なファイルとその役割

### 核となる設定ファイル
- `types/character.ts` - キャラクター型定義（最重要）
- `stores/chatStore.ts` - アプリケーション設定とデフォルト値
- `src/app/api/simple-chat/route.ts` - メインチャットロジック

### UI コンポーネント
- `components/CharacterModal.tsx` - キャラクター編集画面
- `components/settings/ApiSettings.tsx` - API設定画面
- `src/app/page.tsx` - メインチャット画面

### APIエンドポイント
- `/api/simple-chat` - メインチャット
- `/api/enhance-text` - 文章強化（キラキラ）
- `/api/generate-image` - 画像生成
- `/api/user-inspiration` - 応答候補（💡）

## 🚨 既知の問題と注意点

### 環境変数関連
- ローカル環境とVercel環境での環境変数の差異
- Stable Diffusion URLの設定確認が必要

### 画像生成関連
- `contextPromptWeight` などの新しい設定項目の動作確認
- キャラクター専用プロンプトの優先順位確認

### トラッカー関連
- UI表示機能の実装が未完了
- 値の更新ロジックの実装が必要

## 📚 必要なコードブロック

### キャラクタートラッカーUI実装（未実装）
```typescript
// components/CharacterTracker.tsx (要作成)
interface TrackerDisplayProps {
  trackers: CharacterTracker[];
  currentValues: Record<string, number>;
  onChange: (name: string, value: number) => void;
}
```

### 画像生成設定の完全な型定義
```typescript
// types/app.ts の AppSettings に含まれる
imageGenerationEnabled: boolean;
contextPromptWeight: number;        // 0-1
emotionDetectionSensitivity: number; // 0-1
scenarioDetectionEnabled: boolean;
customQualityTags: string;
```

## 🎯 優先度付きタスクリスト

### 高優先度（即座に対応）
1. [ ] 一時ファイル削除とコミット
2. [ ] デプロイ実行
3. [ ] 画像生成機能のテスト
4. [ ] 文章強化機能のテスト

### 中優先度（今後の開発）
1. [ ] トラッカーUI表示機能の実装
2. [ ] トラッカー値更新ロジックの実装
3. [ ] クラウド同期機能の拡張
4. [ ] バッチファイルの改善

### 低優先度（将来的な改善）
1. [ ] Live2Dアバター連携
2. [ ] 音声合成機能の拡張
3. [ ] モバイル対応の改善

## 📝 開発時の注意事項

1. **プロジェクト理解の必須チェック**
   - `PROJECT_REFERENCE.md` を必ず最初に確認
   - 既存機能との重複を避ける

2. **型安全性の確保**
   - `types/app.ts` と `types/character.ts` の整合性維持
   - TypeScriptエラーの解消

3. **エラーハンドリング**
   - API呼び出し時の適切なエラーハンドリング
   - ユーザーへの分かりやすいエラーメッセージ

4. **テスト実行**
   - 機能追加後は必ずローカルテスト
   - デプロイ前のビルドテスト実行

---

**最終更新**: 2025年8月1日  
**作業状況**: 基本機能実装完了、テスト・デバッグフェーズ  
**次の作業者へ**: 上記の優先度付きタスクから開始してください