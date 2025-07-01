import { supabase, getCurrentUser } from './supabase'
import { UserPersona } from '../types/character'

// Personaデータをクラウドに保存
export const savePersonaToCloud = async (persona: UserPersona) => {
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
      .from('personas')
      .upsert({
        id: persona.id,
        user_id: user.id,
        name: persona.name,
        likes: persona.likes || [],
        dislikes: persona.dislikes || [],
        other_settings: persona.other_settings || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Persona保存エラー:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// クラウドからPersonaデータを取得
export const loadPersonasFromCloud = async (): Promise<UserPersona[]> => {
  try {
    if (!supabase) return []
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return []
    }

    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Persona取得エラー:', error)
      return []
    }

    // Supabaseのデータを我々のUserPersona型に変換
    return data.map(item => ({
      id: item.id,
      name: item.name,
      likes: item.likes || [],
      dislikes: item.dislikes || [],
      other_settings: item.other_settings || ''
    }))
  } catch (error) {
    console.error('予期しないエラー:', error)
    return []
  }
}

// クラウドからPersonaを削除
export const deletePersonaFromCloud = async (personaId: string) => {
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
      .from('personas')
      .delete()
      .eq('id', personaId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Persona削除エラー:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// ローカルとクラウドのPersonaデータを同期
export const syncPersonas = async (localPersonas: UserPersona[]): Promise<UserPersona[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // ログインしていない場合はローカルデータをそのまま返す
      return localPersonas
    }

    // クラウドからデータを取得
    const cloudPersonas = await loadPersonasFromCloud()
    
    // ローカルデータをクラウドに保存（新しいもの）
    for (const localPersona of localPersonas) {
      const cloudPersona = cloudPersonas.find(c => c.id === localPersona.id)
      if (!cloudPersona) {
        await savePersonaToCloud(localPersona)
      }
    }

    // 最新のクラウドデータを取得して返す
    return await loadPersonasFromCloud()
  } catch (error) {
    console.error('Persona同期エラー:', error)
    return localPersonas
  }
} 