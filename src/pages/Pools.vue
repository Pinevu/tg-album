<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-slate-900">TG 存储池</h1>
      <p class="text-slate-500 mt-1 text-sm">管理多个 Telegram 机器人图片存储池，可新增、保存、删除、启用。</p>
    </div>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div class="grid grid-cols-1 gap-3">
        <el-input v-model="form.name" placeholder="存储池名称" />
        <el-input v-model="form.chat_id" placeholder="Chat ID" />
        <el-input v-model="form.bot_token" placeholder="Bot Token" show-password />
      </div>
      <div class="flex items-center gap-3">
        <el-switch v-model="form.enabled" />
        <span class="text-sm text-slate-500">设为当前启用池</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <el-button type="primary" @click="save">保存</el-button>
        <el-button @click="testPool">测试连接</el-button>
        <el-button @click="resetForm">清空</el-button>
      </div>
    </div>

    <div class="space-y-3">
      <div v-for="pool in pools" :key="pool.id" class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="font-semibold">{{ pool.name }}</div>
          <el-tag v-if="pool.enabled" type="success">已启用</el-tag>
        </div>
        <div class="text-sm text-slate-500">Chat ID：{{ pool.chat_id }}</div>
        <div class="flex flex-wrap gap-2">
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
import api from '@/utils/axios'

const pools = ref<any[]>([])
const editingId = ref<number | null>(null)
const form = ref({ name: '', bot_token: '', chat_id: '', enabled: true })
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const load = async () => {
  try {
    const { data } = await getPools()
    pools.value = data.results || []
  } catch {
    message.value = '读取存储池失败，请重新登录后重试'
    messageType.value = 'error'
  }
}

const save = async () => {
  if (!form.value.name || !form.value.bot_token || !form.value.chat_id) {
    message.value = '请完整填写存储池名称、Chat ID 和 Bot Token'
    messageType.value = 'error'
    return
  }
  try {
    if (editingId.value) await updatePool(editingId.value, form.value)
    else await createPool(form.value)
    message.value = '存储池保存成功'
    messageType.value = 'success'
    resetForm()
    await load()
  } catch {
    message.value = '存储池保存失败，请确认后端已部署到最新版本'
    messageType.value = 'error'
  }
}

const testPool = async () => {
  if (!form.value.bot_token) {
    message.value = '请先填写 Bot Token'
    messageType.value = 'error'
    return
  }
  try {
    const { data } = await api.post('/tg-pools/test', { bot_token: form.value.bot_token, chat_id: form.value.chat_id })
    message.value = data.ok ? '测试连接成功' : '测试连接失败'
    messageType.value = data.ok ? 'success' : 'error'
  } catch {
    message.value = '测试连接失败'
    messageType.value = 'error'
  }
}

const edit = (pool: any) => {
  editingId.value = pool.id
  form.value = { name: pool.name, bot_token: '', chat_id: pool.chat_id, enabled: !!pool.enabled }
}

const remove = async (id: number) => {
  try {
    await deletePool(id)
    message.value = '存储池已删除'
    messageType.value = 'success'
    await load()
  } catch {
    message.value = '删除失败'
    messageType.value = 'error'
  }
}

const resetForm = () => {
  editingId.value = null
  form.value = { name: '', bot_token: '', chat_id: '', enabled: true }
}

onMounted(load)
</script>
