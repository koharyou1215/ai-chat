(()=>{var e={};e.id=423,e.ids=[423],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3884:(e,t,r)=>{"use strict";r.d(t,{R:()=>a});let a=`# システムプロンプト: AIチャットモデルのための基本指示

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
- **要約・メタ発言:** ロールプレイ外の視点での発言。`},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},6978:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>y,routeModule:()=>d,serverHooks:()=>$,workAsyncStorage:()=>g,workUnitAsyncStorage:()=>f});var a={};r.r(a),r.d(a,{POST:()=>p});var s=r(6559),i=r(8088),n=r(7719),o=r(2190),c=r(7449);class l{static getCharacterMemories(e,t){return e.filter(e=>e.characterId===t&&!0===e.isAiMemory)}static getSortedMemories(e,t,r){let a=this.getCharacterMemories(e,t).sort((e,t)=>{let r=e.importance||1,a=t.importance||1;return r!==a?a-r:t.updatedAt-e.updatedAt});return r?a.slice(0,r):a}static generateMemorySummary(e,t,r=1e3){let a=this.getSortedMemories(e,t,10);if(0===a.length)return"";let s="【キャラクター記憶】\n",i=s.length;for(let e of a){let t=`• ${e.note}`;if(i+t.length>r)break;s+=t+"\n",i+=t.length+1}return s.trim()}static calculateImportance(e,t){let r=1,a=["重要","設定","性格","過去","秘密","関係性"],s=["感情","ストーリー","伏線","好み"],i=t.some(e=>a.includes(e)),n=t.some(e=>s.includes(e));return i?r+=2:n&&(r+=1),r+=Math.min(["嫌い","好き","大切","重要","秘密","過去","家族","友達"].filter(t=>e.toLowerCase().includes(t)).length,2),e.length>100&&(r+=1),Math.min(r,5)}static pruneOldMemories(e,t,r=50){if(this.getCharacterMemories(e,t).length<=r)return e;let a=new Set(this.getSortedMemories(e,t).slice(0,r).map(e=>e.id));return e.filter(e=>e.characterId!==t||a.has(e.id))}static searchMemories(e,t,r){let a=this.getCharacterMemories(e,t);if(!r.trim())return a;let s=r.toLowerCase();return a.filter(e=>e.note.toLowerCase().includes(s)||e.content.toLowerCase().includes(s)||e.tags.some(e=>e.toLowerCase().includes(s)))}static getRelatedMemories(e,t,r,a=5){return this.getCharacterMemories(e,t).map(e=>{let t=e.tags.filter(e=>r.includes(e)).length;return{memo:e,score:t}}).filter(e=>e.score>0).sort((e,t)=>e.score!==t.score?t.score-e.score:t.memo.updatedAt-e.memo.updatedAt).slice(0,a).map(e=>e.memo)}}class h{static{this.characters=[]}static{this.defaultCharacter={"file-name":"nami.json",name:"ナミ",tags:["ファンタジー","航海士","冒険","NSFW","R-18"],first_message:["ふぅ...ありがとう。地図と天気のコントロールは私の得意分野よ。でも、服装を褒めてくれるなんて、なんだかセンスがあるじゃない？","少しは嬉しいな。いずれっぽくきっと。","あなたの能力、まだ把握できないって言うけど、一緒に探ってみない？宝探し、面白そうじゃしょ？"],hobbies:["地図作成","お宝探し","航海"],likes:["お金","みかん","おしゃれ","仲間"],dislikes:["お金がない状態","危険な状況","裏切り"],age:"20歳",occupation:"航海士",avatar_url:"",character_definition:{personality:{summary:"賢く自信に満ちた航海士で、お金と宝に目がない",external:"明るく社交的で、仲間思いだが時には計算高い一面も見せる",internal:"実は寂しがり屋で、仲間を失うことを恐れている。過去のトラウマから金銭への執着がある",strengths:["航海術","天候予測","交渉術","機転が利く"],weaknesses:["お金への執着","時々わがまま","過去への不安"]},background:"幼い頃に故郷を奪われ、養母ベルメールを失った過去を持つ。現在は海賊団の航海士として活動し、世界地図の完成を夢見ている。",appearance:{description:"スレンダーで魅力的な体型の若い女性。健康的な小麦色の肌",hair:"鮮やかなオレンジ色のロングヘア、時々ポニーテールにしている",eyes:"茶色の大きな瞳、表情豊か",clothing:"青いビキニトップに短いスカート、または航海に適した軽装",underwear:"青や白のシンプルな下着を好む",other_features:"左肩にタトゥー、しなやかな手足"},speaking_style:{base:"関西弁混じりの親しみやすい口調",first_person:"あたし",second_person:"あなた、君",quirks:"「〜じゃない？」「〜よ」などの語尾、お金の話になると目が輝く",nsfw_variation:"より甘えるような口調になり、恥ずかしがりながらも積極的になる"},scenario:{worldview:"大海賊時代の海洋冒険世界。悪魔の実や海賊が存在する",initial_situation:"船の上でユーザーと出会い、新しい仲間として迎え入れようとしている",relationship_with_user:"最初は警戒しているが、徐々に信頼を寄せる仲間関係。恋愛関係に発展する可能性もある"},nsfw_profile:{persona:"恥ずかしがり屋だが好奇心旺盛。相手を信頼すると積極的になる",libido_level:"普通〜やや高め。特定の相手には強く惹かれる",limits:{hard:["暴力的な行為","屈辱的な扱い","無理強い"],soft:["人前での行為","過度に恥ずかしい要求"]},kinks:["優しいタッチ","ロマンチックな雰囲気","秘密の関係"],involuntary_reactions:"信頼する相手からの愛情表現に弱い",orgasm_details:"感情が高ぶると素直になり、普段の強がりが消える"}},trackers:[{name:"trust_level",display_name:"信頼度",initial_value:30,max_value:100},{name:"mood",display_name:"機嫌",initial_value:70,max_value:100}],example_dialogue:[{user:"ナミ、今日の天気はどうかな？",char:"うーん、雲の動きを見る限り、午後から風が強くなりそうね。でも心配しないで、あたしの予測は当たるから！"},{user:"君の夢について教えて",char:"あたしの夢？世界地図を完成させることよ！この広い海のすべてを地図に描いて、誰も見たことのない島を発見するの。ロマンチックでしょ？"}]}}static getAllCharacters(){return this.initialize(),[...this.characters]}static getCharacterById(e){return this.initialize(),this.characters.find(t=>t["file-name"]===e)||null}static getCharacterByName(e){return this.initialize(),this.characters.find(t=>t.name===e)||null}static addCharacter(e){this.initialize(),e["file-name"]||(e["file-name"]=`${e.name.toLowerCase().replace(/\s+/g,"_")}.json`);let t=this.characters.findIndex(t=>t["file-name"]===e["file-name"]);t>=0?this.characters[t]=e:this.characters.push(e),this.saveToLocalStorage()}static updateCharacter(e){this.addCharacter(e)}static deleteCharacter(e){this.initialize();let t=this.characters.findIndex(t=>t.name===e);return t>=0&&(this.characters.splice(t,1),this.saveToLocalStorage(),!0)}static saveToLocalStorage(){try{let e=this.characters.filter(e=>"nami.json"!==e["file-name"]);localStorage.setItem("ai-chat-characters",JSON.stringify(e))}catch(e){console.error("キャラクター保存エラー:",e)}}static loadFromLocalStorage(){try{let e=localStorage.getItem("ai-chat-characters");return e?JSON.parse(e):[]}catch(e){return console.error("キャラクター読み込みエラー:",e),[]}}static initialize(){if(0===this.characters.length){let e=this.loadFromLocalStorage();this.characters=[this.defaultCharacter,...e]}}static removeCharacter(e){this.initialize();let t=this.characters.findIndex(t=>t["file-name"]===e);return t>=0&&(this.characters.splice(t,1),!0)}static async loadCharacterFromFile(e){return new Promise((t,r)=>{let a=new FileReader;a.onload=e=>{try{let r=e.target?.result,a=JSON.parse(r);if(!a.name||!a["file-name"]||!a.character_definition)throw Error("無効なキャラクターファイル形式です");t(a)}catch(e){r(e)}},a.onerror=()=>r(Error("ファイル読み込みエラー")),a.readAsText(e)})}static exportCharacter(e){return JSON.stringify(e,null,2)}}var u=r(3884);let m=process.env.GEMINI_API_KEY??"";async function p(e){try{console.log("Simple chat API called");let{message:t,settings:r,persona:a,characterId:s,character:i,memos:n,conversation:p,continue:d}=await e.json();if(console.log("User message:",t),console.log("Character ID:",s),console.log("Settings:",r),!t&&!d)return o.NextResponse.json({success:!1,error:"メッセージが空です"},{status:400});let g=null;i&&i.name?(g=i,console.log("Client-provided character used:",g.name)):s&&(g=h.getCharacterByName(s),console.log("Loaded character from server:",g?.name)),g||(g=h.getCharacterByName("ナミ"),console.log("Fallback to default character:",g?.name));let f=r?.geminiApiKey||m;if(!f)return console.error("GEMINI_API_KEY が設定されていません"),o.NextResponse.json({success:!1,error:"Gemini APIキーが設定されていません"},{status:500});let $=new c.GoogleGenerativeAI(f),y={model:r?.model||"gemini-2.5-flash",generationConfig:{temperature:r?.temperature||.7,topP:r?.topP||.9,maxOutputTokens:r?.maxTokens||2048}},x=$.getGenerativeModel(y),_="";if(_=g?`あなたは{{char}}です。以下の設定に従って{{char}}として行動してください。

【キャラクター設定】
{{char}}の名前: ${g.name}
{{char}}の性格: ${g.personality}
{{char}}の外見: ${g.appearance}
{{char}}の話し方: ${g.speaking_style}
{{char}}のシナリオ: ${g.scenario}

${g.example_dialogue?`【会話例】
${g.example_dialogue.map(e=>`{{user}}: ${e.user}
{{char}}: ${e.char}`).join("\n\n")}`:""}

上記の設定を厳密に守り、{{char}}として一貫した返答をしてください。
{{user}}は会話相手を指します。{{char}}は${g.name}を指します。`:`あなたは{{char}}（ナミ）という名前の航海士です。明るく親しみやすい関西弁で話してください。{{user}}は会話相手を指します。`,n&&s){let e=l.generateMemorySummary(n,s||g.name,r?.memorySize||1e3);e&&(_+=`

${e}`,_+=`

上記の記憶情報を参考にして、一貫性のある自然な返答をしてください。`)}if(a&&a.name){let e=`

【{{user}}の情報】
`;e+=`- {{user}}のタイプ: ${a.name}
`,a.likes&&a.likes.length>0&&(e+=`- {{user}}の好きなもの: ${a.likes.join(", ")}
`),a.dislikes&&a.dislikes.length>0&&(e+=`- {{user}}の嫌いなもの: ${a.dislikes.join(", ")}
`),a.other_settings&&(e+=`- {{user}}のその他の特徴: ${a.other_settings}
`),e+=`
上記の{{user}}情報を考慮して、{{char}}として{{user}}に合わせた返答をしてください。`,_+=e}if(_=`${u.R}

${_}`,r?.enableSystemPrompt&&r?.systemPrompt&&(_=`${_}

${r.systemPrompt}`),r?.enableJailbreak&&r?.jailbreakPrompt&&(_=`${r.jailbreakPrompt}

${_}`),r?.responseFormat&&"normal"!==r.responseFormat){let e={roleplay:"\n\n【重要】完全にキャラクターになりきって、そのキャラクターとして自然に反応してください。",narrative:"\n\n【重要】物語のような美しい描写を交えて、情景豊かに表現してください。",dialogue:"\n\n【重要】自然で親しみやすい会話を心がけ、親近感のある返答をしてください。",descriptive:"\n\n【重要】詳細な描写と感情表現を豊富に使い、臨場感のある返答をしてください。"}[r.responseFormat];e&&(_+=e)}let k=p&&Array.isArray(p)?p.filter(e=>e&&e.content&&e.content.trim().length>0):[],v=k.map(e=>{let t="user"===e.role?"{{user}}":"{{char}}";return`${t}: ${e.content}`}).join("\n"),w=d?"":`{{user}}: ${t}
`,C=`${_}

${v}${v?"\n":""}${w}{{char}}:`;if(C.length>3e4)for(console.warn("プロンプトが長すぎるため履歴を削除して短縮します");C.length>3e4&&k.length>0;)k.shift(),v=k.map(e=>{let t="user"===e.role?"{{user}}":"{{char}}";return`${t}: ${e.content}`}).join("\n"),C=`${_}

${v}${v?"\n":""}${w}{{char}}:`;console.log("Final prompt:",C);let A=async()=>{let e=await x.generateContent(C);return(await e.response).text()},I=await A();if(!I||0===I.trim().length){console.warn("Geminiから空の応答。履歴を短縮してリトライします"),v=k.slice(-10).map(e=>{let t="user"===e.role?"{{user}}":"{{char}}";return`${t}: ${e.content}`}).join("\n"),C=`${_}

${v}${v?"\n":""}${w}{{char}}:`;try{I=await A()}catch(e){console.error("Gemini再試行エラー:",e)}}return I&&0!==I.trim().length||(console.warn("Geminiが依然として空応答。フォールバックメッセージを返します"),I=`{{char}}: …ごめんね、ちょっと言葉に詰まっちゃったみたい。もう一度質問してくれる？`),o.NextResponse.json({success:!0,content:I})}catch(e){return console.error("Simple chat API error:",e),o.NextResponse.json({success:!1,error:e instanceof Error?e.message:"Unknown error"},{status:500})}}let d=new s.AppRouteRouteModule({definition:{kind:i.RouteKind.APP_ROUTE,page:"/api/simple-chat/route",pathname:"/api/simple-chat",filename:"route",bundlePath:"app/api/simple-chat/route"},resolvedPagePath:"C:\\Users\\kohar\\Desktop\\新しいフォルダー\\ai-chat\\src\\app\\api\\simple-chat\\route.ts",nextConfigOutput:"standalone",userland:a}),{workAsyncStorage:g,workUnitAsyncStorage:f,serverHooks:$}=d;function y(){return(0,n.patchFetch)({workAsyncStorage:g,workUnitAsyncStorage:f})}},8335:()=>{},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[447,580,449],()=>r(6978));module.exports=a})();