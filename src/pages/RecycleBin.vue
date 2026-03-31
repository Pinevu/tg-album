<template>
  <div class="text-2xl font-bold mb-4">Recycle Bin</div>
  <div class="flex gap-2 mb-4">
    <el-button @click="restore">还原选中</el-button>
    <el-button type="danger" @click="hardDelete">彻底删除</el-button>
  </div>

  <div class="columns-4 gap-4">
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="relative group break-inside-avoid mb-4"
      :class="{ 'ring-2 ring-red-400': selectedIds.includes(photo.id) }"
      @click="toggleSelect(photo.id)"
    >
      <img :src="`/api/photos/file/${photo.id}`" class="rounded" />
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
  photos.value = data.results || data
}

const toggleSelect = (id: number) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value.push(id)
  }
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
