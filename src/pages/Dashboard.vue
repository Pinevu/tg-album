<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-3">
      <button @click="go('/admin/photos')" class="stat-card">
        <div class="stat-label">📷 照片</div>
        <div class="stat-value">{{ stats.totalPhotos }}</div>
      </button>
      <button @click="go('/admin/albums')" class="stat-card">
        <div class="stat-label">🗂 相册</div>
        <div class="stat-value">{{ stats.totalAlbums }}</div>
      </button>
      <button @click="go('/admin/recycle')" class="stat-card">
        <div class="stat-label">🗑 回收站</div>
        <div class="stat-value">{{ stats.totalDeleted }}</div>
      </button>
      <button @click="go('/admin/pools')" class="stat-card">
        <div class="stat-label">☁️ 存储</div>
        <div class="stat-value">{{ stats.totalPools }}</div>
      </button>
    </div>

    <div class="rounded-[22px] border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
      <span class="text-sm text-slate-500">数据概览</span>
      <el-button size="small" @click="load">刷新</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'

const router = useRouter()
const stats = ref({ totalPhotos: 0, totalAlbums: 0, totalDeleted: 0, totalPools: 0 })

const load = async () => {
  const { data } = await api.get('/stats')
  stats.value = data
}

const go = (path: string) => router.push(path)
onMounted(load)
</script>

<style scoped>
.stat-card {
  @apply rounded-[22px] border border-slate-200 bg-white p-5 text-left
         hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98];
}
.stat-label { @apply text-slate-400 text-xs mb-2; }
.stat-value  { @apply text-4xl font-semibold text-slate-900; }
</style>
