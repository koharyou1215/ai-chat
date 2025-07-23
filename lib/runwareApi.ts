
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

export class RunwareService {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.runware.ai/v1/'; // Runware APIの正しいURLに修正

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createGenerationTask(request: RunwareRequest): Promise<{ taskId: string }> {
    if (!this.apiKey) {
      throw new Error('Runware APIキーが設定されていません');
    }

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const body: RunwareRequest = { // RunwareRequest 型を適用
      taskType: "imageInference",
      outputType: "URL",
      outputFormat: "JPG",
      positivePrompt: request.positivePrompt, // 'request.prompt' から変更
      negativePrompt: request.negativePrompt, // 'request.negative_prompt' から変更
      height: request.height || 1024,
      width: request.width || 1024,
      model: request.model, // 'request.model_id' から変更
      steps: request.steps || 30,
      CFGScale: request.CFGScale || 7, // 'request.cfg_scale' から変更
      seed: request.seed,
      numberResults: request.numberResults || 1, // numberResults を request から取得
      checkNSFW: request.checkNSFW, // 'request.allow_nsfw' から変更
    };

    if (request.lora && request.lora.length > 0) { // 'request.lora_ids' から変更
      // lora がある場合、lora オブジェクトの配列として追加
      body.lora = request.lora; // lora は既に正しい形式で渡される
    }

    try {
      console.log('🚀 Runware API リクエスト送信中:', {
        url: `${this.baseUrl}generation/text-to-image/tasks`,
        model: request.model,
        prompt: request.positivePrompt.substring(0, 100) + '...',
        width: request.width,
        height: request.height
      });

      // Runware APIのテキスト-画像生成タスク開始エンドポイント
      const response = await fetch(`${this.baseUrl}generation/text-to-image/tasks`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      console.log('📡 Runware API レスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Runware API エラーレスポンス:', errorText);
        throw new Error(`API request failed: ${response.status} - ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Runware API レスポンスデータ:', data);

      if (data.id) {
        return { taskId: data.id };
      } else {
        throw new Error('画像生成タスクの作成に失敗しました: タスクIDがありません');
      }
    } catch (error) {
      console.error('Runware API タスク作成エラー:', error);
      throw new Error('画像生成サービスでタスク作成エラーが発生しました');
    }
  }

  async getGenerationTaskStatus(taskId: string): Promise<{ status: string; image?: string; seed?: number }> {
    if (!this.apiKey) {
      throw new Error('Runware APIキーが設定されていません');
    }

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
    };

    try {
      // Runware APIのタスクステータス取得エンドポイント（仮）
      const response = await fetch(`${this.baseUrl}generation/tasks/${taskId}`, { // 修正
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      // Runware APIのレスポンス形式に合わせて調整が必要
      // 例: data.status, data.result.image, data.result.seed など
      if (data.status === 'completed') {
        return {
          status: 'completed',
          image: data.result?.base64 || data.result?.image, // base64またはimageフィールドを想定
          seed: data.result?.seed,
        };
      } else if (data.status === 'failed') {
        throw new Error(`画像生成タスクが失敗しました: ${data.error || '不明なエラー'}`);
      } else {
        return { status: data.status };
      }
    } catch (error) {
      console.error('Runware API タスクステータス取得エラー:', error);
      throw new Error('画像生成サービスでステータス取得エラーが発生しました');
    }
  }
}
