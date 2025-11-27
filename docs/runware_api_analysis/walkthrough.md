# 画像表示ロジックの分析結果

このプロジェクトでは、生成された画像を以下の2つの方法で表示する仕組みになっています。

## 1. 明示的な画像フィールド（推奨）
APIから画像URLが返された場合、メッセージオブジェクトに `image` プロパティとしてURLを設定し、専用の `<img>` タグで表示します。

### 実装箇所
- **`src/hooks/useChatLogic.ts`**:
  ```typescript
  const imageMessage: Message = {
    // ...
    content: `画像を生成しました: ${prompt}`,
    image: result.data.imageUrl, // ここでURLを設定
    // ...
  };
  ```
- **`src/components/chat/MessageArea.tsx`**:
  ```typescript
  {msg.image && (
    <div className="mb-3">
      <img src={msg.image} ... />
    </div>
  )}
  ```

## 2. Markdown画像リンク（バックアップ）
メッセージ本文（`content`）にMarkdown形式の画像リンク `![alt](url)` が含まれている場合、MarkdownパーサーによってHTMLの `<img>` タグに変換されます。

### 実装箇所
- **`lib/markdown.ts`**: `marked` ライブラリを使用してMarkdownをHTMLに変換します。
- **`src/components/chat/MessageArea.tsx`**: `FormattedText` コンポーネントを使用してレンダリングします（ただし、現在のコードにはバグがあり、修正が必要です）。

## 結論
他のプロジェクトで画像がMarkdownテキストのまま表示される場合、以下のいずれかの原因が考えられます：
1.  **Markdown変換が行われていない**: 生のテキストとして表示している。
2.  **画像フィールドを使っていない**: APIレスポンスの画像URLをメッセージの `image` プロパティとして扱わず、テキストとして結合している。

このプロジェクトの `useChatLogic.ts` のように、画像URLを別のプロパティとして管理し、UI側で明示的に `<img>` タグとしてレンダリングする方法を参考にすると良いでしょう。
