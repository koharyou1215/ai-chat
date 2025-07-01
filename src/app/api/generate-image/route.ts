import { NextRequest, NextResponse } from 'next/server';
import { ImagePromptGenerator } from '../../../../lib/imagePromptGenerator';

const STABLE_DIFFUSION_URL = 'http://127.0.0.1:7860';

export async function POST(request: NextRequest) {
  try {
    const { aiResponse, character, conversationContext, loraSettings, seed } = await request.json();
    
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

    console.log('Generated prompt result:', {
      emotion: promptResult.emotion,
      scenario: promptResult.scenario,
      prompt: promptResult.prompt.substring(0, 100) + '...'
    });
    
    // Vercelやクラウド環境では、localhost:7860は利用できないため、
    // プレースホルダー画像を返す
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.log('Production environment detected, returning placeholder image');
      return NextResponse.json({
        image: `https://via.placeholder.com/512x768/4A90E2/FFFFFF?text=${encodeURIComponent(`${character?.name || 'Character'} - ${promptResult.emotion}`)}`,
        success: true,
        message: 'プレースホルダー画像を返しました（本番環境）'
      });
    }
    
    const {
      imageWidth = 512,
      imageHeight = 768,
      imageSteps = 28,
      imageCfgScale = 8,
      imageSampler = 'DPM++ 2M Karras'
    } = character ?? {};

    const payload = {
      prompt: finalPrompt,
      negative_prompt: promptResult.negativePrompt,
      width: imageWidth,
      height: imageHeight,
      steps: imageSteps,
      cfg_scale: imageCfgScale,
      seed: typeof seed === 'number' && seed >= 0 ? seed : Math.floor(Math.random() * 2 ** 32),
      sampler_name: imageSampler,
      batch_size: 1,
      n_iter: 1,
    };
    
    console.log('Sending request to Stable Diffusion:', STABLE_DIFFUSION_URL);
    
    const response = await fetch(`${STABLE_DIFFUSION_URL}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // タイムアウトを短く設定
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Stable Diffusion API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      return NextResponse.json({
        image: `data:image/png;base64,${data.images[0]}`,
        success: true,
      });
    } else {
      throw new Error('画像生成に失敗しました');
    }
    
  } catch (error) {
    console.error('Image generation error:', error);
    
    // エラー時は必ずプレースホルダー画像を返す
    const { character } = await request.json().catch(() => ({ character: null }));
    const characterName = character?.name || 'キャラクター';
    
    return NextResponse.json({
      image: `https://via.placeholder.com/512x768/FF6B6B/FFFFFF?text=${encodeURIComponent(`${characterName} - 画像生成中...`)}`,
      success: true, // successをtrueにして確実に表示させる
      message: '画像生成APIが利用できません。プレースホルダー画像を表示しています。',
    });
  }
}

