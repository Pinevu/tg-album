<template>
  <div class="space-y-5">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">回收站</h1>
      </div>
      <div class="flex gap-2">
        <el-button @click="restore" class="!rounded-2xl" :disabled="!selectedIds.length">还原</el-button>
        <el-button type="danger" @click="hardDelete" class="!rounded-2xl" :disabled="!selectedIds.length">彻底删除</el-button>
      </div>
    </div>

    <div v-if="photos.length === 0" class="panel-empty">回收站为空</div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="photo in photos" :key="photo.id" class="panel-card cursor-pointer" :class="selectedIds.includes(photo.id) ? 'ring-2 ring-red-300 border-red-300' : ''" @click="toggleSelect(photo.id)">
        <img :src="`/api/photos/file/${photo.id}`" class="w-full aspect-[3/4] object-cover rounded-2xl" />
        <div class="mt-3 text-sm font-medium text-slate-800 truncate">{{ photo.original_filename }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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
  ElMessage.success('已还原')
}

const hardDelete = async () => {
  await deletePhotos(selectedIds.value)
  selectedIds.value = []
  await load()
  ElMessage.success('已彻底删除')
}

onMounted(load)
</script>

<style scoped>
.panel-card { @apply rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm; }
.panel-empty { @apply rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm text-center text-slate-400; }
</style>
