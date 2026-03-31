import { defineStore } from 'pinia'

type Album = {
  id: number
  name: string
  parent_id?: number | null
}

export const useAlbumStore = defineStore('albums', {
  state: () => ({
    list: [] as Album[]
  }),
  actions: {
    set(list: Album[]) {
      this.list = list
    }
  }
})
