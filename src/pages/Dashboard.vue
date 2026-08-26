<template>
  <div class="space-y-5">
    <!-- 统计小组件网格 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
      <button
        v-for="card in cards"
        :key="card.path"
        @click="go(card.path)"
        class="stat-widget group"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm transition-transform group-hover:scale-105"
            :style="{ background: card.bg, color: card.color }"
          >
            {{ card.icon }}
          </div>
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{{ card.label }}</span>
        </div>
        <div class="flex items-baseline justify-between">
          <div class="text-3xl font-extrabold tracking-tight text-slate-900">{{ card.value }}</div>
          <span class="text-xs text-slate-400 font-medium group-hover:text-slate-600 transition-colors">查看 →</span>
        </div>
      </button>
    </div>

    <!-- 快捷操作与状态栏 -->
    <div class="panel-card flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 text-xs text-slate-500">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>数据库状态正常 · 实时同步</span>
      </div>
      <el-button size="small" @click="load" class="!h-8 !px-3">
        <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        刷新数据
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'

const router = useRouter()
const stats = ref({ totalPhotos: 0, totalAlbums: 0, totalDeleted: 0, totalPools: 0 })

const cards = ref<{ path: string; label: string; icon: string; bg: string; color: string; value: number }[]>([
  { path: '/admin/photos', label: '照片总数', icon: '📷', bg: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)', color: '#1d4ed8', value: 0 },
  { path: '/admin/albums', label: '相册分类', icon: '🗂', bg: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', color: '#b45309', value: 0 },
  { path: '/admin/recycle', label: '回收站', icon: '🗑', bg: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)', color: '#be185d', value: 0 },
  { path: '/admin/pools', label: '存储池', icon: '☁️', bg: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)', color: '#047857', value: 0 },
])

const load = async () => {
  try {
    const { data } = await api.get('/stats')
    stats.value = data
    cards.value[0].value = data.totalPhotos || 0
    cards.value[1].value = data.totalAlbums || 0
    cards.value[2].value = data.totalDeleted || 0
    cards.value[3].value = data.totalPools || 0
  } catch {}
}

const go = (path: string) => router.push(path)
onMounted(load)
</script>

<style scoped>
.stat-widget {
  border-radius: 22px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  background: #ffffff;
  padding: 20px;
  text-align: left;
  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 4px 14px 0 rgba(15, 23, 42, 0.02);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.stat-widget:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
}

.stat-widget:active {
  transform: scale(0.98);
}
</style>
