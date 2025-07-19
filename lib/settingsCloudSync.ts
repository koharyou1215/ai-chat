import { supabase, getCurrentUser } from './supabase'
import { AppSettings } from '../types/character'

// 設定データをクラウドに保存
export const saveSettingsToCloud = async (settings: AppSettings) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabaseが設定されていません' }
    }
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return { success: false, error: 'ログインが必要です' }
    }

    // APIキーは除外（セキュリティのため）
    const { geminiApiKey, stableDiffusionApiKey, elevenLabsApiKey, ...safeSettings } = settings

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings: safeSettings,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('設定保存エラー:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

// クラウドから設定データを取得
export const loadSettingsFromCloud = async (): Promise<Partial<AppSettings> | null> => {
  try {
    if (!supabase) return null
    
    const user = await getCurrentUser()
    if (!user) {
      console.error('ユーザーがログインしていません')
      return null
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // データが存在しない場合は正常
        return null
      }
      console.error('設定取得エラー:', error)
      return null
    }

    return data.settings
  } catch (error) {
    console.error('予期しないエラー:', error)
    return null
  }
}

// ローカルとクラウドの設定データを同期
export const syncSettings = async (localSettings: AppSettings): Promise<AppSettings> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // ログインしていない場合はローカル設定をそのまま返す
      return localSettings
    }

    // クラウドから設定を取得
    const cloudSettings = await loadSettingsFromCloud()
    
    if (cloudSettings) {
      // クラウド設定が存在する場合、ローカル設定とマージ
      // APIキーはローカル設定を優先
      const mergedSettings = {
        ...cloudSettings,
        geminiApiKey: localSettings.geminiApiKey,
        stableDiffusionApiKey: localSettings.stableDiffusionApiKey,
        elevenLabsApiKey: localSettings.elevenLabsApiKey
      } as AppSettings
      
      return mergedSettings
    } else {
      // クラウド設定が存在しない場合、ローカル設定をクラウドに保存
      await saveSettingsToCloud(localSettings)
      return localSettings
    }
  } catch (error) {
    console.error('設定同期エラー:', error)
    return localSettings
  }
} 