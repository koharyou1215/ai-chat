# AIキャラクターバリエーション管理ガイド

## 📋 概要

同じキャラクター名で異なるAI（Gemini、Claude、Grok）による3つのバリエーションを効率的に管理するシステムです。

## 🏗️ キャラクターファイル構造

### 基本キャラクター（オリジナル）
```json
{
  "name": "ナミ",
  "aiModel": "original",
  "isVariation": false,
  "tags": ["冒険者", "海賊"],
  "personality": "明るく勇敢な性格...",
  "first_message": ["はじめまして！私はナミです！"],
  // ... その他の基本情報
}
```

### AIバリエーション例

#### Geminiバージョン
```json
{
  "name": "ナミ (Gemini版)",
  "baseCharacterName": "ナミ",
  "aiModel": "gemini",
  "isVariation": true,
  "tags": ["冒険者", "海賊", "gemini-generated"],
  "personality": "Geminiが生成した詳細な性格設定...",
  "first_message": ["こんにちは！ナミです。一緒に冒険しましょう！"],
  // ... Gemini特有の詳細設定
}
```

#### Claudeバージョン
```json
{
  "name": "ナミ (Claude版)",
  "baseCharacterName": "ナミ",
  "aiModel": "claude",
  "isVariation": true,
  "tags": ["冒険者", "海賊", "claude-generated"],
  "personality": "Claudeが生成した性格設定...",
  "first_message": ["やあ！私はナミ。よろしくね！"],
  // ... Claude特有の設定
}
```

#### Grokバージョン
```json
{
  "name": "ナミ (Grok版)",
  "baseCharacterName": "ナミ",
  "aiModel": "grok",
  "isVariation": true,
  "tags": ["冒険者", "海賊", "grok-generated"],
  "personality": "Grokが生成した独特な性格設定...",
  "first_message": ["Yo! ナミだぜ！"],
  // ... Grok特有の設定
}
```

## 🎮 ギャラリーでの表示

### 通常表示モード
- **表示**: 基本キャラクター（`isVariation: false`）のみ
- **利点**: ギャラリーがすっきり、同じ名前の重複なし

### バリエーション表示モード
- **表示**: 全てのキャラクター（基本 + バリエーション）
- **識別**: AIモデルバッジ（GEMINI🔵、CLAUDE🟠、GROK🟢）
- **利点**: 全バリエーションから選択可能

## 📁 ファイル保存場所

```
public/characters/
├── ナミ.json                    # 基本版
├── ナミ-gemini.json            # Geminiバージョン  
├── ナミ-claude.json            # Claudeバージョン
└── ナミ-grok.json              # Grokバージョン
```

## 🔧 実装済み機能

### ✅ ギャラリー機能
- [x] バリエーション表示/非表示切り替え
- [x] AIモデルバッジ表示
- [x] グリッド/リスト両表示対応
- [x] フィルタリング・検索対応

### ✅ データ構造
- [x] `aiModel` フィールド（gemini/claude/grok/original）
- [x] `baseCharacterName` フィールド（元キャラクター名）
- [x] `isVariation` フラグ（バリエーション判定）

## 💡 使用方法

1. **基本キャラクター作成**: `isVariation: false` で保存
2. **バリエーション作成**: 各AIで生成後、`isVariation: true` + `aiModel` + `baseCharacterName` を設定
3. **ギャラリー操作**: 🤖レイヤーボタンでバリエーション表示切り替え
4. **識別**: カードのAIバッジで生成元を確認

## 🎯 メリット

- **整理**: 同じ名前のキャラクターが並ばない
- **比較**: AIモデル別の特徴を簡単に比較
- **選択**: 用途に応じて最適なバリエーションを選択
- **管理**: データ構造が統一され、管理が簡単

## 🚀 今後の拡張予定

- [ ] バリエーション比較モーダル
- [ ] AI生成品質評価システム
- [ ] 自動バリエーション生成機能
- [ ] バリエーション間設定コピー機能