# AI Chat プロジェクト - 次フェーズ開発指示書

## 🎯 現在の状況（完了済み）

### ✅ 前フェーズで完了した重要な改善
1. **React Error #31修正**: TrackerValueオブジェクトのレンダリング問題解決
2. **キャラクターフォーマット最適化**: フラット構造に変更、編集画面と完全一致
3. **Vercel対応**: 背景保存をローカルストレージベース、LoRA設定をZustand永続化
4. **拡張トラッカーシステム**: 4つの型（numeric/state/boolean/text）完全対応
5. **LoRA個別重み付け**: 各LoRAに独立した重み設定機能
6. **初回メッセージランダム選択**: 3パターンから1つをランダム選択に修正済み
7. **デフォルトナミ最新化**: lib/characterLoader.tsとpublic/characters/nami.json更新

### 📊 確認済みの動作状況
- **トラッカー表示**: 4つの型すべて正常動作
- **編集画面**: 全フィールド（personality, appearance, hobbies等）完全対応
- **永続化**: LoRA設定、トラッカー値、背景すべて保存動作
- **画像生成**: appearancePrompt自動使用、個別LoRA重み付け対応
- **初回メッセージ**: ランダム選択正常動作（1726-1729行で実装済み）

## 🚀 次に実行すべき作業（優先順）

### 1. 候補生成数>1エラー修正 🔧
**問題**: `/api/simple-chat`で並列リクエスト処理エラー
**場所**: `src/app/api/simple-chat/route.ts`
**対応**: 並列処理ロジックの見直し、エラーハンドリング強化

### 2. UI改善 🎨
**a) ハンバーガーメニュー背景オーバーレイ**
- サイドバー開時に背景オーバーレイ追加
- タップでサイドバー閉じる機能

**b) ヘッダータップ問題修正**
- ヘッダータップ時のonAddCharacter()発火を防止
- `pointer-events-none`の適用範囲調整

### 3. タイプライター速度設定 ⚙️
**場所**: Settings画面
**実装**: 速度調整スライダーをUI設定セクションに追加

### 4. Supabaseクラウド同期 ☁️
**対象データ**:
- 設定（AppSettings）
- キャラクター（Character[]）
- チャット履歴（SessionSummary[]）
- メモ（ChatMemo[]）
- 背景設定（CharacterBackground[]）

## 📁 重要ファイル参照

### 最新キャラクターフォーマット（確定版）
```json
{
  "name": "（キャラクター名）",
  "age": "（年齢）",
  "occupation": "（職業/役割）",
  "tags": ["（タグ1）", "（タグ2）"],
  "hobbies": ["（趣味1）", "（趣味2）"],
  "likes": ["（好きなもの1）", "（好きなもの2）"],
  "dislikes": ["（嫌いなもの1）", "（嫌いなもの2）"],
  "background": "（背景・過去の経歴）",
  "personality": "（性格特性）",
  "appearance": "（外見の特徴）",
  "speaking_style": "（口調、一人称、二人称）",
  "scenario": "（世界観、初期状況、関係性発展）",
  "nsfw_profile": "（任意：NSFW設定）",
  "first_message": [
    "（パターン1）", "（パターン2）", "（パターン3）"
  ],
  "systemPrompt": "（AIへの指示）",
  "appearancePrompt": "（英文画像生成プロンプト）",
  "appearanceNegativePrompt": "（英文ネガティブプロンプト）",
  "trackers": [
    {
      "name": "affection_level",
      "display_name": "好感度",
      "type": "numeric",
      "initial_value": 50,
      "max_value": 100,
      "min_value": 0,
      "category": "relationship",
      "persistent": true,
      "description": "キャラクターからの好意度"
    }
  ]
}
```

### トラッカー型サンプル
**数値型**: `{"type": "numeric", "initial_value": 50, "max_value": 100}`
**状態型**: `{"type": "state", "initial_state": "初対面", "possible_states": ["初対面", "友人", "恋人"]}`
**ブール型**: `{"type": "boolean", "initial_boolean": false}`
**テキスト型**: `{"type": "text", "initial_text": ""}`

## 🔑 重要な実装済み機能

### CharacterTracker.tsx
- 4つのトラッカー型完全対応
- 数値型以外でもプログレスバー/ボタン適切に制御
- TrackerValue型でレンダリング問題解決済み

### LoRASettings.tsx
- 個別LoRAの重み設定UI
- 有効/無効切り替え
- バリデーション機能完備

### 初回メッセージ選択
- `src/app/page.tsx:1726-1729`でランダム選択実装済み
- 3パターンから1つを選択（結合なし）

## ⚠️ 注意事項

1. **avatar_url, backgroundImageUrl削除済み**: これらのフィールドは型定義から除去済み
2. **フラット構造**: character_definition入れ子は廃止、すべてルートレベル
3. **永続化**: Zustand persist使用、Vercel読み取り専用対応済み
4. **トラッカー**: persistentフラグでセッション/永続化制御

## 📝 次の作業手順

1. **simple-chat APIエラー修正**: 並列処理見直し
2. **UI改善**: オーバーレイとヘッダー修正
3. **タイプライター速度**: Settings画面に追加
4. **Supabase同期**: 段階的実装

各作業完了後は必ずローカルテスト→ビルド確認→デプロイの順で進めること。