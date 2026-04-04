<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">仪表盘</h1>
        <p class="text-slate-500 mt-1">概览照片、相册、回收站以及 Telegram 存储池状态</p>
      </div>
      <el-button @click="load" type="primary" class="!rounded-2xl">刷新</el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <button @click="go('/admin/photos')" class="text-left rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all">
        <div class="text-slate-500 text-sm">照片总数</div>
        <div class="text-4xl font-bold mt-3 text-slate-900">{{ stats.totalPhotos }}</div>
        <div class="text-xs text-blue-600 mt-3">点击进入图片管理</div>
      </button>

      <button @click="go('/admin/albums')" class="text-left rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all">
        <div class="text-slate-500 text-sm">相册数量</div>
        <div class="text-4xl font-bold mt-3 text-slate-900">{{ stats.totalAlbums }}</div>
        <div class="text-xs text-blue-600 mt-3">点击进入相册管理</div>
      </button>

      <button @click="go('/admin/recycle')" class="text-left rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all">
        <div class="text-slate-500 text-sm">回收站数量</div>
        <div class="text-4xl font-bold mt-3 text-slate-900">{{ stats.totalDeleted }}</div>
        <div class="text-xs text-blue-600 mt-3">点击进入回收站</div>
      </button>

      <button @click="go('/admin/pools')" class="text-left rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all">
        <div class="text-slate-500 text-sm">TG 存储池</div>
        <div class="text-4xl font-bold mt-3 text-slate-900">{{ stats.totalPools }}</div>
        <div class="text-xs text-blue-600 mt-3">点击进入存储池管理</div>
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

const go = (path: string) => {
  router.push(path)
}

onMounted(load)
</script>
