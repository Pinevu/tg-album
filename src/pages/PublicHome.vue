<template>
  <div class="min-h-screen bg-white text-slate-900 font-sans flex flex-col" :class="[isStandalone ? 'standalone-safe' : '', isStandaloneSlideshow ? 'h-[100svh] overflow-hidden' : '']">
    <transition name="fade-scale">
      <div v-if="showSplash" class="fixed inset-0 z-[120] overflow-hidden bg-white flex items-center justify-center px-6">
        <img v-if="splashBgUrl" :src="splashBgUrl" class="absolute inset-0 w-full h-full object-cover scale-[1.08] animate-splash-zoom" :style="{ objectPosition: splashBgPosition }" />
        <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,.08),rgba(15,23,42,.52))]"></div>
        <div class="relative text-center animate-splash-rise-soft px-8">
          <img :src="iconUrl" class="w-24 h-24 rounded-[28px] shadow-[0_20px_40px_rgba(15,23,42,0.22)] border border-white/65 mx-auto object-cover" />
          <div class="mt-5 text-[29px] font-bold tracking-tight text-white">{{ albumTitle }}</div>
          <div class="mt-1 text-sm text-white/85">正在打开你的独立相册…</div>
        </div>
      </div>
    </transition>

    <header class="sticky top-0 z-50 bg-white/98 backdrop-blur-2xl border-b border-slate-200/50">
      <div class="max-w-6xl mx-auto px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 flex items-center justify-between gap-3">
        <div class="min-w-0 flex items-center gap-3 flex-1">
          <img :src="iconUrl" class="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-200 shrink-0" />
          <div class="min-w-0">
            <div class="text-[18px] md:text-[22px] font-bold tracking-tight text-slate-900 truncate">{{ albumTitle }}</div>
            <div class="text-xs md:text-sm text-slate-500 truncate">{{ isStandalone ? '独立相册' : (isPrivate ? '私密相册' : '摄影作品流') }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button v-if="canInstallAlbum && !isStandalone && isPrivate" @click="installAlbumPwa" class="top-btn top-btn-neutral">安装相册</button>
          <a v-if="!isStandalone" href="/login" class="top-btn top-btn-white">管理入口</a>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto w-full px-4 py-5 bg-white select-none" :class="isStandaloneSlideshow ? 'flex-1 min-h-0 flex flex-col overflow-hidden space-y-4' : 'space-y-5'" style="overscroll-behavior-y:none; touch-action: pan-y;">
      <div v-if="showInstallGuide" class="max-w-3xl mx-auto rounded-[32px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden">
        <div class="relative min-h-[240px] md:min-h-[280px] overflow-hidden bg-slate-900">
          <img v-if="splashBgUrl" :src="splashBgUrl" class="absolute inset-0 w-full h-full object-cover opacity-90" :style="{ objectPosition: splashBgPosition }" />
          <div class="absolute inset-0 bg-gradient-to-b from-black/10 to-black/55"></div>
          <div class="relative p-7 md:p-8 text-white flex flex-col justify-end min-h-[240px] md:min-h-[280px]">
            <img :src="iconUrl" class="w-20 h-20 rounded-[24px] border border-white/70 shadow-2xl object-cover" />
            <div class="mt-4 text-3xl font-bold tracking-tight">{{ albumTitle }}</div>
            <div class="mt-2 text-sm text-white/85">把这个私密相册安装到主屏幕，像独立 App 一样直接打开。</div>
          </div>
        </div>
        <div class="p-5 bg-white">
          <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-600">
            <div>1. 先确认你现在打开的是专属安装页</div>
            <div>2. 点击 Safari 的分享按钮</div>
            <div>3. 选择“添加到主屏幕”</div>
            <div>4. 保持名称为「{{ albumTitle }}」，确认添加</div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button @click="installAlbumPwa" class="rounded-2xl bg-slate-900 text-white px-4 py-2.5 text-sm font-medium shadow-sm">立即安装</button>
            <a :href="normalAlbumUrl" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">普通浏览打开</a>
          </div>
        </div>
      </div>

      <div v-if="installTip" class="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 px-4 py-3 text-sm">{{ installTip }}</div>

      <div v-if="needPassword" class="max-w-md mx-auto rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <div class="text-2xl font-bold tracking-tight">{{ albumTitle }}</div>
          <div class="text-sm text-slate-500 mt-1">输入访问密码</div>
        </div>
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
        <el-input v-model="password" placeholder="访问密码" show-password @keyup.enter="submitPassword" />
        <el-button type="primary" class="w-full !rounded-2xl !h-11" @click="submitPassword">进入相册</el-button>
      </div>

      <div v-else-if="photos.length === 0" class="py-24 text-center text-slate-400"><div class="text-7xl mb-4">📷</div><div>暂无图片</div></div>

      <div v-else :class="isStandaloneSlideshow ? 'flex-1 min-h-0 flex flex-col space-y-4' : 'space-y-5'">
        <template v-if="publicLayoutMode === 'slideshow'">
          <div class="relative rounded-[30px] overflow-hidden bg-white border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]" :class="isStandaloneSlideshow ? 'flex-1 min-h-0' : ''">
            <div ref="heroRef" class="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth carousel-touch" :class="isStandaloneSlideshow ? 'h-full' : ''" @scroll.passive="onHeroScroll" @touchstart="pauseForInteraction">
              <div v-for="photo in photos" :key="photo.id" class="w-full shrink-0 snap-center">
                <div class="relative bg-slate-100 overflow-hidden" :class="isStandaloneSlideshow ? 'h-full min-h-0' : 'aspect-[4/5] sm:aspect-[16/11] md:aspect-[21/9]'">
                  <img :src="photoSrc(photo)" class="w-full h-full object-cover" @click="openViewerByPhoto(photo)" :loading="imageLoadingAttr" />
                  <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent text-white">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <div class="text-lg font-semibold">{{ albumTitle }}</div>
                      </div>
                      <button @click.stop="toggleSlideShow" class="rounded-full px-3 py-1.5 text-xs bg-white/20 backdrop-blur text-white">{{ slidePaused ? '继续' : '暂停' }}</button>
                    </div>
                    <div class="flex gap-1.5 mt-3">
                      <span v-for="(dot, idx) in photos" :key="dot.id" class="w-2 h-2 rounded-full transition-all" :class="idx === currentSlideIndex ? 'bg-white w-5' : 'bg-white/50'"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto no-scrollbar carousel-touch shrink-0">
            <div class="flex gap-3 min-w-max snap-x snap-mandatory">
              <button v-for="(photo, idx) in photos" :key="photo.id" @click="goToSlide(idx)" class="rounded-[22px] overflow-hidden border transition-all duration-200 snap-start" :class="idx === currentSlideIndex ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200'">
                <img :src="photoSrc(photo)" class="w-24 h-32 sm:w-28 sm:h-36 object-cover" :loading="imageLoadingAttr" />
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="publicLayoutMode === 'waterfall'">
          <div class="columns-2 md:columns-3 xl:columns-4 gap-4 md:gap-5 [column-fill:_balance]">
            <div v-for="photo in photos" :key="photo.id" class="mb-4 md:mb-5 break-inside-avoid cursor-pointer" @click="openViewerByPhoto(photo)">
              <div class="group rounded-[26px] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                <img :src="photoSrc(photo)" class="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500" :loading="imageLoadingAttr" />
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            <div v-for="photo in photos" :key="photo.id" class="group rounded-[30px] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer" @click="openViewerByPhoto(photo)">
              <div class="aspect-[3/4] overflow-hidden bg-slate-100">
                <img :src="photoSrc(photo)" class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" :loading="imageLoadingAttr" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <div v-if="viewerVisible" class="fixed inset-0 z-[110] bg-black" :style="{ backgroundColor: `rgba(0,0,0,${viewerBgOpacity})` }" @click.self="closeViewer">
      <div class="absolute inset-0 overflow-hidden touch-none" @touchstart="onViewerTouchStart" @touchmove="onViewerTouchMove" @touchend="onViewerTouchEnd">
        <div class="absolute inset-x-0 top-[max(env(safe-area-inset-top),10px)] z-20 flex items-center justify-between px-4 transition-opacity duration-300" :class="hudVisible ? 'opacity-100' : 'opacity-0'">
          <div class="rounded-full bg-black/28 text-white/95 text-[10px] px-3 py-1.5 backdrop-blur-md border border-white/10 tracking-wide max-w-[72vw] truncate">{{ viewerIndex + 1 }} / {{ photos.length }} · {{ currentViewerPhoto?.original_filename || '照片' }}</div>
          <button @click="closeViewer" class="w-11 h-11 rounded-full bg-black/28 backdrop-blur-md border border-white/10 text-white flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="h-full flex items-center justify-center overflow-hidden" :style="viewerContainerStyle">
          <div class="relative w-full h-full flex items-center justify-center">
            <img
              v-if="currentViewerPhoto"
              :src="photoSrc(currentViewerPhoto)"
              class="max-w-full max-h-full object-contain select-none"
              :style="viewerImageStyle"
              draggable="false"
              :loading="imageLoadingAttr"
            />
          </div>
        </div>

        <div class="absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),16px)] z-20 flex flex-col items-center gap-3 transition-opacity duration-300" :class="hudVisible ? 'opacity-100' : 'opacity-0'">
          <div class="rounded-full bg-black/28 text-white/90 text-xs px-3 py-1.5 backdrop-blur-md border border-white/10">双击放大 · 左右切图 · 下滑关闭</div>
          <div ref="viewerStripRef" class="max-w-full overflow-x-auto no-scrollbar px-4">
            <div class="flex gap-2 min-w-max">
              <button v-for="(photo, idx) in photos" :key="`viewer-${photo.id}`" @click.stop="jumpViewerTo(idx)" class="rounded-2xl overflow-hidden border-2 transition-all duration-200" :class="idx === viewerIndex ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.25)]' : 'border-white/20'">
                <img :src="photoSrc(photo)" class="w-14 h-18 object-cover" :loading="imageLoadingAttr" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }> }
const route = useRoute()
const heroRef = ref<HTMLDivElement | null>(null)
const viewerStripRef = ref<HTMLDivElement | null>(null)
const photos = ref<any[]>([])
const password = ref('')
const error = ref('')
const needPassword = ref(false)
const albumTitle = ref('相册系统')
const slug = ref('')
const installPrompt = ref<InstallPromptEvent | null>(null)
const canInstallAlbum = ref(false)
const installTip = ref('')
const iconVersion = ref('')
const isStandalone = ref(false)
const showSplash = ref(false)
const coverPhotoId = ref<number | null>(null)
const albumVisibility = ref<'public' | 'private'>('public')
const currentSlideIndex = ref(0)
let slideTimer: any = null
const slidePaused = ref(false)
let manifestLinkEl: HTMLLinkElement | null = null
const siteTitle = ref('相册系统')
const publicLayoutMode = ref<'waterfall' | 'grid' | 'slideshow'>('grid')
const lazyLoadEnabled = ref(true)

const viewerVisible = ref(false)
const viewerOpening = ref(false)
const viewerIndex = ref(0)
const viewerScale = ref(1)
const viewerTranslateX = ref(0)
const viewerTranslateY = ref(0)
const viewerTouchStartX = ref(0)
const viewerTouchStartY = ref(0)
const viewerLastTapAt = ref(0)
const viewerPinchStartDistance = ref(0)
const viewerPinchStartScale = ref(1)
const viewerStartTranslateX = ref(0)
const viewerStartTranslateY = ref(0)
const viewerTapX = ref(0)
const viewerTapY = ref(0)
const viewerBgOpacity = ref(0.96)
const hudVisible = ref(true)
let hudTimer: any = null
const isPinching = ref(false)
const isDraggingZoomed = ref(false)

const passwordCacheKey = (slugValue: string) => `private_album_auth_${slugValue}`
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isInstallRoute = computed(() => route.path.startsWith('/app/'))
const isPrivate = computed(() => albumVisibility.value === 'private')
const showInstallGuide = computed(() => !!slug.value && isInstallRoute.value && !isStandalone.value)
const iconUrl = computed(() => slug.value ? `/api/private-albums/${encodeURIComponent(slug.value)}/icon/version/${iconVersion.value || 'default'}.png` : '/icon.svg')
const splashImageUrl = ref('')
const splashImagePosition = ref('center')
const coverUrl = computed(() => coverPhotoId.value ? `/api/photos/file/${coverPhotoId.value}` : '')
const splashBgUrl = computed(() => splashImageUrl.value || coverUrl.value)
const splashBgPosition = computed(() => splashImagePosition.value === 'top' ? 'center 10%' : splashImagePosition.value === 'upper' ? 'center 30%' : splashImagePosition.value === 'lower' ? 'center 70%' : splashImagePosition.value === 'bottom' ? 'center 90%' : 'center center')
const normalAlbumUrl = computed(() => slug.value ? `/${encodeURIComponent(slug.value)}` : '/')
const currentViewerPhoto = computed(() => photos.value[viewerIndex.value] || null)
const imageLoadingAttr = computed(() => lazyLoadEnabled.value ? 'lazy' : 'eager')
const photoSrc = (photo: any) => `/api/photos/file/${photo.id}`
const isStandaloneSlideshow = computed(() => isStandalone.value && publicLayoutMode.value === 'slideshow' && photos.value.length > 0)

const viewerImageStyle = computed(() => ({
  transform: `translate3d(${viewerTranslateX.value}px, ${viewerTranslateY.value}px, 0) scale(${viewerScale.value * (viewerOpening.value ? 0.96 : 1)})`,
  opacity: viewerOpening.value ? 0.92 : 1,
  transition: isPinching.value || isDraggingZoomed.value ? 'none' : 'transform .32s cubic-bezier(.16,1,.3,1), opacity .28s ease',
  touchAction: 'none'
}))
const viewerDismissScale = computed(() => viewerScale.value > 1 ? 1 : Math.max(0.82, 1 - Math.abs(viewerTranslateY.value) / 780))
const viewerContainerStyle = computed(() => ({
  transform: viewerScale.value === 1 ? `translate3d(${viewerTranslateX.value}px, ${viewerTranslateY.value}px, 0) scale(${viewerDismissScale.value})` : 'translate3d(0,0,0) scale(1)',
  transition: isPinching.value || isDraggingZoomed.value ? 'none' : 'transform .34s cubic-bezier(.16,1,.3,1)',
  opacity: viewerBgOpacity.value
}))

const showHudTemporarily = () => {
  hudVisible.value = true
  if (hudTimer) clearTimeout(hudTimer)
  hudTimer = setTimeout(() => { if (viewerVisible.value) hudVisible.value = false }, 1400)
}

const centerViewerStrip = () => {
  if (!viewerStripRef.value) return
  const el = viewerStripRef.value.querySelectorAll('button')[viewerIndex.value] as HTMLElement | undefined
  if (!el) return
  const container = viewerStripRef.value
  const left = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
  container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
}

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
  const title = slug.value ? `${albumTitle.value} · 私密相册` : siteTitle.value
  const desc = slug.value ? `打开私密相册 ${albumTitle.value}，可安装到主屏幕作为独立相册使用。` : siteTitle.value
  document.title = title
  const setMeta = (name: string, content: string) => {
    let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
    if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el) }
    el.content = content
  }
  setMeta('description', desc)
  setMeta('theme-color', '#ffffff')
  setMeta('apple-mobile-web-app-capable', 'yes')
  setMeta('apple-mobile-web-app-status-bar-style', 'default')
  setMeta('apple-mobile-web-app-title', slug.value ? albumTitle.value : siteTitle.value)
  setMeta('mobile-web-app-capable', 'yes')
  let apple = document.head.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null
  if (!apple) { apple = document.createElement('link'); apple.rel = 'apple-touch-icon'; document.head.appendChild(apple) }
  apple.href = iconUrl.value
}

const applyFrontendSettings = (settings: any) => {
  siteTitle.value = settings?.site_title || '相册系统'
  publicLayoutMode.value = (settings?.public_layout_mode || 'grid') as any
  lazyLoadEnabled.value = settings?.lazy_load_enabled !== false && settings?.lazy_load_enabled !== 'false' && settings?.lazy_load_enabled !== '0'
}

const loadPublicPhotos = async () => {
  slug.value = ''
  iconVersion.value = ''
  setManifestForSlug()
  const { data } = await axios.get('/api/public/photos')
  applyFrontendSettings(data.settings || {})
  albumTitle.value = siteTitle.value || '相册系统'
  albumVisibility.value = 'public'
  coverPhotoId.value = null
  splashImageUrl.value = ''
  splashImagePosition.value = 'center'
  syncHead()
  photos.value = data.results || []
  currentSlideIndex.value = 0
  startSlideShow()
}

const initPrivateAlbum = async (slugValue: string) => {
  try {
    const pureSlug = slugValue.replace(/^app\//, '')
    const { data } = await axios.get(`/api/private-albums/${encodeURIComponent(pureSlug)}`)
    albumTitle.value = data.name || '私密相册'
    albumVisibility.value = 'private'
    slug.value = pureSlug
    iconVersion.value = data.icon_version || ''
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
    splashImageUrl.value = data.pwa_splash_image_url || ''
    splashImagePosition.value = data.pwa_splash_position || 'center'
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
    albumTitle.value = data.album?.name || albumTitle.value
    coverPhotoId.value = data.album?.cover_photo_id || photos.value[0]?.id || null
    splashImageUrl.value = data.album?.pwa_splash_image_url || ''
    splashImagePosition.value = data.album?.pwa_splash_position || 'center'
    iconVersion.value = data.album?.pwa_icon_url || data.album?.cover_photo_id ? `${Date.now()}` : iconVersion.value
    needPassword.value = false
    applyFrontendSettings(data.settings || {})
    syncHead()
    startSlideShow()
    localStorage.setItem(passwordCacheKey(slug.value), JSON.stringify({ password: password.value, expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  } catch (e: any) {
    error.value = e?.response?.data?.error || '访问失败'
  }
}

const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!heroRef.value) return
  heroRef.value.scrollTo({ left: heroRef.value.clientWidth * index, behavior })
}
const onHeroScroll = () => {
  if (!heroRef.value) return
  const index = Math.round(heroRef.value.scrollLeft / heroRef.value.clientWidth)
  currentSlideIndex.value = Math.max(0, Math.min(index, photos.value.length - 1))
}
const goToSlide = (index: number) => { currentSlideIndex.value = index; slidePaused.value = true; scrollToIndex(index) }
const startSlideShow = () => {
  if (slideTimer) clearInterval(slideTimer)
  if (publicLayoutMode.value !== 'slideshow') return
  if (photos.value.length <= 1 || slidePaused.value) return
  slideTimer = setInterval(() => {
    const next = (currentSlideIndex.value + 1) % photos.value.length
    currentSlideIndex.value = next
    scrollToIndex(next)
  }, 4200)
}
const toggleSlideShow = () => { slidePaused.value = !slidePaused.value; startSlideShow() }
const pauseForInteraction = () => { slidePaused.value = true; startSlideShow() }

const jumpViewerTo = (index: number) => { viewerIndex.value = index; resetViewerTransform(); showHudTemporarily(); setTimeout(centerViewerStrip, 10) }

const openViewerByPhoto = (photo: any) => {
  const idx = photos.value.findIndex((p: any) => p.id === photo.id)
  viewerIndex.value = idx >= 0 ? idx : 0
  viewerOpening.value = true
  viewerVisible.value = true
  resetViewerTransform()
  showHudTemporarily()
  setTimeout(() => { viewerOpening.value = false }, 40)
  setTimeout(centerViewerStrip, 10)
}
const closeViewer = () => {
  viewerOpening.value = true
  viewerScale.value = Math.max(0.92, viewerScale.value * 0.96)
  viewerBgOpacity.value = 0
  setTimeout(() => {
    viewerVisible.value = false
    viewerOpening.value = false
    resetViewerTransform()
    viewerBgOpacity.value = 0.96
  }, 160)
}
const resetViewerTransform = () => {
  viewerScale.value = 1
  viewerTranslateX.value = 0
  viewerTranslateY.value = 0
  isPinching.value = false
  isDraggingZoomed.value = false
}
const zoomAtPoint = (clientX: number, clientY: number) => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const dx = clientX - vw / 2
  const dy = clientY - vh / 2
  if (viewerScale.value < 1.5) {
    viewerScale.value = 2
    viewerTranslateX.value = -dx * 0.35
    viewerTranslateY.value = -dy * 0.35
  } else if (viewerScale.value < 2.5) {
    viewerScale.value = 3
    viewerTranslateX.value = -dx * 0.55
    viewerTranslateY.value = -dy * 0.55
  } else {
    resetViewerTransform()
  }
}
const onViewerTouchStart = (e: TouchEvent) => {
  showHudTemporarily()
  if (e.touches.length === 2) {
    isPinching.value = true
    viewerPinchStartDistance.value = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    viewerPinchStartScale.value = viewerScale.value
    return
  }
  viewerTouchStartX.value = e.touches[0]?.clientX || 0
  viewerTouchStartY.value = e.touches[0]?.clientY || 0
  viewerTapX.value = viewerTouchStartX.value
  viewerTapY.value = viewerTouchStartY.value
  viewerStartTranslateX.value = viewerTranslateX.value
  viewerStartTranslateY.value = viewerTranslateY.value
  if (viewerScale.value > 1) isDraggingZoomed.value = true
  const now = Date.now()
  if (now - viewerLastTapAt.value < 260) {
    zoomAtPoint(viewerTapX.value, viewerTapY.value)
  }
  viewerLastTapAt.value = now
}
const onViewerTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    viewerScale.value = Math.min(4, Math.max(1, viewerPinchStartScale.value * (dist / Math.max(1, viewerPinchStartDistance.value))))
    return
  }
  const dx = (e.touches[0]?.clientX || 0) - viewerTouchStartX.value
  const dy = (e.touches[0]?.clientY || 0) - viewerTouchStartY.value
  if (viewerScale.value > 1) {
    viewerTranslateX.value = (viewerStartTranslateX.value + dx) * 0.88
    viewerTranslateY.value = (viewerStartTranslateY.value + dy) * 0.88
  } else {
    viewerTranslateX.value = dx * 0.24
    viewerTranslateY.value = Math.max(0, dy)
    viewerBgOpacity.value = Math.max(0.12, 0.96 - Math.abs(dy) / 180)
  }
}
const onViewerTouchEnd = (e: TouchEvent) => {
  if (isPinching.value) {
    isPinching.value = false
    if (viewerScale.value <= 1.02) resetViewerTransform()
    return
  }
  const dx = (e.changedTouches[0]?.clientX || 0) - viewerTouchStartX.value
  const dy = (e.changedTouches[0]?.clientY || 0) - viewerTouchStartY.value
  if (viewerScale.value > 1) {
    isDraggingZoomed.value = false
    const limitX = window.innerWidth * 0.42 * (viewerScale.value - 1)
    const limitY = window.innerHeight * 0.42 * (viewerScale.value - 1)
    viewerTranslateX.value = Math.max(-limitX, Math.min(limitX, viewerTranslateX.value))
    viewerTranslateY.value = Math.max(-limitY, Math.min(limitY, viewerTranslateY.value))
    return
  }
  if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
    viewerTranslateX.value = dx < 0 ? -68 : 68
    setTimeout(() => {
      if (dx < 0 && viewerIndex.value < photos.value.length - 1) viewerIndex.value += 1
      if (dx > 0 && viewerIndex.value > 0) viewerIndex.value -= 1
      viewerTranslateX.value = 0
      viewerTranslateY.value = 0
      viewerBgOpacity.value = 0.96
      showHudTemporarily()
      centerViewerStrip()
    }, 90)
    return
  }
  if (dy > 100) {
    closeViewer()
    return
  }
  viewerTranslateX.value = 0
  viewerTranslateY.value = 0
  viewerBgOpacity.value = 0.96
}

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

watch(viewerIndex, () => {
  if (viewerVisible.value) {
    setTimeout(centerViewerStrip, 10)
    showHudTemporarily()
  }
})

onMounted(async () => {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  showSplash.value = isStandalone.value
  if (showSplash.value) setTimeout(() => { showSplash.value = false }, 1850)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  const slugParam = route.params.slug as string | undefined
  if (slugParam) { canInstallAlbum.value = true; await initPrivateAlbum(slugParam) }
  else { canInstallAlbum.value = false; await loadPublicPhotos() }
})

onBeforeUnmount(() => {
  if (slideTimer) clearInterval(slideTimer)
  if (hudTimer) clearTimeout(hudTimer)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  if (manifestLinkEl && !slug.value) manifestLinkEl.href = '/manifest.webmanifest'
})
</script>

<style scoped>
.standalone-safe { padding-top: env(safe-area-inset-top); background:#fff; }
.top-btn { height: 44px; padding: 0 16px; border-radius: 18px; font-size: 15px; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(15,23,42,.05); }
.top-btn-neutral { background:#f8fafc; border:1px solid #e2e8f0; color:#0f172a; }
.top-btn-white { background:#fff; border:1px solid #e2e8f0; color:#475569; }
.poster-card { border-radius: 32px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 10px 30px rgba(15,23,42,.05); }
.poster-cover { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.poster-overlay { position:absolute; inset:0; background: linear-gradient(to bottom, rgba(15,23,42,.18), rgba(15,23,42,.55)); }
.poster-content { position:relative; z-index:1; padding:28px; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; min-height:260px; }
.carousel-touch { -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; }
.no-scrollbar::-webkit-scrollbar { display:none; }
.no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
.fade-scale-enter-active, .fade-scale-leave-active { transition: opacity .35s ease, transform .35s ease; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(1.02); }
@keyframes splash-rise { 0% { opacity: 0; transform: translateY(14px) scale(.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes splash-zoom { 0% { transform: scale(1.16); opacity: .82; } 100% { transform: scale(1.08); opacity: 1; } }
.animate-splash-rise-soft { animation: splash-rise .52s cubic-bezier(.22,1,.36,1) both; }
.animate-splash-zoom { animation: splash-zoom 1.15s ease-out both; }
</style>
