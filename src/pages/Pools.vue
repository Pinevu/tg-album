<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-slate-900">TG 存储池</h1>
    </div>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <div class="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div class="grid grid-cols-1 gap-3">
        <el-input v-model="form.name" placeholder="存储池名称" />
        <el-input v-model="form.chat_id" placeholder="Chat ID" />
        <el-input v-model="form.bot_token" placeholder="Bot Token" show-password />
      </div>
      <div class="flex items-center gap-3">
        <el-switch v-model="form.enabled" />
        <span class="text-sm text-slate-500">设为启用池</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <el-button type="primary" @click="save">保存</el-button>
        <el-button @click="testPool">测试连接</el-button>
        <el-button @click="resetForm">清空</el-button>
      </div>
    </div>

    <div v-if="loading" class="rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm text-center text-slate-400">
      正在加载存储池...
    </div>

    <div v-else-if="pools.length === 0" class="rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm text-center text-slate-400">
      暂无存储池
    </div>

    <div v-else class="space-y-3">
      <div v-for="pool in pools" :key="pool.id" class="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="font-semibold text-slate-900">{{ pool.name }}</div>
          <el-tag v-if="pool.enabled" type="success">已启用</el-tag>
        </div>
        <div class="text-sm text-slate-500">Chat ID：{{ pool.chat_id }}</div>
        <div class="text-xs text-slate-500 break-all">Webhook：{{ origin }}/api/tg/webhook/{{ pool.id }}</div>
        <div class="flex flex-wrap gap-2">
          <el-button @click="copyWebhook(pool)">复制 Webhook</el-button>
          <el-button @click="copySetWebhook(pool)">复制 setWebhook</el-button>
          <el-button @click="openSetWebhook(pool)">打开 setWebhook</el-button>
          <el-button @click="edit(pool)">编辑</el-button>
          <el-button type="danger" @click="remove(pool.id)">删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/axios'

const origin = location.origin
const pools = ref<any[]>([])
const loading = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', bot_token: '', chat_id: '', enabled: true })
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const load = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/tg-pools')
    pools.value = data.results || []
  } catch (e: any) {
    message.value = e?.response?.data?.error || '读取存储池失败'
    messageType.value = 'error'
    pools.value = []
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!form.value.name || !form.value.bot_token || !form.value.chat_id) {
    message.value = '请完整填写信息'
    messageType.value = 'error'
    return
  }
  try {
    if (editingId.value) await api.put(`/tg-pools/${editingId.value}`, form.value)
    else await api.post('/tg-pools', form.value)
    message.value = '保存成功'
    messageType.value = 'success'
    resetForm()
    await load()
  } catch (e: any) {
    message.value = e?.response?.data?.error || '保存失败'
    messageType.value = 'error'
  }
}

const testPool = async () => {
  if (!form.value.bot_token) return
  try {
    const { data } = await api.post('/tg-pools/test', { bot_token: form.value.bot_token, chat_id: form.value.chat_id })
    message.value = data.ok ? '测试连接成功' : '测试连接失败'
    messageType.value = data.ok ? 'success' : 'error'
  } catch (e: any) {
    message.value = e?.response?.data?.error || '测试连接失败'
    messageType.value = 'error'
  }
}

const getSetWebhookCommand = async (pool: any) => {
  const { data } = await api.get(`/tg-pools/${pool.id}/webhook-command`)
  return data.set_webhook_command
}

const copyWebhook = async (pool: any) => {
  const url = `${origin}/api/tg/webhook/${pool.id}`
  await navigator.clipboard.writeText(url)
  ElMessage.success('Webhook 地址已复制')
}

const copySetWebhook = async (pool: any) => {
  try {
    const cmd = await getSetWebhookCommand(pool)
    await navigator.clipboard.writeText(cmd)
    ElMessage.success('setWebhook 命令已复制')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || `生成失败: ${e?.response?.status || 'unknown'}`)
  }
}

const openSetWebhook = async (pool: any) => {
  try {
    const cmd = await getSetWebhookCommand(pool)
    location.href = cmd
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || `打开失败: ${e?.response?.status || 'unknown'}`)
  }
}

const edit = (pool: any) => {
  editingId.value = pool.id
  form.value = { name: pool.name, bot_token: '', chat_id: pool.chat_id, enabled: !!pool.enabled }
}

const remove = async (id: number) => {
  try {
    await api.delete(`/tg-pools/${id}`)
    message.value = '删除成功'
    messageType.value = 'success'
    await load()
  } catch (e: any) {
    message.value = e?.response?.data?.error || '删除失败'
    messageType.value = 'error'
  }
}

const resetForm = () => {
  editingId.value = null
  form.value = { name: '', bot_token: '', chat_id: '', enabled: true }
}

onMounted(load)
</script>
