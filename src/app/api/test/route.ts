import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

if (!GEMINI_API_KEY) {
  console.warn('[test] GEMINI_API_KEY が設定されていません');
}

export async function GET() {
  try {
    console.log('Testing Gemini API...');
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent('こんにちは！簡単な挨拶をしてください。');
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API Response:', text);
    
    return NextResponse.json({
      success: true,
      gemini_response: text,
      message: 'Gemini API接続成功'
    });
    
  } catch (error) {
    console.error('Gemini API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Gemini API接続失敗'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('Testing Stable Diffusion API...');
    
    const response = await fetch('http://127.0.0.1:7860/sdapi/v1/txt2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'a beautiful anime girl, masterpiece, best quality',
        negative_prompt: 'lowres, bad anatomy',
        width: 512,
        height: 512,
        steps: 10,
        cfg_scale: 7,
        sampler_name: 'DPM++ 2M Karras',
        batch_size: 1,
        n_iter: 1,
        seed: -1,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Stable Diffusion API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Stable Diffusion API Response received');
    
    return NextResponse.json({
      success: true,
      has_images: !!(data.images && data.images.length > 0),
      message: 'Stable Diffusion API接続成功'
    });
    
  } catch (error) {
    console.error('Stable Diffusion API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Stable Diffusion API接続失敗'
    }, { status: 500 });
  }
} 