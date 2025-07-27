import { Character, UserPersona } from '../types/character';

/**
 * 簡易形式のキャラクターデータを完全形式に正規化
 */
export function normalizeCharacterData(data: Character, filename: string): Character {
  // 既に完全形式の場合はそのまま返す
  if (data.character_definition) {
    return data;
  }
  
  // 簡易形式から完全形式に変換
  const normalized: Character = {
    "file-name": filename,
    name: data.name || 'Unknown',
    tags: data.tags || [],
    first_message: Array.isArray(data.first_message) ? data.first_message : [data.first_message || ''],
    age: data.age,
    occupation: data.occupation,
    hobbies: data.hobbies || [],
    likes: data.likes || [],
    dislikes: data.dislikes || [],
    avatar_url: data.avatar_url || '',
    background: data.background,
    
    // 簡易フィールドをそのまま保持
    personality: data.personality,
    appearance: data.appearance,
    speaking_style: data.speaking_style,
    scenario: data.scenario,
    nsfw_profile: data.nsfw_profile,
    
    // 完全形式のcharacter_definitionを構築
    character_definition: {
      personality: {
        summary: data.personality || '',
        external: data.personality || '',
        internal: data.personality || '',
        strengths: [],
        weaknesses: []
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
      nsfw_profile: data.nsfw_profile ? {
        situation: data.nsfw_profile.situation || '',
        mental_state: data.nsfw_profile.mental_state || '',
        status: data.nsfw_profile.status || ''
      } : undefined
    }
  };
  
  return normalized;
}

/**
 * public/characters/ から全キャラクターJSONを自動読み込み
 */
export async function loadAllCharactersFromPublic(): Promise<Character[]> {
  try {
    // public/characters/ の一覧を取得
    const response = await fetch('/api/list-characters');
    if (!response.ok) {
      console.warn('キャラクター一覧取得失敗:', response.status);
      return [];
    }
    
    const fileList: string[] = await response.json();
    const characters: Character[] = [];
    
    // 各JSONファイルを読み込み
    for (const filename of fileList) {
      if (!filename.endsWith('.json')) continue;
      
      try {
        console.log(`📁 キャラクターファイル読み込み中: ${filename}`);
        const charResponse = await fetch(`/characters/character/${filename}`);
        console.log(`📊 レスポンス状態: ${charResponse.status} ${charResponse.statusText}`);
        
        if (charResponse.ok) {
          const characterData = await charResponse.json();
          console.log(`✅ キャラクター読み込み成功: ${filename}`, characterData.name);
          
          // 簡易形式のキャラクターファイルを完全形式に変換
          const normalizedCharacter = normalizeCharacterData(characterData, filename);
          characters.push(normalizedCharacter);
        } else {
          console.error(`❌ キャラクター読み込み失敗: ${filename} - ${charResponse.status}`);
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
export async function loadAllPersonasFromPublic(): Promise<UserPersona[]> {
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
        const personaResponse = await fetch(`/personas/personas/${filename}`);
        console.log(`📊 ペルソナレスポンス状態: ${personaResponse.status} ${personaResponse.statusText}`);
        
        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          console.log(`✅ ペルソナ読み込み成功: ${filename}`, personaData.name);
          personas.push(personaData);
        } else {
          console.error(`❌ ペルソナ読み込み失敗: ${filename} - ${personaResponse.status}`);
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