
# 🚀 AI Chat プロジェクト開発ガイドライン v4.0

## プロジェクト概要
Next.js 15.3.4ベースのAIチャットアプリ。美しいUI/UX・キャラクター/ペルソナ/トラッカー/画像管理をJSONで実現。モジュラー設計・レスポンシブ・永続化重視。

---

## 技術・設計要点
- **Next.js 15.3.4 (App Router)**
- **TailwindCSS + カスタムCSS**
- **Lucide Reactアイコン**
- **React Hooks (useState, useEffect)**
- **JSONデータ管理**

### ディレクトリ例
```
src/app/    # App Router, API, メインチャット
public/     # キャラクター・ペルソナJSON, 画像
components/ # UIコンポーネント
lib/        # 共通ロジック
stores/     # Zustandストア
types/      # 型定義
```

---

## 実装機能・進行状況

### コア機能
- チャットUI（glassmorphism, アニメーション, レスポンシブ）
- キャラクター/ペルソナ/トラッカー/画像管理
- 設定・カスタマイズの永続化
- API連携（画像保存・キャラクター更新）

### UI/UX
- アニメーション（カード登場・キラキラ・プログレスバー）
- モーダル（設定・ギャラリー・編集・インスピレーション）
- トラッカーパネル（カテゴリ色分け・開閉）

### データ仕様
- キャラクター/ペルソナ/トラッカー: JSON形式
- 画像: JPG, PNG, WebP, GIF
- 動画: MP4, WebM（予定）

---

## データ形式例

### キャラクター
```json
{
  "name": "キャラクター名",
  ... // 省略（詳細は従来通り）
  "trackers": [
    { "name": "relationship_status", "type": "state", ... }
  ]
}
```
### ペルソナ
```json
{
  "name": "ペルソナ名",
  ...
}
```
### トラッカー型
- numeric: 数値型（プログレスバー）
- state: 状態型（バッジ）
- boolean: ブール型（ON/OFF）

---

## デザイン・レスポンシブ
- glassmorphism, カラーパレット, アニメーション
- デスクトップ: 3カラム, タブレット: 2カラム, モバイル: 1カラム

---

## コーディング・設計ルール
- TypeScript厳格型
- 機能ごとにコンポーネント分割（500行超で分割）
- 共通処理はlib/utils等に集約
- 型定義はtypes/に集約
- ファイル名: PascalCase(コンポーネント), kebab-case(API)
- CSSはTailwind優先

---

## 開発フロー
1. 要件定義 → 設計 → 実装 → テスト → リファクタ → ドキュメント更新
2. デバッグ: 現象確認→原因特定→修正→テスト→予防策

---

## 進行中・今後の課題
- キャラクター編集モーダル全対応
- 画像処理（リサイズ・圧縮・アスペクト比）
- MP4動画背景
- ファイルアップロード（URL/選択両対応）
- 永続化の安定化
- チャットAPI連携
- トラッカー自動更新
- page.tsxのモジュール分割
- モバイル最適化
- 大規模データ/音声/Live2D対応（将来）

---

## 参考リソース
- [Next.js 15 App Router](https://nextjs.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev/icons/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Glassmorphism Generator](https://glassmorphism.com/)
- [CSS Animation Library](https://animate.style/)
- [Color Palette Generator](https://coolors.co/)

---

**最終更新**: 2025年8月12日 / v4.0（リビルド版）
**開発状況**: Phase 2 進行中

💡 このガイドラインは機能追加・変更のたびに必ず更新してください。