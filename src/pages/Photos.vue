<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">图片管理</h1>
        <p class="text-slate-500 mt-1">图片先进入 Telegram 存储池，再保存到 D1，可按相册归档与批量操作。</p>
      </div>
      <div class="text-sm text-slate-500 rounded-2xl bg-white border border-slate-200 px-4 py-2 shadow-sm">
        已选中 <span class="font-semibold text-blue-600">{{ selectedIds.length }}</span> 张
      </div>
    </div>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" class="rounded-2xl" />

    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div class="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm space-y-4 self-start">
        <div>
          <div class="text-sm font-semibold text-slate-700 mb-2">相册树</div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3 min-h-[120px] max-h-[280px] overflow-auto">
            <el-tree
              :data="albums"
              :props="treeProps"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
              @node-click="onAlbumClick"
            />
          </div>
        </div>

        <div class="flex gap-2 flex-wrap">
          <el-button v-if="currentAlbumId && selectedIds.length === 1" @click="setCover" size="small">设为封面</el-button>
        </div>

        <div class="rounded-[24px] border border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-4 shadow-inner">
          <div>
            <div class="text-sm font-semibold text-blue-700">上传到 TG 存储池</div>
            <div class="text-xs text-blue-600 mt-1">选择目标相册与备注，上传后会自动写入 D1。</div>
          </div>

          <el-select v-model="uploadAlbumId" placeholder="选择目标相册" size="small">
            <el-option v-for="album in flatAlbums" :key="album.id" :label="album.name" :value="album.id" />
          </el-select>

          <el-input v-model="uploadRemark" placeholder="上传备注" size="small" />

          <el-upload drag :http-request="handleUpload" :show-file-list="false" class="w-full">
            <div class="px-4 py-5 text-center text-slate-700 text-sm">点击或拖拽上传图片</div>
          </el-upload>

          <div v-if="uploadQueue.length" class="space-y-2">
            <div class="text-xs font-medium text-slate-500">上传队列</div>
            <div class="grid grid-cols-3 gap-2">
              <div v-for="item in uploadQueue" :key="item.id" class="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <img :src="item.url" class="w-full h-20 object-cover rounded-xl" />
                <div class="mt-2 text-[11px] text-slate-600 truncate">{{ item.name }}</div>
                <el-progress :percentage="item.progress" :stroke-width="6" :show-text="false" class="mt-1" />
                <div class="mt-1 text-[11px]" :class="item.status === 'success' ? 'text-emerald-600' : item.status === 'error' ? 'text-red-500' : 'text-slate-500'">
                  {{ item.status === 'success' ? '已完成' : item.status === 'error' ? '失败' : '上传中' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3 items-center">
          <el-date-picker v-model="range" type="daterange" size="small" />
          <el-select v-model="tag" placeholder="标签" filterable class="w-40" size="small">
            <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
          <el-input v-model="keyword" placeholder="文件名 / 备注关键词" class="w-full md:w-64" size="small" />
          <el-button @click="search" size="small" type="primary">搜索</el-button>
        </div>

        <div v-if="selectedIds.length" class="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-2 items-center">
          <el-input v-model="tagInput" placeholder="批量标签（逗号分隔）" class="w-full md:w-60" size="small" />
          <el-button @click="applyTags" size="small">打标签</el-button>
          <el-input-number v-model="moveAlbumId" placeholder="目标相册ID" size="small" />
          <el-button @click="move" size="small">批量移动</el-button>
          <el-button type="danger" @click="toRecycle" size="small">放入回收站</el-button>
        </div>

        <div v-if="photos.length === 0" class="text-center py-16 rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div class="text-6xl mb-4">🖼️</div>
          <div class="text-slate-500">暂无图片</div>
        </div>

        <div v-else class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="rounded-[22px] border bg-white shadow-sm transition-all duration-200 overflow-hidden"
            :class="selectedIds.includes(photo.id)
              ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg shadow-blue-100'
              : 'border-slate-200 hover:border-blue-200 hover:shadow-md'"
            @click="toggleSelect(photo.id)"
          >
            <div class="p-2">
              <div class="relative">
                <img :src="photo.previewUrl" class="w-full aspect-square rounded-2xl object-cover border border-slate-100 shadow-sm" />
                <div v-if="selectedIds.includes(photo.id)" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-md">✓</div>
              </div>

              <div class="mt-2 text-[10px] font-semibold text-slate-800 truncate">{{ photo.original_filename || '未命名图片' }}</div>
              <div v-if="photo.album_name" class="text-[9px] text-blue-600 mt-0.5 truncate">{{ photo.album_name }}</div>

              <div class="mt-2 grid grid-cols-2 gap-1.5 photo-actions">
                <el-button size="small" @click.stop="openDetail(photo.id)" class="photo-action-btn !border-slate-200 !bg-slate-50 hover:!bg-slate-100">详情</el-button>
                <el-button size="small" @click.stop="openMoveDialog(photo.id)" class="photo-action-btn !border-blue-200 !text-blue-600 !bg-blue-50 hover:!bg-blue-100">移动</el-button>
                <el-button size="small" type="danger" @click.stop="deletePhoto(photo.id)" class="photo-action-btn">删除</el-button>
                <el-button size="small" @click.stop="openEditDialog(photo.id)" class="photo-action-btn !border-purple-200 !text-purple-600 !bg-purple-50 hover:!bg-purple-100">编辑</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="moveDialogVisible" title="移动图片" width="420px" class="!rounded-3xl">
      <el-select v-model="moveToAlbumId" placeholder="选择目标相册" class="w-full" size="large">
        <el-option v-for="album in flatAlbums" :key="album.id" :label="album.name" :value="album.id" />
      </el-select>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMove" :loading="moving">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="420px" class="!rounded-3xl">
      <div class="text-slate-600">确定要删除这张图片吗？此操作不可恢复。</div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">确定删除</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="图片编辑" width="800px" class="!rounded-3xl" @close="resetEditState">
      <div class="space-y-4">
        <div class="flex gap-4">
          <div class="flex-1">
            <img ref="editImageRef" :src="editPhoto?.previewUrl" class="w-full rounded-2xl border border-slate-200" />
          </div>
          <div class="w-48 space-y-3">
            <div class="text-sm font-semibold text-slate-700">调整</div>
            
            <div>
              <label class="text-xs text-slate-500 block mb-1">旋转</label>
              <div class="flex gap-2">
                <el-button size="small" @click="rotateImage(-90)" :disabled="!editImageRef">← 左旋</el-button>
                <el-button size="small" @click="rotateImage(90)" :disabled="!editImageRef">右旋 →</el-button>
              </div>
            </div>

            <div>
              <label class="text-xs text-slate-500 block mb-1">翻转</label>
              <div class="flex gap-2">
                <el-button size="small" @click="flipImage('horizontal')" :disabled="!editImageRef">↔ 水平</el-button>
                <el-button size="small" @click="flipImage('vertical')" :disabled="!editImageRef">↕ 垂直</el-button>
              </div>
            </div>

            <div>
              <label class="text-xs text-slate-500 block mb-1">滤镜</label>
              <div class="grid grid-cols-3 gap-2">
                <el-button size="small" @click="applyFilter('none')" :disabled="!editImageRef">原图</el-button>
                <el-button size="small" @click="applyFilter('grayscale')" :disabled="!editImageRef">黑白</el-button>
                <el-button size="small" @click="applyFilter('sepia')" :disabled="!editImageRef">复古</el-button>
                <el-button size="small" @click="applyFilter('brightness')" :disabled="!editImageRef">明亮</el-button>
                <el-button size="small" @click="applyFilter('contrast')" :disabled="!editImageRef">高对比</el-button>
                <el-button size="small" @click="applyFilter('blur')" :disabled="!editImageRef">模糊</el-button>
              </div>
            </div>

            <div>
              <label class="text-xs text-slate-500 block mb-1">裁剪</label>
              <div class="flex gap-2">
                <el-button size="small" @click="cropToSquare" :disabled="!editImageRef">正方形</el-button>
                <el-button size="small" @click="cropTo16x9" :disabled="!editImageRef">16:9</el-button>
                <el-button size="small" @click="cropTo1x1" :disabled="!editImageRef">1:1</el-button>
              </div>
            </div>

            <div>
              <label class="text-xs text-slate-500 block mb-1">缩放</label>
              <el-slider v-model="scale" :min="0.5" :max="2" :step="0.1" :disabled="!editImageRef" />
              <div class="text-[10px] text-slate-500 mt-1">{{ Math.round(scale * 100) }}%</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-slate-200">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit" :loading="saving" :disabled="!editImageRef">保存修改</el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="照片详情" width="600px" class="!rounded-3xl">
      <div v-if="detail" class="space-y-4">
        <img :src="detail.previewUrl" class="w-full rounded-2xl" />
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-slate-500">文件名:</div>
          <div class="font-medium">{{ detail.original_filename }}</div>
          <div class="text-slate-500">相册:</div>
          <div class="font-medium">{{ detail.album_name }}</div>
          <div class="text-slate-500">尺寸:</div>
          <div class="font-medium">{{ detail.width }} x {{ detail.height }}</div>
          <div class="text-slate-500">文件大小:</div>
          <div class="font-medium">{{ formatFileSize(detail.file_size) }}</div>
          <div class="text-slate-500">上传时间:</div>
          <div class="font-medium">{{ formatDate(detail.uploaded_at) }}</div>
        </div>
        <div v-if="detail.remark" class="pt-2 border-t border-slate-200">
          <div class="text-xs text-slate-500 mb-1">备注</div>
          <div class="text-sm">{{ detail.remark }}</div>
        </div>
        <div v-if="detail.camera_make" class="pt-2 border-t border-slate-200">
          <div class="text-xs text-slate-500 mb-1">相机</div>
          <div class="text-sm">{{ detail.camera_make }} {{ detail.camera_model }}</div>
        </div>
        <div class="pt-2 border-t border-slate-200">
          <el-input v-model="detailRemark" placeholder="添加备注" size="large" />
          <template #footer>
            <el-button @click="detailVisible = false">关闭</el-button>
            <el-button type="primary" @click="saveRemark" :loading="saving">保存</el-button>
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/axios'
import { searchPhotos, getAlbumTree, batchMove, batchDelete, batchTag, listTags, getPhotoDetail, updatePhotoRemark } from '@/utils/api'
import { extractExif, dominantColorHex } from '@/utils/exif'

const albums = ref([])
const photos = ref<any[]>([])
const tags = ref<any[]>([])
const selectedIds = ref<number[]>([])
const range = ref<[Date, Date] | undefined>()
const tag = ref('')
const keyword = ref('')
const tagInput = ref('')
const moveAlbumId = ref<number | undefined>()
const currentAlbumId = ref<number | null>(null)
const detailVisible = ref(false)
const detail = ref<any>(null)
const detailRemark = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const uploadAlbumId = ref<number | undefined>()
const uploadRemark = ref('')
const uploadQueue = ref<any[]>([])
const moveDialogVisible = ref(false)
const moveToAlbumId = ref<number | undefined>()
const deleteDialogVisible = ref(false)
const moving = ref(false)
const deleting = ref(false)
const activeMoveId = ref<number | null>(null)
const activeDeleteId = ref<number | null>(null)

// 编辑相关
const editDialogVisible = ref(false)
const editPhoto = ref<any>(null)
const editImageRef = ref<HTMLImageElement | null>(null)
const editCanvas = ref<HTMLCanvasElement | null>(null)
const scale = ref(1)
const rotation = ref(0)
const flipH = ref(false)
const flipV = ref(false)
const currentFilter = ref('none')
const saving = ref(false)

const flatten = (nodes: any[]): any[] => nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])])
const flatAlbums = computed(() => flatten(albums.value))
const treeProps = { label: 'name', children: 'children' }

const toggleSelect = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(i => i !== id)
    : [...selectedIds.value, id]
}

const search = async () => {
  const params: any = {}
  if (tag.value) params.tag = tag.value
  if (keyword.value) params.keyword = keyword.value
  if (range.value?.[0]) params.date_start = Math.floor(range.value[0].getTime() / 1000)
  if (range.value?.[1]) params.date_end = Math.floor(range.value[1].getTime() / 1000)
  if (currentAlbumId.value) params.album_id = currentAlbumId.value
  const { data } = await searchPhotos(params)
  photos.value = (data.results || []).map((p: any) => ({ ...p, previewUrl: `/api/photos/file/${p.id}` }))
}

const onAlbumClick = (node: any) => {
  currentAlbumId.value = node.id
  search()
}

const loadAlbums = async () => {
  const { data } = await getAlbumTree()
  albums.value = data.results || []
}

const loadTags = async () => {
  const { data } = await listTags()
  tags.value = data.results || []
}

const applyTags = async () => {
  const tagsArr = tagInput.value.split(',').map(t => t.trim()).filter(Boolean)
  if (!tagsArr.length) return
  await batchTag(selectedIds.value, tagsArr)
  tagInput.value = ''
  await search()
}

const move = async () => {
  if (!moveAlbumId.value) return
  await batchMove(selectedIds.value, moveAlbumId.value)
  await search()
}

const toRecycle = async () => {
  await batchDelete(selectedIds.value)
  selectedIds.value = []
  await search()
}

const setCover = async () => {
  if (!currentAlbumId.value || selectedIds.value.length !== 1) return
  await api.put(`/albums/${currentAlbumId.value}/cover`, { cover_photo_id: selectedIds.value[0] })
  message.value = '相册封面已设置'
  messageType.value = 'success'
  ElMessage.success('相册封面已设置')
}

const copyDirectLink = async (id: number) => {
  const photo = photos.value.find((p: any) => p.id === id)
  const rawName = (photo?.original_filename || `photo-${id}.jpg`).split('/').pop() || `photo-${id}.jpg`
  const safeName = rawName.replace(/\s+/g, '_')
  const url = `${location.origin}/api/photos/file/${id}/${encodeURIComponent(safeName)}`
  await navigator.clipboard.writeText(url)
  ElMessage.success('图片直链已复制')
}

const handleUpload = async (options: any) => {
  const file: File = options.file
  const item = {
    id: `${Date.now()}-${Math.random()}`,
    name: file.name,
    url: URL.createObjectURL(file),
    progress: 0,
    status: 'uploading'
  }
  uploadQueue.value.unshift(item)

  try {
    const form = new FormData()
    form.append('file', file)
    form.append('original_filename', file.name)
    if (uploadAlbumId.value) form.append('album_id', String(uploadAlbumId.value))
    if (uploadRemark.value) form.append('remark', uploadRemark.value)
    const exif = await extractExif(file)
    const color = await dominantColorHex(file)
    if (color) form.append('dominant_color_hex', color)
    if (exif.raw_exif_json) form.append('exif_json', exif.raw_exif_json)
    await api.post('/upload', form, {
      onUploadProgress: (evt) => {
        if (!evt.total) return
        item.progress = Math.round((evt.loaded / evt.total) * 100)
      }
    })
    item.progress = 100
    item.status = 'success'
    message.value = '图片上传成功，已进入 TG 存储池'
    messageType.value = 'success'
    ElMessage.success('上传成功')
    uploadRemark.value = ''
    await search()
  } catch (e: any) {
    item.status = 'error'
    message.value = e?.response?.data?.error || '图片上传失败'
    messageType.value = 'error'
    ElMessage.error(message.value)
  }
}

const openDetail = async (id: number) => {
  const { data } = await getPhotoDetail(id)
  detail.value = { ...data, previewUrl: `/api/photos/file/${data.id}` }
  detailRemark.value = data.remark || ''
  detailVisible.value = true
}

const saveRemark = async () => {
  if (!detail.value) return
  await updatePhotoRemark(detail.value.id, detailRemark.value)
  detailVisible.value = false
  await search()
  ElMessage.success('备注已保存')
}

const openMoveDialog = (id: number) => {
  activeMoveId.value = id
  moveToAlbumId.value = undefined
  moveDialogVisible.value = true
}

const confirmMove = async () => {
  if (!moveToAlbumId.value || !activeMoveId.value) {
    ElMessage.warning('请选择目标相册')
    return
  }
  moving.value = true
  try {
    await api.post('/photos/batch-move', { ids: [activeMoveId.value], target_album_id: moveToAlbumId.value })
    ElMessage.success('移动成功')
    moveDialogVisible.value = false
    activeMoveId.value = null
    await search()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '移动失败')
  } finally {
    moving.value = false
  }
}

const deletePhoto = (id: number) => {
  activeDeleteId.value = id
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  if (!activeDeleteId.value) return
  deleting.value = true
  try {
    await api.post('/photos/batch-delete', { ids: [activeDeleteId.value] })
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    activeDeleteId.value = null
    await search()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '删除失败')
  } finally {
    deleting.value = false
  }
}

// ==================== 图片编辑功能 ====================
const openEditDialog = async (id: number) => {
  const { data } = await getPhotoDetail(id)
  editPhoto.value = { ...data, previewUrl: `/api/photos/file/${data.id}` }
  editDialogVisible.value = true
  resetEditState()
  
  await nextTick()
  editImageRef.value = document.querySelector('img[ref="editImageRef"]') as HTMLImageElement
  if (editImageRef.value) {
    initCanvas()
  }
}

const resetEditState = () => {
  scale.value = 1
  rotation.value = 0
  flipH.value = false
  flipV.value = false
  currentFilter.value = 'none'
  editImageRef.value = null
  editCanvas.value = null
}

const initCanvas = () => {
  const img = editImageRef.value
  if (!img) return
  
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  editCanvas.value = canvas
}

const rotateImage = (deg: number) => {
  if (!editImageRef.value || !editCanvas.value) return
  
  rotation.value = (rotation.value + deg) % 360
  applyTransform()
}

const flipImage = (direction: 'horizontal' | 'vertical') => {
  if (!editImageRef.value || !editCanvas.value) return
  
  if (direction === 'horizontal') {
    flipH.value = !flipH.value
  } else {
    flipV.value = !flipV.value
  }
  applyTransform()
}

const applyFilter = (filter: string) => {
  currentFilter.value = filter
  applyTransform()
}

const applyTransform = () => {
  if (!editImageRef.value || !editCanvas.value) return
  
  const img = editImageRef.value
  const canvas = editCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  ctx.save()
  
  // 应用滤镜
  ctx.filter = getFilterCSS(currentFilter.value)
  
  // 应用变换
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1)
  ctx.scale(scale.value, scale.value)
  
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  ctx.restore()
}

const getFilterCSS = (filter: string): string => {
  switch (filter) {
    case 'grayscale': return 'grayscale(100%)'
    case 'sepia': return 'sepia(100%)'
    case 'brightness': return 'brightness(130%)'
    case 'contrast': return 'contrast(150%)'
    case 'blur': return 'blur(2px)'
    default: return 'none'
  }
}

const cropToSquare = () => {
  if (!editImageRef.value || !editCanvas.value) return
  
  const img = editImageRef.value
  const canvas = editCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const size = Math.min(img.naturalWidth, img.naturalHeight)
  const x = (img.naturalWidth - size) / 2
  const y = (img.naturalHeight - size) / 2
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.filter = getFilterCSS(currentFilter.value)
  ctx.drawImage(img, x, y, size, size, 0, 0, size, size)
}

const cropTo16x9 = () => {
  if (!editImageRef.value || !editCanvas.value) return
  
  const img = editImageRef.value
  const canvas = editCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const ratio = 16 / 9
  let width = img.naturalWidth
  let height = img.naturalHeight
  
  if (width / height > ratio) {
    width = height * ratio
  } else {
    height = width / ratio
  }
  
  const x = (img.naturalWidth - width) / 2
  const y = (img.naturalHeight - height) / 2
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.filter = getFilterCSS(currentFilter.value)
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
}

const cropTo1x1 = () => {
  cropToSquare()
}

const saveEdit = async () => {
  if (!editPhoto.value || !editCanvas.value) return
  
  saving.value = true
  try {
    const canvas = editCanvas.value
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    
    const formData = new FormData()
    formData.append('file', blob, `edited_${editPhoto.value.original_filename}`)
    formData.append('remark', `编辑: ${currentFilter.value} 旋转${rotation.value}° 翻转${flipH.value ? '水平' : ''}${flipV.value ? '垂直' : ''}`)
    formData.append('original_filename', `edited_${editPhoto.value.original_filename}`)
    
    await api.post('/upload', formData)
    
    ElMessage.success('图片编辑已保存')
    editDialogVisible.value = false
    await search()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

onMounted(() => {
  loadAlbums()
  loadTags()
  search()
})
</script>

<style scoped>
.photo-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.375rem;
  align-items: stretch;
}

.photo-actions :deep(.el-button),
.photo-action-btn {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-size: 11px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-actions :deep(.el-button > span) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
