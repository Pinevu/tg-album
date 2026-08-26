<template>
  <div class="space-y-5 font-sans">
    <!-- 新增 / 编辑存储池 -->
    <div class="panel-card space-y-4">
      <div class="flex items-center justify-between">
        <div class="text-sm font-bold text-slate-900">{{ editingId ? '编辑 Telegram 存储池' : '添加 Telegram 存储池' }}</div>
        <button v-if="editingId" @click="resetForm" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">取消编辑</button>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">存储池标识名</label>
            <el-input v-model="form.name" placeholder="例如: 主存储群组" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Telegram Chat ID</label>
            <el-input v-model="form.chat_id" placeholder="例如: -100123456789" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Bot Token</label>
            <el-input v-model="form.bot_token" placeholder="BotFather 提供的 Token" show-password />
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-2">
            <el-switch v-model="form.enabled" size="small" />
            <span class="text-xs font-medium text-slate-600">设为此相册的活跃上传池</span>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" @click="testPool" class="action-ghost-btn !h-8 !px-3">测试连接</button>
            <el-button type="primary" @click="save" class="!h-8 !px-4">保存配置</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 存储池列表 -->
    <div v-if="loading" class="panel-empty">正在加载存储池列表...</div>
    <div v-else-if="pools.length === 0" class="panel-empty">暂无存储池配置，请先添加</div>

    <div v-else class="space-y-3">
      <div
        v-for="pool in pools"
        :key="pool.id"
        class="panel-card flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:border-slate-300 transition-colors"
      >
        <div class="min-w-0 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 text-sm">{{ pool.name }}</span>
            <span
              v-if="pool.enabled"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100"
            >
              当前活跃
            </span>
            <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
              备用池
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Chat ID: <code class="text-slate-600 font-mono">{{ pool.chat_id }}</code></span>
            <span>·</span>
            <span class="truncate max-w-xs">Webhook: <code class="text-slate-500 font-mono text-[11px]">{{ origin }}/api/tg/webhook/{{ pool.id }}</code></span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" @click="openSetWebhook(pool)" class="action-ghost-btn !h-8 !px-3">测试 Webhook</button>
          <button type="button" @click="edit(pool)" class="action-ghost-btn !h-8 !px-3">编辑</button>
          <button type="button" @click="remove(pool.id)" class="action-ghost-btn action-ghost-btn-danger !h-8 !px-3">删除</button>
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

const load = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/tg-pools')
    pools.value = data.results || []
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '读取存储池失败')
    pools.value = []
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!form.value.name || !form.value.bot_token || !form.value.chat_id) {
    return ElMessage.warning('请完整填写存储池信息')
  }
  try {
    if (editingId.value) await api.put(`/tg-pools/${editingId.value}`, form.value)
    else await api.post('/tg-pools', form.value)
    ElMessage.success('保存成功')
    resetForm()
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '保存失败')
  }
}

const testPool = async () => {
  if (!form.value.bot_token) return ElMessage.warning('请先填写 Bot Token')
  try {
    const { data } = await api.post('/tg-pools/test', { bot_token: form.value.bot_token, chat_id: form.value.chat_id })
    if (data.ok) {
      ElMessage.success('连接 Telegram 成功')
    } else {
      ElMessage.error(data?.data?.description || data?.error || '测试连接失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '测试连接失败')
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
    ElMessage.error(e?.response?.data?.error || '设置 Webhook 失败')
  }
}

const edit = (pool: any) => {
  editingId.value = pool.id
  form.value = { name: pool.name, bot_token: pool.bot_token || '', chat_id: pool.chat_id, enabled: !!pool.enabled }
}

const remove = async (id: number) => {
  try {
    await api.delete(`/tg-pools/${id}`)
    ElMessage.success('删除成功')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '删除失败')
  }
}

const resetForm = () => {
  editingId.value = null
  form.value = { name: '', bot_token: '', chat_id: '', enabled: true }
}

onMounted(load)
</script>
