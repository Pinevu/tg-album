<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">图片管理</h1>
        <p class="text-slate-500 mt-1">图片先进入 Telegram 存储池，再保存到 D1，可按相册归档与批量操作。</p>
      </div>
      <div class="text-sm text-slate-500">
        已选中 <span class="font-semibold text-blue-600">{{ selectedIds.length }}</span> 张
      </div>
    </div>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <!-- 左侧上传区 -->
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div>
          <div class="text-sm font-semibold text-slate-700 mb-3">相册树</div>
          <el-tree :data="albums" @node-click="onAlbumClick" />
        </div>

        <div class="flex gap-2 flex-wrap">
          <el-button v-if="currentAlbumId && selectedIds.length === 1" @click="setCover" size="small">设为封面</el-button>
        </div>

        <div class="rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-4 space-y-4">
          <div>
            <div class="text-sm font-semibold text-blue-700">上传到 TG 存储池</div>
            <div class="text-xs text-blue-600 mt-1">选择目标相册与备注，上传后会自动写入 D1。</div>
          </div>

          <el-select v-model="uploadAlbumId" placeholder="选择目标相册" size="small">
            <el-option v-for="album in flatAlbums" :key="album.id" :label="album.name" :value="album.id" />
          </el-select>

          <el-input v-model="uploadRemark" placeholder="上传备注" size="small" />

          <el-upload drag :http-request="handleUpload" :show-file-list="false" class="w-full">
            <div class="px-4 py-4 text-center text-slate-700 text-sm">点击或拖拽上传图片</div>
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

      <!-- 右侧图片列表 -->
      <div class="space-y-4">
        <!-- 搜索栏 -->
        <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3 items-center">
          <el-date-picker v-model="range" type="daterange" size="small" />
          <el-select v-model="tag" placeholder="标签" filterable class="w-40" size="small">
            <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
          <el-input v-model="keyword" placeholder="文件名 / 备注关键词" class="w-full md:w-64" size="small" />
          <el-button @click="search" size="small">搜索</el-button>
        </div>

        <!-- 批量操作栏 -->
        <div v-if="selectedIds.length" class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-2 items-center">
          <el-input v-model="tagInput" placeholder="批量标签（逗号分隔）" class="w-full md:w-60" size="small" />
          <el-button @click="applyTags" size="small">打标签</el-button>
          <el-input-number v-model="moveAlbumId" placeholder="目标相册ID" size="small" />
          <el-button @click="move" size="small">批量移动</el-button>
          <el-button type="danger" @click="toRecycle" size="small">放入回收站</el-button>
        </div>

        <!-- iOS 风格小图网格 -->
        <div v-if="photos.length === 0" class="text-center py-16">
          <div class="text-6xl mb-4">📷</div>
          <div class="text-slate-500">暂无图片</div>
        </div>

        <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-xl hover:border-blue-300"
            :class="selectedIds.includes(photo.id)
              ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg shadow-blue-100'
              : ''"
            @click="toggleSelect(photo.id)"
          >
            <!-- 小图预览 (64x64) -->
            <img :src="photo.previewUrl" class="w-16 h-16 object-cover" />

            <!-- 选中状态标记 -->
            <div v-if="selectedIds.includes(photo.id)" class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-md">
              ✓
            </div>

            <!-- 图片信息：按钮在右边 -->
            <div class="absolute top-0 right-0 bottom-0 left-16 flex flex-col justify-between p-1.5">
              <!-- 4个方型按钮 -->
              <div class="flex gap-0.5">
                <el-button size="mini" @click.stop="openDetail(photo.id)" class="!rounded-md !w-8 !px-1.5 !py-0.5 !text-[10px]">详情</el-button>
                <el-button size="mini" @click.stop="openMoveDialog(photo.id)" class="!rounded-md !w-8 !px-1.5 !py-0.5 !text-[10px]">移动</el-button>
                <el-button size="mini" type="danger" @click.stop="deletePhoto(photo.id)" class="!rounded-md !w-8 !px-1.5 !py-0.5 !text-[10px]">删除</el-button>
                <el-button size="mini" @click.stop="copyDirectLink(photo.id)" class="!rounded-md !w-8 !px-1.5 !py-0.5 !text-[10px]">直链</el-button>
              </div>

              <!-- 文件名（小字） -->
              <div>
                <div class="text-[10px] font-medium text-slate-800 line-clamp-1">{{ photo.original_filename || '未命名图片' }}</div>
                <div class="text-[9px] text-slate-500 mt-0.25">{{ photo.camera_model || '未知设备' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动图片对话框 -->
    <el-dialog v-model="moveDialogVisible" title="移动图片" width="400px" class="!rounded-3xl">
      <el-select v-model="moveToAlbumId" placeholder="选择目标相册" class="w-full" size="large">
        <el-option v-for="album in flatAlbums" :key="album.id" :label="album.name" :value="album.id" />
      </el-select>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMove" :loading="moving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px" class="!rounded-3xl">
      <div class="text-slate-600">确定要删除这张图片吗？此操作不可恢复。</div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">删除</el-button>
      </template>
    </el-dialog>

    <!-- 图片详情抽屉（大图预览） -->
    <el-drawer v-model="detailVisible" size="90%" :with-header="true" title="图片详情" class="!rounded-3xl">
      <div v-if="detail" class="space-y-5 max-w-2xl mx-auto">
        <!-- 大图展示 -->
        <div class="rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
          <img :src="`/api/photos/file/${detail.id}`" class="w-full rounded-2xl" />
        </div>

        <!-- iOS 风格信息卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-2xl bg-slate-50 p-4">
            <div class="text-xs text-slate-500 mb-1">文件名</div>
            <div class="text-sm font-medium text-slate-800 break-all">{{ detail.original_filename }}</div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <div class="text-xs text-slate-500 mb-1">尺寸</div>
            <div class="text-sm font-medium text-slate-800">{{ detail.width }} x {{ detail.height }}</div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <div class="text-xs text-slate-500 mb-1">主色</div>
            <div class="text-sm font-medium text-slate-800">{{ detail.dominant_color_hex || '未提取' }}</div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <div class="text-xs text-slate-500 mb-1">拍摄设备</div>
            <div class="text-sm font-medium text-slate-800">{{ detail.camera_model || '未知' }}</div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 md:col-span-2">
            <div class="text-xs text-slate-500 mb-1">TG file_id</div>
            <div class="text-xs font-mono text-slate-700 break-all">{{ detail.tg_file_id || '-' }}</div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 md:col-span-2">
            <div class="text-xs text-slate-500 mb-1">TG unique_id</div>
            <div class="text-xs font-mono text-slate-700 break-all">{{ detail.tg_file_unique_id || '-' }}</div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-2">
          <el-button @click="copyDirectLink(detail.id)" type="primary" size="large" class="!rounded-full !px-6">复制图片直链</el-button>
        </div>

        <!-- 备注输入 -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4">
          <div class="text-sm font-medium text-slate-800 mb-2">备注</div>
          <el-input v-model="detailRemark" placeholder="添加备注" class="mb-2" />
          <el-button @click="saveRemark" size="large" class="!rounded-full !w-full">保存备注</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

const flatten = (nodes: any[]): any[] => nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])])
const flatAlbums = computed(() => flatten(albums.value))

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
  const url = `${location.origin}/api/photos/file/${id}`
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
    const { data } = await api.post('/upload', form, {
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
    if (data?.id) {
      const el = document.querySelectorAll('[data-photo-id]')[0] as HTMLElement | undefined
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  } catch (e: any) {
    item.status = 'error'
    message.value = e?.response?.data?.error || '图片上传失败'
    messageType.value = 'error'
    ElMessage.error(message.value)
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
  moveToAlbumId.value = undefined
  moveDialogVisible.value = true
}

const confirmMove = async () => {
  if (!moveToAlbumId.value) {
    ElMessage.warning('请选择目标相册')
    return
  }
  moving.value = true
  try {
    await api.put(`/photos/${id}/move`, { album_id: moveToAlbumId.value })
    ElMessage.success('移动成功')
    moveDialogVisible.value = false
    await search()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '移动失败')
  } finally {
    moving.value = false
  }
}

const deletePhoto = (id: number) => {
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await api.delete(`/photos/${id}`)
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    await search()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '删除失败')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadAlbums()
  loadTags()
  search()
})
</script>
