import { reactive } from 'vue'
import type { AppVersionInfo } from '@/types/version'

const initialVersion = async (): Promise<AppVersionInfo | null> => {
  try {
    const mod = await import('@/generated/version')
    return mod.APP_VERSION_INFO as AppVersionInfo
  } catch {
    return null
  }
}

type VersionState = {
  loading: boolean
  loaded: boolean
  serverReachable: boolean
  data: AppVersionInfo | null
}

const state = reactive<VersionState>({
  loading: false,
  loaded: false,
  serverReachable: false,
  data: null,
})

export const useVersionMeta = () => {
  const ensureLoaded = async () => {
    if (state.loaded || state.loading) return state
    state.loading = true
    try {
      state.data = await initialVersion()
      const res = await fetch('/api/version', { cache: 'no-store' })
      if (res.ok) {
        state.data = await res.json() as AppVersionInfo
        state.serverReachable = true
      }
    } catch {
      // keep local generated metadata as fallback
    } finally {
      state.loading = false
      state.loaded = true
    }
    return state
  }

  return { state, ensureLoaded }
}
