import { NextRequest, NextResponse } from 'next/server';
import { RunwareService } from '../../../../lib/runwareApi';
import { StableDiffusionService } from '../../../../lib/stableDiffusionApi';

export async function POST(request: NextRequest) {
  console.log('[/api/generate-image] 画像生成APIが呼び出されました');
  console.log("RUNWARE_API_KEY:", process.env.RUNWARE_API_KEY ? "設定済み" : "未設定");
  console.log("RUNWARE_MODEL_ID:", process.env.RUNWARE_MODEL_ID ? "設定済み" : "未設定");
  
  try {
    const requestBodyJson = await request.json(); // ここで await を使ってJSONをパース
    const {
      prompt,
      character, // キャラクター情報
      negativePrompt, // ネガティブプロンプト
      modelId = process.env.RUNWARE_MODEL_ID || "your_runware_model_id_here",
      aspectRatio = "square",
      safetyChecker = "off",
      settings, // settingsオブジェクトもここで取得
      runwareModelId: clientRunwareModelId, // 設定画面から直接送信される値
      runwareLoraIds: clientRunwareLoraIds, // 設定画面から直接送信される値
      runwareApiKey: clientRunwareApiKey, // 設定画面から直接送信される値
      conversationContext // 会話履歴
    } = requestBodyJson;
    
    console.log('[/api/generate-image] リクエストボディ:', {
      prompt: typeof prompt,
      promptValue: prompt,
      modelId: modelId,
      settings: settings ? '設定あり' : '設定なし'
    });
    
    // promptの型チェックと変換
    let processedPrompt = '';
    if (typeof prompt === 'string') {
      processedPrompt = prompt.trim();
    } else if (prompt && typeof prompt === 'object') {
      // オブジェクトの場合はpromptプロパティがあればそれを使用
      if (prompt.prompt && typeof prompt.prompt === 'string') {
        processedPrompt = prompt.prompt.trim();
      } else {
        // promptプロパティがない場合は文字列変換
        processedPrompt = String(prompt).trim();
      }
    } else {
      processedPrompt = String(prompt || '').trim();
    }
    
    if (!processedPrompt) {
      return NextResponse.json({
        success: false,
        error: 'プロンプトが空です'
      }, { status: 400 });
    }
    
    // キャラクター固有のappearancePromptを先頭にマージ（重複防止）
    if (character?.appearancePrompt) {
      const charAp = String(character.appearancePrompt).trim();
      if (charAp && !processedPrompt.startsWith(charAp)) {
        processedPrompt = `${charAp}, ${processedPrompt}`;
        console.log("✅ キャラクターappearancePrompt反映:", charAp);
      }
    }
    
    // ネガティブプロンプトの処理（キャラクター定義のみ使用、デフォルトは追加しない）
    let processedNegativePrompt = '';
    if (negativePrompt && typeof negativePrompt === 'string') {
      processedNegativePrompt = negativePrompt.trim();
    } else if (character?.appearanceNegativePrompt) {
      processedNegativePrompt = String(character.appearanceNegativePrompt).trim();
    }
    // 設定のネガティブプロンプトは使用しない（長すぎる可能性があるため）
    
    // キャラクター固有のappearanceNegativePromptのみを使用（重複防止）
    if (character?.appearanceNegativePrompt && !processedNegativePrompt) {
      const charNeg = String(character.appearanceNegativePrompt).trim();
      if (charNeg) {
        processedNegativePrompt = charNeg;
        console.log("✅ キャラクターappearanceNegativePrompt反映:", charNeg);
      }
    }
    
    console.log("Received prompt for image generation:", processedPrompt);
    console.log("Processed negative prompt BEFORE Runware:", processedNegativePrompt);
    console.log("Negative prompt length BEFORE Runware:", processedNegativePrompt.length);
    console.log("Using model ID:", modelId);
    console.log("Aspect ratio:", aspectRatio);
    console.log("Safety checker:", safetyChecker);

    // 設定画面を優先で取得 - Runware
    const envRunwareApiKey = process.env.RUNWARE_API_KEY;
    const settingsRunwareApiKey = settings?.runwareApiKey; // settingsから取得
    // 設定画面から直接送信された値を最優先、次にsettings、最後に環境変数
    const runwareApiKey = clientRunwareApiKey || settingsRunwareApiKey || envRunwareApiKey;
    
    // デバッグ用：環境変数の詳細確認
    console.log('Runware Environment variables debug:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      RUNWARE_API_KEY_EXISTS: !!process.env.RUNWARE_API_KEY,
      RUNWARE_API_KEY_LENGTH: process.env.RUNWARE_API_KEY?.length || 0,
      RUNWARE_MODEL_ID_EXISTS: !!process.env.RUNWARE_MODEL_ID,
      RUNWARE_MODEL_ID_VALUE: process.env.RUNWARE_MODEL_ID || 'none'
    });
    
    const envRunwareModelId = process.env.RUNWARE_MODEL_ID;
    const settingsRunwareModelId = settings?.runwareModelId; // settingsから取得（キャメルケースに修正）
    // 設定画面から直接送信された値を最優先、次にsettings、最後に環境変数
    const runwareModelId = clientRunwareModelId || settingsRunwareModelId || envRunwareModelId;

    console.log('[/api/generate-image] Runware API Key check:', {
      hasSettingsApiKey: !!settingsRunwareApiKey,
      hasEnvApiKey: !!envRunwareApiKey,
      settingsApiKeyLength: settingsRunwareApiKey?.length || 0,
      envApiKeyLength: envRunwareApiKey?.length || 0,
      finalApiKeyLength: runwareApiKey?.length || 0,
      finalApiKeyStart: runwareApiKey?.substring(0, 15) || 'none',
      envApiKeyStart: envRunwareApiKey?.substring(0, 15) || 'none',
      isProduction: process.env.NODE_ENV === 'production',
      modelId: runwareModelId
    });

    // Stable Diffusion APIキーの事前定義（スコープ全体で使用するため）
    const envStableDiffusionApiKey = process.env.STABLE_DIFFUSION_API_KEY;
    const settingsStableDiffusionApiKey = settings?.stableDiffusionApikey;
    const stableDiffusionApiKey = settingsStableDiffusionApiKey || envStableDiffusionApiKey;
    
    // ローカルStable DiffusionのURL
    const localSdUrl = process.env.LOCAL_SD_URL || settings?.localSdUrl;

    // 設定で指定されたエンジンを優先使用（明示的なRunwareデフォルト）
    const preferredEngine = settings?.imageEngine || 'runware';
    console.log(`[/api/generate-image] 選択されたエンジン: ${preferredEngine}`);
    
    // Runwareを使用（設定で指定、またはデフォルト）
    if (preferredEngine === 'runware' && runwareApiKey && runwareModelId) {
      try {
        console.log(`[/api/generate-image] Runware APIを使用して画像生成: モデル ${runwareModelId}`);
        
        const runwareService = new RunwareService(runwareApiKey);
        
        // LoRA設定の準備
        const enabledLoras = settings?.runwareLoraSettings?.filter(lora => lora.enabled) || [];
        const lorasForApi = enabledLoras.map(lora => ({
          model: lora.id,
          weight: lora.weight
        }));

        console.log(`[/api/generate-image] 使用するLoRA: ${lorasForApi.length}個`, lorasForApi);
        console.log(`[/api/generate-image] Runware呼び出し前 - ネガティブプロンプト:`, processedNegativePrompt);
        console.log(`[/api/generate-image] Runware呼び出し前 - ネガティブプロンプト長:`, processedNegativePrompt.length);

        const result = await runwareService.generateImage({
          positivePrompt: processedPrompt,
          negativePrompt: processedNegativePrompt || undefined,
          model: runwareModelId,
          width: settings?.imageWidth || 512,
          height: settings?.imageHeight || 512,
          CFGScale: settings?.guidanceScale || 7,
          steps: settings?.steps || 20,
          loras: lorasForApi.length > 0 ? lorasForApi : undefined
        });
        
        console.log(`[/api/generate-image] Runware成功: 画像生成完了`);
        
        return NextResponse.json({
          success: true,
          imageUrl: result.imageURL,
          provider: 'runware',
          imageUUID: result.imageUUID
        });
      } catch (runwareError) {
        console.error('[/api/generate-image] Runwareエラー:', runwareError);
        
        // RunwareエラーをキャッチしてStable Diffusionにフォールバック
        // フォールバックが失敗した場合のため、エラーを保持
        const runwareErrorMessage = runwareError instanceof Error ? runwareError.message : 'Runware API failed';
        
        // Stable Diffusionが利用可能かチェック
        const envStableDiffusionApiKey = process.env.STABLE_DIFFUSION_API_KEY;
        const settingsStableDiffusionApiKey = settings?.stableDiffusionApikey;
        const stableDiffusionApiKey = settingsStableDiffusionApiKey || envStableDiffusionApiKey;
        const localSdUrl = process.env.LOCAL_SD_URL;
        
        if (!stableDiffusionApiKey && !localSdUrl) {
          // フォールバック先がない場合は即座にエラーを返す
          return NextResponse.json({
            success: false,
            error: `画像生成に失敗しました: ${runwareErrorMessage}. Stable Diffusionも利用できません。`,
            provider: 'runware_failed',
            debug: {
              runwareError: runwareErrorMessage,
              hasStableDiffusionApiKey: !!stableDiffusionApiKey,
              hasLocalSdUrl: !!localSdUrl
            }
          }, { status: 500 });
        }
        
        // Stable Diffusionにフォールバック継続
      }
    }

    // Stable Diffusion使用 (設定で指定またはRunwareフォールバック)
    if (preferredEngine === 'sd' || !runwareApiKey || !runwareModelId) {

      console.log('[/api/generate-image] Stable Diffusion API Key check:', {
        hasSettingsApiKey: !!settingsStableDiffusionApiKey,
        hasEnvApiKey: !!envStableDiffusionApiKey,
        settingsApiKeyLength: settingsStableDiffusionApiKey?.length || 0,
        envApiKeyLength: envStableDiffusionApiKey?.length || 0,
        finalApiKeyLength: stableDiffusionApiKey?.length || 0,
        finalApiKeyStart: stableDiffusionApiKey?.substring(0, 15) || 'none',
        envApiKeyStart: envStableDiffusionApiKey?.substring(0, 15) || 'none'
      });

      if (stableDiffusionApiKey) {
        try {
          console.log('[/api/generate-image] Stable Diffusion APIを使用して画像生成');
          
          const stableDiffusionService = new StableDiffusionService(stableDiffusionApiKey);
          
          const result = await stableDiffusionService.generateImage({
            prompt: processedPrompt,
            negative_prompt: processedNegativePrompt || undefined,
            width: settings?.imageWidth || 512,
            height: settings?.imageHeight || 512,
            cfg_scale: settings?.guidanceScale || 7,
            steps: settings?.steps || 20
          });
          
          // base64データをデータURLに変換
          const imageUrl = `data:image/png;base64,${result.image}`;
          
          console.log(`[/api/generate-image] Stable Diffusion成功`);
          
          return NextResponse.json({
            success: true,
            imageUrl: imageUrl,
            provider: 'stable-diffusion',
            seed: result.seed
          });
        } catch (stableDiffusionError) {
          console.error('[/api/generate-image] Stable Diffusionエラー:', stableDiffusionError);
          return NextResponse.json({
            success: false,
            error: `Stable Diffusion error: ${stableDiffusionError instanceof Error ? stableDiffusionError.message : 'Unknown error'}`
          }, { status: 500 });
        }
      }
    }

    // ローカルStable Diffusionを試行
    console.log('[/api/generate-image] ローカルSD URL:', localSdUrl);
    
    // プレースホルダーURLや無効なURLを除外
    const isValidLocalUrl = localSdUrl && 
                           localSdUrl !== '' && 
                           !localSdUrl.includes('example.com') && 
                           !localSdUrl.includes('your-sd') &&
                           (localSdUrl.startsWith('http://localhost') || localSdUrl.startsWith('http://127.0.0.1'));
    
    if (isValidLocalUrl) {
      try {
        console.log(`[/api/generate-image] ローカルStable Diffusion APIを使用: ${localSdUrl}`);
        
        const response = await fetch(`${localSdUrl}/sdapi/v1/txt2img`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: processedPrompt,
            width: settings?.imageWidth || 512,
            height: settings?.imageHeight || 512,
            cfg_scale: settings?.guidanceScale || 7,
            steps: settings?.steps || 20,
            sampler_name: 'DPM++ 2M Karras'
          }),
          signal: AbortSignal.timeout(30000) // 30秒タイムアウト
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const imageBase64 = data.images[0];
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        
        console.log('[/api/generate-image] ローカルStable Diffusion成功');
        
        return NextResponse.json({
          success: true,
          imageUrl: imageUrl,
          provider: 'local-stable-diffusion'
        });
      } catch (localSdError) {
        console.error('[/api/generate-image] ローカル安定拡散エラー:', localSdError);
        return NextResponse.json({
          success: false,
          error: `ローカル安定拡散エラー: ${localSdError instanceof Error ? localSdError.message : 'Unknown error'}`
        }, { status: 500 });
      }
    }

    // すべてのプロバイダーが失敗した場合
    console.error('[/api/generate-image] すべての画像生成プロバイダーが失敗しました');
    console.error('[/api/generate-image] デバッグ情報:', {
      runwareApiKeyExists: !!runwareApiKey,
      runwareApiKeyLength: runwareApiKey?.length || 0,
      runwareModelIdExists: !!runwareModelId,
      stableDiffusionApiKeyExists: !!stableDiffusionApiKey,
      stableDiffusionApiKeyLength: stableDiffusionApiKey?.length || 0,
      localSdUrlExists: !!localSdUrl,
      localSdUrl: localSdUrl,
      isValidLocalUrl: isValidLocalUrl,
      preferredEngine: preferredEngine
    });
    
    // Runware APIが利用可能だが設定でStable Diffusionが選択されている場合の提案
    if (preferredEngine === 'sd' && runwareApiKey && runwareModelId) {
      return NextResponse.json({
        success: false,
        error: 'Stable Diffusionが選択されていますが、有効な設定がありません。UI設定でRunwareに切り替えることをお勧めします。',
        suggestion: 'UI設定 > 画像生成エンジン > Runware に変更してください',
        debug: {
          runwareAvailable: true,
          stableDiffusionAvailable: false,
          currentEngine: preferredEngine,
          localUrlValid: isValidLocalUrl
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: '画像生成のためのAPIキーが設定されていません。Runware API Key、Stable Diffusion API Key、またはローカルStable DiffusionのURLを設定してください。',
      debug: {
        runwareApiKeyExists: !!runwareApiKey,
        runwareModelIdExists: !!runwareModelId,
        stableDiffusionApiKeyExists: !!stableDiffusionApiKey,
        localSdUrlExists: !!localSdUrl,
        isValidLocalUrl: isValidLocalUrl
      }
    }, { status: 400 });
  } catch (error) {
    console.error('[/api/generate-image] 予期しないエラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
