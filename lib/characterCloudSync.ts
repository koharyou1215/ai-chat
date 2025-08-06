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

    // テーブル最小スキーマに合わせて安全なペイロードを整形
    const safeName = (character.name || '').toString().trim() || 'unnamed'
    type CharacterDataJSON = {
      tags: string[]
      first_message: string[]
      personality: string
      appearance: string
      speaking_style: string
      scenario: string
      nsfw_profile: string
      age: string
      occupation: string
      hobbies: string[]
      likes: string[]
      dislikes: string[]
      background: string
      avatar_url: string | null
      imageSeed: number | null | undefined
      character_definition: string | null | undefined
      trackers: unknown | null | undefined
      example_dialogue: string | null | undefined
      chatBackgroundUrl: string | null | undefined
    }
    const dataJson: CharacterDataJSON = {
      tags: Array.isArray(character.tags) ? character.tags : [],
      first_message: Array.isArray((character as any).first_message)
        ? (character as any).first_message
        : [],
      personality: character.personality ?? '',
      appearance: character.appearance ?? '',
      speaking_style: character.speaking_style ?? '',
      scenario: character.scenario ?? '',
      // 以下は型に存在しない可能性があるためオプショナルにマップ
      nsfw_profile: (character as Partial<Record<'nsfw_profile', string>>).nsfw_profile ?? '',
      age: (character as Partial<Record<'age', string>>).age ?? '',
      occupation: (character as Partial<Record<'occupation', string>>).occupation ?? '',
      hobbies: (character as Partial<Record<'hobbies', string[]>>).hobbies ?? [],
      likes: (character as Partial<Record<'likes', string[]>>).likes ?? [],
      dislikes: (character as Partial<Record<'dislikes', string[]>>).dislikes ?? [],
      background: (character as Partial<Record<'background', string>>).background ?? '',
      avatar_url: (character as Partial<Record<'avatar_url', string | null>>).avatar_url ?? null,
      imageSeed: (character as Partial<Record<'imageSeed', number | null>>).imageSeed ?? null,
      // 型の差異を許容（文字列 or 構造化）
      character_definition: (character as unknown as { character_definition?: unknown }).character_definition as string | null | undefined ?? null,
      trackers: (character as Partial<Record<'trackers', unknown | null>>).trackers ?? null,
      // 例示対話は配列で保持される想定だが、最小スキーマでは任意（型は広めに保持）
      example_dialogue: (character as unknown as { example_dialogue?: unknown }).example_dialogue as string | null | undefined ?? null,
      chatBackgroundUrl: (character as Partial<Record<'chatBackgroundUrl', string | null>>).chatBackgroundUrl ?? null
    }
    const payload = {
      user_id: user.id,
      name: safeName,
      data: JSON.parse(JSON.stringify(dataJson)),
      updated_at: new Date().toISOString()
    }

    // 重複（同名）を許容するため onConflict は使用しない
    const { data, error } = await supabase
      .from('characters')
      .insert(payload)
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

    // Supabaseの最小スキーマ（data jsonb）からCharacter型へ復元
    // DB行型の簡易定義（必要フィールドのみ）
    type CharacterRow = {
      name: string
      data: Partial<{
        tags: string[]
        first_message: string[]
        personality: string
        appearance: string
        speaking_style: string
        scenario: string
        nsfw_profile: string
        age: string
        occupation: string
        hobbies: string[]
        likes: string[]
        dislikes: string[]
        background: string
        avatar_url: string | null
        imageSeed: number | null
        character_definition: string | null
        trackers: unknown | null
        example_dialogue: string | null
        chatBackgroundUrl: string | null
      }>
    }
    return (data as CharacterRow[]).map((item) => {
      const d = item.data || {}
      const restored: Partial<Character> = {
        name: item.name,
        tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
        // DB→アプリ型の差異を吸収（アプリ型がstring想定ならjoin、配列維持ならそのまま）
        first_message: Array.isArray(d.first_message) ? (d.first_message as any) : (d.first_message as any),
        personality: (d.personality as string) || '',
        appearance: (d.appearance as string) || '',
        speaking_style: (d.speaking_style as string) || '',
        scenario: (d.scenario as string) || '',
        background: (d.background as string) || '',
        avatar_url: (d.avatar_url as string | null) ?? null,
        imageSeed: (d.imageSeed as number | null | undefined),
        character_definition: d.character_definition as unknown as any,
        trackers: d.trackers as unknown as any,
        example_dialogue: d.example_dialogue as unknown as any,
        // 任意フィールド群
        nsfw_profile: (d.nsfw_profile as string) || '',
        age: (d.age as string) || '',
        occupation: (d.occupation as string) || '',
        hobbies: Array.isArray(d.hobbies) ? (d.hobbies as string[]) : [],
        likes: Array.isArray(d.likes) ? (d.likes as string[]) : [],
        dislikes: Array.isArray(d.dislikes) ? (d.dislikes as string[]) : [],
        chatBackgroundUrl: (d.chatBackgroundUrl as string | null) ?? null
      }
      return restored as Character
    })
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
