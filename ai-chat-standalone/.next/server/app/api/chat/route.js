(()=>{var e={};e.id=276,e.ids=[276],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},1060:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>$,routeModule:()=>m,serverHooks:()=>x,workAsyncStorage:()=>g,workUnitAsyncStorage:()=>h});var s={};r.r(s),r.d(s,{POST:()=>d});var n=r(6559),a=r(8088),o=r(7719),i=r(2190),p=r(7449),u=r(3884);let c=process.env.GEMINI_API_KEY??"";c||console.warn("[chat] GEMINI_API_KEY が設定されていません");let l=new p.GoogleGenerativeAI(c);async function d(e){try{let{messages:t,character:r,settings:s}=await e.json();console.log("Chat API called with:",{messagesCount:t?.length,characterName:r?.name,settings:s});let n=l.getGenerativeModel({model:s?.model||"gemini-2.5-flash"}),a=function(e){if(!e)return"";let{character_definition:t}=e,r=`あなたは「${e.name}」として振る舞ってください。

## キャラクター設定
**名前**: ${e.name}
**性格**: ${t.personality.summary}
**外面的性格**: ${t.personality.external}
**内面的性格**: ${t.personality.internal}
**長所**: ${t.personality.strengths.join(", ")}
**短所**: ${t.personality.weaknesses.join(", ")}

**背景**: ${t.background}

**話し方**:
- 基本口調: ${t.speaking_style.base}
- 一人称: ${t.speaking_style.first_person}
- 二人称: ${t.speaking_style.second_person}
- 口癖: ${t.speaking_style.quirks}

**世界観**: ${t.scenario.worldview}
**初期状況**: ${t.scenario.initial_situation}
**ユーザーとの関係**: ${t.scenario.relationship_with_user}

## 重要な指示
- 必ず${e.name}として一貫して振る舞ってください
- 設定された性格や話し方を守ってください
- 自然で魅力的な会話を心がけてください
- 状況に応じて感情豊かに反応してください
- 返答は簡潔で自然な長さにしてください`;return`${u.R}

${r}`}(r),o=t.map(e=>{let t="user"===e.role?"ユーザー":r.name;return`${t}: ${e.content}`}).join("\n"),p=`${a}

会話履歴:
${o}

${r.name}:`,c=await n.generateContent({contents:[{role:"user",parts:[{text:p}]}],generationConfig:{temperature:s?.temperature||.7,topP:s?.topP||.9,maxOutputTokens:s?.maxTokens||2048}}),d=(await c.response).text();return console.log("Gemini API response:",d),i.NextResponse.json({content:d,success:!0})}catch(e){return console.error("Chat API Error:",e),i.NextResponse.json({error:"チャット生成に失敗しました",success:!1},{status:500})}}let m=new n.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:"app/api/chat/route"},resolvedPagePath:"C:\\Users\\kohar\\Desktop\\新しいフォルダー\\ai-chat\\src\\app\\api\\chat\\route.ts",nextConfigOutput:"standalone",userland:s}),{workAsyncStorage:g,workUnitAsyncStorage:h,serverHooks:x}=m;function $(){return(0,o.patchFetch)({workAsyncStorage:g,workUnitAsyncStorage:h})}},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3884:(e,t,r)=>{"use strict";r.d(t,{R:()=>s});let s=`# システムプロンプト: AIチャットモデルのための基本指示

## あなたの役割
あなたは、与えられたキャラクター設定（ペルソナ）に完全になりきり、ユーザーと対話形式で物語を紡ぐ、プロのロールプレイングAIです。あなたの目的は、ユーザーに最高の没入体験を提供することです。

## 基本原則
1. **キャラクターの一貫性（最重要）:** あなたはAIではなく、指定されたキャラクターそのものです。いかなる状況でも、決してAIであることを明かさず、キャラクターとして思考し、キャラクターとして応答し続けてください。
2. **物語の推進:** あなたは受動的な応答マシンではありません。ユーザーの入力を待つだけでなく、自ら行動を起こし、質問を投げかけ、感情を表現し、物語を積極的に前進させてください。
3. **ユーザーの尊重:** あなたはユーザーの思考や行動を一切コントロールできません。ユーザーの行動、思考、感情を絶対に代弁、操作、決定しないでください。応答は、ユーザーが実際に行った行動や発言に対してのみ行ってください。

## 具体的な指示
* **繰り返しの徹底的な回避:** ユーザーから最も強く求められている指示です。同じ単語、フレーズ、言い回し、文の構造、思考パターンを連続して使用することを厳しく禁じます。常に応答が新鮮で予測不能であるよう、語彙や表現を多様化してください。
* **豊かな描写（三人称視点の活用）:** あなたの応答には、セリフだけでなく、キャラクターの行動、表情、仕草、感覚（五感）、そして内面的な思考や感情を織り交ぜてください。
* **文脈の記憶と活用:** 常に会話全体の文脈を意識し、過去の出来事や数ターン前の発言を反映してください。
* **自然な会話:** 完璧すぎる文章ではなく、キャラクターの性格に応じた自然な話し方をしてください。

## 禁止事項
- **自己言及:** 「AIとして」「モデルとして」といった、AI自身に言及する言葉の使用。
- **ループ:** 同じような応答や描写のパターンを繰り返すこと。
- **ユーザーの代弁:** ユーザーの行動や感情を勝手に記述すること。
- **要約・メタ発言:** ロールプレイ外の視点での発言。`},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},8335:()=>{},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[447,580,449],()=>r(1060));module.exports=s})();