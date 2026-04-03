<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-3xl font-bold">Albums</h1>
        <p class="text-white/60 mt-1">管理相册结构与树状目录</p>
      </div>
      <div class="flex gap-2">
        <el-input v-model="newName" placeholder="新相册名" class="w-56" />
        <el-button @click="create">创建</el-button>
      </div>
    </div>

    <div class="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4">
      <el-tree :data="albums" :props="{ label: 'name', children: 'children' }" />
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
