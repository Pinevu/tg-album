import api from '@/utils/axios'

export type PhotoQuery = {
  album_id?: string
  tag?: string
  date_start?: string
  date_end?: string
  keyword?: string
  page?: number
  page_size?: number
}

export const login = (username: string, password: string) => api.post('/login', { username, password })
export const searchPhotos = (params: PhotoQuery) => api.get('/photos/search', { params })
export const getPhotoFile = (id: number) => api.get(`/photos/file/${id}`, { responseType: 'blob' })
export const getPhotoDetail = (id: number) => api.get(`/photos/${id}`)
export const uploadPhoto = (data: FormData) => api.post('/upload', data)
export const updatePhotoRemark = (id: number, remark: string) => api.put(`/photos/${id}/remark`, { remark })
export const batchMove = (ids: number[], target_album_id: number) => api.post('/photos/batch-move', { ids, target_album_id })
export const batchDelete = (ids: number[]) => api.post('/photos/batch-delete', { ids })
export const batchTag = (ids: number[], tags: string[]) => api.post('/photos/batch-tag', { ids, tags })
export const getRecycleBin = () => api.get('/admin/recycle-bin')
export const restorePhotos = (ids: number[]) => api.post('/admin/recycle-bin/restore', { ids })
export const deletePhotos = (ids: number[]) => api.post('/admin/recycle-bin/delete', { ids })
export const getAlbums = () => api.get('/albums')
export const getAlbumTree = () => api.get('/albums/tree')
export const createAlbum = (name: string, visibility: string, parent_id?: number, slug?: string, access_password?: string, pwa_icon_url?: string) => api.post('/albums', { name, visibility, parent_id, slug, access_password, pwa_icon_url })
export const updateAlbum = (id: number, name: string, visibility: string, slug?: string, access_password?: string, pwa_icon_url?: string) => api.put(`/albums/${id}`, { name, visibility, slug, access_password, pwa_icon_url })
export const deleteAlbum = (id: number) => api.delete(`/albums/${id}`)
export const setAlbumCover = (id: number, cover_photo_id: number) => api.put(`/albums/${id}/cover`, { cover_photo_id })
export const listTags = () => api.get('/tags')
export const getPools = () => api.get('/tg-pools')
export const createPool = (payload: any) => api.post('/tg-pools', payload)
export const updatePool = (id: number, payload: any) => api.put(`/tg-pools/${id}`, payload)
export const deletePool = (id: number) => api.delete(`/tg-pools/${id}`)
export const getSettings = () => api.get('/settings')
export const saveSettings = (payload: any) => api.post('/settings', payload)

export const editPhoto = async (file: File, remark: string, originalFilename: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('remark', remark)
  formData.append('original_filename', originalFilename)
  return api.post('/upload', formData)
}
