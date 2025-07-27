// 既存のSettingsModal.tsxファイルを新しいモデル設定で更新するパッチ

// ステップ1: インポート部分に追加
// import { OPENROUTER_MODELS, MODEL_DISPLAY_NAMES, DEFAULT_MODELS } from '../src/config/model-config';

// ステップ2: プロバイダー変更時のデフォルトモデル修正
const defaultModel = provider === 'openrouter' ? 'google/gemini-2.5-pro' : 'gemini-2.5-flash';

// ステップ3: モデル選択のリスト修正
{(formSettings.provider === 'openrouter'
  ? Object.values(OPENROUTER_MODELS)
  : formSettings.provider === 'gemini'
  ? ['gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite-preview-06-17']
  : []
).map(modelId => (
  <option key={modelId} value={modelId}>
    {formSettings.provider === 'openrouter' 
      ? MODEL_DISPLAY_NAMES[modelId] || modelId
      : modelId
    }
  </option>
))}

// ステップ4: プロバイダー選択肢の順序変更
<option value="openrouter">OpenRouter（推奨）</option>
<option value="gemini">Gemini</option>
