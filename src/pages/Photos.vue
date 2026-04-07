<template>
  <div ref="pageRef" class="space-y-5 rounded-[32px] bg-white/82 backdrop-blur-md border border-slate-200/80 shadow-sm p-4">
    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <div class="panel-card bg-white/98 space-y-2.5 border-blue-100/80 !p-4">
      <div class="grid grid-cols-2 gap-2 items-center">
        <el-select v-model="uploadAlbumId" placeholder="选择目标相册" size="small" class="w-full">
          <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
        </el-select>
        <el-input v-model="uploadRemark" placeholder="备注" size="small" />
      </div>
      <el-upload drag multiple :http-request="handleUpload" :show-file-list="false" class="w-full">
        <div class="px-3 py-1.5 text-center text-slate-700 text-sm">点击或拖拽上传</div>
      </el-upload>
      <div v-if="uploadQueue.length" class="grid grid-cols-4 md:grid-cols-6 gap-1.5">
        <div v-for="item in uploadQueue" :key="item.id" class="rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <img :src="item.url" class="w-full h-16 object-cover rounded-xl" />
          <el-progress :percentage="item.progress" :stroke-width="5" :show-text="false" class="mt-2" />
        </div>
      </div>
    </div>

    <div v-if="selectedIds.length" class="sticky bottom-3 z-20 panel-card bg-white/98 border-blue-200 shadow-[0_10px_24px_rgba(37,99,235,0.10)] space-y-3">
      <div class="flex items-center justify-between gap-2 text-sm">
        <div class="font-medium text-slate-700">已选择 {{ selectedIds.length }} 张图片</div>
        <button type="button" @click="clearSelection" class="rounded-xl bg-white border border-slate-200 text-slate-600 px-3 h-8 text-sm font-medium">取消选择</button>
      </div>

      <button type="button" @click="bulkMovePickerOpen = !bulkMovePickerOpen" class="w-full h-11 rounded-[16px] border border-slate-300 bg-white px-4 text-left text-slate-500 flex items-center justify-between">
        <span>{{ bulkSelectedMoveAlbumName || '选择要移动到的相册' }}</span>
        <span class="text-slate-400">⌄</span>
      </button>

      <div v-if="bulkMovePickerOpen" class="rounded-[18px] border border-slate-200 bg-white max-h-56 overflow-y-auto overflow-x-hidden shadow-inner">
        <button
          v-for="album in albums"
          :key="album.id"
          type="button"
          @click="selectBulkMoveAlbum(album)"
          class="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
        >
          {{ album.name }}
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button type="button" @click="confirmBulkMove" class="rounded-xl bg-blue-50 border border-blue-200 text-blue-700 px-4 h-9 text-sm font-medium">确认批量移动</button>
        <button type="button" @click="toRecycleSelected" class="rounded-xl bg-rose-50 border border-rose-200 text-rose-600 px-4 h-9 text-sm font-medium">批量删除</button>
      </div>
    </div>

    <div class="panel-card bg-white/98 space-y-3 border-slate-200 !p-4">
      <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-2">
        <div class="grid grid-cols-4 gap-2 items-center photos-toolbar-grid">
          <button type="button" @click="changePageSize(10)" class="rounded-2xl border h-9 text-sm font-medium w-full whitespace-nowrap text-center flex items-center justify-center" :class="pageSize === 10 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 bg-white text-slate-600'">10 / 页</button>
          <button type="button" @click="changePageSize(20)" class="rounded-2xl border h-9 text-sm font-medium w-full whitespace-nowrap text-center flex items-center justify-center" :class="pageSize === 20 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 bg-white text-slate-600'">20 / 页</button>
          <input v-model="pageJump" inputmode="numeric" placeholder="页码" class="w-full h-9 rounded-2xl border border-slate-200 px-3 text-sm text-center bg-white" />
          <button type="button" @click="jumpToPage" class="rounded-2xl border border-slate-200 bg-white text-slate-600 h-9 text-sm w-full whitespace-nowrap text-center flex items-center justify-center">跳转</button>
        </div>
      </div>
      <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-2 space-y-2">
        <div class="grid grid-cols-2 gap-2 items-center">
          <el-select v-model="currentAlbumId" placeholder="相册" class="w-full" size="small" clearable @change="page = 1; search()">
            <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
          </el-select>
          <el-select v-model="tag" placeholder="标签" filterable class="w-full" size="small">
            <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </div>
        <el-input v-model="keyword" placeholder="文件名 / 备注" class="w-full" size="small" />
        <div class="grid grid-cols-2 gap-2 items-center">
          <el-button @click="page = 1; search()" size="small" type="primary" class="!w-full !h-9 !rounded-2xl !border !border-slate-200 !shadow-none !bg-white !text-slate-700 hover:!bg-slate-50">搜索</el-button>
          <button type="button" @click="recheckBroken" class="rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 h-9 text-sm w-full whitespace-nowrap flex items-center justify-center">检测失效</button>
        </div>
      </div>
      <div class="flex items-center justify-between text-sm text-slate-500 gap-3 px-1">
        <div>当前页 {{ photos.length }} 张 / 共 {{ totalPhotos }} 张</div>
        <div>第 {{ page }} / {{ totalPages }} 页</div>
      </div>
    </div>

    <div v-if="photos.length === 0" class="panel-empty">暂无图片</div>

    <div v-else class="space-y-5">
      <div class="panel-card bg-white/98 border-slate-200 !p-4">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-2 grid grid-cols-3 gap-2 items-center">
          <button type="button" @click="changePage(page - 1)" :disabled="page <= 1" class="rounded-2xl border border-slate-200 bg-white h-9 text-sm font-medium shadow-sm disabled:opacity-40 flex items-center justify-center">上一页</button>
          <div class="rounded-2xl border border-slate-200 bg-white h-9 text-sm text-slate-500 flex items-center justify-center">第 {{ page }} / {{ totalPages }} 页</div>
          <button type="button" @click="changePage(page + 1)" :disabled="page >= totalPages" class="rounded-2xl border border-slate-200 bg-white h-9 text-sm font-medium shadow-sm disabled:opacity-40 flex items-center justify-center">下一页</button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
        <article
          v-for="item in photos"
          :key="item.id"
          class="panel-card bg-white/96 cursor-pointer photo-card relative transition-all duration-200"
          :class="selectedIds.includes(item.id) ? 'ring-2 ring-blue-300 border-blue-400 shadow-[0_8px_20px_rgba(37,99,235,0.12)]' : (latestUploadedPhotoId === item.id ? 'ring-2 ring-emerald-300 border-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.12)]' : '')"
          @click.stop="selectionMode ? toggleSelect(item.id) : toggleCardActions(item.id)"
        >
          <div class="relative">
            <template v-if="item.is_broken">
              <div class="w-full aspect-[4/5] rounded-xl border border-dashed border-rose-200 bg-rose-50/50 flex flex-col items-center justify-center text-center px-4">
                <div class="text-2xl mb-2">⚠️</div>
                <div class="text-xs font-medium text-rose-600">图片文件已失效</div>
                <div class="text-[11px] text-rose-400 mt-1 line-clamp-2">{{ item.broken_reason || "Telegram 文件不可用" }}</div>
              </div>
            </template>
            <img v-else :src="item.previewUrl" class="w-full aspect-[4/5] object-cover rounded-xl" />

            <div v-if="selectedIds.includes(item.id)" class="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">{{ selectedIds.indexOf(item.id) + 1 }}</div>

            <div
              v-if="!selectionMode && activeCardId === item.id"
              class="absolute inset-0 rounded-xl bg-black/18 flex items-center justify-center"
              @click.stop
            >
              <div class="grid grid-cols-2 gap-2 w-[124px]">
                <button type="button" @click.stop="openDetail(item.id)" class="action-mini-btn">详情</button>
                <button type="button" @click.stop="openMoveDialog(item.id)" class="action-mini-btn text-blue-700">移动</button>
                <button type="button" @click.stop="deletePhoto(item.id)" class="action-mini-btn text-rose-600">删除</button>
                <button type="button" @click.stop="copyDirectLink(item)" class="action-mini-btn text-emerald-700">直链</button>
              </div>
            </div>
          </div>

          <div class="mt-2 min-h-[40px] flex flex-col justify-end gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <div v-if="item.album_name" class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">相册:{{ item.album_name }}</div>
              <button type="button" @click.stop="toggleSelect(item.id)" class="w-5 h-5 rounded-full border text-[10px] font-semibold flex items-center justify-center transition-all" :class="selectedIds.includes(item.id) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : (selectionMode ? 'bg-white border-blue-200 text-blue-400' : 'bg-white border-slate-300 text-slate-400')">{{ selectedIds.includes(item.id) ? '✓' : '' }}</button>
            </div>
          </div>
        </article>
      </div>

      <div class="panel-card bg-white/98 border-slate-200 !p-4">
        <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-2 grid grid-cols-3 gap-2 items-center">
          <button type="button" @click="changePage(page - 1)" :disabled="page <= 1" class="rounded-2xl border border-slate-200 bg-white h-9 text-sm font-medium shadow-sm disabled:opacity-40 flex items-center justify-center">上一页</button>
          <div class="rounded-2xl border border-slate-200 bg-white h-9 text-sm text-slate-500 flex items-center justify-center">第 {{ page }} / {{ totalPages }} 页</div>
          <button type="button" @click="changePage(page + 1)" :disabled="page >= totalPages" class="rounded-2xl border border-slate-200 bg-white h-9 text-sm font-medium shadow-sm disabled:opacity-40 flex items-center justify-center">下一页</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="moveDialogVisible" class="fixed inset-0 z-[10020] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
        <div class="w-[340px] max-w-[92vw] rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[18px] font-semibold text-slate-900 tracking-tight">移动图片</div>
            <button type="button" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-xl leading-none flex items-center justify-center" @click="closeMoveDialog">×</button>
          </div>

          <button type="button" @click="movePickerOpen = !movePickerOpen" class="w-full h-12 rounded-[18px] border border-slate-300 bg-white px-4 text-left text-slate-500 flex items-center justify-between">
            <span>{{ selectedMoveAlbumName || '选择目标相册' }}</span>
            <span class="text-slate-400">⌄</span>
          </button>

          <div v-if="movePickerOpen" class="mt-3 rounded-[18px] border border-slate-200 bg-white max-h-56 overflow-y-auto overflow-x-hidden shadow-inner">
            <button
              v-for="album in albums"
              :key="album.id"
              type="button"
              @click="selectMoveAlbum(album)"
              class="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
            >
              {{ album.name }}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2 mt-4">
            <el-button @click="closeMoveDialog">取消</el-button>
            <el-button type="primary" @click="confirmMove" :loading="moving">确定</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="deleteDialogVisible" class="fixed inset-0 z-[10030] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
        <div class="w-[320px] max-w-[88vw] rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[18px] font-semibold text-slate-900 tracking-tight">确认删除</div>
            <button type="button" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-xl leading-none flex items-center justify-center" @click="deleteDialogVisible = false">×</button>
          </div>
          <div class="text-slate-600">确定删除这张图片？</div>
          <div class="grid grid-cols-2 gap-2 mt-4">
            <el-button @click="deleteDialogVisible = false">取消</el-button>
            <el-button type="danger" @click="confirmDelete" :loading="deleting">删除</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="detailVisible && detail" class="fixed inset-0 z-[10040] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
        <div class="w-[360px] max-w-[92vw] max-h-[82vh] overflow-auto rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[18px] font-semibold text-slate-900 tracking-tight">图片详情</div>
            <button type="button" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-xl leading-none flex items-center justify-center" @click="detailVisible = false">×</button>
          </div>
          <img :src="`/api/photos/file/${detail.id}`" class="w-full rounded-3xl border border-slate-200" />
          <div class="grid grid-cols-1 gap-3 mt-4">
            <div class="panel-mini"><div class="label">文件名</div><div class="value break-all">{{ detail.original_filename }}</div></div>
            <div class="panel-mini"><div class="label">分辨率</div><div class="value">{{ detail.width }} x {{ detail.height }}</div></div>
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
const pageJump = ref('')
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
const bulkMovePickerOpen = ref(false)
const movePickerOpen = ref(false)
const deleteDialogVisible = ref(false)
const moving = ref(false)
const deleting = ref(false)
const activeMoveId = ref<number | null>(null)
const activeDeleteId = ref<number | null>(null)
const activeCardId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const latestUploadedPhotoId = ref<number | null>(null)

const selectedMoveAlbumName = computed(() => albums.value.find((a: any) => a.id === moveToAlbumId.value)?.name || '')
const bulkSelectedMoveAlbumName = computed(() => albums.value.find((a: any) => a.id === bulkMoveToAlbumId.value)?.name || '')
const totalPages = computed(() => Math.max(1, Math.ceil(totalPhotos.value / pageSize.value)))
const brokenCount = computed(() => photos.value.filter((p:any) => !!p.is_broken).length)

const closeActionPanel = () => {
  activeCardId.value = null
}

const toggleSelect = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter(i => i !== id) : [...selectedIds.value, id]
}

const clearSelection = () => { selectedIds.value = []; bulkMovePickerOpen.value = false; selectionMode.value = false }

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

const changePageSize = async (size: number) => {
  pageSize.value = size
  page.value = 1
  await search()
}

const jumpToPage = async () => {
  const n = Number(pageJump.value)
  if (!Number.isFinite(n)) return
  await changePage(n)
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
    ElMessage.success('上传成功，已跳到最新图片')
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
  movePickerOpen.value = false
  moveDialogVisible.value = true
  closeActionPanel()
}

const closeMoveDialog = () => {
  moveDialogVisible.value = false
  movePickerOpen.value = false
}

const selectMoveAlbum = (album: any) => {
  moveToAlbumId.value = album.id
  movePickerOpen.value = false
}

const selectBulkMoveAlbum = (album: any) => {
  bulkMoveToAlbumId.value = album.id
  bulkMovePickerOpen.value = false
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
    ElMessage.success('已批量放入回收站')
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

<style scoped>
.panel-card { @apply rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm; }
.panel-empty { @apply rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm; }
.panel-mini { @apply rounded-2xl bg-slate-50 p-4; }
.label { @apply text-xs text-slate-500 mb-1; }
.value { @apply text-sm font-medium text-slate-800; }
.action-mini-btn {
  height: 34px;
  border-radius: 999px;
  background: rgba(255,255,255,.94);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226,232,240,.92);
  font-size: 11px;
  font-weight: 600;
  color: #334155;
  box-shadow: 0 4px 10px rgba(15,23,42,.06);
}

.photos-toolbar-grid > *{min-width:0;}
.photos-toolbar-grid button,.photos-toolbar-grid input{box-sizing:border-box;}
</style>
