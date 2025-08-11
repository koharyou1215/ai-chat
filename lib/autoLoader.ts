import { Character, UserPersona } from '../types/character';

/**
 * 簡易形式のキャラクターデータを完全形式に正規化
 */
export function normalizeCharacterData(data: Character, filename: string): Character {
  console.log(`🔧 normalizeCharacterData実行: ${filename}`, {
    hasCharacterDefinition: !!data.character_definition,
    systemPrompt: data.systemPrompt,
    appearanceNegativePrompt: data.appearanceNegativePrompt,
    first_message: data.first_message
  });
  
  // 🚨 マーフィン・グレイスの詳細ログ 🚨
  if (filename.includes('マーフィン・グレイス')) {
    console.log('🔍🔍🔍 マーフィン・グレイス詳細入力データ:', {
      first_message: data.first_message,
      systemPrompt: data.systemPrompt,
      appearanceNegativePrompt: data.appearanceNegativePrompt,
      nsfw_profile: data.nsfw_profile,
      hasCharacterDefinition: !!data.character_definition,
      dataKeys: Object.keys(data)
    });
  }
  
  // 既に完全形式の場合はそのまま返す
  if (data.character_definition) {
    console.log(`✅ ${filename}: 既に完全形式のためそのまま返す`);
    if (filename.includes('マーフィン・グレイス')) {
      console.log('🔍🔍🔍 マーフィン・グレイス完全形式そのまま返却:', {
        first_message: data.first_message,
        systemPrompt: data.systemPrompt,
        appearanceNegativePrompt: data.appearanceNegativePrompt
      });
    }
    return data;
  }
  
  console.log(`🔄 ${filename}: 簡易形式から完全形式に変換開始`);
  
  // タイムスタンプを設定（既存のものがあれば保持、なければ現在時刻）
  const now = Date.now();
  const createdAt = data.createdAt || now;
  const updatedAt = data.updatedAt || now;
  
  // 🚨 マーフィン・グレイスの変換前ログ 🚨
  if (filename.includes('マーフィン・グレイス')) {
    console.log('🔍🔍🔍 マーフィン・グレイス変換前データ保存:', {
      original_first_message: data.first_message,
      original_systemPrompt: data.systemPrompt,
      original_appearanceNegativePrompt: data.appearanceNegativePrompt,
      original_createdAt: data.createdAt,
      original_updatedAt: data.updatedAt,
      new_createdAt: createdAt,
      new_updatedAt: updatedAt
    });
  }
  
  const normalized: Character = {
    "file-name": filename,
    name: data.name || 'Unknown',
    tags: data.tags || [],
    // 🚨 first_message: 必ず保持 🚨
    first_message: Array.isArray(data.first_message) 
      ? (data.first_message[0] || '') 
      : (data.first_message || ''),
    age: data.age,
    occupation: data.occupation,
    hobbies: data.hobbies || [],
    likes: data.likes || [],
    dislikes: data.dislikes || [],
    avatar_url: data.avatar_url || '',
    // 生い立ち・背景設定（物語的な背景も含む）
    background: data.background || '',
    
    // 簡易フィールドをそのまま保持
    personality: data.personality,
    appearance: data.appearance,
    speaking_style: data.speaking_style,
    scenario: data.scenario,
    // 🚨 nsfw_profile: 必ず保持 🚨
    nsfw_profile: data.nsfw_profile,
    
    // 🚨 新しいパーソナリティフィールドを保持 🚨
    external_personality: data.external_personality || [],
    internal_personality: data.internal_personality || [],
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    
    // 🚨 新フィールドを必ず保持 🚨
    systemPrompt: data.systemPrompt || '',
    appearancePrompt: data.appearancePrompt || '',
    appearanceNegativePrompt: data.appearanceNegativePrompt || '',
    chatBackgroundUrl: data.chatBackgroundUrl,
    trackers: data.trackers || [],
    
    // タイムスタンプフィールドを追加
    createdAt: createdAt,
    updatedAt: updatedAt,
    
    // 完全形式のcharacter_definitionを構築
    character_definition: {
      personality: {
        summary: data.personality || '',
        external: data.external_personality?.join(', ') || data.personality || '',
        internal: data.internal_personality?.join(', ') || data.personality || '',
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || []
      },
      background: data.background || '',
      appearance: {
        description: data.appearance || '',
        hair: '',
        eyes: '',
        clothing: '',
        underwear: '',
        other_features: ''
      },
      speaking_style: {
        base: data.speaking_style || '',
        first_person: '私',
        second_person: 'あなた',
        quirks: '',
        nsfw_variation: ''
      },
      scenario: {
        worldview: '',
        initial_situation: data.scenario || '',
        relationship_with_user: ''
      },
      // 🚨 nsfw_profile の character_definition への設定 - 新旧両形式対応 🚨
      nsfw_profile: data.nsfw_profile ? (() => {
        if (typeof data.nsfw_profile === 'string') {
          // 旧形式: 文字列 → situation フィールドに設定
          return {
            situation: data.nsfw_profile,
            mental_state: '',
            status: ''
          };
        } else if (typeof data.nsfw_profile === 'object' && data.nsfw_profile !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nsfwObj = data.nsfw_profile as any;
          
          // 新形式: オブジェクト → 既存フィールドがあれば使用、なければ新形式から生成
          if (nsfwObj.situation || nsfwObj.mental_state || nsfwObj.status) {
            // 旧オブジェクト形式
            return {
              situation: nsfwObj.situation || '',
              mental_state: nsfwObj.mental_state || '',
              status: nsfwObj.status || ''
            };
          } else {
            // 新オブジェクト形式 → 適切にマッピング
            return {
              situation: nsfwObj.persona || nsfwObj.libido_level || '',
              mental_state: nsfwObj.involuntary_reactions || '',
              status: nsfwObj.orgasm_details || ''
            };
          }
        }
        return undefined;
      })() : undefined
    }
  };
  
  // 🚨 マーフィン・グレイスの変換後ログ 🚨
  if (filename.includes('マーフィン・グレイス')) {
    console.log('🔍🔍🔍 マーフィン・グレイス変換後データ確認:', {
      normalized_first_message: normalized.first_message,
      normalized_systemPrompt: normalized.systemPrompt,
      normalized_appearanceNegativePrompt: normalized.appearanceNegativePrompt,
      normalized_nsfw_profile: normalized.nsfw_profile,
      normalized_createdAt: normalized.createdAt,
      normalized_updatedAt: normalized.updatedAt,
      character_definition_created: !!normalized.character_definition
    });
  }
  
  return normalized;
}

/**
 * public/characters/ から全キャラクターJSONを自動読み込み
 */
export async function loadAllCharactersFromPublic(): Promise<Character[]> {
  try {
    console.log('🌐 キャラクター自動読み込み開始');
    console.log('🌍 環境情報:', {
      isDev: process.env.NODE_ENV === 'development',
      baseUrl: typeof window !== 'undefined' ? window.location.origin : 'server-side'
    });
    
    // public/characters/ の一覧を取得
    const response = await fetch('/api/list-characters');
    if (!response.ok) {
      console.warn('キャラクター一覧取得失敗:', response.status, response.statusText);
      return [];
    }
    
    const fileList: string[] = await response.json();
    const characters: Character[] = [];
    
    // 各JSONファイルを読み込み
    for (const filename of fileList) {
      if (!filename.endsWith('.json')) continue;
      
      try {
        console.log(`📁 キャラクターファイル読み込み中: ${filename}`);
        const charResponse = await fetch(`/characters/${filename}`);
        console.log(`📊 レスポンス状態: ${charResponse.status} ${charResponse.statusText}`);
        
        if (charResponse.ok) {
          const characterData = await charResponse.json();
          console.log(`✅ キャラクター読み込み成功: ${filename}`, characterData.name);
          
          // 簡易形式のキャラクターファイルを完全形式に変換
          const normalizedCharacter = normalizeCharacterData(characterData, filename);
          characters.push(normalizedCharacter);
        } else {
          console.error(`❌ キャラクター読み込み失敗: ${filename} - ${charResponse.status} ${charResponse.statusText}`);
          
          // 本番環境でのデバッグ情報
          try {
            const errorText = await charResponse.text();
            console.error(`❌ エラー詳細: ${errorText}`);
          } catch (e) {
            console.error(`❌ エラー詳細取得失敗:`, e);
          }
        }
      } catch (error) {
        console.error(`❌ キャラクター読み込みエラー: ${filename}`, error);
      }
    }
    
    console.log(`自動読み込み完了: ${characters.length} キャラクター`);
    return characters;
  } catch (error) {
    console.error('キャラクター自動読み込みエラー:', error);
    return [];
  }
}

/**
 * public/personas/ から全ペルソナJSONを自動読み込み
 */
export const loadAllPersonas = async (): Promise<UserPersona[]> => {
  try {
    // public/personas/ の一覧を取得
    const response = await fetch('/api/list-personas');
    if (!response.ok) {
      console.warn('ペルソナ一覧取得失敗:', response.status);
      return [];
    }
    
    const fileList: string[] = await response.json();
    const personas: UserPersona[] = [];
    
    // 各JSONファイルを読み込み
    for (const filename of fileList) {
      if (!filename.endsWith('.json')) continue;
      
      try {
        console.log(`📁 ペルソナファイル読み込み中: ${filename}`);
        const personaResponse = await fetch(`/personas/${filename}`);
        console.log(`📊 ペルソナレスポンス状態: ${personaResponse.status} ${personaResponse.statusText}`);
        
        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          console.log(`✅ ペルソナ読み込み成功: ${filename}`, personaData.name);
          personas.push(personaData);
        } else {
          console.error(`❌ ペルソナ読み込み失敗: ${filename} - ${personaResponse.status} ${personaResponse.statusText}`);
          
          // 本番環境でのデバッグ情報
          try {
            const errorText = await personaResponse.text();
            console.error(`❌ ペルソナエラー詳細: ${errorText}`);
          } catch (e) {
            console.error(`❌ ペルソナエラー詳細取得失敗:`, e);
          }
        }
      } catch (error) {
        console.error(`❌ ペルソナ読み込みエラー: ${filename}`, error);
      }
    }
    
    console.log(`自動読み込み完了: ${personas.length} ペルソナ`);
    return personas;
  } catch (error) {
    console.error('ペルソナ自動読み込みエラー:', error);
    return [];
  }
} 