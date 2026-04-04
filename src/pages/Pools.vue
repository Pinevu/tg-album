<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">TG 存储池</h1>
        <p class="text-slate-500 mt-1">管理用于图片上传的 Telegram Bot / Chat 目标池</p>
      </div>
    </div>

    <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <el-input v-model="form.name" placeholder="存储池名称" />
        <el-input v-model="form.chat_id" placeholder="Chat ID" />
      </div>
      <el-input v-model="form.bot_token" placeholder="Bot Token" show-password />
      <div class="flex items-center gap-3">
        <el-switch v-model="form.enabled" />
        <span class="text-sm text-slate-500">设为当前启用池</span>
      </div>
      <div class="flex gap-2">
        <el-button type="primary" @click="save">保存存储池</el-button>
        <el-button @click="resetForm">清空</el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="pool in pools" :key="pool.id" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold">{{ pool.name }}</div>
          <el-tag v-if="pool.enabled" type="success">已启用</el-tag>
        </div>
        <div class="text-sm text-slate-500">Chat ID：{{ pool.chat_id }}</div>
        <div class="flex gap-2">
          <el-button @click="edit(pool)">编辑</el-button>
          <el-button type="danger" @click="remove(pool.id)">删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPools, createPool, updatePool, deletePool } from '@/utils/api'

const pools = ref<any[]>([])
const editingId = ref<number | null>(null)
const form = ref({ name: '', bot_token: '', chat_id: '', enabled: true })

const load = async () => {
  const { data } = await getPools()
  pools.value = data.results || []
}

const save = async () => {
  if (!form.value.name || !form.value.bot_token || !form.value.chat_id) return
  if (editingId.value) await updatePool(editingId.value, form.value)
  else await createPool(form.value)
  resetForm()
  await load()
}

const edit = (pool: any) => {
  editingId.value = pool.id
  form.value = { name: pool.name, bot_token: '', chat_id: pool.chat_id, enabled: !!pool.enabled }
}

const remove = async (id: number) => {
  await deletePool(id)
  await load()
}

const resetForm = () => {
  editingId.value = null
  form.value = { name: '', bot_token: '', chat_id: '', enabled: true }
}

onMounted(load)
</script>
