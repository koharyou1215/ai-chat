/**
 * Geminiキャラクターファイルを折りたたみ対応形式に変換するスクリプト
 * Node.js で実行: node convert-to-foldable.js
 */
const fs = require('fs');
const path = require('path');

function convertToFoldableFormat() {
  const inputFile = 'gemini_output_character.md';
  const outputFile = 'gemini_character_foldable.md';
  
  try {
    // ファイル読み込み
    const content = fs.readFileSync(inputFile, 'utf8');
    
    // 既に変換済みの部分は保持し、残りを変換
    const lines = content.split('\n');
    const result = [];
    let inJsonBlock = false;
    let currentCharacter = null;
    let jsonContent = [];
    let characterCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 既に変換済みのキャラクターはそのまま保持
      if (line.startsWith('# 🧝‍♀️') || line.startsWith('# 👩‍⚕️')) {
        // 既に変換済み、そのまま追加
        while (i < lines.length && !lines[i].startsWith('---')) {
          result.push(lines[i]);
          i++;
        }
        if (i < lines.length) result.push(lines[i]); // --- も追加
        continue;
      }
      
      // 新しいJSONブロックの開始
      if (line.trim() === '{' && i > 0 && lines[i-1].trim() === '---') {
        inJsonBlock = true;
        jsonContent = [line];
        continue;
      }
      
      // JSONブロック内
      if (inJsonBlock) {
        jsonContent.push(line);
        
        // キャラクター名を検出
        if (line.includes('"name":') && !currentCharacter) {
          const match = line.match(/"name":\s*"([^"]+)"/);
          if (match) {
            currentCharacter = match[1];
          }
        }
        
        // JSONブロック終了
        if (line.trim() === '}' && jsonContent.length > 5) {
          characterCount++;
          
          // 絵文字とキャラクター番号を決定
          const emoji = getCharacterEmoji(currentCharacter, characterCount);
          
          // 変換済み形式で出力
          result.push('');
          result.push(`# ${emoji} キャラクター${characterCount}: ${currentCharacter}`);
          result.push('');
          result.push('<details>');
          result.push('<summary>📝 キャラクター詳細（クリックで展開/折りたたみ）</summary>');
          result.push('');
          result.push('```json');
          result.push(...jsonContent);
          result.push('```');
          result.push('');
          result.push('</details>');
          result.push('');
          result.push('---');
          
          // リセット
          inJsonBlock = false;
          currentCharacter = null;
          jsonContent = [];
        }
        continue;
      }
      
      // その他の行はそのまま追加（ただし既に変換済みでない場合）
      if (!line.startsWith('#') && line.trim() !== '---' && line.trim() !== '') {
        result.push(line);
      }
    }
    
    // ファイル出力
    fs.writeFileSync(outputFile, result.join('\n'), 'utf8');
    console.log(`✅ 変換完了！ ${outputFile} を確認してください。`);
    console.log(`📊 変換されたキャラクター数: ${characterCount}`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

function getCharacterEmoji(characterName, count) {
  if (characterName.includes('フィリア')) return '🧝‍♀️';
  if (characterName.includes('詩織')) return '👩‍⚕️';
  if (characterName.includes('澪')) return '😈';
  if (characterName.includes('水無月') || characterName.includes('玲')) return '👮‍♀️';
  if (characterName.includes('リリス')) return '👸';
  if (characterName.includes('アズリエル')) return '🤖';
  return '🎭'; // デフォルト
}

// 実行
convertToFoldableFormat();