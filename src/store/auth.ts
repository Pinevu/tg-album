import { defineStore } from 'pinia'

const TOKEN_KEY = 'tg_album_token'
const TOKEN_META_KEY = 'tg_album_token_meta'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || ''
  }),
  actions: {
    setToken(t: string) {
      this.token = t
      localStorage.setItem(TOKEN_KEY, t)
      localStorage.setItem(TOKEN_META_KEY, JSON.stringify({ saved_at: Date.now(), version: '0.1.0' }))
    },
    logout() {
      this.token = ''
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_META_KEY)
    }
  }
})
