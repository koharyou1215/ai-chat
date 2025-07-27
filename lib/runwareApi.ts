
export interface RunwareRequest {
  taskType: "imageInference";
  outputType: "URL" | "base64Data" | "dataURI";
  outputFormat?: "JPG" | "PNG" | "WEBP";
  positivePrompt: string; // 'prompt' から変更
  negativePrompt?: string; // 'negative_prompt' から変更
  height?: number;
  width?: number;
  model: string; // 'model_id' から変更、必須に
  steps?: number;
  CFGScale?: number; // 'cfg_scale' から変更
  seed?: number;
  numberResults?: number;
  checkNSFW?: boolean; // 'allow_nsfw' から変更
  lora?: {
    model: string;
    weight?: number;
  }[]; // LoRAの配列を追加
}

export interface RunwareResponse {
  image: string; // base64 encoded image
  seed?: number;
}

// Runware APIのタスク作成時の戻り値の型
export interface RunwareGenerationTask {
  taskId: string;
}

export class RunwareService {
  private apiKey: string;
  private baseUrl = 'https://api.runware.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(params: {
    positivePrompt: string;
    model: string;
    width?: number;
    height?: number;
    CFGScale?: number;
    steps?: number;
  }) {
    const taskUUID = crypto.randomUUID();
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify([{
        taskType: "imageInference",
        taskUUID: taskUUID,
        positivePrompt: params.positivePrompt,
        width: params.width || 512,
        height: params.height || 512,
        model: params.model,
        numberResults: 1,
        CFGScale: params.CFGScale || 7,
        steps: params.steps || 20
      }])
    });

    if (!response.ok) {
      throw new Error(`Runware API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`Runware API error: ${data.errors[0].message}`);
    }

    if (!data.data || !data.data[0]) {
      throw new Error('No image data returned from Runware API');
    }

    return {
      imageURL: data.data[0].imageURL,
      imageUUID: data.data[0].imageUUID
    };
  }
}
