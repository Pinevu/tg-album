<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <div class="min-h-screen relative overflow-hidden">
      <div v-if="bgImage" class="absolute inset-x-0 top-0 h-[420px] bg-top bg-no-repeat bg-contain pointer-events-none" :style="heroStyle"></div>
      <div class="absolute inset-x-0 top-0 h-[460px] pointer-events-none" :style="fadeStyle"></div>

      <div class="relative z-10">
        <header class="sticky top-0 z-20 bg-white/96 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div class="max-w-7xl mx-auto px-4 md:px-6 py-2 grid grid-cols-[1fr_auto] items-center gap-3">
            <div class="min-w-0">
              <div class="text-[19px] font-semibold tracking-tight leading-none">{{ siteTitle }}</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Telegram 图片存储</div>
            </div>
            <div class="flex items-center gap-3 justify-end">
              <a href="/" class="nav-btn">前台</a>
              <button class="nav-btn nav-btn-dark" @click="logout">退出</button>
              </div>
            </div>
          </div>
          <div class="max-w-7xl mx-auto px-4 md:px-6 pb-3">
            <div class="w-full rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-1.5 nav-segmented-wrap">
              <div class="grid grid-cols-5 gap-1.5 w-full nav-segmented">
              <a :class="navClass('/admin/dashboard')" href="/admin/dashboard">概述</a>
              <a :class="navClass('/admin/photos')" href="/admin/photos">图片</a>
              <a :class="navClass('/admin/albums')" href="/admin/albums">相册</a>
              <a :class="navClass('/admin/pools')" href="/admin/pools">存储</a>
              <a :class="navClass('/admin/recycle')" href="/admin/recycle">回收站</a>
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

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const siteTitle = ref('相册系统')
const bgImage = ref('')
const bgOpacity = ref(0.45)

const logout = () => {
  auth.logout()
  localStorage.clear()
  sessionStorage.clear()
  router.replace('/login')
}

const navClass = (path: string) => {
  return ['nav-btn', route.path === path ? 'nav-btn-active' : '']
}

const heroStyle = computed(() => ({ backgroundImage: `url(${bgImage.value})` }))
const fadeStyle = computed(() => ({ background: `linear-gradient(to bottom, rgba(255,255,255,${bgOpacity.value}) 0%, rgba(255,255,255,0.92) 55%, rgba(248,250,252,1) 100%)` }))

onMounted(async () => {
  try {
    const { data } = await getSettings()
    siteTitle.value = data.site_title || '相册系统'
    bgImage.value = data.admin_bg_image || ''
    bgOpacity.value = Number(data.admin_bg_opacity || 0.45)
  } catch {}
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.nav-btn {
  padding: 0 18px; height: 40px; display:inline-flex; align-items:center; justify-content:center;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.94);
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(15,23,42,0.04);
}
.nav-btn-active { background: #2563eb; color: white; border-color: #2563eb; box-shadow: 0 4px 12px rgba(37,99,235,0.14); }
.nav-btn-dark { background: #0f172a; color: white; border-color: #0f172a; }

.nav-segmented .nav-btn{
  width: 100%;
  min-width: 0;
  padding: 0 6px;
  height: 48px;
  border-radius: 20px;
  font-size: 13px;
}
@media (min-width: 768px){
  .nav-segmented{display:flex !important; gap:8px; overflow-x:auto;}
  .nav-segmented .nav-btn{width:auto; min-width:max-content; height:44px; border-radius:14px; padding:0 16px;}
}

.nav-segmented-wrap{overflow:hidden;}
</style>
