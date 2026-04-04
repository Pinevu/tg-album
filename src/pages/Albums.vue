<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">相册管理</h1>
        <p class="text-slate-500 mt-1">管理树状相册结构，建议保留一个“未分类”相册作为 TG 自动同步入口。</p>
      </div>
      <div class="flex gap-2">
        <el-input v-model="newName" placeholder="新相册名" class="w-56" />
        <el-button @click="create">创建</el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <el-tree :data="albums" :props="{ label: 'name', children: 'children' }" />
      </div>
      <div class="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div class="text-lg font-semibold text-blue-700">TG 图片存储池说明</div>
        <div class="text-sm text-blue-700/80 mt-3 space-y-2">
          <p>• 上传图片会先发送到 Telegram Bot。</p>
          <p>• 系统会把 `file_id` / `file_unique_id` 保存到 D1。</p>
          <p>• 推荐创建一个“未分类”相册，作为默认同步入口。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAlbumTree, createAlbum } from '@/utils/api'

const albums = ref([])
const newName = ref('')

const load = async () => {
  const { data } = await getAlbumTree()
  albums.value = data.results || []
}

const create = async () => {
  if (!newName.value) return
  await createAlbum(newName.value)
  newName.value = ''
  await load()
}

onMounted(load)
</script>
