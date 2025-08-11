# 📚 キャラクター管理ガイド

## 🎯 目的
AIで生成されたキャラクターを、エディターで編集しやすい**折りたたみ形式**で管理し、ブラウザで見やすく表示するシステムです。

## 📁 ファイル構成

### **📝 マークダウンファイル（編集用）**
- `gemini_output_character.md` - Gemini生成キャラクター（折りたたみ対応済み）
- `Claud_utput_character.md` - Claude生成キャラクター
- `grok_output_character.md` - Grok生成キャラクター（将来用）

### **🌐 HTMLビューワー（表示用）**
- `gemini-character-viewer.html` - Gemini用ビューワー 🤖
- `claude-character-viewer.html` - Claude用ビューワー 🔥
- `grok-character-viewer.html` - Grok用ビューワー ⚡

### **🛠️ ツール・スクリプト**
- `character-template.md` - 新キャラクター追加テンプレート
- `add-character.js` - 自動追加スクリプト
- `convert-to-foldable.js` - 一括変換スクリプト

## 🚀 使用方法

### **1. エディターでの編集**

#### **VS Code / Cursor での表示**
- キャラクターごとに見出しが付き、折りたたみ可能
- `# 🧝‍♀️ キャラクター1: フィリア・エインセルウェル` をクリックで開閉
- 必要なキャラクターのみ展開して編集

#### **新キャラクター追加（手動）**
1. `character-template.md` をコピー
2. `gemini_output_character.md` の最後に貼り付け
3. `[ここに入力]` 部分を編集

#### **新キャラクター追加（自動）**
```bash
cd public/characters
node add-character.js "新キャラクター名" "🌟"
```

### **2. ブラウザでの表示**

#### **アクセスURL**
- Gemini: `http://localhost:3004/characters/gemini-character-viewer.html`
- Claude: `http://localhost:3004/characters/claude-character-viewer.html`
- Grok: `http://localhost:3004/characters/grok-character-viewer.html`

#### **機能**
- ✅ **全て開く** - 全キャラクターの詳細を一括展開
- ❌ **全て閉じる** - 全キャラクターを一括折りたたみ
- 🔍 **検索** - 名前、タグ、内容で絞り込み
- 📊 **カウンター** - 表示件数をリアルタイム表示

## 📋 キャラクター形式

### **折りたたみ形式（編集用）**
```markdown
# 🎭 キャラクター1: キャラクター名

<details>
<summary>📝 キャラクター詳細（クリックで展開/折りたたみ）</summary>

```json
{
"name": "キャラクター名",
"age": "年齢",
"occupation": "職業",
"tags": ["タグ1", "タグ2"],
...
}
```

</details>

---
```

### **JSON構造**
```json
{
  "name": "キャラクター名",
  "age": "年齢",
  "occupation": "職業",
  "tags": ["ファンタジー", "エルフ", "NSFW"],
  "hobbies": ["趣味1", "趣味2"],
  "likes": ["好きなもの1", "好きなもの2"],
  "dislikes": ["嫌いなもの1", "嫌いなもの2"],
  "background": "背景設定",
  "personality": "性格",
  "appearance": "外見",
  "speaking_style": "話し方",
  "scenario": "シナリオ",
  "nsfw_profile": "NSFW設定",
  "first_message": [
    "「初期メッセージ1」",
    "「初期メッセージ2」"
  ],
  "systemPrompt": "システムプロンプト",
  "appearancePrompt": "外見プロンプト",
  "appearanceNegativePrompt": "ネガティブプロンプト",
  "trackers": [
    {
      "name": "tracker_id",
      "display_name": "表示名",
      "type": "numeric",
      "initial_value": 50,
      "max_value": 100,
      "min_value": 0,
      "category": "status",
      "persistent": true,
      "description": "説明"
    }
  ]
}
```

## 🎨 絵文字ガイド

### **キャラクター別絵文字**
- 🧝‍♀️ - エルフ系キャラクター
- 👩‍⚕️ - 看護師・医療系
- 😈 - ドラゴン・悪魔系
- 👮‍♀️ - 警察・捜査官系
- 👸 - 王族・貴族系
- 🤖 - ロボット・AI系
- 🎭 - その他・汎用

### **AIモデル別カラー**
- 🤖 **Gemini** - 青系（#667eea）
- 🔥 **Claude** - オレンジ系（#ff6347）
- ⚡ **Grok** - 緑系（#16a34a）

## ⚡ 自動化スクリプト

### **add-character.js**
```bash
# 使用例
node add-character.js "新キャラクター名"
node add-character.js "魔法使いエリカ" "🧙‍♀️"
```

### **convert-to-foldable.js**
```bash
# 既存ファイルを折りたたみ形式に変換
node convert-to-foldable.js
```

## 📈 メリット

### **編集面**
- ✅ エディターで見やすい折りたたみ構造
- ✅ 必要な部分のみ展開して編集可能
- ✅ キャラクター追加が簡単
- ✅ 大量のキャラクターでもスクロールしやすい

### **表示面**
- ✅ ブラウザで美しい表示
- ✅ 検索・フィルタリング機能
- ✅ AIモデル別の色分け
- ✅ レスポンシブデザイン

### **管理面**
- ✅ AIモデル別にファイル分離
- ✅ 自動化スクリプトで効率化
- ✅ 既存システムとの互換性維持

## 🔧 トラブルシューティング

### **Q: ビューワーでキャラクターが表示されない**
A: マークダウンファイルのJSON形式を確認してください。特に`{}`の対応とカンマの有無をチェック。

### **Q: 新しいキャラクターが追加できない**
A: `character-template.md`を参考に、正しい形式で追加してください。

### **Q: 折りたたみが効かない**
A: エディターがMarkdownの`<details>`タグに対応していることを確認してください。

---

**最終更新**: 2025年8月3日  
**バージョン**: 1.0.0