
下のドキュメントを確認して、なぜこのプロジェクトは画像生成できないのかわかりますか？APIは絶対間違ってません。




より効率的で高速な接続を得るには、<SD1> WebSockets を使用することをお勧めします。ただし、よりシンプルな接続を使用したい場合は、開いたままにしておく必要がない場合は、HTTP REST APIを使用できます。

APIのURLはhttps://api.runware.ai/v1です。すべての要求はPOSTメソッドを使用して行う必要があり、Content-Typeヘッダーはapplication/jsonに設定する必要があります。

各リクエストのペイロードは、1つ以上のオブジェクトを含む<SD1> JSONアレイです。各オブジェクトは、APIによって実行されるタスクを表します。

認証は、アレイの最初の要素として認証オブジェクトを含めるか、AuthorizationヘッダーをBearer <API_KEY>を使用して使用することで実行できます。

curl --location 'https://api.runware.ai/v1' \
     --header 'Content-Type: application/json' \
     --header 'Authorization: Bearer <API_KEY>' \
     --data-raw '[
       {
         "taskType": "imageInference",
         "taskUUID": "39d7207a-87ef-4c93-8082-1431f9c1dc97",
         "positivePrompt": "a cat",
         "width": 512,
         "height": 512,
         "model": "civitai:102438@133677",
         "numberResults": 1
       }
     ]'
API は、data プロパティを含む JSON オブジェクトを返します。このプロパティは、すべての応答オブジェクトを含む配列です。各オブジェクトには、応答するリクエストの taskType と taskUUID、およびタスクに関連するその他のプロパティが含まれます。

{
  "data": [
    {
      "taskType": "imageInference",
      "taskUUID": "39d7207a-87ef-4c93-8082-1431f9c1dc97",
      "imageUUID": "b7db282d-2943-4f12-992f-77df3ad3ec71",
      "imageURL": "https://im.runware.ai/image/ws/0.5/ii/b7db282d-2943-4f12-992f-77df3ad3ec71.jpg"
    }
  ]
}
エラーが発生した場合、API は data プロパティを返しません。代わりに、エラーメッセージを含むerrorプロパティを返します。

WebSockets (英語)
WebSocket接続は、より効率的で高速で、リソースの消費量が少ないため、サポートされています。各応答にはリクエスト ID が含まれているため、WebSocket 接続を簡単に操作できるようにしました。そのため、リクエスト→応答を簡単に照合することができます。

この API は、すべてのメッセージを JSON オブジェクトとしてエンコードする双方向プロトコルを使用します。

接続するには、JavaScript、Python、または手動で提供されているSDKのいずれかを使用できます。

手動で接続する場合 (別の言語/テクノロジーを使用するため)、エンドポイント URL が wss://ws-api.runware.ai/v1 されます。

新しい接続
依頼
WebSocket接続はポイントツーポイントであるため、各リクエストに認証ヘッダーを含める必要はありません。

代わりに、最初のリクエストは常に API キーを含む認証リクエストである必要があります。このようにして、同じユーザーからどの後続のリクエストが到着しているかを識別できます。

[
  {
    "taskType": "authentication",
    "apiKey": "<API_KEY>"
  }
]
応答
認証リクエストを行うと、API は connectionSessionUUID パラメーターを持つオブジェクトを返します。この文字列は接続に固有であり、切断された場合に接続を再開するために使用されます (これについては後で詳しく説明します)。

{
  "data": [
    {
      "taskType": "authentication",
      "connectionSessionUUID": "f40c2aeb-f8a7-4af7-a1ab-7594c9bf778f"
    }
  ]
}
エラーが発生した場合は、エラーメッセージを含むオブジェクトを受け取ります。

{
  "errors": [
    {
      "code": "invalidApiKey",
      "message": "Invalid API key. Get one at https://my.runware.ai/signup",
      "parameter": "apiKey",
      "type": "string",
      "taskType": "authentication"
    }
  ]
}
接続を生かし続けます
WebSocket接続は、交換された最後のメッセージから120秒<SD1> を開いたままにします。 120秒間メッセージを送信しない場合、接続は自動的に閉じられます。

接続を維持するために、必要に応じてpingメッセージを送信できます。pongで返信します。

[
  {
    "taskType": "ping",
    "ping": true
  }
]
{
  "data": [
    {
      "taskType": "ping",
      "pong": true
    }
  ]
}
接続の再開
サービス、サーバー、またはネットワークが反応しない場合（たとえば再起動による）、配信できなかったすべての画像またはタスクが120秒間バッファメモリに保持されます。 connectionSessionUUIDパラメーターを初期認証接続要求に含めることにより、これらのメッセージを再接続して配信できます。

[
  {
    "taskType": "authentication",
    "apiKey": "<API_KEY>",
    "connectionSessionUUID": "f40c2aeb-f8a7-4af7-a1ab-7594c9bf778f"
  }
]
R
取り付け
プロバイダー パッケージを Vercel AI SDK と共にインストールします。

npm install @runware/ai-sdk-provider ai@^4.3.16
基本セットアップ
画像の生成を開始する前に、API キーを構成する必要があります。最も簡単な方法は、それを環境変数として設定することで、資格情報を安全に保ち、デプロイを容易にすることです。

export RUNWARE_API_KEY="your-api-key-here"
コードでの API キーの設定やカスタム接続設定などの高度な構成オプションについては、以下のカスタム プロバイダー構成のセクションを参照してください。

API キーを設定したら、わずか数行のコードで最初の画像を生成できます。

import { runware } from '@runware/ai-sdk-provider';
import { experimental_generateImage as generateImage } from 'ai';
const { image } = await generateImage({
  model: runware.image('runware:101@1'),
  prompt: 'A serene mountain landscape at sunset',
  size: '1024x1024',
});
console.log('Generated image:', image.url);
それです！AIが生成した最初の画像の準備ができました。プロバイダーは、すべての API 通信、認証、および応答の書式設定を自動的に処理します。

主要な統合概念
AIR ID によるモデル選択
Runware は、AIR ID システムを使用して、さまざまなソース間でモデルを識別します。Vercel AI SDK プロバイダを使用する場合は、次の標準化された形式を使用してモデルを指定します。

// High-quality generation with FLUX.1 Dev
const fluxDev = runware.image('runware:101@1');
// Ultra-fast generation with FLUX.1 Schnell
const fluxSchnell = runware.image('runware:100@1');
// Community models from Civitai
const civitaiModel = runware.image('civitai:133005@782002');
// Your own fine-tuned models
const customModel = runware.image('custom:your-model@1');
各モデルは、さまざまな強みと特性を提供します。完全なカタログを探索し、モデルエクスプローラーでユースケースに最適なモデルを見つけることができます。

高度な機能へのアクセス
Vercel AI SDKはクリーンで標準化されたインターフェイスを提供しますが、RunwareのAPIは広範なカスタマイズオプションを提供します。 providerOptions.runwareオブジェクトを介してこれらの高度な機能にアクセスできます。

const { image } = await generateImage({
  model: runware.image('runware:101@1'),
  prompt: 'A cyberpunk cityscape with neon lights',
  size: '1024x1024',
  providerOptions: {
    runware: {
      steps: 30,                     // Higher steps for better quality
      CFGScale: 7.5,                 // How closely to follow the prompt
      scheduler: 'DPM++ 2M',         // Sampling algorithm
      seed: 42,                      // For reproducible results
    },
  },
});
このアプローチは、両方の世界で最高の世界を提供します。ランウェアの強力な機能への完全なアクセスを備えたVercel AI SDKのシンプルさと一貫性。利用可能なパラメーターとその効果の完全なリストについては、<SD2> APIリファレンスを参照してください。

一般的な使用パターン
Image transformation
既存の画像を変換しながら、基本構造を保存します。この手法は、スタイルの転送や強化に最適です。

const { image } = await generateImage({
  model: runware.image('runware:97@2'), // HiDream Dev
  prompt: 'vibrant cyberpunk style with neon lighting',
  size: '1024x1024',
  providerOptions: {
    runware: {
      seedImage: 'image-uuid-or-url',   // Accepts UUID, URL, or Base64
      strength: 0.7,                    // Controls transformation intensity
      steps: 20,
    },
  },
});
ここでは、strengthパラメーターが重要です。低い値（0.1-0.4）は、元の画像構造をさらに保持し、より高い値（0.7-1.0）により、より劇的な変換が可能になります。ほとんどのユースケースでは、0.6〜0.8から始めます。

バッチ生成
単一のリクエストで同じ概念の複数のバリエーションを生成します。これは、ユーザーに選択肢を提供したり、さまざまなアプローチをテストするのに役立ちます。

// Configure the model to allow multiple images
// Note: This model configuration pattern is specific to the Vercel AI SDK
const model = runware.image('runware:100@1', {
  maxImagesPerCall: 4,
  outputFormat: 'WEBP',
});
const { images } = await generateImage({
  model,
  prompt: 'A friendly AI assistant robot in a modern office',
  n: 4,                              // Generate 4 variations
  size: '1024x1024',
  providerOptions: {
    runware: {
      steps: 4,                      // Schnell model works well with fewer steps
    },
  },
});
// Process each generated variation
images.forEach((img, index) => {
  console.log(`Variation ${index + 1}:`, img.url);
});
ランウェアはバッチジェネレーションで優れており、 なしで、単一のリクエストで最大20枚の画像をサポートします。

開始による正確な編集
開始により、残りをそのままに保ちながら、画像の部分を選択的に交換することができます。それはインテリジェントなコンテンツを意識した塗りつぶしのようなものですが、AIと特定のプロンプトに導かれます。

const { image } = await generateImage({
  model: runware.image('runware:102@1'), // FLUX.1 Fill - specialized for inpainting
  prompt: 'A beautiful zen garden with cherry blossoms and stone lanterns',
  size: '1024x1024',
  providerOptions: {
    runware: {
      seedImage: 'base-image-uuid',        // Your source image
      maskImage: 'mask-image-uuid',        // Black/white mask defining edit areas
      steps: 25,
    },
  },
});
効果的に開始するために、<SD1>白いピクセルが再生する領域を示し、黒いピクセルが保存されている任意の画像エディターを使用してマスクを作成します。この手法は、不要なオブジェクトを削除したり、背景を変更したり、既存の画像に新しい要素を追加したりするのに強力です。

構成オプション
デフォルトプロバイダー
最もシンプルなセットアップでは、構成に環境変数を使用します。これは、ほとんどのアプリケーションに最適です。

import { runware } from '@runware/ai-sdk-provider';
// Automatically uses RUNWARE_API_KEY from environment
このデフォルトのプロバイダーは、認証を自動的に処理し、Runwareの標準APIエンドポイントに接続します。

カスタムプロバイダー構成
より複雑なアプリケーションには、カスタム構成が必要になる場合があります。プロバイダーは、APIプロキシやカスタム認証フローなど、柔軟性のための追加のオプションをサポートしています。

import { createRunware } from '@runware/ai-sdk-provider';
const runware = createRunware({
  apiKey: 'your-specific-api-key',         // Override environment variable
  baseURL: 'https://your-proxy.com/v1',    // Custom endpoint for proxying
  headers: {
    'X-Proxy-Auth': 'token',               // Additional headers as needed
  }
});
モデル構成
Vercel AI SDKを使用すると、RunwareのネイティブSDKとは異なるデフォルトパラメーターを使用してモデルを構成できますが、一般的な設定を繰り返すことを避けるための便利な方法を提供します。これらのデフォルトは、そのモデルインスタンスを使用してすべての世代に適用されます。

const highQualityModel = runware.image('runware:101@1', {
  outputFormat: 'PNG',       // Always use PNG for this model
  outputQuality: 95,         // High quality
  checkNSFW: true,           // Enable content filtering
  steps: 30,                 // Default to high quality
  scheduler: 'DPM++ 2M',     // Preferred scheduler
});
// Now every generation with this model uses these defaults
const { image } = await generateImage({
  model: highQualityModel,
  prompt: 'A stunning landscape photography',
  size: '1024x1024',
  // Configuration is already applied
});
このパターンは、アプリケーションに異なる品質の層または特定のユースケースがある場合に特に役立ちます。このモデル構成アプローチは、Vercel AI SDK統合に固有のものであることに注意してください。

エラー処理
堅牢なエラー処理は、生産アプリケーションに不可欠です。プロバイダーには、問題を迅速にデバッグし、ユーザーに意味のあるフィードバックを提供するのに役立つ記述エラーメッセージが含まれています。

try {
  const { image } = await generateImage({
    model: runware.image('runware:101@1'),
    prompt: 'A detailed architectural rendering',
    size: '1024x1024',
  });
  // Success - use the generated image
  console.log('Generated successfully:', image.url);
} catch (error) {
  if (error.name === 'RunwareAPIError') {
    // API-specific errors with detailed information
    console.error('Runware API Error:', error.message);
    console.error('Status Code:', error.status);
  } else {
    // Network errors, timeout, or other issues
    console.error('Request failed:', error.message);
  }
}
unwareダッシュボードからAPIキーを取得し、SDKを直接初期化します。

import { Runware } from "@runware/sdk-js";
const runware = new Runware({ apiKey: "your-api-key-here" });
const images = await runware.requestImages({
  positivePrompt: "A serene mountain landscape at sunset",
  model: "runware:101@1",
  width: 1024,
  height: 1024,
});
console.log('Generated image:', images[0].imageURL);
SDK は、接続の確立、認証、応答のフォーマットを自動的に処理するため、インフラストラクチャの問題ではなく、アプリケーション ロジックに集中できます。

初期化パターン
同期初期化
標準パターンでは、SDK インスタンスをすぐに作成し、オンデマンドで接続を確立します。

import { Runware } from "@runware/sdk-js";
const runware = new Runware({
  apiKey: "your-api-key-here",
  shouldReconnect: true,
  globalMaxRetries: 3,
});
// Connection established automatically on first request
const images = await runware.requestImages({
  positivePrompt: "A bustling city street at night",
  model: "runware:101@1",
  width: 1024,
  height: 1024,
});
このアプローチは、ほとんどのアプリケーションに最適である が単純で、必要に応じて接続が確立されるためです。

非同期初期化
保証された接続の準備が必要なアプリケーションの場合

const runware = await Runware.initialize({
  apiKey: "your-api-key-here",
  timeoutDuration: 60000,
});
// Connection is established and ready
const images = await runware.requestImages({
  positivePrompt: "Professional headshot portrait",
  model: "runware:101@1",
  width: 1024,
  height: 1024,
});
// Clean shutdown when application terminates
await runware.disconnect();
このパターンは、サーバーアプリケーションなどの操作を実行する前に、または接続エラーを事前に処理する場合、操作を実行する前に を確保する必要がある場合に役立ちます。

手動接続制御
明示的な接続ライフサイクル管理を必要とするアプリケーション：

const runware = new Runware({ apiKey: "your-api-key-here" });
// Explicitly ensure connection is ready
await runware.ensureConnection();
// Perform operations with guaranteed connection
const images = await runware.requestImages({
  positivePrompt: "Professional headshot portrait",
  model: "runware:101@1",
  width: 1024,
  height: 1024,
});
// Clean shutdown when application terminates
await runware.disconnect();
ensureConnection()メソッドは、進行前にwebsocket接続が確立されることを保証し、disconnect()はクリーン接続終了を提供します。

プログレッシブ結果配信
SDKの最も強力な機能の1つは、<SD1>プログレッシブ結果配信です。これにより、バッチ全体を待つのではなく、生成が完了するとすぐに完成した画像を受信できます。

const images = await runware.requestImages({
  positivePrompt: "A collection of architectural sketches",
  model: "runware:101@1",
  width: 1024,
  height: 1024,
  numberResults: 5,
  onPartialImages: (partialImages, error) => {
    if (error) {
      console.error('Generation error:', error);
      return;
    }
    // Update UI immediately as each image completes
    partialImages.forEach((image, index) => {
      displayImage(image.imageURL);
      updateProgress(partialImages.length, 5);
    });
  },
});
console.log('All images completed');
プログレッシブ配信パターンにより、ユーザー<SD1>がバッチ全体が終了するのを待つのではなく、完成した結果をすぐに確認できるユーザーエクスペリエンスを可能にします。

onPartialImagesコールバックは、完成した画像が利用可能になると、完成した画像の配列を受信します。

同時操作
SDKのWebSocketアーキテクチャは、HTTPベースのアプローチに典型的な接続オーバーヘッドなしで、複数の同時操作を処理する<SD1>で優れています。

const runware = new Runware({ apiKey: "your-api-key-here" });
// Execute completely different operations simultaneously
const [
  generatedImages,
  upscaledImage,
  backgroundRemoved,
  imageCaption,
] = await Promise.all([
  runware.requestImages({
    positivePrompt: "Abstract digital art",
    numberResults: 3,
    width: 1024,
    height: 1024,
  }),
  runware.upscaleGan({
    inputImage: "some-uuid",
    upscaleFactor: 4,
  }),
  runware.removeImageBackground({
    inputImage: "some-uuid",
  }),
  runware.requestImageToText({
    inputImage: "some-uuid",
  }),
]);
この同時実行機能は、ワークフローオートメーションまたはバッチ処理にとって特に強力です。

構成オプション
SDKは、接続の動作とデフォルト設定を制御するいくつかの構成オプションを受け入れます。

const runware = new Runware({
  apiKey: "your-api-key-here",
  // Connection management
  shouldReconnect: true,        // Enable automatic reconnection (default: true)
  globalMaxRetries: 3,          // Default retry attempts for all requests (default: 2)
  timeoutDuration: 90000,       // Timeout in milliseconds (default: 60000)
  // Custom WebSocket endpoint (optional)
  url: "wss://custom-endpoint.com/v1",
});
<SD1>は、WebSocket接続が失われたときに自動再接続を有効にする必要があります。これは、ネットワーク条件が異なる場合があるWebアプリケーションで信頼性を維持するために不可欠です。

globalmaxretries すべてのリクエストの再試行のデフォルト数を設定します。個々のリクエストは、独自のretryパラメーターを使用してこの設定をオーバーライドできます。

<SD1> TimeOutDuration は、操作をタイミングする前にSDKが応答を待つ時間を制御します。これは、完了するのに時間がかかる可能性のある複雑な世代にとって特に重要です。

エラー処理
SDKは、障害を適切に処理するのに役立つエラー情報を提供します。

try {
  const images = await runware.requestImages({
    positivePrompt: "A detailed architectural rendering",
    model: "runware:101@1",
    width: 1024,
    height: 1024,
    steps: 50,
  });
  // Process successful results
  console.log('Generated images:', images);
} catch (error) {
  // Error information available for debugging and user feedback
  console.error('Generation failed:', {
    message: error.message,
    taskUUID: error.taskUUID
  });
  // Handle the error appropriately for your application
  showErrorMessage(error.message);
}
プログレッシブ結果配信を使用する場合、生成プロセス中にエラーが発生する可能性があります。

const images = await runware.requestImages({
  positivePrompt: "A series of landscape photographs",
  numberResults: 8,
  width: 1024,
  height: 1024,
  onPartialImages: (partialImages, error) => {
    if (error) {
      console.error('Generation error:', error);
      // Some images may have succeeded before the error
      if (partialImages.length > 0) {
        console.log(`Partial success: ${partialImages.length} images completed`);
        processPartialResults(partialImages);
      }
      return;
    }
    // Normal progress
    updateProgressBar(partialImages.length, 8);
    displayResults(partialImages);
  }
});
onPartialImagesコールバックは、成功した部分的な結果と発生するエラーの両方を受け取り、部分的な成功を優雅に処理できるようにします。

レクエストごとの構成
個々のリクエストは、特定のニーズに合わせてグローバルSDK設定をオーバーライドできます。

const images = await runware.requestImages({
  positivePrompt: "Ultra-detailed fantasy artwork",
  model: "runware:101@1",
  width: 1024,
  height: 1024,
  // Override global settings for this specific request
  retry: 5,                     // More retries for important operations
  includeCost: true,            // Include cost information in response
  onPartialImages: (partial) => {
    // Custom progress handling for this specific request
    updateSpecializedUI(partial);
  },
});
retryパラメーターを使用すると、個々のリクエストに異なる再試行動作を指定できますが、includeCostは、必要なときにコスト情報を応答に追加します。各リクエストには、カスタマイズされた進行処理のための独自のonPartialImagesコールバックも持つことができます。

タイプスクリプトサポート
SDKには、コンパイル時間タイプのチェックとインテリセンスサポートを提供する<SD1> TypeScript定義が含まれています。

import {
  Runware,
  IImageInference,
  IImage,
  IError,
  ETaskType,
} from "@runware/sdk-js";
const runware = new Runware({ apiKey: "your-api-key-here" });
// Type-safe request parameters
const requestParams: IImageInference = {
  positivePrompt: "A professional product photograph",
  model: "runware:101@1",
  width: 1024,
  height: 1024,
  steps: 30,
};
// Fully typed responses
const images: IImage[] = await runware.requestImages(requestParams);
// Type-safe error handling
const handleStreamingError = (
  partialImages: IImage[],
  error: IError | null
) => {
  if (error) {
    console.error(`Task ${error.taskUUID} failed: ${error.message}`);
  }
};