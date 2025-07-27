'use client';

import { AppSettings } from '../../types/app';

interface PromptSettingsProps {
  formSettings: AppSettings;
  setFormSettings: (prev: (prevSettings: AppSettings) => AppSettings) => void;
}

export default function PromptSettings({ formSettings, setFormSettings }: PromptSettingsProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">プロンプト設定</h3>
      <div className="space-y-4">
        {/* 電球（インスピレーション）プロンプト */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💡 電球（インスピレーション）プロンプト
          </label>
          <textarea
            value={formSettings.inspirationPrompt || `あなたは創作的で自然なユーザー返信を提案する専門AIです.\n\n【キャラクター情報】\n名前: {{char}}\n性格・特徴: {character.character_definition || character.description || '不明'}\n\n【ユーザー情報】\n{persona ? '名前: {persona.name}\n性格: {persona.description}\n好み: {persona.likes?.join(', ') || 'なし'}\n苦手: {persona.dislikes?.join(', ') || 'なし'}\n口調・特徴: {persona.other_settings || 'なし'}' : '一般的なユーザー（名前なし）'}\n\n【最新のキャラクター発言】\n「{lastCharacterMessage}」\n\n【会話の文脈】\n{recentConversation}\n\n【重要指示】\n上記の会話文脈を踏まえて、ユーザーが自然に返しそうな返信を1つ作成してください。\n\n【要件】\n- 50-70文字程度\n- ユーザーの性格・口調を反映\n- 会話を自然に発展させる内容\n- {{char}}との関係性に適した親しみ度\n- 創造的で自然な表現\n\n【禁止語】\n「そうなんですね」「なるほど」「詳しく聞かせて」「{{char}}さんらしい答えですね」\n\n自然な返信:`}
            onChange={(e) => setFormSettings(prev => ({ ...prev, inspirationPrompt: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            rows={8}
            placeholder="電球ボタン用のプロンプトを入力..."
          />
          <p className="text-xs text-gray-500 mt-1">
            電球ボタン（💡）で使用されるプロンプトです。{`{character.name}`}、{`{persona}`}、{`{lastCharacterMessage}`}、{`{recentConversation}`} が変数として使用できます。
          </p>
        </div>

        {/* キラキラ（文章強化）プロンプト */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ✨ キラキラ（文章強化）プロンプト
          </label>
          <textarea
            value={formSettings.enhancementPrompt || `以下のユーザーのテキストを、より魅力的で表現豊かな文章に強化してください。\n\n{conversationContext}\n\n【元のテキスト】\n{text}\n\n【強化の方向性】\n- 感情や気持ちをより具体的で魅力的に表現\n- 状況や背景をより詳しく魅力的に説明\n- ユーザーらしい自然で魅力的な表現\n- 会話の流れを考慮した自然な表現\n- 300-400字程度に大幅強化\n- 絵文字や感情表現を適切に追加\n- より魅力的で面白い表現に変更\n\n【重要な指示】\n- 元のテキストの意図や内容は保持してください\n- ユーザーとして自然で魅力的な表現にしてください\n- 会話の流れを考慮して自然な表現にしてください\n- 大幅に強化して魅力的にしてください\n- JSON形式ではなく、強化されたテキストのみを返してください\n- 遠慮せずに魅力的で面白い表現にしてください\n\n強化されたテキスト:`}
            onChange={(e) => setFormSettings(prev => ({ ...prev, enhancementPrompt: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            rows={8}
            placeholder="キラキラボタン用のプロンプトを入力..."
          />
          <p className="text-xs text-gray-500 mt-1">
            キラキラボタン（✨）で使用されるプロンプトです。{`{text}`}、{`{conversationContext}`} が変数として使用できます。
          </p>
        </div>
      </div>
    </section>
  );
} 