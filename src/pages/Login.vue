<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900 px-4">
    <div class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white shadow-lg p-8">

      <div class="mb-7 text-center">
        <div class="text-3xl font-bold tracking-tight">{{ siteTitle }}</div>
        <div class="text-slate-400 mt-1.5 text-sm">私有相册后台管理</div>
      </div>

      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4" />

      <div class="space-y-3">
        <el-input v-model="username" placeholder="用户名" @keyup.enter="login" />
        <el-input v-model="password" placeholder="密码" show-password @keyup.enter="login" />
      </div>

      <el-button type="primary" class="w-full mt-5 !h-11 !rounded-2xl !text-base" @click="login">登录</el-button>

      <div class="text-center mt-5">
        <button class="text-xs text-slate-400 hover:text-slate-600 transition-colors" @click="clearCache">清除缓存</button>
      </div>

      <div class="text-center mt-4 text-[11px] text-slate-300">
        v{{ versionText }}<span v-if="commitShort !== 'unknown'"> · {{ commitShort }}</span>
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
