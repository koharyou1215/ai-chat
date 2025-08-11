/**
 * 新しいキャラクターを折りたたみ形式で追加するスクリプト
 * 使用方法: node add-character.js "キャラクター名" [絵文字]
 */
const fs = require('fs');
const path = require('path');

function addNewCharacter(characterName, emoji = '🎭') {
  const inputFile = 'gemini_output_character.md';
  
  try {
    // 既存ファイルを読み込み
    let content = fs.readFileSync(inputFile, 'utf8');
    
    // キャラクター番号を計算
    const characterCount = (content.match(/# [🧝‍♀️👩‍⚕️😈👮‍♀️👸🤖🎭]/g) || []).length + 1;
    
    // 新しいキャラクターテンプレート
    const newCharacterTemplate = `

# ${emoji} キャラクター${characterCount}: ${characterName}

<details>
<summary>📝 キャラクター詳細（クリックで展開/折りたたみ）</summary>

\`\`\`json
{
"name": "${characterName}",
"age": "[年齢を入力]",
"occupation": "[職業を入力]",
"tags": ["[タグ1]", "[タグ2]", "[タグ3]"],
"hobbies": ["[趣味1]", "[趣味2]"],
"likes": ["[好きなもの1]", "[好きなもの2]"],
"dislikes": ["[嫌いなもの1]", "[嫌いなもの2]"],
"background": "[背景設定を入力]",
"personality": "[性格を入力]",
"appearance": "[外見を入力]",
"speaking_style": "[話し方を入力]",
"scenario": "[シナリオを入力]",
"nsfw_profile": "[NSFW設定を入力]",
"first_message": [
"「[第1メッセージを入力]」",
"「[第2メッセージを入力]」",
"「[第3メッセージを入力]」"
],
"systemPrompt": "[システムプロンプトを入力]",
"appearancePrompt": "[外見プロンプトを入力]",
"appearanceNegativePrompt": "[ネガティブプロンプトを入力]",
"trackers": [
{
"name": "example_tracker",
"display_name": "サンプルトラッカー",
"type": "numeric",
"initial_value": 50,
"max_value": 100,
"min_value": 0,
"category": "status",
"persistent": true,
"description": "説明を入力してください"
}
]
}
\`\`\`

</details>

---`;

    // ファイルの最後に追加
    content += newCharacterTemplate;
    
    // ファイルに書き出し
    fs.writeFileSync(inputFile, content, 'utf8');
    
    console.log(`✅ キャラクター「${characterName}」を追加しました！`);
    console.log(`📝 ファイルを開いて詳細を編集してください: ${inputFile}`);
    console.log(`🎯 追加位置: キャラクター${characterCount}`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

// コマンドライン引数を処理
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('使用方法: node add-character.js "キャラクター名" [絵文字]');
  console.log('例: node add-character.js "新キャラクター" "🌟"');
  process.exit(1);
}

const characterName = args[0];
const emoji = args[1] || '🎭';

addNewCharacter(characterName, emoji);