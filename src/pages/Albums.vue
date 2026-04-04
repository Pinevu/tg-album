<template>
  <div class="space-y-4">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">相册管理</h1>
        <p class="text-slate-500 mt-1">创建公开相册或私密相册，图片会先进入照片池，再归纳到具体相册。</p>
      </div>
      <div class="flex flex-col md:flex-row gap-2">
        <el-input v-model="newName" placeholder="新相册名" class="w-56" />
        <el-select v-model="visibility" class="w-36">
          <el-option label="公开相册" value="public" />
          <el-option label="私密相册" value="private" />
        </el-select>
        <el-button @click="create">创建</el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <el-tree :data="albums" :props="{ label: 'name', children: 'children' }" />
      </div>
      <div class="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div class="text-lg font-semibold text-blue-700">流程说明</div>
        <div class="text-sm text-blue-700/80 mt-3 space-y-2">
          <p>• 图片上传会先进入 TG 存储池。</p>
          <p>• 系统默认把新图片放入“未分类”相册。</p>
          <p>• 你之后可以在图片管理里批量归纳到公开或私密相册。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAlbumTree } from '@/utils/api'
import api from '@/utils/axios'

const albums = ref([])
const newName = ref('')
const visibility = ref('private')

const load = async () => {
  const { data } = await getAlbumTree()
  albums.value = data.results || []
}

const create = async () => {
  if (!newName.value) return
  await api.post('/albums', { name: newName.value, visibility: visibility.value })
  newName.value = ''
  visibility.value = 'private'
  await load()
}

onMounted(load)
</script>
