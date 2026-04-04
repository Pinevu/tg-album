<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
    <!-- iOS 风格顶部导航 -->
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div>
          <div class="text-lg font-bold">相册系统</div>
          <div class="text-xs text-slate-500">iOS 风格相册展示</div>
        </div>
      </div>
      <a href="#/login" class="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow-lg shadow-blue-500/30">管理入口</a>
    </header>

    <!-- iOS 风格内容区 -->
    <main class="max-w-7xl mx-auto p-4 space-y-6">
      <!-- 欢迎卡片 -->
      <div class="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-2xl shadow-blue-500/20">
        <div class="text-2xl md:text-3xl font-bold mb-2">公开相册</div>
        <div class="text-white/90 text-sm md:text-base">浏览相册封面，点击进入相册</div>
      </div>

      <!-- iOS 风格标签栏 -->
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button @click="selectAlbum(null)" :class="['px-4 py-2.5 rounded-full text-sm font-semibold transition-all', currentAlbumId === null ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300']">
          全部相册
        </button>
        <button v-for="album in albums" :key="album.id" @click="selectAlbum(album.id)" :class="['px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap', currentAlbumId === album.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300']">
          {{ album.name }}
        </button>
      </div>

      <!-- iOS 风格相册封面卡片流 -->
      <div v-if="albums.length === 0" class="text-center py-20">
        <div class="text-8xl mb-6 opacity-20">📷</div>
        <div class="text-slate-400 text-lg font-medium">暂无相册</div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="album in filteredAlbums"
          :key="album.id"
          @click="openAlbum(album)"
          class="group relative rounded-3xl overflow-hidden cursor-pointer bg-white border-2 border-slate-200 shadow-md hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1"
        >
          <!-- 相册封面 -->
          <div class="aspect-[3/4] overflow-hidden bg-slate-100 relative">
            <img
              v-if="album.cover_photo"
              :src="`/api/photos/file/${album.cover_photo.id}`"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <svg class="w-20 h-20 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>

            <!-- iOS 风格右滑提示 -->
            <div class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>

          <!-- 相册信息 -->
          <div class="p-5 space-y-3">
            <div class="font-bold text-slate-800 text-sm truncate">{{ album.name }}</div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
              {{ album.photo_count || 0 }} 张照片
            </div>
          </div>
        </div>
      </div>

      <!-- iOS 风格相册照片瀑布流 -->
      <div v-if="currentAlbumId && albumPhotos.length > 0" class="space-y-6 pt-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">{{ currentAlbum?.name }}</h2>
            <p class="text-sm text-slate-500 mt-1">{{ albumPhotos.length }} 张照片</p>
          </div>
        </div>

        <!-- iOS 风格照片瀑布流 -->
        <div class="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 [column-fill:_balance]">
          <div
            v-for="photo in albumPhotos"
            :key="photo.id"
            @click="preview(photo)"
            class="mb-4 break-inside-avoid rounded-2xl overflow-hidden cursor-pointer bg-white border-2 border-slate-200 shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-200"
          >
            <img :src="`/api/photos/file/${photo.id}`" class="w-full block" />
          </div>
        </div>
      </div>
    </main>

    <!-- iOS 风格图片预览 Modal -->
    <div v-if="previewVisible" class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md" @click="closePreview">
      <!-- 关闭按钮 -->
      <button @click="closePreview" class="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-10 transition-all duration-300 hover:bg-white/30">
        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <!-- 图片容器 -->
      <div class="h-full flex items-center justify-center p-4">
        <img :src="previewUrl" class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" @click.stop />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const albums = ref<any[]>([])
const albumPhotos = ref<any[]>([])
const currentAlbumId = ref<number | null>(null)
const currentAlbum = ref<any>(null)
const previewVisible = ref(false)
const previewUrl = ref('')
const previewPhoto = ref<any>(null)

const filteredAlbums = computed(() => {
  if (!currentAlbumId.value) return albums.value
  return albums.value.filter(a => a.id === currentAlbumId.value)
})

const loadAlbums = async () => {
  try {
    const { data } = await axios.get('/api/public/albums')
    albums.value = data.results || []
  } catch (error) {
    console.error('加载相册失败:', error)
  }
}

const loadAlbumPhotos = async (albumId: number) => {
  try {
    const { data } = await axios.get('/api/public/photos', { params: { album_id: albumId } })
    albumPhotos.value = data.results || []
  } catch (error) {
    console.error('加载相册照片失败:', error)
  }
}

const selectAlbum = (id: number | null) => {
  currentAlbumId.value = id
  if (id) {
    currentAlbum.value = albums.value.find(a => a.id === id)
    loadAlbumPhotos(id)
  } else {
    albumPhotos.value = []
  }
}

const openAlbum = (album: any) => {
  currentAlbumId.value = album.id
  currentAlbum.value = album
  loadAlbumPhotos(album.id)
}

const preview = (photo: any) => {
  previewPhoto.value = photo
  previewUrl.value = `/api/photos/file/${photo.id}`
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  setTimeout(() => {
    previewUrl.value = ''
    previewPhoto.value = null
  }, 300)
}

onMounted(async () => {
  await loadAlbums()
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
