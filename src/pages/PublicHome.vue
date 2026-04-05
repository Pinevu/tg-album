<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,#eef4ff,white_40%)] text-slate-900 font-sans">
    <header class="sticky top-0 z-50 bg-white/88 backdrop-blur-2xl border-b border-slate-200/70">
      <div class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-3">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <div class="text-2xl font-bold tracking-tight">{{ albumTitle }}</div>
            <div class="text-sm text-slate-500">照片集</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="canInstallAlbum" @click="installAlbumPwa" class="rounded-2xl border border-blue-200 bg-blue-50 text-blue-600 px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-blue-100 transition">安装相册</button>
          <a href="/login" class="rounded-2xl border border-slate-200 bg-white/80 text-slate-600 px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-white hover:text-slate-800 transition">管理入口</a>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div v-if="installTip" class="max-w-md mx-auto mb-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-sm">{{ installTip }}</div>

      <div v-if="needPassword" class="max-w-md mx-auto rounded-[32px] border border-slate-200 bg-white/92 backdrop-blur p-6 shadow-lg space-y-4">
        <div><div class="text-2xl font-bold tracking-tight">{{ albumTitle }}</div><div class="text-sm text-slate-500 mt-1">输入访问密码</div></div>
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
        <el-input v-model="password" placeholder="访问密码" show-password @keyup.enter="submitPassword" />
        <el-button type="primary" class="w-full !rounded-2xl !h-11" @click="submitPassword">进入相册</el-button>
      </div>

      <div v-else-if="photos.length === 0" class="py-24 text-center text-slate-400"><div class="text-7xl mb-4">📷</div><div>暂无图片</div></div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        <div v-for="photo in photos" :key="photo.id" class="group rounded-[30px] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer" @click="preview(photo)">
          <div class="aspect-[3/4] overflow-hidden bg-slate-100"><img :src="`/api/photos/file/${photo.id}`" class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" /></div>
        </div>
      </div>
    </main>

    <div v-if="previewVisible" class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md" @click="closePreview">
      <button @click="closePreview" class="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-10 hover:bg-white/30 transition"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
      <div class="h-full flex items-center justify-center p-4"><img :src="previewUrl" class="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" @click.stop /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }> }
const route = useRoute()
const photos = ref<any[]>([])
const previewVisible = ref(false)
const previewUrl = ref('')
const password = ref('')
const error = ref('')
const needPassword = ref(false)
const albumTitle = ref('公开相册')
const slug = ref('')
const installPrompt = ref<InstallPromptEvent | null>(null)
const canInstallAlbum = ref(false)
const installTip = ref('')
let manifestLinkEl: HTMLLinkElement | null = null
const passwordCacheKey = (slugValue: string) => `private_album_auth_${slugValue}`
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

const setManifestForSlug = (slugValue?: string) => {
  const href = slugValue ? `/api/private-albums/${encodeURIComponent(slugValue)}/manifest.webmanifest` : '/manifest.webmanifest'
  let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }
  link.href = href
  manifestLinkEl = link
}

const loadPublicPhotos = async () => {
  setManifestForSlug()
  const { data } = await axios.get('/api/public/photos')
  photos.value = data.results || []
}

const initPrivateAlbum = async (slugValue: string) => {
  try {
    const pureSlug = slugValue.replace(/^app\//, '')
    const { data } = await axios.get(`/api/private-albums/${encodeURIComponent(pureSlug)}`)
    albumTitle.value = data.name || '私密相册'
    slug.value = pureSlug
    setManifestForSlug(pureSlug)
    const cached = localStorage.getItem(passwordCacheKey(pureSlug))
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.expires_at > Date.now()) {
        password.value = parsed.password
        await submitPassword()
        return
      }
      localStorage.removeItem(passwordCacheKey(pureSlug))
    }
    needPassword.value = true
  } catch {
    needPassword.value = false
    photos.value = []
    error.value = '相册不存在'
  }
}

const submitPassword = async () => {
  error.value = ''
  try {
    const { data } = await axios.post(`/api/private-albums/${encodeURIComponent(slug.value)}/auth`, { password: password.value })
    photos.value = data.results || []
    albumTitle.value = data.album?.name || albumTitle.value
    needPassword.value = false
    localStorage.setItem(passwordCacheKey(slug.value), JSON.stringify({ password: password.value, expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  } catch (e: any) {
    error.value = e?.response?.data?.error || '访问失败'
  }
}
const preview = (photo: any) => { previewUrl.value = `/api/photos/file/${photo.id}`; previewVisible.value = true }
const closePreview = () => { previewVisible.value = false; previewUrl.value = '' }
const handleBeforeInstallPrompt = (event: Event) => { event.preventDefault(); installPrompt.value = event as InstallPromptEvent; canInstallAlbum.value = !!slug.value }
const installAlbumPwa = async () => {
  if (!slug.value) return
  const appUrl = `${location.origin}/app/${encodeURIComponent(slug.value)}`
  if (isIOS()) {
    installTip.value = '即将打开专属安装页。请在 Safari 中点分享按钮，再选择“添加到主屏幕”。'
    location.href = appUrl
    return
  }
  if (installPrompt.value) {
    await installPrompt.value.prompt()
    await installPrompt.value.userChoice.catch(() => null)
    return
  }
  installTip.value = `如果没有出现安装弹窗，请直接打开：${appUrl}`
}

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  const slugParam = route.params.slug as string | undefined
  if (slugParam) { canInstallAlbum.value = true; await initPrivateAlbum(slugParam) }
  else { canInstallAlbum.value = false; await loadPublicPhotos() }
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  if (manifestLinkEl && !slug.value) manifestLinkEl.href = '/manifest.webmanifest'
})
</script>
