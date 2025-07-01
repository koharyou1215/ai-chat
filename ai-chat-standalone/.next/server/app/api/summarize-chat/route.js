(()=>{var e={};e.id=248,e.ids=[248],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4100:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>d,routeModule:()=>g,serverHooks:()=>h,workAsyncStorage:()=>p,workUnitAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>l});var n=r(6559),o=r(8088),a=r(7719),i=r(2190),u=r(7449);let c=process.env.GEMINI_API_KEY??"";async function l(e){try{console.log("Chat summarization API called");let{messages:t,characterName:r,sessionTitle:s}=await e.json();if(console.log("Messages count:",t?.length),!t||0===t.length)return i.NextResponse.json({success:!1,error:"メッセージが見つかりません"},{status:400});if(t.length<3)return i.NextResponse.json({success:!0,summary:{overview:"会話がまだ短いため、要約するには十分な内容がありません。",keyPoints:["会話を続けてより多くの内容を蓄積してください。"],characterInsights:[],emotionalFlow:"会話開始",wordCount:t.reduce((e,t)=>e+t.content.length,0)}});let n=new u.GoogleGenerativeAI(c).getGenerativeModel({model:"gemini-1.5-flash",generationConfig:{temperature:.3,topP:.8,maxOutputTokens:1500}}),o=t.map(e=>`${"user"===e.role?"ユーザー":r||"キャラクター"}: ${e.content}`).join("\n\n"),a=`以下の会話を詳細に分析して、構造化された要約を作成してください。

【会話タイトル】: ${s||"新しいチャット"}
【キャラクター】: ${r||"AI"}

【会話内容】:
${o}

【要求する要約形式】:
以下のJSON形式で応答してください：

{
  "overview": "会話全体の概要（150文字以内）",
  "keyPoints": [
    "重要なポイント1",
    "重要なポイント2",
    "重要なポイント3"
  ],
  "characterInsights": [
    "キャラクターの性格や行動に関する洞察1",
    "キャラクターの性格や行動に関する洞察2"
  ],
  "emotionalFlow": "会話の感情的な流れの説明",
  "topics": [
    "話題1",
    "話題2",
    "話題3"
  ],
  "userEngagement": "ユーザーの関与度や興味のポイント",
  "memorableQuotes": [
    "印象的な発言やフレーズ1",
    "印象的な発言やフレーズ2"
  ]
}

重要な点：
- 客観的で正確な要約を心がける
- キャラクターの個性や特徴を捉える
- 会話の流れと感情の変化を記録
- ユーザーとキャラクターの関係性に注目
- 今後の会話に役立つ情報を抽出

JSON形式以外は出力しないでください。`;console.log("Sending summarization request to Gemini");let l=await n.generateContent(a),g=(await l.response).text();console.log("Gemini response:",g);try{let e=JSON.parse(g),r={messageCount:t.length,userMessageCount:t.filter(e=>"user"===e.role).length,aiMessageCount:t.filter(e=>"assistant"===e.role).length,wordCount:t.reduce((e,t)=>e+t.content.length,0),averageMessageLength:Math.round(t.reduce((e,t)=>e+t.content.length,0)/t.length),conversationDuration:t.length>1?t[t.length-1].timestamp-t[0].timestamp:0};return i.NextResponse.json({success:!0,summary:{...e,stats:r,generatedAt:Date.now()}})}catch(e){return console.error("JSON parse error:",e),i.NextResponse.json({success:!0,summary:{overview:"AIによる会話の要約です。",keyPoints:["会話の詳細な要約の生成中にエラーが発生しました。"],characterInsights:["キャラクターの分析は後ほど再試行してください。"],emotionalFlow:"分析中",topics:["一般的な会話"],userEngagement:"分析中",memorableQuotes:[],stats:{messageCount:t.length,userMessageCount:t.filter(e=>"user"===e.role).length,aiMessageCount:t.filter(e=>"assistant"===e.role).length,wordCount:t.reduce((e,t)=>e+t.content.length,0)},generatedAt:Date.now()}})}}catch(e){return console.error("Chat summarization API error:",e),i.NextResponse.json({success:!1,error:e instanceof Error?e.message:"Unknown error"},{status:500})}}c||console.warn("[summarize-chat] GEMINI_API_KEY が設定されていません");let g=new n.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/summarize-chat/route",pathname:"/api/summarize-chat",filename:"route",bundlePath:"app/api/summarize-chat/route"},resolvedPagePath:"C:\\Users\\kohar\\Desktop\\新しいフォルダー\\ai-chat\\src\\app\\api\\summarize-chat\\route.ts",nextConfigOutput:"standalone",userland:s}),{workAsyncStorage:p,workUnitAsyncStorage:m,serverHooks:h}=g;function d(){return(0,a.patchFetch)({workAsyncStorage:p,workUnitAsyncStorage:m})}},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},8335:()=>{},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[447,580,449],()=>r(4100));module.exports=s})();