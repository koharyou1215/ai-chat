// OpenRouterのモデル一覧を取得してGrok系モデルを確認するスクリプト
// 実行: node check-grok-models.js

const checkGrokModels = async () => {
  try {
    console.log('OpenRouterのモデル一覧を確認中...');
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Grok関連のモデルを検索
    const grokModels = data.data.filter(model => 
      model.id.toLowerCase().includes('grok') || 
      model.name.toLowerCase().includes('grok') ||
      model.id.includes('xai')
    );

    console.log('\n=== Grok関連モデル ===');
    if (grokModels.length > 0) {
      grokModels.forEach(model => {
        console.log(`ID: ${model.id}`);
        console.log(`Name: ${model.name}`);
        console.log(`Context Length: ${model.context_length}`);
        console.log(`Pricing: $${model.pricing?.prompt || 'N/A'} per 1K tokens`);
        console.log('---');
      });
    } else {
      console.log('Grok関連のモデルは見つかりませんでした。');
    }

    // xAI関連のモデルも検索
    const xaiModels = data.data.filter(model => 
      model.id.includes('xai') || 
      model.name.toLowerCase().includes('xai')
    );

    console.log('\n=== xAI関連モデル ===');
    if (xaiModels.length > 0) {
      xaiModels.forEach(model => {
        console.log(`ID: ${model.id}`);
        console.log(`Name: ${model.name}`);
        console.log(`Context Length: ${model.context_length}`);
        console.log('---');
      });
    } else {
      console.log('xAI関連のモデルは見つかりませんでした。');
    }

    // 利用可能な全モデル数を表示
    console.log(`\n全体で ${data.data.length} のモデルが利用可能です。`);

  } catch (error) {
    console.error('エラー:', error);
  }
};

checkGrokModels();
