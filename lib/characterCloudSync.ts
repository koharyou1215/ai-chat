import { supabase, getCurrentUser } from './supabase'
import { Character } from '../types/character'

// キャラクターデータをクラウドに保存
export const saveCharacterToCloud = async (character: Character) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabaseが設定されていません' }
    }
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return { success: false, error: 'ログインが必要です' }
    }

    const { data, error } = await supabase
      .from('characters')
      .upsert({
        name: character.name,
        user_id: user.id,
        tags: character.tags || [],
        first_message: character.first_message || [],
        personality: character.personality || '',
        appearance: character.appearance || '',
        speaking_style: character.speaking_style || '',
        scenario: character.scenario || '',
        nsfw_profile: character.nsfw_profile || '',
        age: character.age || '',
        occupation: character.occupation || '',
        hobbies: character.hobbies || [],
        likes: character.likes || [],
        dislikes: character.dislikes || [],
        background: character.background || '',
        avatar_url: character.avatar_url || null,
        image_seed: character.imageSeed || null,
        character_definition: character.character_definition || null,
        trackers: character.trackers || null,
        example_dialogue: character.example_dialogue || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('キャラクター保存エラー:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// クラウドからキャラクターデータを取得
export const loadCharactersFromCloud = async (): Promise<Character[]> => {
  try {
    if (!supabase) return []
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return []
    }

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('キャラクター取得エラー:', error)
      return []
    }

    // Supabaseのデータを我々のCharacter型に変換
    return data.map(item => ({
      name: item.name,
      tags: item.tags || [],
      first_message: item.first_message || [],
      personality: item.personality || '',
      appearance: item.appearance || '',
      speaking_style: item.speaking_style || '',
      scenario: item.scenario || '',
      nsfw_profile: item.nsfw_profile || '',
      age: item.age || '',
      occupation: item.occupation || '',
      hobbies: item.hobbies || [],
      likes: item.likes || [],
      dislikes: item.dislikes || [],
      background: item.background || '',
      avatar_url: item.avatar_url || null,
      imageSeed: item.image_seed || undefined,
      character_definition: item.character_definition || undefined,
      trackers: item.trackers || undefined,
      example_dialogue: item.example_dialogue || undefined
    }))
  } catch (error) {
    console.error('予期しないエラー:', error)
    return []
  }
}

// クラウドからキャラクターを削除
export const deleteCharacterFromCloud = async (characterName: string) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabaseが設定されていません' }
    }
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return { success: false, error: 'ログインが必要です' }
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('name', characterName)
      .eq('user_id', user.id)

    if (error) {
      console.error('キャラクター削除エラー:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// ローカルとクラウドのデータを同期
export const syncCharacters = async (localCharacters: Character[]): Promise<Character[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // ログインしていない場合はローカルデータをそのまま返す
      return localCharacters
    }

    // クラウドからデータを取得
    const cloudCharacters = await loadCharactersFromCloud()
    
    // ローカルデータをクラウドに保存（新しいもの、更新されたもの）
    for (const localChar of localCharacters) {
      const cloudChar = cloudCharacters.find(c => c.name === localChar.name)
      if (!cloudChar) {
        await saveCharacterToCloud(localChar)
      }
    }

    // 最新のクラウドデータを取得して返す
    return await loadCharactersFromCloud()
  } catch (error) {
    console.error('同期エラー:', error)
    return localCharacters
  }
} 