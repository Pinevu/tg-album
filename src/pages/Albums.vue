<template>
  <div class="text-2xl font-bold mb-4">Albums Settings</div>
  <div class="flex gap-3 mb-4">
    <el-input v-model="newName" placeholder="新相册名" />
    <el-button @click="create">创建</el-button>
  </div>
  <el-tree :data="albums" :props="{ label: 'name', children: 'children' }" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAlbumTree, createAlbum } from '@/utils/api'

const albums = ref([])
const newName = ref('')

const load = async () => {
  const { data } = await getAlbumTree()
  albums.value = data.results || data
}

const create = async () => {
  if (!newName.value) return
  await createAlbum(newName.value)
  newName.value = ''
  await load()
}

onMounted(load)
</script>
