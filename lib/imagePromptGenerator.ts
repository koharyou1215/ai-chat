import { Message } from '../src/hooks/useChatState';

interface GeneratedPrompt {
  enhancedPrompt: string;
  contextPrompt: string;
}

interface ContextElements {
  emotions: string[];
  actions: string[];
  poses: string[];
  situation: string[];
  expressions: string[];
}

/**
 * 会話履歴を分析して画像生成プロンプトを生成
 */
export class ImagePromptGenerator {
  /**
   * 会話履歴から動的なプロンプトを生成
   */
  generateFromHistory(
    messages: Message[], 
    basePrompt: string, 
    qualityPrompt: string,
    contextPromptWeight: number = 1.3
  ): GeneratedPrompt {
    if (!messages || messages.length === 0) {
      return {
        enhancedPrompt: this.combinePrompts(basePrompt, qualityPrompt, ''),
        contextPrompt: ''
      };
    }

    // 最新の数メッセージから文脈を抽出（重要度が高い）
    const recentMessages = messages.slice(-6);
    
    // キャラクターの動作・感情・状況を分析
    const contextElements = this.analyzeContext(recentMessages);
    
    // 動的プロンプトを生成（強調タグ付き）
    const contextPrompt = this.buildContextPrompt(contextElements, contextPromptWeight);
    
    // 最終プロンプトを結合
    const enhancedPrompt = this.combinePrompts(basePrompt, qualityPrompt, contextPrompt);
    
    return {
      enhancedPrompt,
      contextPrompt
    };
  }

  /**
   * 会話から文脈要素を抽出
   */
  private analyzeContext(messages: Message[]): ContextElements {
    const elements: ContextElements = {
      emotions: [],
      actions: [],
      poses: [],
      situation: [],
      expressions: []
    };

    messages.forEach(message => {
      if (message.role === 'assistant') {
        const content = message.content.toLowerCase();
        
        // 感情キーワードを抽出
        elements.emotions.push(...this.extractEmotions(content));
        
        // 動作・ポーズキーワードを抽出
        elements.actions.push(...this.extractActions(content));
        elements.poses.push(...this.extractPoses(content));
        
        // 表情キーワードを抽出
        elements.expressions.push(...this.extractExpressions(content));
        
        // 状況キーワードを抽出
        elements.situation.push(...this.extractSituation(content));
      }
    });

    // 重複を除去して最新のものを優先
    return {
      emotions: [...new Set(elements.emotions)].slice(-3),
      actions: [...new Set(elements.actions)].slice(-3),
      poses: [...new Set(elements.poses)].slice(-2),
      expressions: [...new Set(elements.expressions)].slice(-2),
      situation: [...new Set(elements.situation)].slice(-2)
    };
  }

  /**
   * 感情キーワードを抽出
   */
  private extractEmotions(content: string): string[] {
    const emotionPatterns = {
      'happy, joyful': ['嬉しい', '楽しい', '幸せ', '喜ん', 'わくわく', 'うきうき'],
      'sad, melancholy': ['悲しい', '落ち込', '憂鬱', '沈ん', 'しょんぼり'],
      'angry, furious': ['怒', '腹立', 'むかつ', 'いらいら', 'ぷんぷん'],
      'embarrassed, shy': ['恥ずかし', '照れ', '赤面', 'もじもじ'],
      'surprised, shocked': ['驚', 'びっくり', '衝撃', '愕然'],
      'nervous, anxious': ['緊張', '不安', 'ドキドキ', 'そわそわ'],
      'confident, proud': ['自信', '誇らし', '堂々', '得意'],
      'confused, puzzled': ['困惑', '混乱', 'きょとん', '首をかしげ'],
      'excited, energetic': ['興奮', '元気', 'テンション', 'ハイテンション'],
      'calm, peaceful': ['落ち着', '穏やか', '静か', 'リラックス']
    };

    const found: string[] = [];
    Object.entries(emotionPatterns).forEach(([emotion, patterns]) => {
      if (patterns.some(pattern => content.includes(pattern))) {
        found.push(emotion);
      }
    });

    return found;
  }

  /**
   * 動作キーワードを抽出
   */
  private extractActions(content: string): string[] {
    const actionPatterns = {
      'walking, moving': ['歩', '移動', '進ん', 'とことこ'],
      'sitting down': ['座', '腰を下ろ', 'ちょこん'],
      'standing up': ['立', '立ち上が', 'すっく'],
      'running, rushing': ['走', '駆け', '急い', 'だだだ'],
      'reaching out, extending hand': ['手を伸ば', '差し出', '手を差し'],
      'hugging, embracing': ['抱き', 'ハグ', '抱擁'],
      'waving hand': ['手を振', '振っ', 'ひらひら'],
      'nodding': ['うなず', '頷', 'こくこく'],
      'shaking head': ['首を振', '首を横に'],
      'pointing': ['指差', '指を向け', 'びしっ'],
      'looking around': ['見回', '辺りを見', 'きょろきょろ'],
      'touching, caressing': ['触れ', '撫で', '優しく'],
      'dancing, swaying': ['踊', '揺れ', 'くるくる'],
      'cooking, preparing food': ['料理', '作っ', '調理'],
      'reading': ['読ん', '本を', '読書'],
      'working, studying': ['勉強', '作業', '仕事']
    };

    const found: string[] = [];
    Object.entries(actionPatterns).forEach(([action, patterns]) => {
      if (patterns.some(pattern => content.includes(pattern))) {
        found.push(action);
      }
    });

    return found;
  }

  /**
   * キャラクターの基本外見プロンプトを構築
   */
  private extractPoses(content: string): string[] {
    const posePatterns = {
      'arms crossed': ['腕を組', '腕組み'],
      'hands on hips': ['腰に手', '手を腰に'],
      'arms spread wide': ['腕を広げ', '両手を広げ'],
      'leaning forward': ['身を乗り出', '前のめり'],
      'leaning back': ['もたれ', '背もたれ'],
      'kneeling down': ['膝をつ', 'ひざまず'],
      'lying down': ['横にな', '寝そべ', '寝転'],
      'crouching': ['しゃがん', 'うずくま'],
      'hands behind back': ['手を後ろに', '背中に手'],
      'hands in pockets': ['ポケット', '手をポケット'],
      'covering face': ['顔を覆', '手で顔を'],
      'stretching': ['伸び', 'ストレッチ'],
      'bowing, bending': ['お辞儀', '頭を下げ', '腰を曲げ']
    };

    const found: string[] = [];
    Object.entries(posePatterns).forEach(([pose, patterns]) => {
      if (patterns.some(pattern => content.includes(pattern))) {
        found.push(pose);
      }
    });

    return found;
  }

  /**
   * 表情キーワードを抽出
   */
  private extractExpressions(content: string): string[] {
    const expressionPatterns = {
      'smiling, grinning': ['笑顔', '微笑', 'にこにこ', 'にっこり', 'にやにや'],
      'frowning, scowling': ['しかめ', '眉をひそ', 'むすっ'],
      'wide-eyed, surprised look': ['目を見開', '大きな目', 'まん丸な目'],
      'winking': ['ウィンク', 'ウインク', '片目を'],
      'pouting, sulking': ['ふくれ', 'ぷくー', '頬を膨ら'],
      'blushing, red face': ['赤面', '頬を染め', '顔を赤く'],
      'crying, tears': ['涙', '泣', 'うるうる'],
      'yawning, sleepy': ['あくび', '眠そう', 'うとうと'],
      'tongue out': ['舌を出', 'べー', 'ぺろっ'],
      'serious expression': ['真剣', '険し', '厳し'],
      'gentle smile': ['優しい笑顔', '穏やか', 'ほんわか'],
      'mischievous grin': ['いたずら', 'にやり', 'にんまり']
    };

    const found: string[] = [];
    Object.entries(expressionPatterns).forEach(([expression, patterns]) => {
      if (patterns.some(pattern => content.includes(pattern))) {
        found.push(expression);
      }
    });

    return found;
  }

  /**
   * 状況キーワードを抽出
   */
  private extractSituation(content: string): string[] {
    const situationPatterns = {
      'in kitchen': ['キッチン', '台所', '料理'],
      'in bedroom': ['ベッドルーム', '寝室', 'ベッド'],
      'outdoors, in garden': ['屋外', '庭', '外で', '青空'],
      'at school, classroom': ['学校', '教室', '授業'],
      'in library': ['図書館', '本棚', '静か'],
      'at cafe': ['カフェ', '喫茶', 'コーヒー'],
      'in bathroom': ['お風呂', '浴室', 'バスルーム'],
      'on beach': ['海', 'ビーチ', '砂浜'],
      'in rain': ['雨', '傘', '濡れ'],
      'during sunset': ['夕焼け', '夕陽', '夕日'],
      'at night': ['夜', '夜中', '深夜', '星空'],
      'in morning': ['朝', '朝日', '朝食'],
      'indoors, cozy': ['部屋', '室内', '家の中'],
      'festival, celebration': ['祭り', 'お祭り', '祝い']
    };

    const found: string[] = [];
    Object.entries(situationPatterns).forEach(([situation, patterns]) => {
      if (patterns.some(pattern => content.includes(pattern))) {
        found.push(situation);
      }
    });

    return found;
  }

  /**
   * 文脈プロンプトを構築（強調タグ付き）
   */
  private buildContextPrompt(elements: ContextElements, weight: number): string {
    const prompts: string[] = [];
    const weightTag = weight.toFixed(1);

    // 感情プロンプト
    if (elements.emotions.length > 0) {
      prompts.push(`(${elements.emotions.join(', ')}:${weightTag})`);
    }

    // 表情プロンプト
    if (elements.expressions.length > 0) {
      prompts.push(`(${elements.expressions.join(', ')}:${weightTag})`);
    }

    // 動作プロンプト
    if (elements.actions.length > 0) {
      prompts.push(`(${elements.actions.join(', ')}:${weightTag})`);
    }

    // ポーズプロンプト
    if (elements.poses.length > 0) {
      prompts.push(`(${elements.poses.join(', ')}:${weightTag})`);
    }

    // 状況プロンプト
    if (elements.situation.length > 0) {
      prompts.push(`(${elements.situation.join(', ')}:${weightTag})`);
    }

    return prompts.join(', ');
  }

  /**
   * プロンプトを結合
   */
  private combinePrompts(basePrompt: string, qualityPrompt: string, contextPrompt: string): string {
    const parts = [basePrompt, qualityPrompt];
    
    if (contextPrompt) {
      parts.push(contextPrompt);
    }

    return parts.filter(p => p.trim()).join(', ');
  }
}

export default ImagePromptGenerator;
