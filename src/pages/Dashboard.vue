<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">仪表盘</h1>
        <p class="text-slate-500 mt-1">概览照片、相册、回收站以及 Telegram 存储池状态</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-slate-500 text-sm">照片总数</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalPhotos }}</div>
      </div>
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-slate-500 text-sm">相册数量</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalAlbums }}</div>
      </div>
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-slate-500 text-sm">回收站数量</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalDeleted }}</div>
      </div>
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-slate-500 text-sm">TG 存储池</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalPools }}</div>
        <div class="text-xs text-slate-400 mt-1">可新增、编辑、删除和切换启用池</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/utils/axios'

const stats = ref({ totalPhotos: 0, totalAlbums: 0, totalDeleted: 0, totalPools: 0 })

const load = async () => {
  const { data } = await api.get('/stats')
  stats.value = data
}

onMounted(load)
</script>
