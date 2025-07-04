import { NextRequest, NextResponse } from 'next/server';
import { ImagePromptGenerator } from '../../../../lib/imagePromptGenerator';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  try {
    const { aiResponse, character, conversationContext, loraSettings, negativePrompt: extraNegativePrompt, seed } = await request.json();
    
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
    const forceLocal = process.env.FORCE_LOCAL_SD === 'true';
    const localSdEnabled = forceLocal || process.env.USE_LOCAL_SD === 'true' || !!process.env.LOCAL_SD_URL;
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
    
    // Replicate APIキーが設定されている場合は実際のAI画像生成
    const useReplicate = process.env.REPLICATE_API_TOKEN && !forceLocal;
    if (useReplicate) {
      console.log('Using Replicate API for image generation');

      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
      const modelName = process.env.REPLICATE_MODEL_NAME || '';
      const modelVersion = process.env.REPLICATE_MODEL_VERSION;

      try {
        let imageUrl: string | undefined;

        if (modelName) {
          // 例: "black-forest-labs/flux-kontext-pro" または version を付与した識別子
          const identifier = modelVersion ? `${modelName}:${modelVersion}` : modelName;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const output: unknown = await replicate.run(identifier as any, {
            input: {
              prompt: finalPrompt,
              negative_prompt: finalNegativePrompt,
              width: character?.imageWidth || 512,
              height: character?.imageHeight || 768,
              num_inference_steps: character?.imageSteps || 28,
              guidance_scale: character?.imageCfgScale || 8,
              seed: typeof seed === 'number' && seed >= 0 ? seed : Math.floor(Math.random() * 2 ** 32),
            },
          });

          if (Array.isArray(output)) {
            imageUrl = output[0] as string;
          } else if (typeof output === 'string') {
            imageUrl = output;
          } else if (output && typeof (output as { url?: () => string }).url === 'function') {
            imageUrl = (output as { url: () => string }).url();
          }
        } else {
          // モデル名が指定されていない場合は従来どおり version ハッシュで呼び出し
          const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: process.env.REPLICATE_MODEL_VERSION || 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', // 既定 SDXL
              input: {
                prompt: finalPrompt,
                negative_prompt: finalNegativePrompt,
                width: character?.imageWidth || 512,
                height: character?.imageHeight || 768,
                num_inference_steps: character?.imageSteps || 28,
                guidance_scale: character?.imageCfgScale || 8,
                seed: typeof seed === 'number' && seed >= 0 ? seed : Math.floor(Math.random() * 2 ** 32),
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Replicate API error: ${response.status}`);
          }

          const prediction = await response.json();

          // 予測が完了するまで待機（最大30秒）
          let result = prediction;
          let attempts = 0;
          while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
              headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
              },
            });

            result = await statusResponse.json();
            attempts++;
          }

          if (result.status === 'succeeded' && result.output && result.output[0]) {
            imageUrl = result.output[0];
          }
        }

        if (imageUrl) {
          return NextResponse.json({
            image: imageUrl,
            success: true,
          });
        }
      } catch (replicateError) {
        console.error('Replicate API error:', replicateError);
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
      message: process.env.REPLICATE_API_TOKEN ? 
        '画像生成に時間がかかっています。プレースホルダーを表示中...' : 
        'Replicate APIキーを設定すると美しいAI画像が生成されます。'
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

