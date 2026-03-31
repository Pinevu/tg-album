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
import { searchPhotos, getAlbums, getRecycleBin } from '@/utils/api'

const stats = ref({ totalPhotos: 0, totalAlbums: 0, totalDeleted: 0 })

const load = async () => {
  const p = await searchPhotos({ page_size: 1 })
  const a = await getAlbums()
  const r = await getRecycleBin()
  stats.value.totalPhotos = (p.data.results || p.data).length
  stats.value.totalAlbums = (a.data.results || a.data).length
  stats.value.totalDeleted = (r.data.results || r.data).length
}

onMounted(load)
</script>
