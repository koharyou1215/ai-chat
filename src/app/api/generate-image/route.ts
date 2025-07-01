import { NextRequest, NextResponse } from 'next/server';
import { ImagePromptGenerator } from '../../../../lib/imagePromptGenerator';

const STABLE_DIFFUSION_URL = 'http://127.0.0.1:7860';

// 確実に表示されるプレースホルダー画像を生成
function generatePlaceholderImage(characterName: string, emotion: string): string {
  const svg = `
    <svg width="512" height="768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="768" fill="url(#bg)"/>
      <circle cx="256" cy="200" r="80" fill="rgba(255,255,255,0.3)"/>
      <circle cx="220" cy="180" r="8" fill="white"/>
      <circle cx="292" cy="180" r="8" fill="white"/>
      <path d="M 200 230 Q 256 260 312 230" stroke="white" stroke-width="4" fill="none"/>
      <text x="256" y="350" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${characterName}</text>
      <text x="256" y="390" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="18">${emotion}</text>
      <text x="256" y="450" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="16">画像生成中...</text>
    </svg>
  `;
  
  // SVGをbase64エンコード
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

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
      
      const characterName = character?.name || 'キャラクター';
      const placeholderImage = generatePlaceholderImage(characterName, promptResult.emotion);
      
      return NextResponse.json({
        image: placeholderImage,
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
    const placeholderImage = generatePlaceholderImage(characterName, 'エラー');
    
    return NextResponse.json({
      image: placeholderImage,
      success: true, // successをtrueにして確実に表示させる
      message: '画像生成APIが利用できません。プレースホルダー画像を表示しています。',
    });
  }
}

