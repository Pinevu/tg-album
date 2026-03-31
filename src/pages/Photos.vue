<template>
  <div class="flex gap-4">
    <el-tree class="w-64 bg-white/5 p-3 rounded" :data="albums" @node-click="onAlbumClick" />

    <div class="flex-1">
      <div class="flex gap-3 mb-4">
        <el-date-picker v-model="range" type="daterange" />
        <el-select v-model="tag" placeholder="标签" filterable>
          <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
        </el-select>
        <el-input v-model="keyword" placeholder="关键词" />
        <el-button @click="search">搜索</el-button>

        <el-upload drag :http-request="handleUpload" :show-file-list="false">
          <i class="el-icon-upload" />
          <div>拖拽上传</div>
        </el-upload>
      </div>

      <div v-if="selectedIds.length" class="mb-4 flex gap-2">
        <el-input v-model="tagInput" placeholder="批量标签(逗号分隔)" />
        <el-button @click="applyTags">打标签</el-button>
        <el-input-number v-model="moveAlbumId" placeholder="目标相册ID" />
        <el-button @click="move">批量移动</el-button>
        <el-button type="danger" @click="toRecycle">放入回收站</el-button>
      </div>

      <div ref="gridRef" class="masonry-grid">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="masonry-item relative group"
          :class="{ 'ring-2 ring-blue-400': selectedIds.includes(photo.id) }"
          @click="toggleSelect(photo.id)"
        >
          <img :src="photo.previewUrl" class="rounded w-full" @click.stop="openDetail(photo.id)" />

          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition p-2 text-xs">
            <div>{{ photo.camera_model }}</div>
            <div>{{ photo.aperture }}</div>
            <el-button size="small" @click.stop="openDetail(photo.id)">详情</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-drawer v-model="detailVisible" size="40%" title="Photo Detail">
    <div v-if="detail">
      <img :src="`/api/photos/file/${detail.id}`" class="rounded mb-4 w-full" />
      <div class="text-sm space-y-1">
        <div>文件名: {{ detail.original_filename }}</div>
        <div>尺寸: {{ detail.width }}x{{ detail.height }}</div>
        <div>主色: {{ detail.dominant_color_hex }}</div>
        <div>拍摄设备: {{ detail.camera_model }}</div>
        <div>光圈: {{ detail.aperture }}</div>
        <div>快门: {{ detail.shutter_speed }}</div>
        <div>ISO: {{ detail.iso }}</div>
        <div>焦距: {{ detail.focal_length }}</div>
      </div>
      <el-input v-model="detailRemark" placeholder="备注" class="mt-4" />
      <el-button class="mt-2" @click="saveRemark">保存备注</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import Masonry from 'masonry-layout'
import imagesLoaded from 'imagesloaded'
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
const gridRef = ref<HTMLElement | null>(null)
let masonry: Masonry | null = null

const detailVisible = ref(false)
const detail = ref<any>(null)
const detailRemark = ref('')
const currentAlbumId = ref<number | null>(null)

const toggleSelect = (id: number) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value.push(id)
  }
}

const initMasonry = async () => {
  await nextTick()
  if (!gridRef.value) return
  imagesLoaded(gridRef.value, () => {
    masonry = new Masonry(gridRef.value!, {
      itemSelector: '.masonry-item',
      columnWidth: '.masonry-item',
      percentPosition: true
    })
  })
}

const search = async () => {
  const params: any = {}
  if (tag.value) params.tag = tag.value
  if (keyword.value) params.keyword = keyword.value
  if (range.value?.[0]) params.date_start = Math.floor(range.value[0].getTime() / 1000)
  if (range.value?.[1]) params.date_end = Math.floor(range.value[1].getTime() / 1000)
  if (currentAlbumId.value) params.album_id = currentAlbumId.value

  const { data } = await searchPhotos(params)
  photos.value = (data.results || data).map((p: any) => ({
    ...p,
    previewUrl: `/api/photos/file/${p.id}`
  }))
  initMasonry()
}

const loadAlbums = async () => {
  const { data } = await getAlbumTree()
  albums.value = data.results || data
}

const loadTags = async () => {
  const { data } = await listTags()
  tags.value = data.results || data
}

const onAlbumClick = (node: any) => {
  currentAlbumId.value = node.id
  search()
}

const applyTags = async () => {
  const ts = tagInput.value.split(',').map(t => t.trim()).filter(Boolean)
  if (!ts.length) return
  await batchTag(selectedIds.value, ts)
  tagInput.value = ''
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
  if (exif.camera_make) form.append('camera_make', exif.camera_make)
  if (exif.camera_model) form.append('camera_model', exif.camera_model)
  if (exif.lens) form.append('lens', exif.lens)
  if (exif.aperture) form.append('aperture', exif.aperture)
  if (exif.shutter_speed) form.append('shutter_speed', exif.shutter_speed)
  if (exif.iso) form.append('iso', String(exif.iso))
  if (exif.focal_length) form.append('focal_length', exif.focal_length)
  if (exif.gps_lat) form.append('gps_lat', String(exif.gps_lat))
  if (exif.gps_lng) form.append('gps_lng', String(exif.gps_lng))
  if (exif.taken_at) form.append('taken_at', String(exif.taken_at))

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

<style scoped>
.masonry-grid { column-count: 4; column-gap: 16px; }
.masonry-item { break-inside: avoid; margin-bottom: 16px; }
@media (max-width: 1200px) { .masonry-grid { column-count: 3; } }
@media (max-width: 900px) { .masonry-grid { column-count: 2; } }
@media (max-width: 640px) { .masonry-grid { column-count: 1; } }
</style>
