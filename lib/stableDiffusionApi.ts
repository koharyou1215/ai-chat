export interface StableDiffusionResponse {
  image: string; // base64 encoded image
  seed?: number;
}

export interface StableDiffusionRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  lora?: string;
}

export class StableDiffusionService {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(request: StableDiffusionRequest): Promise<StableDiffusionResponse> {
    if (!this.apiKey) {
      throw new Error('Stable Diffusion APIキーが設定されていません');
    }

    const formData = new FormData();
    formData.append('text_prompts[0][text]', request.prompt);
    formData.append('text_prompts[0][weight]', '1');
    
    if (request.negative_prompt) {
      formData.append('text_prompts[1][text]', request.negative_prompt);
      formData.append('text_prompts[1][weight]', '-1');
    }

    formData.append('cfg_scale', (request.cfg_scale || 7).toString());
    formData.append('height', (request.height || 1024).toString());
    formData.append('width', (request.width || 1024).toString());
    formData.append('steps', (request.steps || 30).toString());
    formData.append('samples', '1');

    if (request.seed) {
      formData.append('seed', request.seed.toString());
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.artifacts && data.artifacts.length > 0) {
        return {
          image: data.artifacts[0].base64,
          seed: data.artifacts[0].seed,
        };
      } else {
        throw new Error('画像生成に失敗しました');
      }
    } catch (error) {
      console.error('Stable Diffusion API エラー:', error);
      throw new Error('画像生成サービスでエラーが発生しました');
    }
  }

  // ReplicateのStable Diffusionを使用する場合の代替実装
  async generateImageWithReplicate(request: StableDiffusionRequest): Promise<StableDiffusionResponse> {
    // Replicate API の実装（後で追加可能）
    // 現在はモックレスポンスを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          image: '/api/placeholder/1024/1024', // プレースホルダー画像
        });
      }, 2000);
    });
  }

  parsePromptFromGemini(geminiResponse: string): { positive: string; negative: string } {
    const lines = geminiResponse.split('\n');
    let positive = '';
    let negative = '';

    for (const line of lines) {
      if (line.startsWith('POSITIVE:')) {
        positive = line.replace('POSITIVE:', '').trim();
      } else if (line.startsWith('NEGATIVE:')) {
        negative = line.replace('NEGATIVE:', '').trim();
      }
    }

    // フォールバック: パターンが見つからない場合は全体をpositiveとして使用
    if (!positive && !negative) {
      positive = geminiResponse.trim();
    }

    return { positive, negative };
  }
} 