<template>
  <div class="space-y-5">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">相册管理</h1>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-2 w-full md:w-auto">
        <el-input v-model="newName" placeholder="相册名" class="md:w-40" />
        <el-select v-model="visibility" class="md:w-28">
          <el-option label="公开" value="public" />
          <el-option label="私密" value="private" />
        </el-select>
        <el-input v-model="slug" placeholder="slug" class="md:w-36" />
        <el-input v-model="accessPassword" placeholder="密码" show-password class="md:w-36" />
        <el-button @click="create" type="primary" class="!rounded-2xl">{{ editingId ? '保存' : '创建' }}</el-button>
      </div>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

    <div class="space-y-3">
      <div v-for="album in flatAlbums" :key="album.id" class="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div class="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
            <span>{{ album.name }}</span>
            <span v-if="album.name === '公开相册'" class="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-600">系统锁定</span>
            <span v-if="album.name === '未分类'" class="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-600">默认相册</span>
          </div>
          <div class="text-sm text-slate-500 mt-1">{{ album.visibility === 'public' ? '公开相册' : '私密相册' }}</div>
          <div v-if="album.slug" class="text-xs text-slate-500 mt-1 break-all">{{ location.origin }}/{{ album.slug }}</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button v-if="album.slug" @click="copyShareLink(album)" class="!rounded-2xl">复制链接</el-button>
          <el-button @click="edit(album)" :disabled="album.name === '公开相册'" class="!rounded-2xl">编辑</el-button>
          <el-button type="danger" @click="remove(album)" :disabled="album.name === '公开相册' || album.name === '未分类'" class="!rounded-2xl">删除</el-button>
        </div>
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
const slug = ref('')
const accessPassword = ref('')
const editingId = ref<number | null>(null)
const error = ref('')

const flatten = (nodes: any[]): any[] => nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])])
const flatAlbums = computed(() => flatten(albums.value))

const load = async () => {
  error.value = ''
  try {
    const { data } = await getAlbumTree()
    albums.value = data.results || []
  } catch (e: any) {
    error.value = e?.response?.data?.error || '相册读取失败，请刷新或重新登录'
  }
}

const create = async () => {
  if (!newName.value) return
  try {
    if (editingId.value) await updateAlbum(editingId.value, newName.value, visibility.value, slug.value || undefined, accessPassword.value || undefined)
    else await createAlbum(newName.value, visibility.value, undefined, slug.value || undefined, accessPassword.value || undefined)
    newName.value = ''
    visibility.value = 'private'
    slug.value = ''
    accessPassword.value = ''
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
  slug.value = album.slug || ''
  accessPassword.value = album.access_password || ''
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

const copyShareLink = async (album: any) => {
  const url = `${location.origin}/${album.slug}`
  await navigator.clipboard.writeText(url)
  ElMessage.success('分享链接已复制')
}

onMounted(load)
</script>
