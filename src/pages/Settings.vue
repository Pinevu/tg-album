<template>
  <div class="space-y-5 rounded-[32px] bg-white/82 backdrop-blur-md border border-slate-200/80 shadow-sm p-4 md:p-5">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight">网页后台设置</h1>
    </div>

    <div class="panel-card space-y-5 max-w-3xl bg-white/96">
      <section class="space-y-3">
        <div class="section-title">基础信息</div>
        <el-input v-model="form.site_title" placeholder="网页名称 / 站点标题" />
      </section>

      <section class="space-y-3">
        <div class="section-title">管理员账号</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-input v-model="form.admin_username" placeholder="管理员用户名" autocomplete="off" />
          <el-input v-model="form.admin_password" placeholder="新密码（留空表示不修改）" show-password autocomplete="new-password" />
        </div>
        <div class="text-xs text-slate-500">当前登录账号优先显示在这里。保存时会同步更新后台登录账号；密码留空则保持当前密码不变。</div>
      </section>

      <section class="space-y-3">
        <div class="section-title">前台相册显示</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-select v-model="form.public_layout_mode">
            <el-option label="瀑布流" value="waterfall" />
            <el-option label="等高栅格" value="grid" />
            <el-option label="幻灯片模式" value="slideshow" />
          </el-select>
          <div class="rounded-[18px] border border-slate-200 bg-slate-50/70 px-3 py-2.5 flex items-center justify-between gap-3">
            <div>
              <div class="text-sm text-slate-700">全局懒加载</div>
              <div class="text-[11px] text-slate-500 mt-0.5">前台图片是否延迟加载</div>
            </div>
            <el-switch v-model="form.lazy_load_enabled" />
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div class="section-title">内容安全</div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-slate-400">启用</span>
            <el-switch v-model="form.content_safety_enabled" />
          </div>
        </div>
        <template v-if="form.content_safety_enabled">
          <div class="grid grid-cols-2 gap-3">
            <el-select v-model="form.content_safety_provider">
              <el-option label="自定义" value="custom" />
              <el-option label="阿里云" value="aliyun" />
              <el-option label="腾讯云" value="tencent" />
            </el-select>
            <el-select v-model="form.content_safety_action">
              <el-option label="冻结" value="freeze" />
              <el-option label="标记" value="flag" />
            </el-select>
          </div>
          <el-input v-model="form.content_safety_api_url" placeholder="API URL" />
          <el-input v-model="form.content_safety_api_key" placeholder="API Key" show-password autocomplete="off" />
        </template>
      </section>

      <div class="flex gap-2 flex-wrap">
        <el-button type="primary" @click="save">保存设置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings } from '@/utils/api'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const form = ref({
  site_title: '相册系统',
  admin_username: auth.token ? '' : 'admin',
  admin_password: '',
  content_safety_enabled: false,
  content_safety_provider: 'custom',
  content_safety_api_url: '',
  content_safety_api_key: '',
  content_safety_action: 'freeze',
  public_layout_mode: 'grid',
  lazy_load_enabled: true,
})

const decodeJwtPayload = (token: string) => {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '==='.slice((base64.length + 3) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const currentLoggedUsername = () => {
  if (!auth.token) return ''
  const payload = decodeJwtPayload(auth.token)
  return payload?.username || ''
}

const toBool = (value: any, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 1) return true
  if (value === 'false' || value === '0' || value === 0) return false
  return fallback
}

const load = async () => {
  const { data } = await getSettings()
  form.value.site_title = data.site_title || '相册系统'
  form.value.admin_username = currentLoggedUsername() || data.admin_username || 'admin'
  form.value.admin_password = ''
  form.value.content_safety_enabled = toBool(data.content_safety_enabled, false)
  form.value.content_safety_provider = data.content_safety_provider || 'custom'
  form.value.content_safety_api_url = data.content_safety_api_url || ''
  form.value.content_safety_api_key = data.content_safety_api_key || ''
  form.value.content_safety_action = data.content_safety_action || 'freeze'
  form.value.public_layout_mode = data.public_layout_mode || 'grid'
  form.value.lazy_load_enabled = toBool(data.lazy_load_enabled, true)
}

const save = async () => {
  await saveSettings(form.value)
  form.value.admin_password = ''
  ElMessage.success('设置已保存')
}

onMounted(load)
</script>

<style scoped>
.section-title { @apply text-sm font-semibold text-slate-900; }
.panel-card { @apply rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm; }
</style>
