<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,white_42%)] text-slate-900 font-sans" :class="isStandalone ? 'pb-6 standalone-safe' : ''">
    <transition name="fade-scale">
      <div v-if="showSplash" class="fixed inset-0 z-[120] bg-[radial-gradient(circle_at_top,#bfdbfe,#ffffff_60%)] flex items-center justify-center px-6">
        <div class="text-center animate-splash-rise">
          <img :src="iconUrl" class="w-24 h-24 rounded-[28px] shadow-2xl border border-white/70 mx-auto object-cover" />
          <div class="mt-5 text-2xl font-bold tracking-tight text-slate-900">{{ albumTitle }}</div>
          <div class="mt-1 text-sm text-slate-500">正在打开你的独立相册…</div>
        </div>
      </div>
    </transition>

    <header class="sticky top-0 z-50 bg-white/82 backdrop-blur-2xl border-b border-slate-200/70">
      <div class="max-w-6xl mx-auto px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 flex items-center justify-between gap-3">
        <div class="min-w-0 flex items-center gap-3 flex-1">
          <img :src="iconUrl" class="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-blue-500/15 border border-white/80 shrink-0" />
          <div class="min-w-0">
            <div class="text-[18px] md:text-[22px] font-bold tracking-tight text-slate-900 truncate">{{ albumTitle }}</div>
            <div class="text-xs md:text-sm text-slate-500 truncate">{{ isStandalone ? '独立相册' : '照片集' }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button v-if="canInstallAlbum && !isStandalone" @click="installAlbumPwa" class="top-btn top-btn-blue">安装相册</button>
          <a v-if="!isStandalone" href="/login" class="top-btn top-btn-white">管理入口</a>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-5 space-y-4">
      <div v-if="showInstallGuide" class="poster-card max-w-3xl mx-auto overflow-hidden">
        <div class="poster-hero">
          <img v-if="coverUrl" :src="coverUrl" class="poster-cover" />
          <div class="poster-overlay"></div>
          <div class="poster-content">
            <img :src="iconUrl" class="w-20 h-20 rounded-[24px] border border-white/70 shadow-2xl object-cover" />
            <div class="mt-4 text-3xl font-bold tracking-tight text-white">{{ albumTitle }}</div>
            <div class="mt-2 text-sm text-white/85">把这个私密相册安装到主屏幕，像独立 App 一样直接打开。</div>
          </div>
        </div>
        <div class="p-5 bg-white">
          <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-600">
            <template v-if="isIOS()">
              <div>1. 先确认你现在打开的是专属安装页</div>
              <div>2. 点击 Safari 的分享按钮</div>
              <div>3. 选择“添加到主屏幕”</div>
              <div>4. 保持名称为「{{ albumTitle }}」，确认添加</div>
            </template>
            <template v-else>
              <div>1. 点击下方“立即安装”</div>
              <div>2. 如未弹出安装框，请在浏览器菜单中选择“安装应用”</div>
            </template>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button @click="installAlbumPwa" class="rounded-2xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium shadow-sm">立即安装</button>
            <a :href="normalAlbumUrl" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">普通浏览打开</a>
          </div>
        </div>
      </div>

      <div v-if="installTip" class="max-w-lg mx-auto rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-sm">{{ installTip }}</div>

      <div v-if="isStandalone && showWelcomeCard" class="max-w-3xl mx-auto rounded-[30px] border border-white/80 bg-white/86 backdrop-blur-xl shadow-lg overflow-hidden">
        <div class="p-5 md:p-6 flex items-center gap-4">
          <img :src="iconUrl" class="w-16 h-16 rounded-[20px] object-cover shadow-lg border border-slate-200" />
          <div class="min-w-0 flex-1">
            <div class="text-lg font-semibold text-slate-900 truncate">欢迎回来，{{ albumTitle }}</div>
            <div class="text-sm text-slate-500 mt-1">现在你正以独立相册模式浏览。</div>
          </div>
          <button @click="showWelcomeCard = false" class="text-slate-400 text-sm shrink-0">关闭</button>
        </div>
      </div>

      <div v-if="needPassword" class="max-w-md mx-auto rounded-[32px] border border-slate-200 bg-white/92 backdrop-blur p-6 shadow-lg space-y-4">
        <div>
          <div class="text-2xl font-bold tracking-tight">{{ albumTitle }}</div>
          <div class="text-sm text-slate-500 mt-1">输入访问密码</div>
        </div>
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
        <el-input v-model="password" placeholder="访问密码" show-password @keyup.enter="submitPassword" />
        <el-button type="primary" class="w-full !rounded-2xl !h-11" @click="submitPassword">进入相册</el-button>
      </div>

      <div v-else-if="photos.length === 0" class="py-24 text-center text-slate-400"><div class="text-7xl mb-4">📷</div><div>暂无图片</div></div>

      <div v-else class="space-y-5">
        <div class="relative rounded-[30px] overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div class="aspect-[16/11] md:aspect-[21/9] bg-slate-100 overflow-hidden">
            <img :src="`/api/photos/file/${currentSlide.id}`" class="w-full h-full object-cover" @click="preview(currentSlide)" />
          </div>
          <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/55 to-transparent text-white">
            <div class="text-lg font-semibold">{{ albumTitle }}</div>
            <div class="text-sm text-white/85">左右滑动缩略图，或等待自动播放</div>
          </div>
        </div>

        <div class="overflow-x-auto no-scrollbar">
          <div class="flex gap-3 min-w-max">
            <button v-for="(photo, idx) in photos" :key="photo.id" @click="goToSlide(idx)" class="rounded-[22px] overflow-hidden border transition-all duration-200" :class="idx === currentSlideIndex ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'">
              <img :src="`/api/photos/file/${photo.id}`" class="w-28 h-36 object-cover" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          <div v-for="photo in photos" :key="photo.id" class="group rounded-[30px] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer" @click="preview(photo)">
            <div class="aspect-[3/4] overflow-hidden bg-slate-100">
              <img :src="`/api/photos/file/${photo.id}`" class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
            </div>
          </div>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const albumTitle = ref('相册系统')
const slug = ref('')
const installPrompt = ref<InstallPromptEvent | null>(null)
const canInstallAlbum = ref(false)
const installTip = ref('')
const isStandalone = ref(false)
const showSplash = ref(false)
const showWelcomeCard = ref(true)
const coverPhotoId = ref<number | null>(null)
const currentSlideIndex = ref(0)
let slideTimer: any = null
let manifestLinkEl: HTMLLinkElement | null = null
const passwordCacheKey = (slugValue: string) => `private_album_auth_${slugValue}`
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isInstallRoute = computed(() => route.path.startsWith('/app/'))
const showInstallGuide = computed(() => !!slug.value && isInstallRoute.value && !isStandalone.value)
const iconUrl = computed(() => slug.value ? `/api/private-albums/${encodeURIComponent(slug.value)}/icon.svg` : '/icon.svg')
const coverUrl = computed(() => coverPhotoId.value ? `/api/photos/file/${coverPhotoId.value}` : '')
const normalAlbumUrl = computed(() => slug.value ? `/${encodeURIComponent(slug.value)}` : '/')
const currentSlide = computed(() => photos.value[currentSlideIndex.value] || photos.value[0] || { id: coverPhotoId.value })

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

const syncHead = () => {
  const title = slug.value ? `${albumTitle.value} · 私密相册` : '相册系统'
  const desc = slug.value ? `打开私密相册 ${albumTitle.value}，可安装到主屏幕作为独立相册使用。` : '相册系统'
  document.title = title
  const setMeta = (name: string, content: string) => {
    let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
    if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el) }
    el.content = content
  }
  setMeta('description', desc)
  setMeta('theme-color', '#2563eb')
  setMeta('apple-mobile-web-app-capable', 'yes')
  setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')
  setMeta('apple-mobile-web-app-title', slug.value ? albumTitle.value : '相册系统')
  setMeta('mobile-web-app-capable', 'yes')
  let apple = document.head.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null
  if (!apple) { apple = document.createElement('link'); apple.rel = 'apple-touch-icon'; document.head.appendChild(apple) }
  apple.href = iconUrl.value
}

const loadPublicPhotos = async () => {
  slug.value = ''
  albumTitle.value = '相册系统'
  coverPhotoId.value = null
  setManifestForSlug()
  syncHead()
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
    syncHead()
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
    currentSlideIndex.value = 0
    startSlideShow()
    albumTitle.value = data.album?.name || albumTitle.value
    coverPhotoId.value = data.album?.cover_photo_id || photos.value[0]?.id || null
    needPassword.value = false
    syncHead()
    localStorage.setItem(passwordCacheKey(slug.value), JSON.stringify({ password: password.value, expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  } catch (e: any) {
    error.value = e?.response?.data?.error || '访问失败'
  }
}
const preview = (photo: any) => { previewUrl.value = `/api/photos/file/${photo.id}`; previewVisible.value = true }
const goToSlide = (index: number) => { currentSlideIndex.value = index }
const startSlideShow = () => { if (slideTimer) clearInterval(slideTimer); if (photos.value.length <= 1) return; slideTimer = setInterval(() => { currentSlideIndex.value = (currentSlideIndex.value + 1) % photos.value.length }, 3200) }
const closePreview = () => { previewVisible.value = false; previewUrl.value = '' }
const handleBeforeInstallPrompt = (event: Event) => { event.preventDefault(); installPrompt.value = event as InstallPromptEvent; canInstallAlbum.value = !!slug.value }
const installAlbumPwa = async () => {
  if (!slug.value) return
  const appUrl = `${location.origin}/app/${encodeURIComponent(slug.value)}?install=1`
  if (isIOS()) {
    if (!isInstallRoute.value) { location.href = appUrl; return }
    installTip.value = '请点 Safari 分享按钮，选择“添加到主屏幕”。如果名称需要修改，也可以在弹窗里手动改成你想要的名字。'
    return
  }
  if (installPrompt.value) { await installPrompt.value.prompt(); await installPrompt.value.userChoice.catch(() => null); return }
  installTip.value = `如果没有出现安装弹窗，请直接打开：${appUrl}`
}
watch(() => route.fullPath, () => {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
})
onMounted(async () => {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  showSplash.value = isStandalone.value
  if (showSplash.value) setTimeout(() => { showSplash.value = false }, 1400)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  const slugParam = route.params.slug as string | undefined
  if (slugParam) { canInstallAlbum.value = true; await initPrivateAlbum(slugParam) }
  else { canInstallAlbum.value = false; await loadPublicPhotos() }
})
onBeforeUnmount(() => {
  if (slideTimer) clearInterval(slideTimer)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  if (manifestLinkEl && !slug.value) manifestLinkEl.href = '/manifest.webmanifest'
})
</script>

<style scoped>
.standalone-safe { padding-top: env(safe-area-inset-top); }
.top-btn { height: 44px; padding: 0 16px; border-radius: 18px; font-size: 15px; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(15,23,42,.06); }
.top-btn-blue { background:#eff6ff; border:1px solid #bfdbfe; color:#2563eb; }
.top-btn-white { background:rgba(255,255,255,.88); border:1px solid #e2e8f0; color:#475569; }
.poster-card { border-radius: 32px; border: 1px solid rgba(191,219,254,.9); background: rgba(255,255,255,.92); box-shadow: 0 18px 48px rgba(37,99,235,.12); }
.poster-hero { position: relative; min-height: 260px; background: linear-gradient(135deg, #2563eb, #4f46e5); overflow: hidden; }
.poster-cover { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.poster-overlay { position:absolute; inset:0; background: linear-gradient(to bottom, rgba(15,23,42,.18), rgba(15,23,42,.45)); }
.poster-content { position:relative; z-index:1; padding:28px; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; min-height:260px; }
.fade-scale-enter-active, .fade-scale-leave-active { transition: opacity .35s ease, transform .35s ease; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(1.02); }
@keyframes splash-rise { 0% { opacity: 0; transform: translateY(10px) scale(.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
.animate-splash-rise { animation: splash-rise .45s ease-out both; }
</style>
