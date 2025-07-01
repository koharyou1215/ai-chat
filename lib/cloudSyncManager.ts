import { syncCharacters } from './characterCloudSync'
import { syncPersonas } from './personaCloudSync'
import { syncMemos } from './memoCloudSync'
import { syncSettings } from './settingsCloudSync'
import { getCurrentUser } from './supabase'
import { Character, UserPersona, ChatMemo, AppSettings } from '../types/character'

export interface SyncData {
  characters: Character[]
  personas: UserPersona[]
  memos: ChatMemo[]
  settings: AppSettings
}

export interface SyncResult {
  success: boolean
  data?: SyncData
  error?: string
  syncedItems: {
    characters: boolean
    personas: boolean
    memos: boolean
    settings: boolean
  }
}

// 全データを同期
export const syncAllData = async (localData: SyncData): Promise<SyncResult> => {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      success: false,
      error: 'ログインが必要です',
      syncedItems: {
        characters: false,
        personas: false,
        memos: false,
        settings: false
      }
    }
  }

  const result: SyncResult = {
    success: true,
    data: { ...localData },
    syncedItems: {
      characters: false,
      personas: false,
      memos: false,
      settings: false
    }
  }

  try {
    // キャラクターデータを同期
    try {
      const syncedCharacters = await syncCharacters(localData.characters)
      if (result.data) {
        result.data.characters = syncedCharacters
        result.syncedItems.characters = true
      }
    } catch (error) {
      console.error('キャラクター同期エラー:', error)
    }

    // Personaデータを同期
    try {
      const syncedPersonas = await syncPersonas(localData.personas)
      if (result.data) {
        result.data.personas = syncedPersonas
        result.syncedItems.personas = true
      }
    } catch (error) {
      console.error('Persona同期エラー:', error)
    }

    // メモデータを同期
    try {
      const syncedMemos = await syncMemos(localData.memos)
      if (result.data) {
        result.data.memos = syncedMemos
        result.syncedItems.memos = true
      }
    } catch (error) {
      console.error('メモ同期エラー:', error)
    }

    // 設定データを同期
    try {
      const syncedSettings = await syncSettings(localData.settings)
      if (result.data) {
        result.data.settings = syncedSettings
        result.syncedItems.settings = true
      }
    } catch (error) {
      console.error('設定同期エラー:', error)
    }

    return result
  } catch (error) {
    console.error('総合同期エラー:', error)
    return {
      success: false,
      error: '同期中にエラーが発生しました',
      syncedItems: {
        characters: false,
        personas: false,
        memos: false,
        settings: false
      }
    }
  }
}

// 同期状態を確認
export const checkSyncStatus = async () => {
  const user = await getCurrentUser()
  return {
    isLoggedIn: !!user,
    userEmail: user?.email || null,
    lastSync: localStorage.getItem('last-sync-time'),
    canSync: !!user
  }
} 