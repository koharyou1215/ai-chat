
export interface RunwareRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  model_id?: string;
  lora_ids?: string[];
}

export interface RunwareResponse {
  image: string; // base64 encoded image
  seed?: number;
}

export class RunwareService {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.runwayml.com/v1/'; // This is a placeholder URL

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(request: RunwareRequest): Promise<RunwareResponse> {
    if (!this.apiKey) {
      throw new Error('Runware APIキーが設定されていません');
    }

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const body = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      width: request.width || 1024,
      height: request.height || 1024,
      steps: request.steps || 30,
      cfg_scale: request.cfg_scale || 7,
      seed: request.seed,
      model: request.model_id,
      loras: request.lora_ids,
    };

    try {
      // RunwayMLのAPIエンドポイントは、モデルによって異なる場合や、
      // 生成タスクを開始して結果をポーリングする非同期フローを持つ場合があります。
      // これは、直接画像を返す単純なエンドポイントを想定した仮の実装です。
      const response = await fetch(`${this.baseUrl}text-to-image`, { // Endpoint is a guess
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.artifacts && data.artifacts.length > 0 && data.artifacts[0].base64) {
        return {
          image: data.artifacts[0].base64,
          seed: data.artifacts[0].seed,
        };
      } else if (data.image) { // Some APIs might return the image directly
        return {
          image: data.image,
        };
      }
      else {
        throw new Error('画像生成に失敗しました');
      }
    } catch (error) {
      console.error('Runware API エラー:', error);
      throw new Error('画像生成サービスでエラーが発生しました');
    }
  }
}
