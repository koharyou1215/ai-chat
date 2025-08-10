import { NextRequest, NextResponse } from 'next/server';
import { GeminiApiManager } from '../../../../lib/geminiApiManager';

export async function POST(request: NextRequest) {
  console.log('🔍 User Inspiration API 開始');
  
  try {
    const body = await request.json();
    const { 
      message, 
      conversationHistory,
      settings
    } = body;

    console.log('🔍 リクエストデータ:', {
      hasMessage: !!message,
      messageLength: message?.length || 0,
      hasConversationHistory: !!conversationHistory,
      conversationHistoryLength: conversationHistory?.length || 0,
      hasSettings: !!settings,
      settingsType: typeof settings,
      settingsKeys: settings ? Object.keys(settings) : []
    });

    if (!message) {
      console.error('❌ メッセージがありません');
      return NextResponse.json({
        success: false,
        error: 'メッセージが必要です'
      }, { status: 400 });
    }

    // プロンプトを設定から取得（設定画面のもののみ使用）
    const inspirationPrompt = settings?.inspirationPrompt;
    
    console.log(`🔍 設定データ詳細:`, {
      settingsExists: !!settings,
      inspirationPromptExists: !!inspirationPrompt,
      inspirationPromptLength: inspirationPrompt?.length || 0,
      settingsKeys: settings ? Object.keys(settings) : [],
      inspirationPromptPreview: inspirationPrompt ? inspirationPrompt.substring(0, 100) + '...' : 'なし',
      inspirationPromptType: typeof inspirationPrompt
    });
    
    if (!inspirationPrompt || typeof inspirationPrompt !== 'string' || inspirationPrompt.trim().length === 0) {
      console.error('❌ インスピレーションプロンプトが無効:', {
        value: inspirationPrompt,
        type: typeof inspirationPrompt,
        isString: typeof inspirationPrompt === 'string',
        length: inspirationPrompt?.length || 0,
        isEmpty: inspirationPrompt?.trim().length === 0
      });
      return NextResponse.json({
        success: false,
        error: '設定画面でインスピレーションプロンプトを設定してください'
      }, { status: 400 });
    }

    // プロンプトを構築（複数のプレースホルダーパターンに対応）
    let finalPrompt = inspirationPrompt;
    
    // 会話履歴がある場合はコンテキストとして含める
    const contextToUse = conversationHistory && conversationHistory.trim() 
      ? conversationHistory 
      : message;
    
    // 会話履歴の置換（複数パターン対応）
    finalPrompt = finalPrompt.replace(/\{\{conversation\}\}/g, contextToUse);
    finalPrompt = finalPrompt.replace(/\{\{user\}\}と\{\{char\}\}間の会話履歴/g, contextToUse);
    finalPrompt = finalPrompt.replace(/会話履歴:/g, `会話履歴:\n${contextToUse}`);
    
    console.log(`🔍 プロンプト置換確認:`, {
      originalPromptLength: inspirationPrompt.length,
      messageLength: message.length,
      conversationHistoryLength: conversationHistory?.length || 0,
      finalPromptLength: finalPrompt.length,
      hasConversationPlaceholder: inspirationPrompt.includes('{{conversation}}'),
      hasUserCharPlaceholder: inspirationPrompt.includes('{{user}}と{{char}}間の会話履歴'),
      hasGenericHistoryPattern: inspirationPrompt.includes('会話履歴:'),
      replacementOccurred: inspirationPrompt !== finalPrompt,
      contextToUseSample: contextToUse.substring(0, 100) + '...'
    });
    
    // プレースホルダーが見つからない場合は、プロンプトの末尾に会話履歴を追加
    if (inspirationPrompt === finalPrompt) {
      console.log('⚠️ プレースホルダーが見つかりませんでした。会話履歴をプロンプト末尾に追加します。');
      finalPrompt = `${inspirationPrompt}\n\n**会話履歴:**\n${contextToUse}\n\n上記の会話履歴を分析して返信候補を生成してください。`;
      console.log(`🔧 フォールバック後のプロンプト長: ${finalPrompt.length}文字`);
    }
    
    console.log(`🔍 プロンプト長: ${finalPrompt.length}文字`);
    // 詳細ログを削減してメモリ使用量を抑制
    if (finalPrompt.length > 1000) {
      console.log(`⚠️ プロンプトが長すぎます (${finalPrompt.length}文字) - 短縮を推奨`);
    }

    // GeminiApiManager priority system を使用（503エラー対策）
    const maxTokens = settings?.maxTokens || 1500;
    const selectedModel = settings?.model || 'gemini-1.5-flash';
    console.log(`🔹 GeminiApiManager priority call開始（model: ${selectedModel}, maxTokens: ${maxTokens}）`);
    
    // メッセージ形式に変換
    const messagesForGemini = [
      { role: 'user', content: finalPrompt }
    ];
    
    // GeminiApiManagerのgenerateWithPriorityを使用してフォールバック機能を活用
    const generateResult = await GeminiApiManager.generateWithPriority(
      selectedModel,
      messagesForGemini,
      {
        maxTokens: maxTokens,
        temperature: 0.7,
        openRouterApiKey: settings?.openRouterApiKey
      }
    );

    if (!generateResult.success || !generateResult.content) {
      console.error('❌ GeminiApiManager generateWithPriority失敗:', generateResult.error);
      return NextResponse.json({
        success: false,
        error: generateResult.error || 'AI生成に失敗しました'
      }, { status: 500 });
    }

    const content = generateResult.content;
    console.log(`✅ GeminiApiManager成功 - レスポンス文字数: ${content.length} (provider: ${generateResult.provider})`);
    console.log(`📝 AIレスポンス内容（先頭500文字）:`, content.substring(0, 500));

    if (!content) {
      console.warn('⚠️ 返却テキストが空です');
      return NextResponse.json({
        success: false,
        error: 'AI応答が空です'
      }, { status: 500 });
    }
    
    // 候補を抽出（改良版：番号付きリストと括弧形式の両方に対応）
    let candidates: string[] = [];
    
    console.log(`🔍 AI応答内容（先頭200文字）:`, content.substring(0, 200));
    
    // まず番号付きリスト（1. 2. 3. 4.）で分割を試行
    const numberedSections = content.split(/(?=\d+\.)/);
    const validNumberedSections = numberedSections
      .filter(section => section.trim().match(/^\d+\./))
      .map(section => {
        const cleanContent = section.replace(/^\d+\.\s*/, '').trim();
        return cleanContent;
      })
      .filter(candidate => candidate.length > 0);
    
    if (validNumberedSections.length > 0) {
      console.log(`🔍 番号付きリストを検出: ${validNumberedSections.length}件`);
      candidates = validNumberedSections;
      candidates.forEach((candidate, index) => {
        console.log(`🔍 番号付き候補${index + 1}:`, {
          content: candidate.substring(0, 100) + '...',
          length: candidate.length
        });
      });
    } else {
      // 番号付きがない場合、［］形式で抽出
      // 改良版：[タイトル]とその後の内容をより正確に抽出
      const bracketPattern = /\[([^\]]+)\]\s*([\s\S]*?)(?=\[|$)/g;
      const bracketMatches = [...content.matchAll(bracketPattern)];
      
      if (bracketMatches && bracketMatches.length > 0) {
        candidates = bracketMatches.map((match) => {
          const title = match[1]; // [タイトル] の中身
          const contentAfterTitle = match[2] ? match[2].trim() : ''; // タイトル後の内容
          
          console.log(`🔍 候補解析:`, {
            fullMatch: match[0],
            title: title,
            contentAfterTitle: contentAfterTitle,
            contentLength: contentAfterTitle.length
          });
          
          // タイトルと内容を組み合わせ（長さ制限を削除）
          if (contentAfterTitle.length > 0) {
            return `[${title}] ${contentAfterTitle}`;
          } else {
            // 内容がない場合は、AIが完全な応答を生成していない可能性
            console.warn(`⚠️ 候補「${title}」に内容がありません`);
            return `[${title}] （内容を生成中...)`;
          }
        }).filter((candidate: string) => candidate.length > 0);
      } else {
        // フォールバック：全内容を単一候補として扱う
        candidates = [content.trim()];
      }
    }

    console.log(`🔍 抽出した候補数: ${candidates.length}`);
    console.log(`📋 候補詳細:`, candidates.map((c, i) => `${i+1}: ${c.substring(0, 100)}...`));

    console.log(`✅ インスピレーション生成成功（GeminiApiManager）:`, {
      candidateCount: candidates.length,
      provider: generateResult.provider,
      success: true
    });

    return NextResponse.json({
      success: true,
      candidates: candidates.length > 0 ? candidates : [content.trim()]
    });

  } catch (error) {
    console.error('❌ User inspiration API error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
    }, { status: 500 });
  }
}