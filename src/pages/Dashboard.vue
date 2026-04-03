<template>
  <div class="text-2xl font-bold mb-4">Dashboard Overview</div>
  <div class="grid grid-cols-3 gap-4">
    <div class="p-4 rounded bg-white/10">Total Photos: {{ stats.totalPhotos }}</div>
    <div class="p-4 rounded bg-white/10">Albums: {{ stats.totalAlbums }}</div>
    <div class="p-4 rounded bg-white/10">Deleted: {{ stats.totalDeleted }}</div>
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
