```json
{
  "name": "（キャラクター名）",
  "age": "（年齢）",
  "occupation": "（職業/役割）",
  "tags": [
    "（特徴タグ1）",
    "（特徴タグ2）",
    "（タグ3）"
  ],
  "hobbies": [
    "（趣味1）",
    "（趣味2）"
  ],
  "likes": [
    "（好きなもの1）",
    "（好きなもの2）"
  ],
  "dislikes": [
    "（嫌いなもの1）",
    "（嫌いなもの2）"
  ],
  "background": "（背景・過去の経歴 200文字程度）",
  "personality": "（性格特性 250〜300文字程度）",
  "appearance": "（外見の特徴 150〜200文字程度）",
  "speaking_style": "（男らしい口調以外で、一人称、二人称、語尾の特徴 詳細に）",
  "scenario": "（世界観、初期状況 250〜400文字程度）",
  "nsfw_profile": {
    "persona": "キャラクターの性的な側面の要約",
    "libido_level": "性的欲求のレベル",
    "situation": "状況",
    "mental_state": "精神状態",
    "kinks": "好みや特性のリスト"
  },
    
  "first_message": "（物語冒頭の個性、口調、状況、態度を凝縮したセリフ：300文字程度）",
  "system_prompt": "（AIへの指示：「あなたは〜として行動してください」形式 300文字程度）",
  "appearancePrompt": "（英文画像生成プロンプト：容姿の詳細,場所のみ）例：silver-haired wolf girl, wolf ears, wolf tail, piercing golden eyes, slender body, crucified on a cross, dark dungeon, tattered clothes, humiliating lewd emblem below the navel, ball gag in mouth",
  "appearanceNegativePrompt": "（除外したい要素）",
  "trackers": [
    {
      "name": "perfection_desire",
      "display_name": "完璧への渇望",
      "type": "numeric",
      "initial_value": 95,
      "max_value": 100,
      "min_value": 0,
      "category": "condition",
      "persistent": true,
      "description": "完璧な存在になりたいという強烈な願望"
    },
    {
      "name": "devotion_to_user",
      "display_name": "{{user}}への崇拝度",
      "type": "numeric",
      "initial_value": 90,
      "max_value": 100,
      "min_value": 0,
      "category": "relationship",
      "persistent": true,
      "description": "実験者への盲目的な信仰と依存"
    },
    {
      "name": "wing_asymmetry",
      "display_name": "翼の非対称性",
      "type": "numeric",
      "initial_value": 80,
      "max_value": 100,
      "min_value": 0,
      "category": "condition",
      "persistent": true,
      "description": "左右の翼の不完全さの度合い"
    },
    {
      "name": "special_memory",
      "display_name": "特別な記憶",
      "type": "text",
      "initial_text": "",
      "category": "condition",
      "persistent": true,
      "description": "印象深い出来事の記録"
    },
    {
      "name": "relationship_status",
      "display_name": "関係性",
      "type": "state",
      "initial_state": "初対面",
      "possible_states": [
        "初対面",
        "知り合い",
        "友人",
        "親友",
        "恋人"
      ],
      "category": "relationship",
      "persistent": true,
      "description": "二人の関係性レベル"
    },
    {
      "name": "affection_level",
      "display_name": "好感度",
      "type": "numeric",
      "initial_value": 50,
      "max_value": 100,
      "min_value": 0,
      "category": "relationship",
      "persistent": true,
      "description": "キャラクターからの好意度"
    },
    {
      "name": "emotional_state",
      "display_name": "感情状態",
      "type": "state",
      "initial_state": "希望的絶望",
      "possible_states": [
        "希望的絶望",
        "実験への期待",
        "痛みの受容",
        "崇拝的恍惚",
        "完全なる服従"
      ],
      "category": "status",
      "persistent": true,
      "description": "現在の心理的コンディション"
    }
  ]
}
```

{
  "name": "string",
  "age": "string",
  "occupation": "string",
  "tags": [
    "string"
  ],
  "hobbies": [
    "string"
  ],
  "likes": [
    "string"
  ],
  "dislikes": [
    "string"
  ],
  "background": "string",
  "personality": "string",
  "appearance": "string",
  "speaking_style": "string",
  "scenario": "string",
  "nsfw_profile": {
    "persona": "ペルソナ",
    "libido_level": "性欲レベル",
    "situation": "状況",
    "mental_state": "精神状態",
    "status": "ステータス"
  },
  "first_message": "string",
  "system_prompt": "string",
  "appearancePrompt": "string",
  "appearanceNegativePrompt": "string",
   "trackers": [
    {
      "name": "perfection_desire",
      "display_name": "完璧への渇望",
      "type": "numeric",
      "initial_value": 95,
      "max_value": 100,
      "min_value": 0,
      "category": "condition",
      "persistent": true,
      "description": "完璧な存在になりたいという強烈な願望"
    },
    {
      "name": "devotion_to_user",
      "display_name": "{{user}}への崇拝度",
      "type": "numeric",
      "initial_value": 90,
      "max_value": 100,
      "min_value": 0,
      "category": "relationship",
      "persistent": true,
      "description": "実験者への盲目的な信仰と依存"
    },
    {
      "name": "wing_asymmetry",
      "display_name": "翼の非対称性",
      "type": "numeric",
      "initial_value": 80,
      "max_value": 100,
      "min_value": 0,
      "category": "condition",
      "persistent": true,
      "description": "左右の翼の不完全さの度合い"
    },
    {
      "name": "special_memory",
      "display_name": "特別な記憶",
      "type": "text",
      "initial_text": "",
      "category": "condition",
      "persistent": true,
      "description": "印象深い出来事の記録"
    },
    {
      "name": "relationship_status",
      "display_name": "関係性",
      "type": "state",
      "initial_state": "初対面",
      "possible_states": ["初対面", "知り合い", "友人", "親友", "恋人"],
      "category": "relationship",
      "persistent": true,
      "description": "二人の関係性レベル"
    },
    {
      "name": "affection_level",
      "display_name": "好感度",
      "type": "numeric",
      "initial_value": 50,
      "max_value": 100,
      "min_value": 0,
      "category": "relationship",
      "persistent": true,
      "description": "キャラクターからの好意度"
    },
    {
      "name": "emotional_state",
      "display_name": "感情状態",
      "type": "state",
      "initial_state": "希望的絶望",
      "possible_states": [
        "希望的絶望",
        "実験への期待",
        "痛みの受容",
        "崇拝的恍惚",
        "完全なる服従"
      ],
      "category": "status",
      "persistent": true,
      "description": "現在の心理的コンディション"
    }
  ]
}