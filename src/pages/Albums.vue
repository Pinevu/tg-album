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

    <div class="space-y-3">
      <div v-for="album in flatAlbums" :key="album.id" class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div class="font-semibold text-slate-900">{{ album.name }}</div>
          <div class="text-sm text-slate-500">{{ album.visibility === 'public' ? '公开相册' : '私密相册' }}</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button @click="edit(album)">编辑</el-button>
          <el-button type="danger" @click="remove(album.id)">删除</el-button>
        </div>
      </div>
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAlbumTree, createAlbum, updateAlbum, deleteAlbum } from '@/utils/api'

const albums = ref<any[]>([])
const newName = ref('')
const visibility = ref('private')
const editingId = ref<number | null>(null)

const flatten = (nodes: any[]): any[] => nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])])
const flatAlbums = computed(() => flatten(albums.value))

const load = async () => {
  const { data } = await getAlbumTree()
  albums.value = data.results || []
}

const create = async () => {
  if (!newName.value) return
  if (editingId.value) await updateAlbum(editingId.value, newName.value, visibility.value)
  else await createAlbum(newName.value, visibility.value)
  newName.value = ''
  visibility.value = 'private'
  editingId.value = null
  await load()
}

const edit = (album: any) => {
  editingId.value = album.id
  newName.value = album.name
  visibility.value = album.visibility || 'private'
}

const remove = async (id: number) => {
  await deleteAlbum(id)
  await load()
}

onMounted(load)
</script>
