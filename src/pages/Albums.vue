<template>
  <div class="space-y-4 rounded-[28px] bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm p-4">
    <div class="space-y-3">
      <div class="w-full max-w-[780px] space-y-3">
        <form class="contents" autocomplete="off" data-lpignore="true" @submit.prevent>
          <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-2 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <el-input v-model="newName" placeholder="相册名" name="album_name" autocomplete="off" />
              <el-select v-model="visibility" name="album_visibility"><el-option label="公开" value="public" /><el-option label="私密" value="private" /></el-select>
              <el-input v-model="slug" placeholder="slug" name="album_slug" autocomplete="off" />
              <el-input v-model="accessPassword" placeholder="密码" name="album_access_password" type="text" show-password autocomplete="new-password" />
            </div>
          </div>

          <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-2 space-y-2">
            <el-input v-model="pwaIconUrl" placeholder="PWA 图标 URL" name="pwa_icon_url" autocomplete="off" />
            <el-input v-model="pwaSplashImageUrl" placeholder="启动背景图 URL" name="pwa_splash_image_url" autocomplete="off" />
            <el-select v-model="pwaSplashPosition" name="pwa_splash_position"><el-option label="顶部偏上" value="top" /><el-option label="偏上" value="upper" /><el-option label="居中" value="center" /><el-option label="偏下" value="lower" /><el-option label="底部偏下" value="bottom" /></el-select>
          </div>

          <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-2 space-y-2">
            <div class="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
              <label class="upload-like-btn">
                <input type="file" accept="image/*" @change="onIconFileChange" class="hidden" tabindex="-1" />
                <span>选择文件</span>
              </label>
              <div class="text-sm text-slate-400 truncate px-2">{{ iconFileName }}</div>
              <button type="button" @click="clearPwaIcon" class="upload-like-btn secondary">清空图标</button>
            </div>

            <div class="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
              <label class="upload-like-btn">
                <input type="file" accept="image/*" @change="onSplashFileChange" class="hidden" tabindex="-1" />
                <span>选择文件</span>
              </label>
              <div class="text-sm text-slate-400 truncate px-2">{{ splashFileName }}</div>
              <button type="button" @click="clearSplashImage" class="upload-like-btn secondary">清空背景</button>
            </div>

            <div>
              <el-button @click="saveAlbum" type="primary" class="!w-full">{{ editingId ? '保存' : '创建' }}</el-button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="pwaIconUrl || slug || pwaSplashImageUrl">
      <div class="panel-card bg-white/96 max-w-sm p-3">
        <div class="text-sm text-slate-500 mb-3">当前 PWA 图标预览</div>
        <img :src="iconPreviewUrl" class="w-20 h-20 rounded-[22px] object-cover border border-slate-200 bg-slate-50" />
        <div class="mt-2.5 text-[11px] text-slate-500">当前来源：{{ iconSourceLabel }}</div>
      </div>
      <div class="panel-card bg-white/96 p-3">
        <div class="text-sm text-slate-500 mb-2.5">当前启动背景图模拟预览</div>
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
        <div class="mt-2.5 text-[11px] text-slate-500">当前来源：{{ splashSourceLabel }}</div>
      </div>
    </div>

    <div v-if="loading" class="panel-empty">正在加载相册...</div>
    <div v-else-if="flatAlbums.length === 0" class="panel-empty">暂无相册</div>

    <div v-else class="space-y-2.5">
      <div v-for="album in flatAlbums" :key="album.id" class="panel-card flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 p-3.5">
        <div class="flex items-center gap-3 min-w-0">
          <img :src="album.pwa_icon_url || (album.cover_photo_id ? `/api/photos/file/${album.cover_photo_id}` : (album.slug ? `/api/private-albums/${album.slug}/icon.svg` : '/icon.svg'))" class="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0" />
          <div class="min-w-0">
            <div class="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>{{ album.name }}</span>
              <span v-if="album.name === '公开相册'" class="tag-blue">系统锁定</span>
              <span v-if="album.name === '未分类'" class="tag-amber">默认相册</span>
            </div>
            <div class="text-sm text-slate-500 mt-1">{{ album.visibility === 'public' ? '公开相册' : '私密相册' }}</div>
            <div v-if="album.slug" class="text-xs text-slate-500 mt-1 break-all">{{ origin }}/{{ album.slug }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">图标优先级：自定义图标 > 相册封面 > 文字图标</div>
            <div class="text-[10px] text-slate-400 mt-0.5">当前来源：{{ album.pwa_icon_url ? '自定义图标' : (album.cover_photo_id ? '相册封面' : '文字图标') }}</div>
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
import { computed, nextTick, onMounted, ref } from 'vue'
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
const iconFileName = ref('未选择文件')
const splashFileName = ref('未选择文件')
const editingId = ref<number | null>(null)

const flatten = (nodes: any[]): any[] => (nodes || []).flatMap((n) => [n, ...((n.children && Array.isArray(n.children)) ? flatten(n.children) : [])])
const flatAlbums = computed(() => flatten(albums.value))
const iconPreviewUrl = computed(() => pwaIconUrl.value || (slug.value ? `/api/private-albums/${slug.value}/icon.svg?v=${Date.now()}` : '/icon.svg'))
const splashPreviewUrl = computed(() => pwaSplashImageUrl.value || '')
const iconSourceLabel = computed(() => pwaIconUrl.value ? '自定义图标' : (slug.value ? '系统生成图标' : '默认图标'))
const splashPositionLabel = computed(() => pwaSplashPosition.value === 'top' ? '顶部偏上' : pwaSplashPosition.value === 'upper' ? '偏上' : pwaSplashPosition.value === 'lower' ? '偏下' : pwaSplashPosition.value === 'bottom' ? '底部偏下' : '居中')
const splashSourceLabel = computed(() => pwaSplashImageUrl.value ? `独立启动背景图（优先显示，位置：${splashPositionLabel.value}）` : '未设置，前台将回退到相册封面图')
const splashObjectPosition = computed(() => pwaSplashPosition.value === 'top' ? 'center 10%' : pwaSplashPosition.value === 'upper' ? 'center 30%' : pwaSplashPosition.value === 'lower' ? 'center 70%' : pwaSplashPosition.value === 'bottom' ? 'center 90%' : 'center center')

const blurActiveInput = async () => {
  await nextTick()
  const active = document.activeElement as HTMLElement | null
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) active.blur()
  if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) document.activeElement.blur()
}

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
  iconFileName.value = file.name
  reader.onload = () => { pwaIconUrl.value = String(reader.result || '') }
  reader.readAsDataURL(file)
}

const onSplashFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  splashFileName.value = file.name
  reader.onload = () => { pwaSplashImageUrl.value = String(reader.result || '') }
  reader.readAsDataURL(file)
}

const clearPwaIcon = () => { pwaIconUrl.value = ''; iconFileName.value = '未选择文件' }
const clearSplashImage = () => { pwaSplashImageUrl.value = ''; splashFileName.value = '未选择文件' }

const resetForm = () => {
  newName.value = ''
  visibility.value = 'private'
  slug.value = ''
  accessPassword.value = ''
  pwaIconUrl.value = ''
  pwaSplashImageUrl.value = ''
  pwaSplashPosition.value = 'center'
  iconFileName.value = '未选择文件'
  splashFileName.value = '未选择文件'
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
    await blurActiveInput()
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
  iconFileName.value = album.pwa_icon_url ? '已选择图标' : '未选择文件'
  splashFileName.value = album.pwa_splash_image_url ? '已选择背景' : '未选择文件'
  blurActiveInput()
}

const removeAlbum = async (album: any) => {
  try {
    await deleteAlbum(album.id)
    ElMessage.success('删除成功')
    await load()
    await blurActiveInput()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '删除失败')
  }
}

const copyShareLink = async (album: any) => {
  const url = `${origin}/${album.slug}`
  await navigator.clipboard.writeText(url)
  ElMessage.success('分享链接已复制')
}

onMounted(async () => {
  await blurActiveInput()
  await load()
  setTimeout(() => { blurActiveInput() }, 50)
  setTimeout(() => { blurActiveInput() }, 250)
})
</script>

<style scoped>
.panel-card { @apply rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm; }
.panel-empty { @apply rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm; }
.tag-blue { @apply text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-600; }
.tag-amber { @apply text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-600; }

.upload-like-btn{height:36px;padding:0 14px;border-radius:14px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:12px;font-weight:400;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;box-shadow:none;}
.upload-like-btn.secondary{color:#475569;}
</style>
