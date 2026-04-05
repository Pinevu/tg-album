<template>
  <div class="space-y-6 rounded-[36px] bg-white/88 backdrop-blur-md border border-slate-200/80 shadow-sm p-4 md:p-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">图片管理</h1>
      </div>
      <div class="text-sm text-slate-500 rounded-2xl bg-white border border-slate-200 px-4 py-2 shadow-sm">
        已选中 <span class="font-semibold text-blue-600">{{ selectedIds.length }}</span> 张
      </div>
    </div>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <div class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 items-start">
      <aside>
        <div class="panel-card space-y-4 bg-white/96">
          <div class="text-sm font-semibold text-slate-700">上传</div>
          <el-select v-model="uploadAlbumId" placeholder="选择目标相册" size="small" class="w-full">
            <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
          </el-select>
          <el-input v-model="uploadRemark" placeholder="备注" size="small" />
          <el-upload drag multiple :http-request="handleUpload" :show-file-list="false" class="w-full">
            <div class="px-4 py-6 text-center text-slate-700 text-sm">点击或拖拽上传图片</div>
          </el-upload>
          <div v-if="uploadQueue.length" class="grid grid-cols-3 gap-2">
            <div v-for="item in uploadQueue" :key="item.id" class="rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <img :src="item.url" class="w-full h-20 object-cover rounded-xl" />
              <div class="mt-2 text-[11px] truncate text-slate-600">{{ item.name }}</div>
              <el-progress :percentage="item.progress" :stroke-width="6" :show-text="false" class="mt-1" />
            </div>
          </div>
        </div>
      </aside>

      <section class="space-y-4">
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
          <article v-for="photo in photos" :key="photo.id" class="panel-card bg-white/96 cursor-pointer photo-card" :class="selectedIds.includes(photo.id) ? 'ring-2 ring-blue-200 border-blue-400' : ''" @click="toggleSelect(photo.id)">
            <img :src="photo.previewUrl" class="w-full aspect-[4/5] object-cover rounded-xl" />
                        <div v-if="photo.album_name" class="text-[11px] text-blue-600 mt-0.5 truncate">相册:{{ photo.album_name }}</div>
            <div class="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" @click.stop="openDetail(photo.id)" class="action-btn action-neutral">详情</button>
              <button type="button" @click.stop="openMoveDialog(photo.id)" class="action-btn action-blue">移动</button>
              <button type="button" @click.stop="deletePhoto(photo.id)" class="action-btn action-red">删除</button>
              <button type="button" @click.stop="copyDirectLink(photo.id)" class="action-btn action-green">直链</button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <el-dialog v-model="moveDialogVisible" title="移动图片" width="360px" class="!rounded-3xl">
      <el-select v-model="moveToAlbumId" placeholder="选择目标相册" class="w-full" size="large">
        <el-option v-for="album in albums" :key="album.id" :label="album.name" :value="album.id" />
      </el-select>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMove" :loading="moving">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="360px" class="!rounded-3xl">
      <div class="text-slate-600">确定删除这张图片？</div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">删除</el-button>
      </template>
    </el-dialog>


    <el-dialog v-model="actionSheetVisible" title="图片操作" width="320px" class="!rounded-3xl">
      <div class="grid grid-cols-2 gap-2">
        <button type="button" @click="openDetail(actionPhotoId!) ; actionSheetVisible=false" class="action-btn action-neutral">详情</button>
        <button type="button" @click="openMoveDialog(actionPhotoId!) ; actionSheetVisible=false" class="action-btn action-blue">移动</button>
        <button type="button" @click="deletePhoto(actionPhotoId!) ; actionSheetVisible=false" class="action-btn action-red">删除</button>
        <button type="button" @click="copyDirectLink(actionPhotoId!) ; actionSheetVisible=false" class="action-btn action-green">直链</button>
      </div>
      <template #footer>
        <el-button @click="actionSheetVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    <el-drawer v-model="detailVisible" size="90%" title="图片详情">
      <div v-if="detail" class="space-y-4 max-w-2xl mx-auto">
        <img :src="`/api/photos/file/${detail.id}`" class="w-full rounded-3xl border border-slate-200" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="panel-mini"><div class="label">文件名</div><div class="value break-all">{{ detail.original_filename }}</div></div>
          <div class="panel-mini"><div class="label">尺寸</div><div class="value">{{ detail.width }} x {{ detail.height }}</div></div>
          <div class="panel-mini"><div class="label">相册</div><div class="value">{{ detail.album_name || '-' }}</div></div>
          <div class="panel-mini"><div class="label">主色</div><div class="value">{{ detail.dominant_color_hex || '-' }}</div></div>
        </div>
        <div>
          <el-input v-model="detailRemark" placeholder="备注" />
          <el-button @click="saveRemark" class="mt-3" type="primary">保存备注</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/axios'
import { searchPhotos, getAlbums, batchMove, batchDelete, uploadPhoto, listTags, getPhotoDetail, updatePhotoRemark } from '@/utils/api'
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
const detailRemark = ref('')
const moveDialogVisible = ref(false)
const moveToAlbumId = ref<number | undefined>()
const deleteDialogVisible = ref(false)
const moving = ref(false)
const deleting = ref(false)
const activeMoveId = ref<number | null>(null)
const activeDeleteId = ref<number | null>(null)
const activeCardId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const toggleSelect = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(i => i !== id)
    : [...selectedIds.value, id]
  actionPhotoId.value = id
  actionSheetVisible.value = true
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

const copyDirectLink = async (id: number) => {
  const photo = photos.value.find((p: any) => p.id === id)
  const rawName = (photo?.original_filename || `photo-${id}.jpg`).split('/').pop() || `photo-${id}.jpg`
  const safeName = rawName.replace(/\s+/g, '_')
  const url = `${location.origin}/api/photos/file/${id}/${encodeURIComponent(safeName)}`
  await navigator.clipboard.writeText(url)
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
  if (!moveToAlbumId.value || !activeMoveId.value) return
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
}

const confirmDelete = async () => {
  if (!activeDeleteId.value) return
  deleting.value = true
  try {
    await batchDelete([activeDeleteId.value])
    deleteDialogVisible.value = false
    activeDeleteId.value = null
    await search()
    ElMessage.success('删除成功')
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
  height: 28px;
  min-height: 28px;
  border-radius: 10px;
  border: 1px solid #dbe3ef;
  font-size: 11px;
  font-weight: 600;
  line-height: 26px;
  text-align: center;
  background: #ffffff;
  color: #334155;
}
.action-neutral { color: #334155; background: #ffffff; border-color: #dbe3ef; }
.action-blue { color: #2563eb; background: #ffffff; border-color: #dbeafe; }
.action-red { color: #e11d48; background: #ffffff; border-color: #fde2e2; }
.action-green { color: #059669; background: #ffffff; border-color: #d1fae5; }
.compact-photo-card { padding: 10px; }
.action-btn { height: 24px; min-height: 24px; border-radius: 9999px; font-size: 10px; line-height: 22px; }
</style>
