import { Character, UserPersona } from '../types/character';

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
        const charResponse = await fetch(`/characters/${filename}`);
        if (charResponse.ok) {
          const characterData = await charResponse.json();
          characters.push(characterData);
        }
      } catch (error) {
        console.warn(`キャラクター読み込み失敗: ${filename}`, error);
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
        const personaResponse = await fetch(`/personas/${filename}`);
        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          personas.push(personaData);
        }
      } catch (error) {
        console.warn(`ペルソナ読み込み失敗: ${filename}`, error);
      }
    }
    
    console.log(`自動読み込み完了: ${personas.length} ペルソナ`);
    return personas;
  } catch (error) {
    console.error('ペルソナ自動読み込みエラー:', error);
    return [];
  }
} 