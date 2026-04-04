<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 font-sans">
    <header class="sticky top-0 z-50 bg-white/85 backdrop-blur-2xl border-b border-slate-200/70">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div class="text-lg font-bold tracking-tight">公开相册</div>
            <div class="text-xs text-slate-500">Telegram 图库瀑布流</div>
          </div>
        </div>
        <a href="#/login" class="rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-100 hover:text-slate-800 transition">管理入口</a>
      </div>
    </header>

    <main class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <section class="rounded-[32px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white p-6 shadow-2xl shadow-blue-500/20 overflow-hidden relative">
        <div class="relative z-10">
          <div class="text-2xl md:text-4xl font-bold tracking-tight">公开相册照片流</div>
          <div class="text-white/85 mt-2 text-sm md:text-base">直接展示所有公开相册中的照片，按时间倒序瀑布流展示。</div>
        </div>
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
      </section>

      <section class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          @click="selectAlbum(null)"
          :class="['px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all', currentAlbumId === null ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600']"
        >
          全部公开图片
        </button>
        <button
          v-for="album in albums"
          :key="album.id"
          @click="selectAlbum(album.id)"
          :class="['px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all', currentAlbumId === album.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600']"
        >
          {{ album.name }}
        </button>
      </section>

      <section v-if="photos.length === 0" class="rounded-[28px] border border-slate-200 bg-white shadow-sm py-20 text-center">
        <div class="text-7xl mb-4">📷</div>
        <div class="text-slate-500">暂无公开图片</div>
      </section>

      <section v-else>
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="rounded-[28px] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200 cursor-pointer"
            @click="preview(photo)"
          >
            <div class="aspect-[3/4] overflow-hidden bg-slate-100">
              <img :src="`/api/photos/file/${photo.id}`" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="previewVisible" class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md" @click="closePreview">
      <button @click="closePreview" class="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-10 hover:bg-white/30 transition">
        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="h-full flex items-center justify-center p-4">
        <img :src="previewUrl" class="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" @click.stop />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'

const photos = ref<any[]>([])
const previewVisible = ref(false)
const previewUrl = ref('')

const preview = (photo: any) => {
  previewUrl.value = `/api/photos/file/${photo.id}`
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  previewUrl.value = ''
}

onMounted(async () => {
  await loadPhotos()
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
