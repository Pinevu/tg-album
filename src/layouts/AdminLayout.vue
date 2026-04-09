<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <div class="min-h-screen relative overflow-hidden">
      <div v-if="bgImage" class="absolute inset-0 pointer-events-none admin-bg-layer" :style="heroStyle"></div>

      <div class="relative z-10">
        <header class="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl border-b border-slate-200/45 shadow-[0_1px_0_rgba(15,23,42,0.015)]">
          <div class="max-w-7xl mx-auto px-4 md:px-6 py-2 grid grid-cols-[1fr_auto] items-center gap-2.5">
            <div class="min-w-0">
              <div class="text-[18px] font-semibold tracking-tight leading-none">{{ siteTitle }}</div>
              <div class="text-[10px] text-slate-500 mt-0.5">Telegram 图片存储</div>
            </div>
            <div class="flex items-center gap-3 justify-end">
              <div class="hidden md:block text-[10px] text-slate-400 text-right leading-tight">
                <div>v{{ versionText }}</div>
                <div v-if="commitShort !== 'unknown'">{{ commitShort }}</div>
              </div>
              <a href="/" class="nav-btn">前台</a>
              <button class="nav-btn nav-btn-dark" @click="logout">退出</button>
            </div>
          </div>
          <div class="max-w-7xl mx-auto px-4 md:px-6 pb-2.5">
            <div class="w-full rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-1.5 nav-segmented-wrap">
              <div class="grid grid-cols-6 gap-1.5 w-full nav-segmented">
                <a :class="navClass('/admin/dashboard')" href="/admin/dashboard">概述</a>
                <a :class="navClass('/admin/photos')" href="/admin/photos">图片</a>
                <a :class="navClass('/admin/albums')" href="/admin/albums">相册</a>
                <a :class="navClass('/admin/pools')" href="/admin/pools">存储</a>
                <a :class="navClass('/admin/recycle')" href="/admin/recycle">回收站</a>
                <a :class="navClass('/admin/settings')" href="/admin/settings">设置</a>
              </div>
            </div>
          </div>
        </header>

        <main class="max-w-7xl mx-auto px-5 md:px-6 py-5 md:py-6">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useRouter, useRoute } from 'vue-router'
import { getSettings } from '@/utils/api'
import { useVersionMeta } from '@/composables/useVersionMeta'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const siteTitle = ref('相册系统')
const bgImage = ref('')
const bgOpacity = ref(0.45)
const { state: versionState, ensureLoaded } = useVersionMeta()

const versionText = computed(() => versionState.data?.version || '0.0.0')
const commitShort = computed(() => versionState.data?.git_commit_short || 'unknown')

const logout = () => {
  auth.logout()
  localStorage.clear()
  sessionStorage.clear()
  router.replace('/login')
}

const navClass = (path: string) => {
  return ['nav-btn', route.path === path ? 'nav-btn-active' : '']
}

const heroStyle = computed(() => ({
  backgroundImage: `url(${bgImage.value})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  opacity: String(Math.max(0.03, Number(bgOpacity.value)))
}))

onMounted(async () => {
  ensureLoaded()
  // 优先从 localStorage 读取（防止 D1 存储的 base64 被截断导致读出来为空）
  const cachedBg = localStorage.getItem('admin_bg_image')
  const cachedOpacity = localStorage.getItem('admin_bg_opacity')
  bgImage.value = cachedBg || ''
  bgOpacity.value = Number(cachedOpacity || 0.8)
  try {
    const { data } = await getSettings()
    siteTitle.value = data.site_title || '相册系统'
    // 图片可能因 base64 过长而读取失败，失败时保留当前值
    bgImage.value = data.admin_bg_image || bgImage.value
    bgOpacity.value = Number(data.admin_bg_opacity || bgOpacity.value || 0.45)
  } catch {
    // 网络/API 错误时什么都不做，保留内存中的值
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.admin-bg-layer {
  filter: saturate(0.92) blur(0px);
  transform: scale(1.04);
  transform-origin: top center;
}
.nav-btn {
  padding: 0 14px; height: 36px; display:inline-flex; align-items:center; justify-content:center;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.98);
  color: #475569;
  font-size: 12px;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: none;
}
.nav-btn-active {
  background: #ffffff;
  color: #0f172a;
  border-color: rgba(203,213,225,.95);
  box-shadow: 0 6px 16px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.98);
}
.nav-btn-dark { background: #0f172a; color: white; border-color: #0f172a; }

.nav-segmented .nav-btn{
  width: 100%;
  min-width: 0;
  padding: 0 6px;
  height: 40px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 800 !important;
  letter-spacing: 0.01em;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.nav-segmented .nav-btn:not(.nav-btn-active){
  color:#64748b;
}
.nav-segmented .nav-btn.nav-btn-active{
  font-weight: 900 !important;
  color:#0f172a;
  background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 100%);
  border: 1px solid rgba(226,232,240,.98);
  box-shadow: 0 8px 18px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1);
}
@media (min-width: 768px){
  .nav-segmented{display:flex !important; gap:4px; overflow-x:auto;}
  .nav-segmented .nav-btn{width:auto; min-width:max-content; height:40px; border-radius:14px; padding:0 14px;}
}

.nav-segmented-wrap{overflow:hidden; border-radius:22px; background:rgba(248,250,252,.9); border:1px solid rgba(226,232,240,.95); padding:4px;}
</style>
