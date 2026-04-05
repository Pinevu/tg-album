<template>
  <div class="space-y-5 rounded-[32px] bg-white/82 backdrop-blur-md border border-slate-200/80 shadow-sm p-4 md:p-5">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight">网页设置</h1>
    </div>

    <div class="panel-card space-y-4 max-w-2xl bg-white/96">
      <el-input v-model="form.site_title" placeholder="网站名" />
      <el-input v-model="form.admin_bg_image" placeholder="后台背景图 URL" />
      <div class="space-y-2">
        <div class="text-sm text-slate-500">或上传背景图</div>
        <input type="file" accept="image/*" @change="onFileChange" class="block w-full text-sm text-slate-500" />
        <img v-if="form.admin_bg_image" :src="form.admin_bg_image" class="w-full max-h-48 object-contain rounded-2xl border border-slate-200 bg-slate-50" />
      </div>
      <div>
        <div class="text-sm text-slate-500 mb-2">背景遮罩透明度</div>
        <el-slider v-model="form.admin_bg_opacity" :min="0" :max="1" :step="0.05" />
      </div>
      <div class="flex gap-2">
        <el-button type="primary" @click="save">保存设置</el-button>
        <el-button @click="clearImage">清空背景图</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings } from '@/utils/api'

const form = ref({ site_title: '相册系统', admin_bg_image: '', admin_bg_opacity: 0.45 })

const load = async () => {
  const { data } = await getSettings()
  form.value.site_title = data.site_title || '相册系统'
  form.value.admin_bg_image = data.admin_bg_image || ''
  form.value.admin_bg_opacity = Number(data.admin_bg_opacity || 0.45)
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.value.admin_bg_image = String(reader.result || '') }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  form.value.admin_bg_image = ''
}

const save = async () => {
  await saveSettings(form.value)
  ElMessage.success('设置已保存')
}

onMounted(load)
</script>
