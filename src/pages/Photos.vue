<template>
  <div ref="pageRef" class="space-y-4 font-sans">
    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <!-- 上传卡片 -->
    <div class="panel-card space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">快速上传</div>
        <div class="flex items-center gap-2">
          <el-select v-model="uploadAlbumId" placeholder="目标相册" size="small" class="!w-32">
            <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
          </el-select>
          <el-input v-model="uploadRemark" placeholder="备注（可选）" size="small" class="!w-36" />
        </div>
      </div>

      <el-upload
        drag
        multiple
        :http-request="handleUpload"
        :show-file-list="false"
        class="w-full !rounded-2xl"
      >
        <div class="py-2 text-center text-slate-600 text-xs flex items-center justify-center gap-2">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>点击或将图片拖拽至此上传</span>
        </div>
      </el-upload>

      <!-- 上传队列预览 -->
      <div v-if="uploadQueue.length" class="grid grid-cols-4 md:grid-cols-6 gap-2 pt-1">
        <div v-for="item in uploadQueue" :key="item.id" class="rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-2xs">
          <img :src="item.url" class="w-full h-14 object-cover rounded-lg" />
          <el-progress :percentage="item.progress" :stroke-width="3" :show-text="false" class="mt-1.5" />
        </div>
      </div>
    </div>

    <!-- 检索与筛选栏 -->
    <div class="panel-card space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <el-select v-model="currentAlbumId" placeholder="所有相册" size="small" clearable @change="page = 1; search()">
          <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
        </el-select>
        <el-select v-model="tag" placeholder="所有标签" filterable size="small" clearable @change="page = 1; search()">
          <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
        </el-select>
        <el-input v-model="keyword" placeholder="搜索文件名 / 备注" size="small" clearable @keyup.enter="page = 1; search()" />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        <div class="flex items-center gap-2 text-slate-500">
          <span>共 <strong class="text-slate-800">{{ totalPhotos }}</strong> 张</span>
          <span>·</span>
          <span>第 {{ page }} / {{ totalPages }} 页</span>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" @click="page = 1; search()" class="action-ghost-btn !h-8 !px-3">搜索</button>
          <button type="button" @click="recheckBroken" class="action-ghost-btn action-ghost-btn-danger !h-8 !px-3">检测失效</button>
          <button type="button" @click="changePage(page - 1)" :disabled="page <= 1" class="action-ghost-btn !h-8 !px-2.5 disabled:opacity-30">‹</button>
          <button type="button" @click="changePage(page + 1)" :disabled="page >= totalPages" class="action-ghost-btn !h-8 !px-2.5 disabled:opacity-30">›</button>
        </div>
      </div>
    </div>

    <!-- 批量操作浮动条 -->
    <div
      v-if="selectedIds.length"
      class="sticky bottom-4 z-30 panel-card !bg-white/95 backdrop-blur-xl border-blue-200 shadow-[0_8px_30px_rgba(37,99,235,0.15)] space-y-2.5"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>已选择 <strong>{{ selectedIds.length }}</strong> 项</span>
        </div>
        <button type="button" @click="clearSelection" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">取消选择</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <el-select v-model="bulkMoveToAlbumId" placeholder="选择目标相册" size="small" class="w-full">
          <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
        </el-select>
        <button type="button" @click="confirmBulkMove" class="action-ghost-btn !h-8 !bg-blue-50 !border-blue-200 !text-blue-700 font-medium">确认移动</button>
        <button type="button" @click="toRecycleSelected" class="action-ghost-btn action-ghost-btn-danger !h-8 font-medium">批量删除</button>
      </div>
    </div>

    <!-- 图片展示区 -->
    <div v-if="photos.length === 0" class="panel-empty">
      <div class="text-3xl mb-2">📷</div>
      <div>暂无图片数据</div>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-3.5 items-start">
      <article
        v-for="item in photos"
        :key="item.id"
        class="group relative rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer photo-card"
        :class="[
          selectedIds.includes(item.id) ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : '',
          latestUploadedPhotoId === item.id ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
        ]"
        @click.stop="selectionMode ? toggleSelect(item.id) : toggleCardActions(item.id)"
      >
        <!-- 图片主体 -->
        <div class="relative aspect-[4/5] bg-slate-100 overflow-hidden">
          <template v-if="item.is_broken">
            <div class="w-full h-full border border-dashed border-rose-200 bg-rose-50/60 flex flex-col items-center justify-center text-center p-3">
              <div class="text-2xl mb-1">⚠️</div>
              <div class="text-xs font-semibold text-rose-600">文件已失效</div>
              <div class="text-[10px] text-rose-400 mt-1 line-clamp-2">{{ item.broken_reason || 'Telegram 404' }}</div>
            </div>
          </template>
          <img
            v-else
            :src="item.previewUrl"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />

          <!-- 选中计数角标 -->
          <div
            v-if="selectedIds.includes(item.id)"
            class="absolute top-2 left-2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
          >
            {{ selectedIds.indexOf(item.id) + 1 }}
          </div>

          <!-- 浮动操作遮罩 -->
          <div
            v-if="!selectionMode && activeCardId === item.id"
            class="photo-card-overlay"
            @click.stop
          >
            <div class="grid grid-cols-2 gap-1.5 p-2">
              <button type="button" @click.stop="openDetail(item.id)" class="action-mini-btn">详情</button>
              <button type="button" @click.stop="openMoveDialog(item.id)" class="action-mini-btn !text-blue-700">移动</button>
              <button type="button" @click.stop="deletePhoto(item.id)" class="action-mini-btn !text-rose-600">删除</button>
              <button type="button" @click.stop="copyDirectLink(item)" class="action-mini-btn !text-emerald-700">直链</button>
            </div>
          </div>
        </div>

        <!-- 底部相册标签与选择框 -->
        <div class="p-2.5 flex items-center justify-between gap-1.5 border-t border-slate-100 bg-white">
          <span
            v-if="item.album_name"
            class="text-[11px] font-medium text-slate-500 truncate"
            :title="item.album_name"
          >
            {{ item.album_name }}
          </span>
          <span v-else class="text-[11px] text-slate-300">未分类</span>

          <button
            type="button"
            @click.stop="toggleSelect(item.id)"
            class="w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center transition-all shrink-0"
            :class="selectedIds.includes(item.id) ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'bg-white border-slate-300 text-slate-400 hover:border-blue-400'"
          >
            {{ selectedIds.includes(item.id) ? '✓' : '' }}
          </button>
        </div>
      </article>
    </div>

    <!-- 模态框: 移动照片 -->
    <Teleport to="body">
      <div v-if="moveDialogVisible" class="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="w-full max-w-xs rounded-3xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-base font-bold text-slate-900">移动照片</div>
            <button type="button" class="w-7 h-7 rounded-full bg-slate-100 text-slate-400 text-sm flex items-center justify-center hover:bg-slate-200" @click="closeMoveDialog">✕</button>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">选择目标相册</label>
            <el-select v-model="moveToAlbumId" placeholder="选择相册" class="w-full">
              <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
            </el-select>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <el-button @click="closeMoveDialog">取消</el-button>
            <el-button type="primary" @click="confirmMove" :loading="moving">确认移动</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 模态框: 确认删除 -->
    <Teleport to="body">
      <div v-if="deleteDialogVisible" class="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="w-full max-w-xs rounded-3xl bg-white shadow-2xl border border-slate-200 p-5 space-y-3.5 text-center">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            🗑
          </div>
          <div>
            <div class="text-base font-bold text-slate-900">移至回收站</div>
            <div class="text-xs text-slate-500 mt-1">确定要将此照片移入回收站吗？之后可以随时还原。</div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2">
            <el-button @click="deleteDialogVisible = false">取消</el-button>
            <el-button type="danger" @click="confirmDelete" :loading="deleting">删除</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 模态框: 照片详情与 EXIF -->
    <Teleport to="body">
      <div v-if="detailVisible && detail" class="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-base font-bold text-slate-900">照片详情</div>
            <button type="button" class="w-7 h-7 rounded-full bg-slate-100 text-slate-400 text-sm flex items-center justify-center hover:bg-slate-200" @click="detailVisible = false">✕</button>
          </div>

          <img :src="`/api/photos/file/${detail.id}`" class="w-full rounded-2xl border border-slate-100 shadow-sm max-h-60 object-contain bg-slate-50" />

          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div class="text-[10px] text-slate-400 font-medium uppercase">文件名</div>
              <div class="text-slate-800 font-medium break-all mt-0.5">{{ detail.original_filename }}</div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-medium uppercase">分辨率</div>
                <div class="text-slate-800 font-medium mt-0.5">{{ detail.width }} × {{ detail.height }}</div>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-medium uppercase">所属相册</div>
                <div class="text-slate-800 font-medium mt-0.5 truncate">{{ detail.album_name || '未分类' }}</div>
              </div>
            </div>
            <div v-if="detail.camera_model" class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div class="text-[10px] text-slate-400 font-medium uppercase">拍摄设备</div>
              <div class="text-slate-800 font-medium mt-0.5">{{ detail.camera_make }} {{ detail.camera_model }}</div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { searchPhotos, getAlbums, uploadPhoto, listTags, getPhotoDetail, batchMove, batchDelete, recheckBrokenPhotos } from '@/utils/api'
import { extractExif, dominantColorHex } from '@/utils/exif'

const pageRef = ref<HTMLElement | null>(null)
const albums = ref<any[]>([])
const photos = ref<any[]>([])
const totalPhotos = ref(0)
const page = ref(1)
const pageSize = ref(10)
const tags = ref<any[]>([])
const selectedIds = ref<number[]>([])
const selectionMode = ref(false)
const currentAlbumId = ref<number | undefined>()
const tag = ref('')
const keyword = ref('')
const uploadAlbumId = ref<number | undefined>()
const uploadRemark = ref('')
const uploadQueue = ref<any[]>([])
const detailVisible = ref(false)
const detail = ref<any>(null)
const moveDialogVisible = ref(false)
const moveToAlbumId = ref<number | undefined>()
const bulkMoveToAlbumId = ref<number | undefined>()
const deleteDialogVisible = ref(false)
const moving = ref(false)
const deleting = ref(false)
const activeMoveId = ref<number | null>(null)
const activeDeleteId = ref<number | null>(null)
const activeCardId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const latestUploadedPhotoId = ref<number | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(totalPhotos.value / pageSize.value)))

const closeActionPanel = () => {
  activeCardId.value = null
}

const toggleSelect = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter(i => i !== id) : [...selectedIds.value, id]
}

const clearSelection = () => { selectedIds.value = []; selectionMode.value = false }

const toggleCardActions = (id: number) => {
  activeCardId.value = activeCardId.value === id ? null : id
}

const handleWindowClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.photo-card')) closeActionPanel()
}

const loadAlbums = async () => {
  const { data } = await getAlbums()
  albums.value = data.results || []
  if (!uploadAlbumId.value) {
    const uncategorized = albums.value.find((a: any) => a.name === '未分类')
    uploadAlbumId.value = uncategorized?.id || albums.value[0]?.id
  }
}

const loadTags = async () => {
  const { data } = await listTags()
  tags.value = data.results || []
}

const search = async () => {
  const params: any = { page: page.value, page_size: pageSize.value }
  if (currentAlbumId.value) params.album_id = currentAlbumId.value
  if (tag.value) params.tag = tag.value
  if (keyword.value) params.keyword = keyword.value
  const { data } = await searchPhotos(params)
  totalPhotos.value = Number(data.total || 0)
  photos.value = (data.results || []).map((p: any) => ({ ...p, previewUrl: `/api/photos/file/${p.id}` }))
}

const changePage = async (next: number) => {
  if (next < 1 || next > totalPages.value) return
  page.value = next
  await search()
}

const recheckBroken = async () => {
  try {
    const ids = photos.value.filter((p:any) => p.is_broken).map((p:any) => p.id)
    const { data } = await recheckBrokenPhotos(ids)
    message.value = `检测 ${data.checked} 张，恢复 ${data.recovered} 张，仍失效 ${data.stillBroken} 张`
    messageType.value = data.recovered > 0 ? 'success' : 'error'
    await search()
  } catch (e:any) {
    message.value = e?.response?.data?.error || '重新检测失败'
    messageType.value = 'error'
  }
}

const sanitizeFilename = (name?: string) => {
  const raw = (name || 'image.jpg').split('/').pop() || 'image.jpg'
  return raw.replace(/\s+/g, '_')
}

const buildDirectLink = (photo: any) => {
  const filename = sanitizeFilename(photo?.original_filename)
  return `${location.origin}/api/photos/file/${photo.id}/${encodeURIComponent(filename)}`
}

const copyDirectLink = async (photo: any) => {
  await navigator.clipboard.writeText(buildDirectLink(photo))
  closeActionPanel()
  ElMessage.success('直链已复制')
}

const handleUpload = async (options: any) => {
  const file: File = options.file
  const item = { id: `${Date.now()}-${Math.random()}`, name: file.name, url: URL.createObjectURL(file), progress: 0 }
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
    const { data } = await uploadPhoto(form)
    item.progress = 100
    uploadRemark.value = ''
    page.value = 1
    latestUploadedPhotoId.value = data?.id || null
    await search()
    setTimeout(() => { latestUploadedPhotoId.value = null }, 6000)
    ElMessage.success('上传成功')
  } catch (e: any) {
    message.value = e?.response?.data?.error || e?.message || '上传失败'
    messageType.value = 'error'
  }
}

const openDetail = async (id: number) => {
  const { data } = await getPhotoDetail(id)
  detail.value = data
  detailVisible.value = true
  closeActionPanel()
}

const openMoveDialog = (id: number) => {
  activeMoveId.value = id
  moveToAlbumId.value = undefined
  moveDialogVisible.value = true
  closeActionPanel()
}

const closeMoveDialog = () => {
  moveDialogVisible.value = false
}

const confirmMove = async () => {
  if (!moveToAlbumId.value || !activeMoveId.value) return ElMessage.warning('请选择目标相册')
  moving.value = true
  try {
    await batchMove([activeMoveId.value], moveToAlbumId.value)
    closeMoveDialog()
    activeMoveId.value = null
    await search()
    ElMessage.success('移动成功')
  } finally {
    moving.value = false
  }
}

const confirmBulkMove = async () => {
  if (!bulkMoveToAlbumId.value || !selectedIds.value.length) return ElMessage.warning('请选择目标相册')
  moving.value = true
  try {
    await batchMove(selectedIds.value, bulkMoveToAlbumId.value)
    clearSelection()
    await search()
    ElMessage.success('批量移动成功')
  } finally {
    moving.value = false
  }
}

const toRecycleSelected = async () => {
  if (!selectedIds.value.length) return
  deleting.value = true
  try {
    await batchDelete(selectedIds.value)
    clearSelection()
    await search()
    ElMessage.success('已移入回收站')
  } finally {
    deleting.value = false
  }
}

const deletePhoto = (id: number) => {
  activeDeleteId.value = id
  deleteDialogVisible.value = true
  closeActionPanel()
}

const confirmDelete = async () => {
  if (!activeDeleteId.value) return
  deleting.value = true
  try {
    await batchDelete([activeDeleteId.value])
    deleteDialogVisible.value = false
    activeDeleteId.value = null
    await search()
    ElMessage.success('已放入回收站')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  window.addEventListener('click', handleWindowClick)
  await loadAlbums()
  await loadTags()
  await search()
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick)
})
</script>
