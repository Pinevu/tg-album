<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900 px-4 py-10">
    <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
      <div class="mb-8 text-center">
        <div class="text-3xl font-bold tracking-wide">相册系统</div>
        <div class="text-slate-500 mt-2 text-sm">私有相册后台管理</div>
        <div class="text-xs text-slate-400 mt-2">版本 v1.3.34</div>
      </div>

      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4" />
      <el-alert title="如果页面异常或点击无反应，请清缓存后重开页面。" type="warning" show-icon :closable="false" class="mb-4" />

      <el-input v-model="username" placeholder="用户名" class="mb-3" />
      <el-input v-model="password" placeholder="密码" show-password class="mb-5" />
      <div class="grid grid-cols-2 gap-3">
        <el-button type="primary" class="w-full" size="large" @click="login">登录</el-button>
        <el-button class="w-full" @click="clearCache">清除缓存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/utils/axios'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

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
