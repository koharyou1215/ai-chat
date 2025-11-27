# 画像表示不具合修正計画

## ゴール
生成された画像がMarkdownリンクのテキスト（`![Generated Image](...)`）として表示されてしまう問題を解決し、正しく画像として表示されるようにする。

## 原因
`src/components/chat/MessageArea.tsx` において、`FormattedText` コンポーネントを使用する際に、期待される `md` プロパティではなく `text` プロパティを渡しているため、Markdownのレンダリング（画像変換を含む）が行われていない。

## 変更内容

### UIコンポーネント
#### [MODIFY] [MessageArea.tsx](file:///c:/script/ai-chat/src/components/chat/MessageArea.tsx)
- `FormattedText` コンポーネントへのプロパティ渡しを修正します。
```diff
- <FormattedText text={msg.content} />
+ <FormattedText md={msg.content} />
```

## 検証計画
### 手動検証
- 修正後、ユーザーに画像生成を試してもらい、画像が正しく表示されることを確認していただく。
