import { NextRequest, NextResponse } from 'next/server';
import { RunwareService } from '../../../../lib/runwareApi';
import { StableDiffusionService } from '../../../../lib/stableDiffusionApi';

export async function POST(request: NextRequest) {
  console.log('[/api/generate-image] 画像生成APIが呼び出されました');
  
  try {
    const { prompt, settings } = await request.json();
    
    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'プロンプトが空です'
      }, { status: 400 });
    }
    
    console.log(`[/api/generate-image] プロンプト: ${prompt}`);
    console.log(`[/api/generate-image] 設定:`, settings);

    // 環境変数を最優先で取得 - Runware
    const envRunwareApiKey = process.env.RUNWARE_API_KEY;
    const settingsRunwareApiKey = settings?.Runwareapikey;
    const runwareApiKey = envRunwareApiKey || settingsRunwareApiKey;
    
    const envRunwareModelId = process.env.RUNWARE_MODEL_ID;
    const settingsRunwareModelId = settings?.runwaremodelid;
    const runwareModelId = envRunwareModelId || settingsRunwareModelId;

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
        
        const task = await runwareService.createGenerationTask({
          taskType: "imageInference",
          outputType: "URL",
          positivePrompt: prompt,
          model: runwareModelId,
          width: settings?.imageWidth || 512,
          height: settings?.imageHeight || 512,
          CFGScale: settings?.guidanceScale || 7,
          steps: settings?.steps || 20
        });
        
        // タスクの完了を待つ（簡単なポーリング）
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
          const result = await runwareService.getGenerationTaskStatus(task.taskId);
          
          if (result.status === 'completed' && result.image) {
            console.log(`[/api/generate-image] Runware成功: タスク完了`);
            
            return NextResponse.json({
              success: true,
              imageUrl: result.image,
              provider: 'runware',
              seed: result.seed
            });
          }
          
          if (result.status === 'failed') {
            throw new Error('画像生成タスクが失敗しました');
          }
          
          // 2秒待機
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
        
        throw new Error('画像生成がタイムアウトしました');
      } catch (runwareError) {
        console.error('[/api/generate-image] Runwareエラー:', runwareError);
        // Stable Diffusionにフォールバック
      }
    }

    // Stable Diffusionフォールバック
    const envStableDiffusionApiKey = process.env.STABLE_DIFFUSION_API_KEY;
    const settingsStableDiffusionApiKey = settings?.stableDiffusionApikey;
    const stableDiffusionApiKey = envStableDiffusionApiKey || settingsStableDiffusionApiKey;

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
          prompt: prompt,
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
    const localSdUrl = process.env.LOCAL_SD_URL || settings?.localSdUrl;
    if (localSdUrl && localSdUrl !== '' && localSdUrl !== 'your-sd.example.com') {
      try {
        console.log(`[/api/generate-image] ローカルStable Diffusion APIを使用: ${localSdUrl}`);
        
        const response = await fetch(`${localSdUrl}/sdapi/v1/txt2img`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
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
    return NextResponse.json({
      success: false,
      error: '画像生成のためのAPIキーが設定されていません。Runware API Key、Stable Diffusion API Key、またはローカルStable DiffusionのURLを設定してください。'
    }, { status: 400 });

  } catch (error) {
    console.error('[/api/generate-image] 予期しないエラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
