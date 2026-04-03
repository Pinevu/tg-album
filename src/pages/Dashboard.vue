<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-white/60 mt-1">概览照片、相册和回收站状态</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5">
        <div class="text-white/60 text-sm">Total Photos</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalPhotos }}</div>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5">
        <div class="text-white/60 text-sm">Albums</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalAlbums }}</div>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5">
        <div class="text-white/60 text-sm">Deleted</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalDeleted }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/utils/axios'

const stats = ref({ totalPhotos: 0, totalAlbums: 0, totalDeleted: 0 })

const load = async () => {
  const { data } = await api.get('/stats')
  stats.value = data
}

onMounted(load)
</script>
