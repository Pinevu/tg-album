<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight">网页设置</h1>
    </div>

    <div class="panel-card space-y-4 max-w-2xl">
      <el-input v-model="form.site_title" placeholder="网站名" />
      <el-input v-model="form.admin_bg_image" placeholder="后台背景图 URL" />
      <div>
        <div class="text-sm text-slate-500 mb-2">背景遮罩透明度</div>
        <el-slider v-model="form.admin_bg_opacity" :min="0" :max="1" :step="0.05" />
      </div>
      <el-button type="primary" class="!rounded-2xl" @click="save">保存设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings } from '@/utils/api'

const form = ref({
  site_title: '相册系统',
  admin_bg_image: '',
  admin_bg_opacity: 0.45,
})

const load = async () => {
  const { data } = await getSettings()
  form.value.site_title = data.site_title || '相册系统'
  form.value.admin_bg_image = data.admin_bg_image || ''
  form.value.admin_bg_opacity = Number(data.admin_bg_opacity || 0.45)
}

const save = async () => {
  await saveSettings(form.value)
  ElMessage.success('设置已保存')
}

onMounted(load)
</script>
