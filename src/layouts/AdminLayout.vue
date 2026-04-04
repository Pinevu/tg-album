<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,#f2f6ff,white_45%)] text-slate-900">
    <header class="sticky top-0 z-20 bg-white/88 backdrop-blur-2xl border-b border-slate-200/80 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div>
          <div class="text-xl font-bold tracking-tight">相册系统</div>
          <div class="text-xs text-slate-500">Telegram 图片存储池</div>
        </div>
        <div class="flex items-center gap-2">
          <a href="/" class="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-sm shadow-sm hover:border-blue-300 transition">前台</a>
          <button class="px-3 py-2 rounded-2xl bg-slate-900 text-white text-sm shadow-sm" @click="logout">退出</button>
        </div>
      </div>
      <div class="max-w-7xl mx-auto px-4 pb-4 overflow-x-auto no-scrollbar">
        <div class="flex gap-2 min-w-max">
          <a :class="navClass('/admin/dashboard')" href="/admin/dashboard">仪表盘</a>
          <a :class="navClass('/admin/photos')" href="/admin/photos">图片</a>
          <a :class="navClass('/admin/albums')" href="/admin/albums">相册</a>
          <a :class="navClass('/admin/pools')" href="/admin/pools">存储池</a>
          <a :class="navClass('/admin/recycle')" href="/admin/recycle">回收站</a>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-5 md:py-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { useRouter, useRoute } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const logout = () => {
  auth.logout()
  localStorage.clear()
  sessionStorage.clear()
  router.replace('/login')
}

const navClass = (path: string) => {
  return ['px-3 py-2 rounded-2xl text-sm font-medium transition-all border whitespace-nowrap', route.path === path
    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 shadow-sm']
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
