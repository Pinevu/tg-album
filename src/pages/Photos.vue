<template>
  <div class="space-y-5 rounded-[32px] bg-white/82 backdrop-blur-md border border-slate-200/80 shadow-sm p-4 md:p-5">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">图片管理</h1>
      </div>
      <div class="text-sm text-slate-500 rounded-2xl bg-white border border-slate-200 px-4 py-2 shadow-sm">
        已选中 <span class="font-semibold text-blue-600">{{ selectedIds.length }}</span> 张
      </div>
    </div>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <div class="panel-card bg-white/96 space-y-4">
      <div class="text-sm font-semibold text-slate-700">上传</div>
      <div class="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-center">
        <el-select v-model="uploadAlbumId" placeholder="选择目标相册" size="small" class="w-full">
          <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
        </el-select>
        <el-input v-model="uploadRemark" placeholder="备注" size="small" />
        <el-upload drag multiple :http-request="handleUpload" :show-file-list="false" class="w-full md:w-56">
          <div class="px-4 py-4 text-center text-slate-700 text-sm">点击或拖拽上传</div>
        </el-upload>
      </div>
      <div v-if="uploadQueue.length" class="grid grid-cols-4 md:grid-cols-6 gap-2">
        <div v-for="item in uploadQueue" :key="item.id" class="rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <img :src="item.url" class="w-full h-16 object-cover rounded-xl" />
          <el-progress :percentage="item.progress" :stroke-width="5" :show-text="false" class="mt-2" />
        </div>
      </div>
    </div>

    <div class="panel-card bg-white/96 flex flex-wrap gap-3 items-center">
      <el-select v-model="currentAlbumId" placeholder="相册" class="w-36" size="small" clearable @change="search">
        <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
      </el-select>
      <el-select v-model="tag" placeholder="标签" filterable class="w-32" size="small">
        <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
      </el-select>
      <el-input v-model="keyword" placeholder="文件名 / 备注" class="w-full md:w-64" size="small" />
      <el-button @click="search" size="small" type="primary">搜索</el-button>
    </div>

    <div v-if="selectedIds.length" class="panel-card bg-white/96 flex flex-wrap gap-2 items-center">
      <el-select v-model="moveAlbumId" placeholder="移动到相册" class="w-40" size="small">
        <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
      </el-select>
      <el-button @click="moveSelected" size="small">批量移动</el-button>
      <el-button type="danger" @click="toRecycle" size="small">批量删除</el-button>
    </div>

    <div v-if="photos.length === 0" class="panel-empty">暂无图片</div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
      <article
        v-for="photo in photos"
        :key="photo.id"
        class="panel-card bg-white/96 cursor-pointer photo-card"
        :class="selectedIds.includes(photo.id) ? 'ring-2 ring-blue-200 border-blue-400' : ''"
        @click="openActionPanel(photo)"
      >
        <img :src="photo.previewUrl" class="w-full aspect-[4/5] object-cover rounded-xl" />
        <div v-if="photo.album_name" class="mt-2 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">相册:{{ photo.album_name }}</div>
      </article>
    </div>

    <Teleport to="body">
      <div v-if="actionPanelVisible && actionPhoto" class="fixed inset-0 z-[10010] pointer-events-none">
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] max-w-[86vw] rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4 pointer-events-auto">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[18px] font-semibold text-slate-900 tracking-tight">图片操作</div>
            <button type="button" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-xl leading-none flex items-center justify-center" @click="closeActionPanel">×</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" @click="openDetail(actionPhoto.id)" class="action-btn action-neutral">详情</button>
            <button type="button" @click="openMoveDialog(actionPhoto.id)" class="action-btn action-blue">移动</button>
            <button type="button" @click="deletePhoto(actionPhoto.id)" class="action-btn action-red">删除</button>
            <button type="button" @click="copyDirectLink(actionPhoto)" class="action-btn action-green">直链</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="moveDialogVisible" class="fixed inset-0 z-[10020] pointer-events-none">
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] max-w-[88vw] rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4 pointer-events-auto">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[18px] font-semibold text-slate-900 tracking-tight">移动图片</div>
            <button type="button" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-xl leading-none flex items-center justify-center" @click="moveDialogVisible = false">×</button>
          </div>
          <el-select v-model="moveToAlbumId" placeholder="选择目标相册" class="w-full" size="default" teleported :teleported="true" popper-class="move-album-popper" placement="bottom-start">
            <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
          </el-select>
          <div class="grid grid-cols-2 gap-2 mt-4">
            <el-button @click="moveDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmMove" :loading="moving">确定</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="deleteDialogVisible" class="fixed inset-0 z-[9999] pointer-events-none">
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] max-w-[88vw] rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4 pointer-events-auto">
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
      <div v-if="detailVisible && detail" class="fixed inset-0 z-[9999] pointer-events-none">
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[92vw] max-h-[82vh] overflow-auto rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4 pointer-events-auto">
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
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { searchPhotos, getAlbums, batchMove, batchDelete, uploadPhoto, listTags, getPhotoDetail } from '@/utils/api'
import { extractExif, dominantColorHex } from '@/utils/exif'

const albums = ref<any[]>([])
const photos = ref<any[]>([])
const tags = ref<any[]>([])
const selectedIds = ref<number[]>([])
const currentAlbumId = ref<number | undefined>()
const moveAlbumId = ref<number | undefined>()
const tag = ref('')
const keyword = ref('')
const uploadAlbumId = ref<number | undefined>()
const uploadRemark = ref('')
const uploadQueue = ref<any[]>([])
const detailVisible = ref(false)
const detail = ref<any>(null)
const moveDialogVisible = ref(false)
const moveToAlbumId = ref<number | undefined>()
const deleteDialogVisible = ref(false)
const moving = ref(false)
const deleting = ref(false)
const activeMoveId = ref<number | null>(null)
const activeDeleteId = ref<number | null>(null)
const actionPanelVisible = ref(false)
const actionPhoto = ref<any>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const openActionPanel = (photo: any) => {
  actionPhoto.value = photo
  actionPanelVisible.value = true
}

const closeActionPanel = () => {
  actionPanelVisible.value = false
  actionPhoto.value = null
}

const loadAlbums = async () => {
  const { data } = await getAlbums()
  albums.value = data.results || []
  if (!uploadAlbumId.value && albums.value.length) uploadAlbumId.value = albums.value[0].id
}

const loadTags = async () => {
  const { data } = await listTags()
  tags.value = data.results || []
}

const search = async () => {
  const params: any = {}
  if (currentAlbumId.value) params.album_id = currentAlbumId.value
  if (tag.value) params.tag = tag.value
  if (keyword.value) params.keyword = keyword.value
  const { data } = await searchPhotos(params)
  photos.value = (data.results || []).map((p: any) => ({ ...p, previewUrl: `/api/photos/file/${p.id}` }))
}

const moveSelected = async () => {
  if (!moveAlbumId.value || !selectedIds.value.length) return
  await batchMove(selectedIds.value, moveAlbumId.value)
  selectedIds.value = []
  await search()
  ElMessage.success('已移动')
}

const toRecycle = async () => {
  if (!selectedIds.value.length) return
  await batchDelete(selectedIds.value)
  selectedIds.value = []
  await search()
  ElMessage.success('已删除')
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
    await uploadPhoto(form)
    item.progress = 100
    uploadRemark.value = ''
    await search()
    ElMessage.success('上传成功')
  } catch {
    message.value = '上传失败'
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

const confirmMove = async () => {
  if (!moveToAlbumId.value || !activeMoveId.value) return ElMessage.warning('请选择目标相册')
  moving.value = true
  try {
    await batchMove([activeMoveId.value], moveToAlbumId.value)
    moveDialogVisible.value = false
    activeMoveId.value = null
    await search()
    ElMessage.success('移动成功')
  } finally {
    moving.value = false
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
  await loadAlbums()
  await loadTags()
  await search()
})
</script>

<style scoped>
.panel-card { @apply rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm; }
.panel-empty { @apply rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm; }
.panel-mini { @apply rounded-2xl bg-slate-50 p-4; }
.label { @apply text-xs text-slate-500 mb-1; }
.value { @apply text-sm font-medium text-slate-800; }
.action-btn {
  width: 100%;
  height: 32px;
  min-height: 32px;
  border-radius: 10px;
  border: 1px solid #dbe3ef;
  font-size: 12px;
  font-weight: 600;
  line-height: 30px;
  text-align: center;
  background: #ffffff;
  color: #334155;
}
.action-neutral { color: #334155; }
.action-blue { color: #2563eb; }
.action-red { color: #e11d48; }
.action-green { color: #059669; }
.move-album-popper{z-index:12000 !important;}
</style>
