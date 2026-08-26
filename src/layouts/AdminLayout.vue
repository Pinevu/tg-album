<template>
  <div class="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
      <div class="max-w-7xl mx-auto px-4 md:px-6">
        <!-- 品牌与顶栏操作 -->
        <div class="flex items-center justify-between h-14 md:h-16 gap-3">
          <div class="min-w-0 flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[15px] md:text-[16px] font-bold tracking-tight text-slate-900 leading-tight truncate">{{ siteTitle }}</div>
              <div class="text-[10px] text-slate-400 font-medium">后台管理系统</div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 text-[11px] text-slate-500 font-medium mr-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>v{{ versionText }}</span>
              <span v-if="commitShort !== 'unknown'" class="text-slate-400">· {{ commitShort }}</span>
            </div>
            <a href="/" class="header-btn header-btn-ghost">
              <svg class="w-3.5 h-3.5 mr-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              前台
            </a>
            <button class="header-btn header-btn-dark" @click="logout">退出</button>
          </div>
        </div>

        <!-- 页面分段导航栏 -->
        <div class="pb-2.5 pt-0.5">
          <nav class="p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <a
              v-for="item in navItems"
              :key="item.path"
              :href="item.path"
              class="nav-pill"
              :class="{ 'nav-pill-active': route.path === item.path }"
            >
              {{ item.label }}
            </a>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主体区域 -->
    <main class="max-w-7xl mx-auto w-full px-4 md:px-6 py-5 md:py-6 flex-1">
      <router-view />
    </main>
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
const { state: versionState, ensureLoaded } = useVersionMeta()

const navItems = [
  { path: '/admin/dashboard', label: '概述' },
  { path: '/admin/photos', label: '图片' },
  { path: '/admin/albums', label: '相册' },
  { path: '/admin/pools', label: '存储' },
  { path: '/admin/recycle', label: '回收站' },
  { path: '/admin/settings', label: '设置' },
]

const versionText = computed(() => versionState.data?.version || '0.0.0')
const commitShort = computed(() => versionState.data?.git_commit_short || 'unknown')

const logout = () => {
  auth.logout()
  localStorage.clear()
  sessionStorage.clear()
  router.replace('/login')
}

onMounted(async () => {
  ensureLoaded()
  try {
    const { data } = await getSettings()
    siteTitle.value = data.site_title || '相册系统'
  } catch {}
})
</script>

<style scoped>
.header-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-btn-ghost {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
}

.header-btn-ghost:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.header-btn-dark {
  border: 1px solid #0f172a;
  background: #0f172a;
  color: #ffffff;
}

.header-btn-dark:hover {
  background: #1e293b;
  border-color: #1e293b;
}

.nav-pill {
  flex: 1;
  min-width: max-content;
  height: 34px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-pill:hover {
  color: #0f172a;
}

.nav-pill-active {
  background: #ffffff;
  color: #0f172a;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
}
</style>
