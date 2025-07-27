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
      modelId = process.env.RUNWARE_MODEL_ID || "your_runware_model_id_here",
      aspectRatio = "square",
      safetyChecker = "off",
      settings // settingsオブジェクトもここで取得
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
      // オブジェクトの場合は文字列に変換を試行
      processedPrompt = JSON.stringify(prompt).trim();
    } else {
      processedPrompt = String(prompt || '').trim();
    }
    
    if (!processedPrompt) {
      return NextResponse.json({
        success: false,
        error: 'プロンプトが空です'
      }, { status: 400 });
    }
    
    console.log("Received prompt for image generation:", processedPrompt);
    console.log("Using model ID:", modelId);
    console.log("Aspect ratio:", aspectRatio);
    console.log("Safety checker:", safetyChecker);

    // 設定画面を優先で取得 - Runware
    const envRunwareApiKey = process.env.RUNWARE_API_KEY;
    const settingsRunwareApiKey = settings?.runwareApiKey; // settingsから取得
    const runwareApiKey = settingsRunwareApiKey || envRunwareApiKey;
    
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
    // 設定画面のモデルを優先、設定がない場合のみ環境変数を使用
    const runwareModelId = settingsRunwareModelId || envRunwareModelId;

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

    // Runwareを優先的に使用
    if (runwareApiKey && runwareModelId) {
      try {
        console.log(`[/api/generate-image] Runware APIを使用して画像生成: モデル ${runwareModelId}`);
        
        const runwareService = new RunwareService(runwareApiKey);
        
        const result = await runwareService.generateImage({
          positivePrompt: processedPrompt,
          model: runwareModelId,
          width: settings?.imageWidth || 512,
          height: settings?.imageHeight || 512,
          CFGScale: settings?.guidanceScale || 7,
          steps: settings?.steps || 20
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
        // Stable Diffusionにフォールバック
      }
    }

    // Stable Diffusionフォールバック
    const envStableDiffusionApiKey = process.env.STABLE_DIFFUSION_API_KEY;
    const settingsStableDiffusionApiKey = settings?.stableDiffusionApikey; // settingsから取得
    const stableDiffusionApiKey = settingsStableDiffusionApiKey || envStableDiffusionApiKey;

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

    // ローカルStable Diffusionを試行
    const localSdUrl = process.env.LOCAL_SD_URL || settings?.localSdUrl; // settingsから取得
    console.log('[/api/generate-image] ローカルSD URL:', localSdUrl);
    
    if (localSdUrl && localSdUrl !== '' && localSdUrl !== 'your-sd.example.com' && !localSdUrl.includes('example.com')) {
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
      localSdUrl: localSdUrl
    });
    
    return NextResponse.json({
      success: false,
      error: '画像生成のためのAPIキーが設定されていません。Runware API Key、Stable Diffusion API Key、またはローカルStable DiffusionのURLを設定してください。',
      debug: {
        runwareApiKeyExists: !!runwareApiKey,
        runwareModelIdExists: !!runwareModelId,
        stableDiffusionApiKeyExists: !!stableDiffusionApiKey,
        localSdUrlExists: !!localSdUrl
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
