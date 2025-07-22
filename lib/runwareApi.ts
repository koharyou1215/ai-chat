
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

    const body = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      width: request.width || 1024,
      height: request.height || 1024,
      steps: request.steps || 30,
      cfg_scale: request.cfg_scale || 7,
      seed: request.seed,
      model_id: request.model_id,
      lora_ids: request.lora_ids,
    };

    try {
      // Runware APIのテキスト-画像生成タスク開始エンドポイント（仮）
      // 正しいエンドポイントはドキュメントで確認が必要
      const response = await fetch(`${this.baseUrl}generation/text-to-image/tasks`, { // 修正
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

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
