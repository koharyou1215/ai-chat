const fs = require('fs');
const path = require('path');

// Grokキャラクターファイルを個別JSONファイルに変換
async function convertGrokCharacters() {
  console.log('🔄 Grokキャラクター変換開始...');
  
  try {
    // Grokキャラクターファイルを読み込み
    const grokFilePath = path.join(__dirname, 'grok_output_character.md');
    const grokContent = fs.readFileSync(grokFilePath, 'utf8');
    
    // JSONブロックを分割
    const characterBlocks = [];
    let currentBlock = '';
    let inJsonBlock = false;
    let braceCount = 0;
    let lineNumber = 0;
    
    const lines = grokContent.split('\n');
    
    for (const line of lines) {
      lineNumber++;
      
      // JSONの開始を検出
      if (line.trim() === '{' && !inJsonBlock) {
        inJsonBlock = true;
        braceCount = 1;
        currentBlock = line + '\n';
      }
      // 既にJSONブロック内の場合
      else if (inJsonBlock) {
        currentBlock += line + '\n';
        
        // 波括弧の数をカウント
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        // JSONブロックの終了
        if (braceCount === 0) {
          characterBlocks.push({
            content: currentBlock.trim(),
            lineStart: lineNumber - currentBlock.split('\n').length + 1,
            lineEnd: lineNumber
          });
          
          currentBlock = '';
          inJsonBlock = false;
        }
      }
    }
    
    console.log(`📋 ${characterBlocks.length}個のキャラクターブロックを検出`);
    
    // 各キャラクターを処理
    let savedCount = 0;
    const characterVariants = {}; // 同名キャラクターの管理
    
    for (let i = 0; i < characterBlocks.length; i++) {
      try {
        const block = characterBlocks[i];
        const characterData = JSON.parse(block.content);
        
        // バリデーション
        if (!characterData.name) {
          console.log(`⚠️ ブロック${i + 1}: nameフィールドがありません。スキップします。`);
          continue;
        }
        
        console.log(`\n📝 処理中: ${characterData.name}`);
        
        // バリエーション管理
        const baseName = characterData.name;
        if (!characterVariants[baseName]) {
          characterVariants[baseName] = 0;
        }
        characterVariants[baseName]++;
        
        // ファイル名生成
        let filename;
        let actualName = baseName;
        if (characterVariants[baseName] === 1) {
          filename = `${baseName}-grok.json`;
        } else {
          // 2つ目以降は番号を付ける
          filename = `${baseName}（パターン${characterVariants[baseName]}）-grok.json`;
          actualName = `${baseName}（パターン${characterVariants[baseName]}）`;
        }
        
        // 型の整合性チェックと修正
        
        // 1. first_messageを配列から文字列に変換
        if (Array.isArray(characterData.first_message)) {
          characterData.first_message = characterData.first_message[0] || '';
          console.log(`  ✅ first_messageを文字列に変換`);
        }
        
        // 2. Grok固有メタデータを追加
        const enhancedCharacter = {
          ...characterData,
          name: actualName, // バリエーション名を反映
          aiModel: 'grok',
          isVariation: true,
          baseCharacterName: baseName
        };
        
        // 3. 必須フィールドの確認・設定
        if (!enhancedCharacter.background) enhancedCharacter.background = '';
        if (!enhancedCharacter.systemPrompt) enhancedCharacter.systemPrompt = '';
        if (!enhancedCharacter.appearancePrompt) enhancedCharacter.appearancePrompt = '';
        if (!enhancedCharacter.appearanceNegativePrompt) enhancedCharacter.appearanceNegativePrompt = '';
        if (!enhancedCharacter.trackers) enhancedCharacter.trackers = [];
        
        // 4. 不要なフィールドを削除（存在する場合）
        delete enhancedCharacter.avatar_url;
        delete enhancedCharacter.chatBackgroundUrl;
        
        // 5. ファイルに保存
        const outputPath = path.join(__dirname, filename);
        fs.writeFileSync(outputPath, JSON.stringify(enhancedCharacter, null, 2), 'utf8');
        
        console.log(`  💾 保存完了: ${filename}`);
        console.log(`  📊 メタデータ: aiModel=${enhancedCharacter.aiModel}, baseCharacterName=${enhancedCharacter.baseCharacterName}`);
        
        savedCount++;
        
      } catch (parseError) {
        console.error(`❌ ブロック${i + 1}のJSONパースエラー:`, parseError.message);
        console.log(`   行範囲: ${characterBlocks[i].lineStart}-${characterBlocks[i].lineEnd}`);
      }
    }
    
    console.log(`\n✅ Grok変換完了: ${savedCount}個のキャラクターファイルを保存しました`);
    
    // 保存された内容の概要表示
    console.log('\n📋 保存されたキャラクター:');
    Object.keys(characterVariants).forEach(name => {
      const count = characterVariants[name];
      if (count === 1) {
        console.log(`  - ${name}-grok.json`);
      } else {
        for (let i = 1; i <= count; i++) {
          if (i === 1) {
            console.log(`  - ${name}-grok.json`);
          } else {
            console.log(`  - ${name}（パターン${i}）-grok.json`);
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 変換処理エラー:', error);
  }
}

// 実行
convertGrokCharacters();