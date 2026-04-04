<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-xl font-bold">相册系统</div>
        <div class="text-xs text-slate-500">公开相册展示页</div>
      </div>
      <a href="#/login" class="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm">管理入口</a>
    </header>

    <main class="max-w-6xl mx-auto p-4 space-y-5">
      <div class="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 shadow-lg">
        <div class="text-2xl md:text-3xl font-bold">公开相册</div>
        <div class="text-white/80 mt-2 text-sm md:text-base">展示已公开的相册图片内容</div>
      </div>

      <div class="overflow-x-auto no-scrollbar">
        <div class="flex gap-2 min-w-max">
          <button class="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm" @click="selectAlbum(null)">全部</button>
          <button v-for="album in albums" :key="album.id" class="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm" @click="selectAlbum(album.id)">
            {{ album.name }}
          </button>
        </div>
      </div>

      <div class="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
        <div v-for="photo in photos" :key="photo.id" class="mb-4 break-inside-avoid rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm cursor-pointer" @click="preview(photo)">
          <img :src="`/api/photos/file/${photo.id}`" class="w-full block" />
          <div class="p-3">
            <div class="font-medium line-clamp-1">{{ photo.original_filename || '未命名图片' }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ photo.remark || '公开相册内容' }}</div>
          </div>
        </div>
      </div>
    </main>

    <el-dialog v-model="previewVisible" width="95%" top="4vh">
      <img v-if="previewPhoto" :src="`/api/photos/file/${previewPhoto.id}`" class="w-full rounded-2xl" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const albums = ref<any[]>([])
const photos = ref<any[]>([])
const currentAlbumId = ref<number | null>(null)
const previewVisible = ref(false)
const previewPhoto = ref<any>(null)

const loadAlbums = async () => {
  const { data } = await axios.get('/api/public/albums')
  albums.value = data.results || []
}

const loadPhotos = async () => {
  const params: any = {}
  if (currentAlbumId.value) params.album_id = currentAlbumId.value
  const { data } = await axios.get('/api/public/photos', { params })
  photos.value = data.results || []
}

const selectAlbum = (id: number | null) => {
  currentAlbumId.value = id
  loadPhotos()
}

const preview = (photo: any) => {
  previewPhoto.value = photo
  previewVisible.value = true
}

onMounted(async () => {
  await loadAlbums()
  await loadPhotos()
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
