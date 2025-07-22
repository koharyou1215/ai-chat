import { NextRequest, NextResponse } from 'next/server';
import { ImagePromptGenerator } from '../../../../lib/imagePromptGenerator';
import { RunwareService } from '../../../../lib/runwareApi';

export async function POST(request: NextRequest) {
  try {
    const { aiResponse, character, conversationContext, loraSettings, negativePrompt: extraNegativePrompt, seed, imageEngine } = await request.json();
    
    // 新しいプロンプトジェネレータを使用
    const promptResult = ImagePromptGenerator.generateImagePrompt(
      character,
      aiResponse,
      conversationContext
    );

    // LORA設定をプロンプトに追加
    let finalPrompt = promptResult.prompt;
    if (loraSettings && typeof loraSettings === 'string' && loraSettings.trim().length > 0) {
      finalPrompt = `${loraSettings}, ${finalPrompt}`;
    }

    // ユーザー指定のネガティブプロンプトを追加
    let finalNegativePrompt = promptResult.negativePrompt;
    if (extraNegativePrompt && typeof extraNegativePrompt === 'string' && extraNegativePrompt.trim().length > 0) {
      finalNegativePrompt = `${promptResult.negativePrompt}, ${extraNegativePrompt}`;
    }

    console.log('Generated prompt result:', {
      emotion: promptResult.emotion,
      scenario: promptResult.scenario,
      prompt: promptResult.prompt.substring(0, 100) + '...'
    });
    
    const characterName = character?.name || 'キャラクター';
    
    // ① ローカル Stable Diffusion WebUI が使えるかチェック
    //    - 環境変数 USE_LOCAL_SD が 'true' のとき、または LOCAL_SD_URL が存在するときに有効
    //    - LOCAL_SD_URL が無い場合は既定 URL "http://127.0.0.1:7860" を使用
    const forceLocalEnv = process.env.FORCE_LOCAL_SD === 'true';
    // クライアント指定があれば優先
    let selectedEngine: 'sd' | 'runware';
    if (imageEngine === 'sd' || imageEngine === 'runware') {
      selectedEngine = imageEngine;
    } else {
      selectedEngine = forceLocalEnv || process.env.USE_LOCAL_SD === 'true' || !!process.env.LOCAL_SD_URL ? 'sd' : 'runware';
    }

    // Flag retained for backward-compat; may be used in future
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const forceLocal = selectedEngine === 'sd';
    const localSdEnabled = selectedEngine === 'sd';
    const localSdBaseUrl = (process.env.LOCAL_SD_URL || 'http://127.0.0.1:7860').replace(/\/$/, '');

    if (localSdEnabled) {
      try {
        console.log('Using local Stable Diffusion WebUI for image generation →', localSdBaseUrl);

        const sdResponse = await fetch(`${localSdBaseUrl}/sdapi/v1/txt2img`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: finalPrompt,
            negative_prompt: finalNegativePrompt,
            width: character?.imageWidth || 512,
            height: character?.imageHeight || 768,
            steps: character?.imageSteps || 28,
            cfg_scale: character?.imageCfgScale || 8,
            sampler_name: character?.imageSampler || 'DPM++ 2M Karras',
            seed: typeof seed === 'number' && seed >= 0 ? seed : -1,
            batch_size: 1,
            n_iter: 1,
          }),
        });

        if (!sdResponse.ok) {
          throw new Error(`Local SD API error: ${sdResponse.status}`);
        }

        const sdData = await sdResponse.json();

        if (sdData.images && sdData.images.length > 0) {
          const base64Png = sdData.images[0];
          const dataUri = `data:image/png;base64,${base64Png}`;
          return NextResponse.json({
            image: dataUri,
            success: true,
            message: 'ローカル Stable Diffusion で生成しました',
          });
        }
      } catch (localSdError) {
        console.error('Local Stable Diffusion error:', localSdError);
        // フォールスルーして Replicate / プレースホルダー処理へ
      }
    }
    
    // Runware APIキーが設定されている場合は実際のAI画像生成
    if (selectedEngine === 'runware') {
      console.log('Using Runware API for image generation');

      const runwareApiKey = process.env.RUNWARE_API_KEY; // 環境変数名が RUNWARE_API_KEY であると仮定
      if (!runwareApiKey) {
        throw new Error('Runware APIキーが設定されていません');
      }

      const runwareService = new RunwareService(runwareApiKey);

      try {
        // 画像生成タスクの作成
        // character.imageWidth, character.imageHeight は SettingsModal の値
        const { taskId } = await runwareService.createGenerationTask({
          prompt: finalPrompt,
          negative_prompt: finalNegativePrompt,
          width: character?.imageWidth || 1024, // Runwareの推奨サイズに合わせて調整
          height: character?.imageHeight || 1024, // 同上
          steps: character?.imageSteps || 50, // Runwareの推奨ステップ数に合わせて調整
          cfg_scale: character?.imageCfgScale || 7,
          seed: typeof seed === 'number' && seed >= 0 ? seed : Math.floor(Math.random() * 2 ** 32),
          model_id: character?.runwareModelId, // SettingsModalから取得したID
          lora_ids: character?.runwareLoraIds, // SettingsModalから取得したID
          allow_nsfw: true, // NSFWフィルターを解除
        });

        console.log(`Runware task created with ID: ${taskId}`);

        // タスクの完了をポーリング
        let attempts = 0;
        let taskStatus: { status: string; image?: string; seed?: number } = { status: 'pending' };
        const MAX_ATTEMPTS = 60; // 2秒 * 60回 = 120秒 (2分) タイムアウト
        const POLL_INTERVAL_MS = 2000; // 2秒

        while (taskStatus.status !== 'completed' && taskStatus.status !== 'failed' && attempts < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
          taskStatus = await runwareService.getGenerationTaskStatus(taskId);
          console.log(`Runware task ${taskId} status: ${taskStatus.status}`);
          attempts++;
        }

        if (taskStatus.status === 'completed' && taskStatus.image) {
          // Runwareから返される画像はBase64エンコードされていると仮定
          const dataUri = `data:image/png;base64,${taskStatus.image}`;
          return NextResponse.json({
            image: dataUri,
            success: true,
            message: 'Runware API で生成しました',
          });
        } else {
          throw new Error(`Runware 画像生成タスクが完了しませんでした: ${taskStatus.status}`);
        }

      } catch (runwareError) {
        console.error('Runware API error:', runwareError);
        // エラー時はプレースホルダーにフォールバック
      }
    }
    
    // APIキーがない場合やエラー時はプレースホルダー画像
    console.log('Returning placeholder image');
    
    // シンプルで確実なプレースホルダー画像（base64 PNG）
    const placeholderImage = generateSimplePlaceholder(characterName, promptResult.emotion);
    
    return NextResponse.json({
      image: placeholderImage,
      success: true,
      message: process.env.RUNWARE_API_KEY ? 
        '画像生成に時間がかかっています。プレースホルダーを表示中...' : 
        'Runware APIキーを設定すると美しいAI画像が生成されます。'
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    
    // エラー時は必ずプレースホルダー画像を返す
    const { character } = await request.json().catch(() => ({ character: null }));
    const characterName = character?.name || 'キャラクター';
    const placeholderImage = generateSimplePlaceholder(characterName, 'エラー');
    
    return NextResponse.json({
      image: placeholderImage,
      success: true,
      message: 'プレースホルダー画像を表示しています。',
    });
  }
}

// シンプルなプレースホルダー画像を生成
function generateSimplePlaceholder(characterName: string, emotion: string): string {
  // 軽量なSVGプレースホルダー
  const svg = `<svg width="512" height="768" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="512" height="768" fill="url(#grad)"/>
    <circle cx="256" cy="220" r="70" fill="rgba(255,255,255,0.2)"/>
    <circle cx="230" cy="200" r="8" fill="white"/>
    <circle cx="282" cy="200" r="8" fill="white"/>
    <path d="M 210 250 Q 256 280 302 250" stroke="white" stroke-width="4" fill="none"/>
    <text x="256" y="360" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${characterName}</text>
    <text x="256" y="400" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial" font-size="18">${emotion}</text>
    <text x="256" y="500" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial" font-size="14">AI画像生成対応</text>
  </svg>`;
  
  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

