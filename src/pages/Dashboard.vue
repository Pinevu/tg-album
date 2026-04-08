<template>
  <div class="space-y-4 rounded-[28px] bg-white/88 backdrop-blur-md border border-slate-200/80 shadow-sm p-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-[12px] font-normal text-slate-500">概述</h1>
      </div>
      <el-button @click="load" type="primary">刷新</el-button>
    </div>

    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <button @click="go('/admin/photos')" class="panel-card text-left">
        <div class="panel-label">照片</div>
        <div class="panel-value">{{ stats.totalPhotos }}</div>
      </button>
      <button @click="go('/admin/albums')" class="panel-card text-left">
        <div class="panel-label">相册</div>
        <div class="panel-value">{{ stats.totalAlbums }}</div>
      </button>
      <button @click="go('/admin/recycle')" class="panel-card text-left">
        <div class="panel-label">回收站</div>
        <div class="panel-value">{{ stats.totalDeleted }}</div>
      </button>
      <button @click="go('/admin/pools')" class="panel-card text-left">
        <div class="panel-label">存储</div>
        <div class="panel-value">{{ stats.totalPools }}</div>
      </button>
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
.panel-card { @apply rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all; }
.panel-label { @apply text-slate-500 text-sm; }
.panel-value { @apply text-4xl mt-3 text-slate-900; }
</style>
