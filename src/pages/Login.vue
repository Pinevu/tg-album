<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900 px-4">
    <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
      <div class="mb-8 text-center">
        <div class="text-3xl font-bold tracking-wide">相册系统</div>
        <div class="text-slate-500 mt-2 text-sm">私有相册后台管理</div>
      </div>

      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4" />

      <el-input v-model="username" placeholder="用户名" class="mb-3" />
      <el-input v-model="password" placeholder="密码" show-password class="mb-5" />
      <el-button type="primary" class="w-full" size="large" @click="login">登录</el-button>
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
    router.push('/admin/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.error || '登录失败，请检查用户名密码或等待后端最新部署完成'
  }
}
</script>
