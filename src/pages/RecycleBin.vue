<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Recycle Bin</h1>
      <p class="text-white/60 mt-1">可还原或永久删除</p>
    </div>

    <div class="flex gap-2">
      <el-button @click="restore">还原选中</el-button>
      <el-button type="danger" @click="hardDelete">彻底删除</el-button>
    </div>

    <div class="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="mb-4 break-inside-avoid relative rounded-2xl overflow-hidden border border-white/10 bg-white/5"
        :class="{ 'ring-2 ring-red-400': selectedIds.includes(photo.id) }"
        @click="toggleSelect(photo.id)"
      >
        <img :src="`/api/photos/file/${photo.id}`" class="w-full block" />
        <div class="p-3 text-xs text-white/70">{{ photo.original_filename }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getRecycleBin, restorePhotos, deletePhotos } from '@/utils/api'

const photos = ref<any[]>([])
const selectedIds = ref<number[]>([])

const load = async () => {
  const { data } = await getRecycleBin()
  photos.value = data.results || []
}

const toggleSelect = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(i => i !== id)
    : [...selectedIds.value, id]
}

const restore = async () => {
  await restorePhotos(selectedIds.value)
  selectedIds.value = []
  await load()
}

const hardDelete = async () => {
  await deletePhotos(selectedIds.value)
  selectedIds.value = []
  await load()
}

onMounted(load)
</script>
