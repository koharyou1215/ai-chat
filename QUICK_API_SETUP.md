# 🚀 APIキー即座設定ガイド

## **🔑 必要なAPIキー**

### **1. OpenRouter API** (必須)
- **取得先**: https://openrouter.ai/
- **使用量**: 無料〜有料プラン
- **設定場所**: `.env.local` の `OPENROUTER_API_KEY`

### **2. Google Gemini API** (推奨)
- **取得先**: https://makersuite.google.com/app/apikey
- **使用量**: 無料枠大きい
- **設定場所**: `.env.local` の `GOOGLE_API_KEY`

### **3. Runware API** (画像生成)
- **取得先**: https://runware.ai/
- **使用量**: 無料枠あり
- **設定場所**: `.env.local` の `RUNWARE_API_KEY`

---

## **📝 設定手順**

### **Step 1: .env.localファイル編集**
```bash
# ファイルを開いて編集
code .env.local
```

### **Step 2: APIキーを実際の値に置換**
```bash
# 例（実際のキーに置換してください）
OPENROUTER_API_KEY=sk-or-v1-abc123def456...
GOOGLE_API_KEY=AIzaSyAbc123Def456...
RUNWARE_API_KEY=zj7h0aPEZpgG4Gc...
```

### **Step 3: 開発サーバー再起動**
```bash
# Ctrl+C で停止
# 再起動
npm run dev
```

---

## **⚡ 即座テスト方法**

### **テスト1: チャット機能**
1. ブラウザで http://localhost:3004
2. 「こんにちは」と送信
3. ✅ AI返信が正常表示

### **テスト2: 画像生成**
1. 設定 → UI設定 → 画像生成を有効化 ✓
2. チャット送信
3. ✅ キャラクター画像が自動生成

---

## **🛠️ トラブルシューティング**

### **401エラー（認証失敗）**
```
OpenRouter HTTP 401: No auth credentials found
```
**解決**: APIキーが正しく設定されているか確認

### **400エラー（リクエスト不正）**
```
Runware API error: 400 Bad Request
```
**解決**: Runware APIキーとモデルIDを確認

### **設定画面から直接設定**
1. **設定 → API設定**
2. 各APIキーを直接入力
3. 保存 → 再テスト

---

## **💡 設定確認コマンド**

```bash
# 環境変数が読み込まれているか確認
echo $OPENROUTER_API_KEY
echo $GOOGLE_API_KEY
echo $RUNWARE_API_KEY
```

---

**最終更新**: 2025年8月4日