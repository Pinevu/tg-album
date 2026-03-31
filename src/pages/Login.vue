<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 text-white">
    <div class="w-96 p-6 rounded-xl bg-white/10 backdrop-blur">
      <h1 class="text-xl font-bold mb-4">Login</h1>
      <el-input v-model="username" placeholder="Username" class="mb-3" />
      <el-input v-model="password" placeholder="Password" show-password class="mb-4" />
      <el-button type="primary" class="w-full" @click="login">Login</el-button>
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
