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
    
    const {
      imageWidth = 512,
      imageHeight = 768,
      imageSteps = 28,
      imageCfgScale = 8,
      imageSampler = 'DPM++ 2M Karras'
    } = character ?? {};

    const payload = {
      prompt: finalPrompt,
      _prompt: promptResult.negativePrompt,
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
    
    // エラー時はプレースホルダー画像を返す
    return NextResponse.json({
      image: 'https://via.placeholder.com/512x768/4A90E2/FFFFFF?text=Image+Generation+Failed',
      success: false,
      error: error instanceof Error ? error.message : '画像生成でエラーが発生しました',
    });
  }
}

