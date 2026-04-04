<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200">
      <div class="px-4 py-3 flex items-center justify-between">
        <div>
          <div class="text-lg font-bold">相册系统</div>
          <div class="text-xs text-slate-500">Telegram 图片存储池</div>
        </div>
        <div class="hidden md:block text-xs text-slate-400">手机优先 · PWA · D1 · TG 存储池</div>
      </div>
      <div class="md:hidden overflow-x-auto no-scrollbar px-3 pb-3">
        <div class="flex gap-2 min-w-max">
          <a class="px-3 py-2 rounded-full bg-blue-600 text-white text-sm" href="#/admin/dashboard">仪表盘</a>
          <a class="px-3 py-2 rounded-full bg-white border border-slate-200 text-sm" href="#/admin/photos">图片</a>
          <a class="px-3 py-2 rounded-full bg-white border border-slate-200 text-sm" href="#/admin/albums">相册</a>
          <a class="px-3 py-2 rounded-full bg-white border border-slate-200 text-sm" href="#/admin/pools">存储池</a>
          <a class="px-3 py-2 rounded-full bg-white border border-slate-200 text-sm" href="#/admin/recycle">回收站</a>
        </div>
      </div>
    </header>

    <div class="md:flex">
      <aside class="hidden md:block w-64 p-4 border-r border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm min-h-[calc(100vh-64px)]">
        <el-menu class="bg-transparent" router :default-active="$route.path" text-color="#334155" active-text-color="#2563eb">
          <el-menu-item index="/admin/dashboard">仪表盘</el-menu-item>
          <el-menu-item index="/admin/photos">图片管理</el-menu-item>
          <el-menu-item index="/admin/albums">相册管理</el-menu-item>
          <el-menu-item index="/admin/pools">TG 存储池</el-menu-item>
          <el-menu-item index="/admin/recycle">回收站</el-menu-item>
        </el-menu>
      </aside>

      <main class="flex-1 p-4 md:p-6 overflow-auto">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
