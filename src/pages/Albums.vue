<template>
  <div class="space-y-5 font-sans">
    <!-- 相册配置表单 -->
    <div class="panel-card space-y-4">
      <div class="flex items-center justify-between">
        <div class="text-sm font-bold text-slate-900">{{ editingId ? '编辑相册' : '新建相册' }}</div>
        <button v-if="editingId" @click="resetForm" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">取消编辑</button>
      </div>

      <form autocomplete="off" data-lpignore="true" @submit.prevent="saveAlbum" class="space-y-3.5">
        <!-- 基础属性 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">相册名称</label>
            <el-input v-model="newName" placeholder="例如: 旅行记录" name="album_name" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">相册属性</label>
            <el-select v-model="visibility" name="album_visibility" class="w-full">
              <el-option label="私密相册（密码保护）" value="private" />
              <el-option label="公开相册（所有人可见）" value="public" />
            </el-select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">专属 Slug (路径)</label>
            <el-input v-model="slug" placeholder="例如: travel" name="album_slug" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">访问密码</label>
            <el-input v-model="accessPassword" placeholder="留空无密码" name="album_access_password" show-password autocomplete="new-password" />
          </div>
        </div>

        <!-- PWA 定制 -->
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
          <div class="text-xs font-semibold text-slate-700">PWA 独立相册定制</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <el-input v-model="pwaIconUrl" placeholder="图标 URL" name="pwa_icon_url" />
            <el-input v-model="pwaSplashImageUrl" placeholder="启动背景图 URL" name="pwa_splash_image_url" />
            <el-select v-model="pwaSplashPosition" name="pwa_splash_position" class="w-full">
              <el-option label="背景对齐: 顶部偏上" value="top" />
              <el-option label="背景对齐: 偏上" value="upper" />
              <el-option label="背景对齐: 居中" value="center" />
              <el-option label="背景对齐: 偏下" value="lower" />
              <el-option label="背景对齐: 底部偏下" value="bottom" />
            </el-select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-2">
              <label class="action-ghost-btn !h-8 !px-3 !bg-white">
                <input type="file" accept="image/*" @change="onIconFileChange" class="hidden" tabindex="-1" />
                <span>选择本地图标</span>
              </label>
              <span class="text-slate-400 truncate flex-1">{{ iconFileName }}</span>
              <button v-if="pwaIconUrl" type="button" @click="clearPwaIcon" class="text-slate-400 hover:text-slate-600">清除</button>
            </div>

            <div class="flex items-center gap-2">
              <label class="action-ghost-btn !h-8 !px-3 !bg-white">
                <input type="file" accept="image/*" @change="onSplashFileChange" class="hidden" tabindex="-1" />
                <span>选择本地启动图</span>
              </label>
              <span class="text-slate-400 truncate flex-1">{{ splashFileName }}</span>
              <button v-if="pwaSplashImageUrl" type="button" @click="clearSplashImage" class="text-slate-400 hover:text-slate-600">清除</button>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-1">
          <el-button type="primary" @click="saveAlbum" class="!px-6">
            {{ editingId ? '保存相册修改' : '创建新相册' }}
          </el-button>
        </div>
      </form>
    </div>

    <!-- 实时预览区 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="pwaIconUrl || slug || pwaSplashImageUrl">
      <div class="panel-card space-y-2.5">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">PWA 图标实时预览</div>
        <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <img :src="iconPreviewUrl" class="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm shrink-0" />
          <div class="min-w-0">
            <div class="text-sm font-bold text-slate-900 truncate">{{ newName || slug || '相册系统' }}</div>
            <div class="text-xs text-slate-400 mt-1">来源: {{ iconSourceLabel }}</div>
          </div>
        </div>
      </div>

      <div class="panel-card space-y-2.5">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">PWA 启动画面模拟</div>
        <div class="mx-auto w-[190px] rounded-[28px] bg-slate-950 p-1 shadow-lg">
          <div class="rounded-[24px] overflow-hidden bg-black relative aspect-[9/19.5] border border-white/10">
            <div class="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-black z-20 border border-white/10"></div>
            <img v-if="splashPreviewUrl" :src="splashPreviewUrl" class="w-full h-full object-cover scale-[1.02]" :style="{ objectPosition: splashObjectPosition }" />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-500 text-xs bg-slate-900">暂无启动图</div>
            <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/40"></div>
            <div class="absolute inset-x-0 bottom-0 p-3 z-10">
              <div class="rounded-xl border border-white/15 bg-black/30 backdrop-blur-md p-2.5 text-center shadow-lg">
                <img :src="iconPreviewUrl" class="mx-auto w-10 h-10 rounded-xl border border-white/40 shadow-sm object-cover" />
                <div class="mt-2 text-white font-bold text-sm tracking-tight truncate">{{ newName || slug || '相册系统' }}</div>
                <div class="mt-0.5 text-white/70 text-[9px]">正在载入相册…</div>
              </div>
            </div>
            <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/60"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相册列表 -->
    <div v-if="loading" class="panel-empty">正在加载相册数据...</div>
    <div v-else-if="flatAlbums.length === 0" class="panel-empty">暂无相册，请先创建</div>

    <div v-else class="space-y-2.5">
      <div
        v-for="album in flatAlbums"
        :key="album.id"
        class="panel-card flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:border-slate-300 transition-colors"
      >
        <div class="flex items-center gap-3.5 min-w-0">
          <img
            :src="album.pwa_icon_url || (album.cover_photo_id ? `/api/photos/file/${album.cover_photo_id}` : (album.slug ? `/api/private-albums/${album.slug}/icon.png` : '/icon.svg'))"
            class="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0"
          />
          <div class="min-w-0">
            <div class="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
              <span>{{ album.name }}</span>
              <span v-if="album.name === '公开相册'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">系统公开</span>
              <span v-if="album.name === '未分类'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">默认</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{{ album.visibility === 'public' ? '公开' : '私密' }}</span>
              <span v-if="album.slug" class="truncate text-slate-500 font-mono text-[11px]">/{{ album.slug }}</span>
              <span v-if="album.pwa_icon_url" class="text-emerald-600 text-[10px]">● 已自定义图标</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 shrink-0">
          <button v-if="album.slug" type="button" @click="copyShareLink(album)" class="action-ghost-btn !h-8 !px-3">复制链接</button>
          <button type="button" @click="editAlbum(album)" :disabled="album.name === '公开相册'" class="action-ghost-btn !h-8 !px-3 disabled:opacity-40">编辑</button>
          <button type="button" @click="removeAlbum(album)" :disabled="album.name === '公开相册' || album.name === '未分类'" class="action-ghost-btn action-ghost-btn-danger !h-8 !px-3 disabled:opacity-40">删除</button>
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
const iconPreviewUrl = computed(() => pwaIconUrl.value || (slug.value ? `/api/private-albums/${slug.value}/icon.png?v=${Date.now()}` : '/icon.svg'))
const splashPreviewUrl = computed(() => pwaSplashImageUrl.value || '')
const iconSourceLabel = computed(() => pwaIconUrl.value ? '自定义图标' : (slug.value ? '系统生成图标' : '默认图标'))
const splashPositionLabel = computed(() => pwaSplashPosition.value === 'top' ? '顶部偏上' : pwaSplashPosition.value === 'upper' ? '偏上' : pwaSplashPosition.value === 'lower' ? '偏下' : pwaSplashPosition.value === 'bottom' ? '底部偏下' : '居中')
const splashSourceLabel = computed(() => pwaSplashImageUrl.value ? `独立启动背景图（位置: ${splashPositionLabel.value}）` : '未设置，前台回退至相册封面')
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
  if (!newName.value.trim()) return ElMessage.warning('请输入相册名称')
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
