<template>
  <div class="space-y-5 rounded-[32px] bg-white/82 backdrop-blur-md border border-slate-200/80 shadow-sm p-4 md:p-5">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div><h1 class="text-3xl font-bold text-slate-900 tracking-tight">相册管理</h1></div>
      <div class="grid grid-cols-1 md:grid-cols-13 gap-2 w-full md:w-auto">
        <el-input v-model="newName" placeholder="相册名" class="md:w-32" />
        <el-select v-model="visibility" class="md:w-24"><el-option label="公开" value="public" /><el-option label="私密" value="private" /></el-select>
        <el-input v-model="slug" placeholder="slug" class="md:w-28" />
        <el-input v-model="accessPassword" placeholder="密码" show-password class="md:w-28" />
        <el-input v-model="pwaIconUrl" placeholder="PWA 图标 URL" class="md:w-32" />
        <el-input v-model="pwaSplashImageUrl" placeholder="启动背景图 URL" class="md:w-36" />
        <el-select v-model="pwaSplashPosition" class="md:w-32"><el-option label="顶部偏上" value="top" /><el-option label="偏上" value="upper" /><el-option label="居中" value="center" /><el-option label="偏下" value="lower" /><el-option label="底部偏下" value="bottom" /></el-select>
        <input type="file" accept="image/*" @change="onIconFileChange" class="block w-full text-sm text-slate-500 md:w-32" />
        <input type="file" accept="image/*" @change="onSplashFileChange" class="block w-full text-sm text-slate-500 md:w-32" />
        <el-button @click="clearPwaIcon">清空图标</el-button>
        <el-button @click="clearSplashImage">清空背景</el-button>
        <el-button @click="saveAlbum" type="primary">{{ editingId ? '保存' : '创建' }}</el-button>
      </div>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="pwaIconUrl || slug || pwaSplashImageUrl">
      <div class="panel-card bg-white/96 max-w-sm">
        <div class="text-sm text-slate-500 mb-3">当前 PWA 图标预览</div>
        <img :src="iconPreviewUrl" class="w-20 h-20 rounded-[22px] object-cover border border-slate-200 bg-slate-50" />
        <div class="mt-3 text-xs text-slate-500">当前来源：{{ iconSourceLabel }}</div>
      </div>
      <div class="panel-card bg-white/96">
        <div class="text-sm text-slate-500 mb-3">当前启动背景图模拟预览</div>
        <div class="mx-auto w-[250px] rounded-[36px] bg-slate-900 p-[8px] shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <div class="rounded-[28px] overflow-hidden bg-black relative aspect-[9/19.5] border border-white/10">
            <div class="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/70 z-20 border border-white/10"></div>
            <img v-if="splashPreviewUrl" :src="splashPreviewUrl" class="w-full h-full object-cover scale-[1.04]" :style="{ objectPosition: splashObjectPosition }" />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-slate-100">暂无启动背景图</div>
            <div class="absolute inset-0 bg-gradient-to-b from-black/8 via-black/10 to-black/46"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
              <img :src="iconPreviewUrl" class="w-16 h-16 rounded-[20px] border border-white/60 shadow-2xl object-cover" />
              <div class="mt-4 text-white font-bold text-[22px] tracking-tight">{{ newName || slug || '相册系统' }}</div>
              <div class="mt-1 text-white/85 text-xs">正在打开你的独立相册…</div>
            </div>
            <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full bg-white/70"></div>
          </div>
        </div>
        <div class="mt-3 text-xs text-slate-500">当前来源：{{ splashSourceLabel }}</div>
      </div>
    </div>

    <div v-if="loading" class="panel-empty">正在加载相册...</div>
    <div v-else-if="flatAlbums.length === 0" class="panel-empty">暂无相册</div>

    <div v-else class="space-y-3">
      <div v-for="album in flatAlbums" :key="album.id" class="panel-card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <img :src="album.pwa_icon_url || (album.cover_photo_id ? `/api/photos/file/${album.cover_photo_id}` : (album.slug ? `/api/private-albums/${album.slug}/icon.svg` : '/icon.svg'))" class="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0" />
          <div class="min-w-0">
            <div class="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>{{ album.name }}</span>
              <span v-if="album.name === '公开相册'" class="tag-blue">系统锁定</span>
              <span v-if="album.name === '未分类'" class="tag-amber">默认相册</span>
            </div>
            <div class="text-sm text-slate-500 mt-1">{{ album.visibility === 'public' ? '公开相册' : '私密相册' }}</div>
            <div v-if="album.slug" class="text-xs text-slate-500 mt-1 break-all">{{ origin }}/{{ album.slug }}</div>
            <div class="text-[11px] text-slate-400 mt-1">图标优先级：自定义图标 > 相册封面 > 文字图标</div>
            <div class="text-[11px] text-slate-400 mt-1">当前来源：{{ album.pwa_icon_url ? '自定义图标' : (album.cover_photo_id ? '相册封面' : '文字图标') }}</div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button v-if="album.slug" @click="copyShareLink(album)">复制链接</el-button>
          <el-button @click="editAlbum(album)" :disabled="album.name === '公开相册'">编辑</el-button>
          <el-button type="danger" @click="removeAlbum(album)" :disabled="album.name === '公开相册' || album.name === '未分类'">删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAlbumTree, createAlbum, updateAlbum, deleteAlbum } from '@/utils/api'

const origin = location.origin
const albums = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const newName = ref('')
const visibility = ref('private')
const slug = ref('')
const accessPassword = ref('')
const pwaIconUrl = ref('')
const pwaSplashImageUrl = ref('')
const pwaSplashPosition = ref('center')
const editingId = ref<number | null>(null)

const flatten = (nodes: any[]): any[] => (nodes || []).flatMap((n) => [n, ...((n.children && Array.isArray(n.children)) ? flatten(n.children) : [])])
const flatAlbums = computed(() => flatten(albums.value))
const iconPreviewUrl = computed(() => pwaIconUrl.value || (slug.value ? `/api/private-albums/${slug.value}/icon.svg?v=${Date.now()}` : '/icon.svg'))
const splashPreviewUrl = computed(() => pwaSplashImageUrl.value || '')
const iconSourceLabel = computed(() => pwaIconUrl.value ? '自定义图标' : (slug.value ? '系统生成图标' : '默认图标'))
const splashPositionLabel = computed(() => pwaSplashPosition.value === 'top' ? '顶部偏上' : pwaSplashPosition.value === 'upper' ? '偏上' : pwaSplashPosition.value === 'lower' ? '偏下' : pwaSplashPosition.value === 'bottom' ? '底部偏下' : '居中')
const splashSourceLabel = computed(() => pwaSplashImageUrl.value ? `独立启动背景图（优先显示，位置：${splashPositionLabel.value}）` : '未设置，前台将回退到相册封面图')
const splashObjectPosition = computed(() => pwaSplashPosition.value === 'top' ? 'center 10%' : pwaSplashPosition.value === 'upper' ? 'center 30%' : pwaSplashPosition.value === 'lower' ? 'center 70%' : pwaSplashPosition.value === 'bottom' ? 'center 90%' : 'center center')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await getAlbumTree()
    albums.value = Array.isArray(data?.results) ? data.results : []
  } catch (e: any) {
    albums.value = []
    error.value = e?.response?.data?.error || '相册读取失败'
  } finally {
    loading.value = false
  }
}

const onIconFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { pwaIconUrl.value = String(reader.result || '') }
  reader.readAsDataURL(file)
}

const onSplashFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { pwaSplashImageUrl.value = String(reader.result || '') }
  reader.readAsDataURL(file)
}

const clearPwaIcon = () => { pwaIconUrl.value = '' }
const clearSplashImage = () => { pwaSplashImageUrl.value = '' }

const resetForm = () => {
  newName.value = ''
  visibility.value = 'private'
  slug.value = ''
  accessPassword.value = ''
  pwaIconUrl.value = ''
  pwaSplashImageUrl.value = ''
  pwaSplashPosition.value = 'center'
  editingId.value = null
}

const saveAlbum = async () => {
  if (!newName.value.trim()) return
  try {
    if (editingId.value) await updateAlbum(editingId.value, newName.value, visibility.value, slug.value || undefined, accessPassword.value || undefined, pwaIconUrl.value || undefined, pwaSplashImageUrl.value || undefined, pwaSplashPosition.value)
    else await createAlbum(newName.value, visibility.value, undefined, slug.value || undefined, accessPassword.value || undefined, pwaIconUrl.value || undefined, pwaSplashImageUrl.value || undefined, pwaSplashPosition.value)
    ElMessage.success('保存成功')
    resetForm()
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '保存失败')
  }
}

const editAlbum = (album: any) => {
  if (album.name === '公开相册') return
  editingId.value = album.id
  newName.value = album.name || ''
  visibility.value = album.visibility || 'private'
  slug.value = album.slug || ''
  accessPassword.value = album.access_password || ''
  pwaIconUrl.value = album.pwa_icon_url || ''
  pwaSplashImageUrl.value = album.pwa_splash_image_url || ''
  pwaSplashPosition.value = album.pwa_splash_position || 'center'
}

const removeAlbum = async (album: any) => {
  try {
    await deleteAlbum(album.id)
    ElMessage.success('删除成功')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '删除失败')
  }
}

const copyShareLink = async (album: any) => {
  const url = `${origin}/${album.slug}`
  await navigator.clipboard.writeText(url)
  ElMessage.success('分享链接已复制')
}

onMounted(load)
</script>

<style scoped>
.panel-card { @apply rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm; }
.panel-empty { @apply rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm; }
.tag-blue { @apply text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-600; }
.tag-amber { @apply text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-600; }
</style>
