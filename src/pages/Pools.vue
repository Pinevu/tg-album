<template>
  <div class="space-y-5 rounded-[32px] bg-white/82 backdrop-blur-md border border-slate-200/80 shadow-sm p-4 md:p-5">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight">存储</h1>
    </div>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

    <div class="panel-card space-y-3">
      <div class="grid grid-cols-1 gap-3">
        <el-input v-model="form.name" placeholder="存储名称" />
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

    <div v-if="loading" class="panel-empty">正在加载存储池...</div>
    <div v-else-if="pools.length === 0" class="panel-empty">暂无存储池</div>

    <div v-else class="space-y-3">
      <div v-for="pool in pools" :key="pool.id" class="panel-card space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="font-semibold text-slate-900">{{ pool.name }}</div>
        </div>
        <div class="text-sm text-slate-500">Chat ID：{{ pool.chat_id }}</div>
        <div class="text-xs text-slate-500 break-all">Webhook：{{ origin }}/api/tg/webhook/{{ pool.id }}</div>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500">启用</span>
            <el-switch :model-value="!!pool.enabled" @change="togglePoolEnabled(pool, $event)" />
          </div>
          <div class="grid grid-cols-3 gap-2 flex-1 max-w-[320px]">
            <el-button @click="openSetWebhook(pool)" class="!w-full">setWebhook</el-button>
            <el-button @click="edit(pool)" class="!w-full">编辑</el-button>
            <el-button type="danger" @click="remove(pool.id)" class="!w-full">删除</el-button>
          </div>
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


const openSetWebhook = async (pool: any) => {
  try {
    const cmd = await getSetWebhookCommand(pool)
    location.href = cmd
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || `打开失败: ${e?.response?.status || 'unknown'}`)
  }
}

const togglePoolEnabled = async (pool: any, enabled: boolean) => {
  try {
    await api.put(`/tg-pools/${pool.id}`, { name: pool.name, bot_token: '', chat_id: pool.chat_id, enabled })
    await load()
  } catch (e: any) {
    message.value = e?.response?.data?.error || '切换启用状态失败'
    messageType.value = 'error'
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

<style scoped>
.panel-card { @apply rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm; }
.panel-empty { @apply rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm; }
</style>
