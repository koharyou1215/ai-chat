# 🚀 Supabase完全セットアップガイド

## 📋 概要
AI Chatプロジェクトにクラウド同期機能を追加するための完全手順

---

## 🆕 Step 1: Supabaseアカウント作成

### 1-1. Supabaseサイトにアクセス
```
https://supabase.com/
```

### 1-2. アカウント作成
1. **「Start your project」**をクリック
2. **GitHub**、**Google**、または**メール**でサインアップ
3. メール認証を完了

### 1-3. 新しいプロジェクト作成
1. **「New Project」**をクリック
2. **Organization**: Personal（または新規作成）
3. **Project name**: `ai-chat-sync`
4. **Database Password**: 強固なパスワードを設定
5. **Region**: `Northeast Asia (Tokyo)`
6. **「Create new project」**をクリック

---

## 🔧 Step 2: データベーステーブル作成

### 2-1. SQL Editorでテーブル作成
1. Supabaseダッシュボードで**「SQL Editor」**をクリック
2. **「New query」**をクリック
3. 以下のSQLをコピー&ペースト：

```sql
-- ユーザー設定テーブル
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- キャラクターテーブル
CREATE TABLE user_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ペルソナテーブル
CREATE TABLE user_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- チャット履歴テーブル
CREATE TABLE user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  history_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- メモテーブル
CREATE TABLE user_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memo_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) 有効化
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memos ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成（ユーザーは自分のデータのみアクセス可能）
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own characters" ON user_characters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own characters" ON user_characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON user_characters
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON user_characters
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own personas" ON user_personas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personas" ON user_personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personas" ON user_personas
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own personas" ON user_personas
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own history" ON user_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON user_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON user_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON user_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memos" ON user_memos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memos" ON user_memos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memos" ON user_memos
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memos" ON user_memos
  FOR DELETE USING (auth.uid() = user_id);
```

4. **「RUN」**をクリック
5. ✅ Success が表示されればOK

### 2-2. 認証設定
1. **「Authentication」** → **「Settings」**をクリック
2. **「Email」**タブで以下を確認：
   - **Enable email confirmations**: OFF（テスト用）
   - **Enable email change confirmations**: OFF（テスト用）
3. **「Save」**をクリック

---

## 🔑 Step 3: API情報取得

### 3-1. プロジェクト設定から情報取得
1. **「Settings」** → **「API」**をクリック
2. 以下をコピー：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 💻 Step 4: Vercel環境変数設定

### 4-1. Vercel環境変数追加
```bash
# Vercel CLIで設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
# → https://xxx.supabase.co を入力

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
# → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... を入力
```

### 4-2. ローカル環境設定
`.env.local`ファイルを作成：
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Step 5: デプロイとテスト

### 5-1. デプロイ
```bash
npm run build
vercel --prod
```

### 5-2. 動作テスト
1. デプロイ完了後、アプリにアクセス
2. **設定 → その他 → クラウド同期**をクリック
3. **メールアドレス**を入力
4. **「認証メール送信」**をクリック
5. ✅ 「認証メール送信成功」が表示されればOK

---

## 🛠️ トラブルシューティング

### 問題1: テーブル作成エラー
```
ERROR: relation "user_settings" already exists
```
**解決法**: 既存テーブルを削除してから再作成
```sql
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_characters CASCADE;
DROP TABLE IF EXISTS user_personas CASCADE;
DROP TABLE IF EXISTS user_history CASCADE;
DROP TABLE IF EXISTS user_memos CASCADE;
```

### 問題2: 認証エラー
```
AuthSessionMissingError
```
**解決法**: 
1. Supabase設定で「Email confirmations」をOFFに
2. ブラウザのLocalStorageをクリア

### 問題3: 環境変数認識されない
```
Supabase未設定
```
**解決法**:
1. Vercelダッシュボードで環境変数を確認
2. 再デプロイ実行: `vercel --prod --force`

---

## 📋 チェックリスト

### Supabase側
- [ ] プロジェクト作成完了
- [ ] SQLテーブル作成完了  
- [ ] RLS設定完了
- [ ] 認証設定完了
- [ ] API情報取得完了

### Vercel側
- [ ] 環境変数追加完了
- [ ] デプロイ完了
- [ ] 動作テスト完了

### アプリ側
- [ ] クラウド同期画面表示
- [ ] メール認証送信成功
- [ ] データ同期テスト完了

---

## 🎯 完了後の機能

### ✅ 利用可能機能
- 設定のクラウド同期
- キャラクターのクラウド同期  
- ペルソナのクラウド同期
- チャット履歴のクラウド同期
- メモのクラウド同期
- データの完全エクスポート

### 📱 使い方
1. **設定 → その他 → クラウド同期**
2. メールアドレスで認証
3. **「アップロード」**でデータ保存
4. **「ダウンロード」**でデータ復元

---

**最終更新**: 2025年8月4日  
**対応版本**: ai-chat v2.0.0