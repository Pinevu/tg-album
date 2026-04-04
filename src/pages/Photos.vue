<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">图片管理</h1>
        <p class="text-white/60 mt-1">支持相册树、关键词、标签、时间范围和批量操作</p>
      </div>
      <el-upload drag :http-request="handleUpload" :show-file-list="false" class="upload-card">
        <div class="px-4 py-6 text-center">拖拽上传</div>
      </el-upload>
    </div>

    <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4 flex flex-wrap gap-3 items-center">
      <el-date-picker v-model="range" type="daterange" />
      <el-select v-model="tag" placeholder="标签" filterable class="w-40">
        <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
      </el-select>
      <el-input v-model="keyword" placeholder="关键词" class="w-56" />
      <el-button @click="search">搜索</el-button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4">
        <el-tree :data="albums" @node-click="onAlbumClick" />
      </div>

      <div class="space-y-4">
        <div v-if="selectedIds.length" class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4 flex flex-wrap gap-2 items-center">
          <el-input v-model="tagInput" placeholder="批量标签（逗号分隔）" class="w-60" />
          <el-button @click="applyTags">打标签</el-button>
          <el-input-number v-model="moveAlbumId" placeholder="目标相册ID" />
          <el-button @click="move">批量移动</el-button>
          <el-button type="danger" @click="toRecycle">放入回收站</el-button>
        </div>

        <div class="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
          <div v-for="photo in photos" :key="photo.id" class="mb-4 break-inside-avoid relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5" @click="toggleSelect(photo.id)">
            <img :src="photo.previewUrl" class="w-full block" />
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition p-3 flex flex-col justify-between">
              <div class="text-xs">
                <div>{{ photo.original_filename }}</div>
                <div>{{ photo.camera_model }}</div>
              </div>
              <div class="flex gap-2">
                <el-button size="small" @click.stop="openDetail(photo.id)">详情</el-button>
              </div>
            </div>
            <div v-if="selectedIds.includes(photo.id)" class="absolute top-2 right-2 rounded-full bg-blue-500 text-white w-6 h-6 flex items-center justify-center text-xs">✓</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-drawer v-model="detailVisible" size="40%" title="图片详情">
    <div v-if="detail" class="space-y-4">
      <img :src="`/api/photos/file/${detail.id}`" class="rounded-xl w-full" />
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>文件名：{{ detail.original_filename }}</div>
        <div>尺寸：{{ detail.width }}x{{ detail.height }}</div>
        <div>主色：{{ detail.dominant_color_hex }}</div>
        <div>拍摄设备：{{ detail.camera_model }}</div>
      </div>
      <el-input v-model="detailRemark" placeholder="备注" />
      <el-button @click="saveRemark">保存备注</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { searchPhotos, getAlbumTree, batchMove, batchDelete, batchTag, uploadPhoto, listTags, getPhotoDetail, updatePhotoRemark } from '@/utils/api'
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

const handleUpload = async (options: any) => {
  const file: File = options.file
  const form = new FormData()
  form.append('file', file)
  form.append('original_filename', file.name)
  if (currentAlbumId.value) form.append('album_id', String(currentAlbumId.value))
  const exif = await extractExif(file)
  const color = await dominantColorHex(file)
  if (color) form.append('dominant_color_hex', color)
  if (exif.raw_exif_json) form.append('exif_json', exif.raw_exif_json)
  await uploadPhoto(form)
  await search()
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
}

onMounted(() => {
  loadAlbums()
  loadTags()
  search()
})
</script>
