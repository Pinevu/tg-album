<template>
  <div class="space-y-5 max-w-3xl font-sans">
    <!-- 站点基础信息 -->
    <div class="panel-card space-y-3.5">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-full bg-blue-600"></span>
        <h2 class="text-sm font-bold text-slate-900">站点基础配置</h2>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-400 mb-1">网页名称 / 站点标题</label>
        <el-input v-model="form.site_title" placeholder="相册系统" />
      </div>
    </div>

    <!-- 管理员账号凭据 -->
    <div class="panel-card space-y-3.5">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-full bg-indigo-600"></span>
        <h2 class="text-sm font-bold text-slate-900">管理员账号</h2>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">管理员用户名</label>
          <el-input v-model="form.admin_username" placeholder="admin" autocomplete="off" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">重设密码（留空不改）</label>
          <el-input v-model="form.admin_password" placeholder="••••••••" show-password autocomplete="new-password" />
        </div>
      </div>
      <div class="text-[11px] text-slate-400">当前已登录用户名优先显示。修改保存后同步更新后台登录凭据。</div>
    </div>

    <!-- 前台相册浏览模式与性能 -->
    <div class="panel-card space-y-3.5">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-full bg-amber-500"></span>
        <h2 class="text-sm font-bold text-slate-900">前台相册浏览与性能</h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">默认展示布局</label>
          <el-select v-model="form.public_layout_mode" class="w-full">
            <el-option label="等高栅格模式 (Grid)" value="grid" />
            <el-option label="瀑布流模式 (Waterfall)" value="waterfall" />
            <el-option label="沉浸幻灯片 (Slideshow)" value="slideshow" />
          </el-select>
        </div>

        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
          <div>
            <div class="text-xs font-semibold text-slate-800">图片全局懒加载</div>
            <div class="text-[10px] text-slate-400 mt-0.5">延迟加载视口外图片，节省流量</div>
          </div>
          <el-switch v-model="form.lazy_load_enabled" size="small" />
        </div>
      </div>
    </div>

    <!-- 鉴黄与内容安全 -->
    <div class="panel-card space-y-3.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-4 rounded-full bg-rose-500"></span>
          <h2 class="text-sm font-bold text-slate-900">内容安全与合规审查</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-slate-400">开启审核</span>
          <el-switch v-model="form.content_safety_enabled" size="small" />
        </div>
      </div>

      <template v-if="form.content_safety_enabled">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">审查提供商</label>
            <el-select v-model="form.content_safety_provider" class="w-full">
              <el-option label="自定义审查接口" value="custom" />
              <el-option label="阿里云内容安全" value="aliyun" />
              <el-option label="腾讯云天御" value="tencent" />
            </el-select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">违规处置策略</label>
            <el-select v-model="form.content_safety_action" class="w-full">
              <el-option label="直接冻结图片 (推荐)" value="freeze" />
              <el-option label="仅添加风险标记" value="flag" />
            </el-select>
          </div>
        </div>

        <div class="space-y-2">
          <el-input v-model="form.content_safety_api_url" placeholder="审查 API Endpoint URL" />
          <el-input v-model="form.content_safety_api_key" placeholder="API Secret Key (可选)" show-password autocomplete="off" />
        </div>
      </template>

      <div v-else class="text-xs text-slate-400">
        开启后，上传图片时自动调用第三方安全接口检测违规或敏感内容。
      </div>
    </div>

    <!-- 底部保存操作按钮 -->
    <div class="flex justify-end pt-1">
      <el-button type="primary" @click="save" class="!h-10 !px-8 !font-semibold">
        保存全部设置
      </el-button>
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
  ElMessage.success('配置已保存生效')
}

onMounted(load)
</script>
