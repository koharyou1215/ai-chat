import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing basic Gemini API...');
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('AIzaSyB6swTTIlDM3pgyALHjZDFTUIQf2fhzLAE');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('こんにちは');
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API success:', text);
    
    return NextResponse.json({
      success: true,
      response: text
    });
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 