<template>
  <div class="space-y-5 font-sans">
    <!-- 工具栏 -->
    <div class="panel-card flex items-center justify-between gap-3">
      <div class="text-xs text-slate-500 flex items-center gap-2">
        <span>回收站照片: <strong class="text-slate-800">{{ photos.length }}</strong> 张</span>
        <span v-if="selectedIds.length" class="text-blue-600 font-medium">· 已选 {{ selectedIds.length }} 项</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="restore"
          :disabled="!selectedIds.length"
          class="action-ghost-btn !h-8 !px-3.5 !bg-blue-50 !border-blue-200 !text-blue-700 font-medium disabled:opacity-40"
        >
          一键还原
        </button>
        <button
          type="button"
          @click="hardDelete"
          :disabled="!selectedIds.length"
          class="action-ghost-btn action-ghost-btn-danger !h-8 !px-3.5 font-medium disabled:opacity-40"
        >
          彻底删除
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="photos.length === 0" class="panel-empty">
      <div class="text-3xl mb-2">🗑</div>
      <div>回收站为空，暂无已删除照片</div>
    </div>

    <!-- 照片网格 -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-3.5">
      <article
        v-for="photo in photos"
        :key="photo.id"
        @click="toggleSelect(photo.id)"
        class="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer"
        :class="selectedIds.includes(photo.id) ? 'ring-2 ring-rose-400 border-rose-400 shadow-md' : ''"
      >
        <div class="aspect-[3/4] bg-slate-100 overflow-hidden relative">
          <img :src="`/api/photos/file/${photo.id}`" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />

          <!-- 选中角标 -->
          <div
            v-if="selectedIds.includes(photo.id)"
            class="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
          >
            ✓
          </div>
        </div>

        <div class="p-2.5 space-y-0.5 border-t border-slate-100 bg-white">
          <div class="text-xs font-semibold text-slate-800 truncate">{{ photo.original_filename }}</div>
          <div class="text-[10px] text-slate-400">删除于 {{ formatDeletedAt(photo.deleted_at) }}</div>
        </div>
      </article>
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
  if (!selectedIds.value.length) return
  await restorePhotos(selectedIds.value)
  selectedIds.value = []
  await load()
  ElMessage.success('已恢复所选照片')
}

const hardDelete = async () => {
  if (!selectedIds.value.length) return
  await deletePhotos(selectedIds.value)
  selectedIds.value = []
  await load()
  ElMessage.success('已彻底删除所选照片')
}

const formatDeletedAt = (ts: number) => ts ? new Date(ts * 1000).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

onMounted(load)
</script>
