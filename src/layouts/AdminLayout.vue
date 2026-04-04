<template>
  <div class="min-h-screen md:flex bg-transparent text-slate-900">
    <aside class="md:w-72 p-4 md:border-r md:border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
      <div class="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 mb-4 shadow-lg">
        <div class="text-3xl font-bold leading-tight">相册<br />系统</div>
        <div class="text-sm text-white/80 mt-2">Telegram 图片存储池</div>
      </div>
      <el-menu class="bg-transparent" router :default-active="$route.path" text-color="#334155" active-text-color="#2563eb">
        <el-menu-item index="/admin/dashboard">仪表盘</el-menu-item>
        <el-menu-item index="/admin/photos">图片管理</el-menu-item>
        <el-menu-item index="/admin/albums">相册管理</el-menu-item>
        <el-menu-item index="/admin/pools">TG 存储池</el-menu-item>
        <el-menu-item index="/admin/recycle">回收站</el-menu-item>
      </el-menu>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 px-4 md:px-6 flex items-center justify-between border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-10">
        <div class="text-sm text-slate-500">后台控制台</div>
        <div class="text-xs text-slate-400">手机优先 · PWA · D1 · TG 存储池</div>
      </header>
      <main class="flex-1 p-4 md:p-6 overflow-auto">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
