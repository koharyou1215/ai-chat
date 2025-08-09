'use client';

import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { AppSettings } from '../types/app';

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
            value={formSettings.inspirationPrompt || `# ユーザー返信生成AI

あなたは自然で魅力的なユーザー返信を生成する専門AIです。与えられた情報を基に、ユーザーが実際に返しそうなリアルな返信を1つ作成してください。

## 入力情報

### キャラクター情報
- **名前**: {{char}}
- **性格・特徴**: {character.character_definition || character.description || '不明'}

### ユーザー情報
- **名前**: {persona.name}
- **性格**: {persona.description}
- **好み**: {persona.likes?.join(', ') || 'なし'}
- **苦手**: {persona.dislikes?.join(', ') || 'なし'}
- **口調・特徴**: {persona.other_settings || 'なし'}

### 会話データ
- **キャラクターの最新発言**: 「{lastCharacterMessage}」
- **直近の会話流れ**: {recentConversation}

## 生成要件

### 必須条件
1. **文字数**: 100～150文字（句読点含む）
2. **口調**: ユーザーの設定された口調・性格を忠実に反映
3. **会話継続**: 自然に会話が発展する内容
4. **関係性**: {{char}}との親しみ度に適した表現
5. **自然性**: 実際の人間が返しそうなリアルな反応

### 避けるべき表現
- 「そうなんですね」「なるほど」
- 「詳しく聞かせて」「教えて」
- 「{{char}}さんらしい」「さすが」
- その他の定型的・機械的な相槌

### 推奨する要素
- ユーザーの個性が表れる独特な反応
- 感情や驚き、興味を自然に表現
- 会話に新しい要素や視点を加える
- キャラクターの発言への具体的な反応や感想

## 出力要件
**返信候補のみを1つ出力してください。説明や解説は不要です。**`}
            onChange={(e) => {
              console.log('電球プロンプト更新:', e.target.value.substring(0, 100) + '...');
              setFormSettings(prev => ({ ...prev, inspirationPrompt: e.target.value }));
            }}
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
            value={formSettings.enhancementPrompt || `# 文章強化プロンプト

あなたは文章表現強化の専門家です。与えられたテキストを、読者が鮮明に情景を想像できる詳細な描写に変換してください。

## 入力情報
- 会話の文脈：{conversationContext}
- 強化対象テキスト：{text}

## 強化指針
1. **内容の保持**：元テキストの意図・場面進行を完全に維持
2. **描写の焦点**：「どのように」という動作の詳細に重点を置く
3. **表現の深化**：五感に訴える具体的で臨場感のある描写を追加
4. **文字数**：100～150文字程度に調整

## 創作設定
- ジャンル：創作フィクション（ファンタジー要素含む）
- 表現レベル：R-18対応

## 出力形式
- 強化されたテキストのみを出力
- 説明文、解説、JSON形式は一切使用しない
- {{char}}の台詞や行動は絶対に追加しない
- {{user}}視点の動作描写のみに集中`}
            onChange={(e) => {
              console.log('キラキラプロンプト更新:', e.target.value.substring(0, 100) + '...');
              setFormSettings(prev => ({ ...prev, enhancementPrompt: e.target.value }));
            }}
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