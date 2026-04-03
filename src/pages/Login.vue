<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white px-4">
    <div class="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl p-8">
      <div class="mb-8 text-center">
        <div class="text-3xl font-bold tracking-wide">TG Album</div>
        <div class="text-white/60 mt-2 text-sm">私有相册后台管理</div>
      </div>

      <el-input v-model="username" placeholder="Username" class="mb-3" />
      <el-input v-model="password" placeholder="Password" show-password class="mb-5" />
      <el-button type="primary" class="w-full" size="large" @click="login">Login</el-button>
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
const auth = useAuthStore()
const router = useRouter()

const login = async () => {
  const { data } = await api.post('/login', { username: username.value, password: password.value })
  auth.setToken(data.token)
  router.push('/admin/dashboard')
}
</script>
