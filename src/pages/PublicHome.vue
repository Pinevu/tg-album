<template>
  <div class="min-h-screen bg-white text-slate-900 font-sans flex flex-col" :class="[isStandalone ? 'standalone-safe' : '', isStandaloneSlideshow ? 'h-[100dvh] overflow-hidden' : '']">
    <!-- PWA 启动屏动画 -->
    <transition name="fade-scale">
      <div v-if="showSplash" class="fixed inset-0 z-[120] overflow-hidden bg-white flex items-center justify-center px-6">
        <img v-if="splashBgUrl" :src="splashBgUrl" class="absolute inset-0 w-full h-full object-cover scale-[1.06] animate-splash-zoom" :style="{ objectPosition: splashBgPosition }" />
        <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.12),rgba(15,23,42,0.6))]"></div>
        <div class="relative text-center animate-splash-rise-soft px-8">
          <img :src="iconUrl" class="w-20 h-20 rounded-[24px] shadow-[0_16px_36px_rgba(15,23,42,0.25)] border border-white/70 mx-auto object-cover" />
          <div class="mt-4 text-2xl font-bold tracking-tight text-white">{{ albumTitle }}</div>
          <div class="mt-1 text-xs text-white/80">正在载入相册…</div>
        </div>
      </div>
    </transition>

    <!-- 顶栏导航 -->
    <header v-if="isStandaloneSlideshow" class="sticky top-0 z-40 shrink-0 bg-white/85 backdrop-blur-xl border-b border-slate-100">
      <div class="max-w-6xl mx-auto px-4 pt-[max(env(safe-area-inset-top),8px)] pb-2 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm font-bold text-slate-900 tracking-tight truncate">{{ albumTitle }}</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 shrink-0">
            {{ currentSlideIndex + 1 }} / {{ photos.length }}
          </span>
        </div>
        <button
          type="button"
          @click.stop="toggleSlideShow"
          class="h-7 px-3 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 shrink-0"
        >
          <span>{{ slidePaused ? '▶ 继续' : '⏸ 暂停' }}</span>
        </button>
      </div>
    </header>

    <header v-else class="sticky top-0 z-40 shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
      <div class="max-w-6xl mx-auto px-4 pt-[max(env(safe-area-inset-top),8px)] pb-3 flex items-center justify-between gap-3">
        <div class="min-w-0 flex items-center gap-2.5 flex-1">
          <img :src="iconUrl" class="w-9 h-9 rounded-xl object-cover border border-slate-200/80 shadow-2xs shrink-0" />
          <div class="min-w-0">
            <div class="text-[15px] md:text-[17px] font-bold tracking-tight text-slate-900 truncate">{{ albumTitle }}</div>
            <div class="text-[11px] text-slate-400 font-medium truncate">{{ isStandalone ? '独立应用' : (isPrivate ? '私密相册' : '作品流') }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button v-if="canInstallAlbum && !isStandalone && isPrivate" @click="installAlbumPwa" class="ios-btn !bg-slate-900 !text-white !border-slate-900">安装相册</button>
          <a v-if="!isStandalone" href="/login" class="ios-btn">管理后台</a>
        </div>
      </div>
    </header>

    <!-- 主体区域 -->
    <main
      class="max-w-6xl mx-auto w-full px-3 md:px-4 select-none"
      :class="isStandaloneSlideshow ? 'flex-1 min-h-0 flex flex-col overflow-hidden pt-2 pb-[max(env(safe-area-inset-bottom),8px)] space-y-2.5' : 'py-5 space-y-5'"
      style="overscroll-behavior-y:none; touch-action: pan-y;"
    >
      <!-- 安装提示横幅 -->
      <div v-if="showInstallGuide" class="max-w-xl mx-auto rounded-[28px] border border-slate-200 bg-white shadow-md overflow-hidden">
        <div class="relative min-h-[200px] overflow-hidden bg-slate-950">
          <img v-if="splashBgUrl" :src="splashBgUrl" class="absolute inset-0 w-full h-full object-cover opacity-85" :style="{ objectPosition: splashBgPosition }" />
          <div class="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60"></div>
          <div class="relative p-6 text-white flex flex-col justify-end min-h-[200px]">
            <img :src="iconUrl" class="w-16 h-16 rounded-2xl border border-white/60 shadow-lg object-cover" />
            <div class="mt-3 text-2xl font-bold tracking-tight">{{ albumTitle }}</div>
            <div class="mt-1 text-xs text-white/80">添加到手机主屏幕，获得原生 App 般的全屏浏览体验。</div>
          </div>
        </div>
        <div class="p-4 space-y-3 bg-white text-xs text-slate-600">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 leading-relaxed">
            <div>1. 点击 Safari 底部中间的 <strong>分享按钮 (↑)</strong></div>
            <div>2. 下滑选择 <strong>“添加到主屏幕”</strong></div>
            <div>3. 确认名称并点击右上角 <strong>“添加”</strong></div>
          </div>
          <div class="flex gap-2">
            <button @click="installAlbumPwa" class="flex-1 h-9 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center">立即安装</button>
            <a :href="normalAlbumUrl" class="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center justify-center">普通浏览</a>
          </div>
        </div>
      </div>

      <div v-if="installTip" class="max-w-md mx-auto rounded-xl border border-slate-200 bg-slate-50 text-slate-700 px-3.5 py-2.5 text-xs text-center">{{ installTip }}</div>

      <!-- 密码解锁卡片 -->
      <div v-if="needPassword" class="max-w-sm mx-auto my-12 rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl space-y-4 text-center">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-xl">
          🔒
        </div>
        <div>
          <div class="text-xl font-bold text-slate-900">{{ albumTitle }}</div>
          <div class="text-xs text-slate-400 mt-1">此相册受密码保护，请输入访问凭据</div>
        </div>
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
        <el-input v-model="password" placeholder="请输入相册密码" show-password @keyup.enter="submitPassword" />
        <el-button type="primary" class="w-full !h-10 !rounded-xl !font-semibold" @click="submitPassword">进入相册</el-button>
      </div>

      <div v-else-if="photos.length === 0" class="py-24 text-center text-slate-400">
        <div class="text-5xl mb-3">📷</div>
        <div class="text-sm font-medium">暂无照片内容</div>
      </div>

      <!-- 图片主展示区 -->
      <div v-else :class="isStandaloneSlideshow ? 'flex-1 min-h-0 flex flex-col space-y-2.5' : 'space-y-4'">
        <!-- 模式 1: 沉浸幻灯片 -->
        <template v-if="publicLayoutMode === 'slideshow'">
          <!-- 主图轮播视口 -->
          <div class="relative overflow-hidden bg-slate-900" :class="isStandaloneSlideshow ? 'flex-1 min-h-0 rounded-2xl' : 'rounded-[22px] shadow-sm border border-slate-200'">
            <div
              ref="heroRef"
              class="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth carousel-touch h-full"
              @scroll.passive="onHeroScroll"
              @touchstart="pauseForInteraction"
            >
              <div v-for="photo in photos" :key="photo.id" class="w-full shrink-0 snap-center h-full">
                <div class="relative bg-slate-950 overflow-hidden h-full flex items-center justify-center" :class="isStandaloneSlideshow ? '' : 'aspect-[4/5] sm:aspect-[16/11] md:aspect-[21/9]'">
                  <img
                    :src="photoSrc(photo)"
                    class="w-full h-full object-contain"
                    :class="isStandaloneSlideshow ? '' : 'cursor-pointer'"
                    @click="isStandaloneSlideshow ? toggleSlideShow() : openViewerByPhoto(photo)"
                    :loading="imageLoadingAttr"
                  />

                  <!-- 非全屏模式下的底部浮层 -->
                  <div v-if="!isStandaloneSlideshow" class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white flex items-center justify-between gap-3">
                    <div class="text-sm font-bold truncate">{{ albumTitle }}</div>
                    <button
                      type="button"
                      @click.stop="toggleSlideShow"
                      class="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md text-white border border-white/20"
                    >
                      {{ slidePaused ? '▶ 继续' : '⏸ 暂停' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部微型胶卷缩略图条 -->
          <div ref="thumbStripRef" class="overflow-x-auto no-scrollbar carousel-touch shrink-0" :class="isStandaloneSlideshow ? 'pb-[max(env(safe-area-inset-bottom),6px)]' : ''">
            <div class="flex min-w-max gap-1.5 px-0.5">
              <button
                v-for="(photo, idx) in photos"
                :key="photo.id"
                type="button"
                @click="goToSlide(idx)"
                class="overflow-hidden transition-all duration-200 rounded-[8px] snap-start shrink-0"
                :class="idx === currentSlideIndex ? 'ring-2 ring-blue-600 opacity-100 shadow-sm' : 'opacity-45 hover:opacity-75'"
              >
                <img :src="photoSrc(photo)" class="w-12 h-16 sm:w-14 sm:h-18 object-cover" :loading="imageLoadingAttr" />
              </button>
            </div>
          </div>
        </template>

        <!-- 模式 2: 瀑布流 -->
        <template v-else-if="publicLayoutMode === 'waterfall'">
          <div class="columns-2 sm:columns-3 lg:columns-4 gap-2.5 [column-fill:_balance]">
            <div
              v-for="photo in photos"
              :key="photo.id"
              class="mb-2.5 break-inside-avoid rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group"
              @click="openViewerByPhoto(photo)"
            >
              <img :src="photoSrc(photo)" class="w-full h-auto object-cover group-hover:scale-[1.015] transition-transform duration-300" :loading="imageLoadingAttr" />
            </div>
          </div>
        </template>

        <!-- 模式 3: 等高栅格 (Grid) -->
        <template v-else>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 sm:gap-1.5">
            <div
              v-for="photo in photos"
              :key="photo.id"
              class="aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group relative shadow-2xs hover:shadow-sm transition-all"
              @click="openViewerByPhoto(photo)"
            >
              <img :src="photoSrc(photo)" class="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300" :loading="imageLoadingAttr" />
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- 原生级全屏大图 Lightbox 弹出层 -->
    <transition name="viewer-fade">
      <div
        v-if="viewerVisible"
        class="fixed inset-0 z-[110]"
        :style="{ backgroundColor: `rgba(0,0,0,${viewerBgOpacity})` }"
        @click.self="closeViewer"
      >
        <div
          class="absolute inset-0 overflow-hidden touch-none"
          @touchstart="onViewerTouchStart"
          @touchmove="onViewerTouchMove"
          @touchend="onViewerTouchEnd"
        >
          <!-- 顶栏 HUD -->
          <div
            class="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 transition-opacity duration-200"
            :class="hudVisible ? 'opacity-100' : 'opacity-0'"
          >
            <div class="text-white/90 text-xs font-semibold tracking-wide">
              {{ viewerIndex + 1 }} / {{ photos.length }}
            </div>
            <button
              type="button"
              @click="closeViewer"
              class="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 图片展示容器 -->
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

          <!-- 底栏胶卷 HUD -->
          <div
            class="absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),20px)] z-20 flex justify-center transition-opacity duration-200 px-4"
            :class="hudVisible ? 'opacity-100' : 'opacity-0'"
          >
            <div ref="viewerStripRef" class="max-w-full overflow-x-auto no-scrollbar">
              <div class="flex gap-1.5 min-w-max p-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                <button
                  v-for="(photo, idx) in photos"
                  :key="`v-${photo.id}`"
                  type="button"
                  @click.stop="jumpViewerTo(idx)"
                  class="overflow-hidden rounded-[6px] transition-all duration-150 shrink-0"
                  :class="idx === viewerIndex ? 'ring-2 ring-white opacity-100' : 'opacity-40 hover:opacity-75'"
                >
                  <img :src="photoSrc(photo)" class="w-8 h-11 object-cover" :loading="imageLoadingAttr" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }> }
const route = useRoute()
const heroRef = ref<HTMLDivElement | null>(null)
const thumbStripRef = ref<HTMLDivElement | null>(null)
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
const iconUrl = computed(() => slug.value ? `/api/private-albums/${encodeURIComponent(slug.value)}/icon.png` : '/icon.svg')
const splashImageUrl = ref('')
const splashImagePosition = ref<'top' | 'upper' | 'center' | 'lower' | 'bottom'>('center')
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

const centerThumbStrip = () => {
  if (!thumbStripRef.value) return
  const el = thumbStripRef.value.querySelectorAll('button')[currentSlideIndex.value] as HTMLElement | undefined
  if (!el) return
  const container = thumbStripRef.value
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

  // iOS 启动图
  const splashSrc = splashImageUrl.value || coverUrl.value || iconUrl.value
  let portraitStartup = document.head.querySelector('link[rel="apple-touch-startup-image"][media*="portrait"]') as HTMLLinkElement | null
  if (!portraitStartup) {
    portraitStartup = document.createElement('link')
    portraitStartup.rel = 'apple-touch-startup-image'
    portraitStartup.media = 'screen and (orientation: portrait)'
    document.head.appendChild(portraitStartup)
  }
  portraitStartup.href = splashSrc

  let landscapeStartup = document.head.querySelector('link[rel="apple-touch-startup-image"][media*="landscape"]') as HTMLLinkElement | null
  if (!landscapeStartup) {
    landscapeStartup = document.createElement('link')
    landscapeStartup.rel = 'apple-touch-startup-image'
    landscapeStartup.media = 'screen and (orientation: landscape)'
    document.head.appendChild(landscapeStartup)
  }
  landscapeStartup.href = splashSrc
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
    if (isStandalone.value) {
      showSplash.value = true
      setTimeout(() => { showSplash.value = false }, 2200)
    }
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

const goToSlide = (index: number) => {
  currentSlideIndex.value = index
  slidePaused.value = true
  scrollToIndex(index)
}

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

const toggleSlideShow = () => {
  slidePaused.value = !slidePaused.value
  startSlideShow()
}

const pauseForInteraction = () => {
  slidePaused.value = true
  startSlideShow()
}

const jumpViewerTo = (index: number) => {
  viewerIndex.value = index
  resetViewerTransform()
  showHudTemporarily()
  setTimeout(centerViewerStrip, 10)
}

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

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault()
  installPrompt.value = event as InstallPromptEvent
  canInstallAlbum.value = !!slug.value
}

const installAlbumPwa = async () => {
  if (!slug.value) return
  const appUrl = `${location.origin}/app/${encodeURIComponent(slug.value)}?install=1`
  if (isIOS()) {
    if (!isInstallRoute.value) { location.href = appUrl; return }
    installTip.value = '请点 Safari 底部中间的分享按钮，选择“添加到主屏幕”。'
    return
  }
  if (installPrompt.value) {
    await installPrompt.value.prompt()
    await installPrompt.value.userChoice.catch(() => null)
    return
  }
  installTip.value = `请直接访问并添加: ${appUrl}`
}

watch(currentSlideIndex, () => {
  setTimeout(centerThumbStrip, 50)
}, { immediate: true })

watch(() => route.fullPath, () => {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
})

watch(isStandaloneSlideshow, (active) => {
  document.documentElement.style.overflow = active ? 'hidden' : ''
  document.body.style.overflow = active ? 'hidden' : ''
  document.body.style.height = active ? '100dvh' : ''
}, { immediate: true })

watch(viewerIndex, () => {
  if (viewerVisible.value) {
    setTimeout(centerViewerStrip, 10)
    showHudTemporarily()
  }
})

onMounted(async () => {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  const slugParam = route.params.slug as string | undefined
  if (slugParam) {
    canInstallAlbum.value = true
    await initPrivateAlbum(slugParam)
  } else {
    canInstallAlbum.value = false
    await loadPublicPhotos()
  }
  if (isStandalone.value && !needPassword.value) {
    showSplash.value = true
    setTimeout(() => { showSplash.value = false }, 2200)
  }
})

onBeforeUnmount(() => {
  if (slideTimer) clearInterval(slideTimer)
  if (hudTimer) clearTimeout(hudTimer)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  if (manifestLinkEl && !slug.value) manifestLinkEl.href = '/manifest.webmanifest'
})
</script>

<style scoped>
.standalone-safe {
  background: #ffffff;
}

.ios-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #007aff;
  transition: all 0.15s ease;
  text-decoration: none;
}

.ios-btn:active {
  transform: scale(0.97);
}

.carousel-touch {
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

.viewer-fade-enter-active {
  transition: opacity 0.22s ease;
}

.viewer-fade-leave-active {
  transition: opacity 0.15s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}

@keyframes splash-rise {
  0% {
    opacity: 0;
    transform: translateY(14px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes splash-zoom {
  0% {
    transform: scale(1.14);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.06);
    opacity: 1;
  }
}

.animate-splash-rise-soft {
  animation: splash-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.animate-splash-zoom {
  animation: splash-zoom 1.1s ease-out both;
}
</style>
