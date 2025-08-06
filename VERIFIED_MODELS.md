# ✅ 実働確認済みモデル一覧

## 🔒 **絶対に削除・変更禁止**

以下のモデルは実際の運用で動作確認済みです。**絶対に削除や変更をしないでください。**

### **確認済みモデル**

| モデル | プロバイダ | 状態 | 備考 |
|--------|-----------|------|------|
| `anthropic/claude-3.5-sonnet` | OpenRouter | ✅ 実働確認済み | 4.0 Sonnet |
| `x-ai/grok-beta` | OpenRouter | ✅ 実働確認済み | Grok 4 |
| `deepseek/deepseek-chat` | OpenRouter | ✅ 実働確認済み | DeepSeek 3 |

### **Gemini 直接API (確認済み)**

| モデル | プロバイダ | 状態 |
|--------|-----------|------|
| `gemini-1.5-flash` | Google直接 | ✅ 実働確認済み |
| `gemini-1.5-pro` | Google直接 | ✅ 実働確認済み |
| `gemini-2.5-flash` | Google直接 | ✅ 実働確認済み |
| `gemini-2.5-pro` | Google直接 | ✅ 実働確認済み |

## 🚨 **重要な注意事項**

1. **削除禁止**: 上記のモデルは実際の業務で使用されており、削除すると機能が停止します
2. **設定保持**: クイック設定とAPIの対応関係を維持してください
3. **優先配置**: 確認済みモデルは選択リストの上部に配置しています

## 📋 **コード内の配置場所**

- `components/QuickSettingsModal.tsx` - クイック設定のモデル選択
- `src/app/api/simple-chat/route.ts` - メインチャット機能
- `src/app/api/user-inspiration/route.ts` - 返信提案機能  
- `src/app/api/enhance-text/route.ts` - 文章強化機能

**⚠️ これらのファイルでモデル設定を変更する際は、必ず確認済みモデルを保持してください。**
