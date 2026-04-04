<template>
  <div class="space-y-5">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">相册管理</h1>
        <p class="text-slate-500 mt-1">创建公开相册或私密相册，图片会先进入照片池，再归纳到具体相册。</p>
      </div>
      <div class="flex flex-col md:flex-row gap-2">
        <el-input v-model="newName" placeholder="新相册名" class="w-56" />
        <el-select v-model="visibility" class="w-36">
          <el-option label="公开相册" value="public" />
          <el-option label="私密相册" value="private" />
        </el-select>
        <el-button @click="create" type="primary" class="!rounded-2xl">{{ editingId ? '保存' : '创建' }}</el-button>
      </div>
    </div>

    <div class="space-y-3">
      <div v-for="album in flatAlbums" :key="album.id" class="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div class="font-semibold text-slate-900 flex items-center gap-2">
            <span>{{ album.name }}</span>
            <span v-if="album.name === '公开相册'" class="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-600">系统锁定</span>
            <span v-if="album.name === '未分类'" class="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-600">默认相册</span>
          </div>
          <div class="text-sm text-slate-500 mt-1">{{ album.visibility === 'public' ? '公开相册' : '私密相册' }}</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button @click="edit(album)" :disabled="album.name === '公开相册'" class="!rounded-2xl">编辑</el-button>
          <el-button type="danger" @click="remove(album)" :disabled="album.name === '公开相册' || album.name === '未分类'" class="!rounded-2xl">删除</el-button>
        </div>
      </div>
    </div>

    <div class="rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
      <div class="text-lg font-semibold text-blue-700">流程说明</div>
      <div class="text-sm text-blue-700/80 mt-3 space-y-2">
        <p>• 图片上传会先进入 TG 存储池。</p>
        <p>• 系统默认把新图片放入“未分类”相册。</p>
        <p>• “公开相册”为系统相册，已锁定不可编辑/删除。</p>
        <p>• “未分类”为默认相册，不可删除。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
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
  try {
    if (editingId.value) await updateAlbum(editingId.value, newName.value, visibility.value)
    else await createAlbum(newName.value, visibility.value)
    newName.value = ''
    visibility.value = 'private'
    editingId.value = null
    await load()
    ElMessage.success('保存成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '操作失败')
  }
}

const edit = (album: any) => {
  if (album.name === '公开相册') return
  editingId.value = album.id
  newName.value = album.name
  visibility.value = album.visibility || 'private'
}

const remove = async (album: any) => {
  if (album.name === '公开相册' || album.name === '未分类') return
  try {
    await deleteAlbum(album.id)
    await load()
    ElMessage.success('删除成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '删除失败')
  }
}

onMounted(load)
</script>
