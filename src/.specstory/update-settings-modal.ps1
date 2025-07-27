// PowerShellスクリプト: 設定モーダルを新しいモデル設定で更新

$settingsFile = "components\SettingsModal.tsx"

# 1. インポートを追加
$content = Get-Content $settingsFile
$importIndex = $content | Select-String -Pattern "import.*VoiceManager" | Select-Object -First 1 | ForEach-Object { $_.LineNumber }
$newImport = "import { OPENROUTER_MODELS, MODEL_DISPLAY_NAMES, DEFAULT_MODELS } from '../src/config/model-config';"
$content = $content[0..($importIndex-1)] + $newImport + $content[$importIndex..($content.Length-1)]

# 2. デフォルトモデルを修正
$content = $content -replace "const defaultModel = provider === 'gemini' \? 'gemini-2\.5-flash' : 'openai/gpt-4o-mini';", 
    "const defaultModel = provider === 'openrouter' ? 'google/gemini-2.5-pro' : 'gemini-2.5-flash';"

# 3. モデル選択リストを修正
$oldModelList = "\{\(formSettings\.provider === 'gemini'.*?\]\)"
$newModelList = @"
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
"@

$content = $content -replace $oldModelList, $newModelList -replace "`r`n", "`n"

# 4. プロバイダー選択の順序変更
$content = $content -replace '<option value="gemini">Gemini</option>\s*<option value="openrouter">OpenRouter</option>', 
    '<option value="openrouter">OpenRouter（推奨）</option><option value="gemini">Gemini</option>'

Set-Content $settingsFile $content

Write-Host "設定モーダルのモデル設定を更新しました"
