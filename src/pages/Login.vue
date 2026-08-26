<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900 px-4 py-8">
    <div class="w-full max-w-sm rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
      <!-- 品牌标识 -->
      <div class="mb-7 text-center">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 mx-auto mb-3.5 flex items-center justify-center text-white shadow-md">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="text-2xl font-extrabold tracking-tight text-slate-900">{{ siteTitle }}</div>
        <div class="text-slate-400 mt-1 text-xs font-medium">私有相册后台管理</div>
      </div>

      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4" />

      <!-- 输入框表单 -->
      <div class="space-y-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 mb-1">用户名</label>
          <el-input v-model="username" placeholder="请输入管理员用户名" @keyup.enter="login" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 mb-1">密码</label>
          <el-input v-model="password" placeholder="请输入密码" show-password @keyup.enter="login" />
        </div>
      </div>

      <el-button type="primary" class="w-full mt-6 !h-11 !rounded-2xl !text-sm !font-semibold" @click="login">
        登录控制台
      </el-button>

      <div class="text-center mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <button class="hover:text-slate-600 transition-colors" @click="clearCache">清除缓存</button>
        <span>v{{ versionText }}<span v-if="commitShort !== 'unknown'"> · {{ commitShort }}</span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/utils/axios'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import { useVersionMeta } from '@/composables/useVersionMeta'
import { getSettings } from '@/utils/api'

const username = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()
const { state: versionState, ensureLoaded } = useVersionMeta()
const siteTitle = ref('相册系统')

const versionText = computed(() => versionState.data?.version || '0.0.0')
const commitShort = computed(() => versionState.data?.git_commit_short || 'unknown')

onMounted(async () => {
  ensureLoaded()
  try {
    const { data } = await getSettings()
    siteTitle.value = data.site_title || '相册系统'
  } catch {}
})

const login = async () => {
  error.value = ''
  try {
    const { data } = await api.post('/login', { username: username.value, password: password.value })
    auth.setToken(data.token)
    router.replace('/admin/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.error || '登录失败'
  }
}

const clearCache = () => {
  localStorage.clear()
  sessionStorage.clear()
  location.href = '/login'
}
</script>
